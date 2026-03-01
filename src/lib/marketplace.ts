/**
 * Marketplace data layer — shared helpers for Motors, Classifieds, and Properties.
 * Import from '@/lib/marketplace'
 */
import { supabase } from '@/integrations/supabase/client';

// ─── Constants ──────────────────────────────────────────────
export const EMIRATES = [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman',
    'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain',
] as const;

export const MOTOR_CATEGORIES = [
    'Cars', 'Motorcycles', 'Heavy Vehicles', 'Boats', 'Auto Accessories & Parts',
] as const;

export const CLASSIFIED_CATEGORIES = [
    'Electronics', 'Fashion', 'Furniture', 'Business & Industrial',
    'Home & Garden', 'Sports & Outdoors', 'General Items',
] as const;

export const PROPERTY_TYPES = [
    'Apartment', 'Villa', 'Townhouse', 'Penthouse',
    'Land', 'Commercial', 'Full Building',
] as const;

export const getMotorCategoryTranslation = (c: string) => {
    switch (c) {
        case 'Cars': return 'carsCategory';
        case 'Motorcycles': return 'motorcyclesCategory';
        case 'Heavy Vehicles': return 'heavyVehiclesCategory';
        case 'Boats': return 'boatsCategory';
        case 'Auto Accessories & Parts': return 'autoAccessoriesCategory';
        default: return c;
    }
};

export const getClassifiedCategoryTranslation = (c: string) => {
    switch (c) {
        case 'Electronics': return 'electronicsCategory';
        case 'Fashion': return 'fashionCategory';
        case 'Furniture': return 'furnitureCategory';
        case 'Business & Industrial': return 'businessIndustrialCategory';
        case 'Home & Garden': return 'homeGardenCategory';
        case 'Sports & Outdoors': return 'sportsOutdoorsCategory';
        case 'General Items': return 'generalItemsCategory';
        default: return c;
    }
};

export const getPropertyCategoryTranslation = (c: string) => {
    switch (c) {
        case 'Apartment': return 'apartmentCategory';
        case 'Villa': return 'villaCategory';
        case 'Townhouse': return 'townhouseCategory';
        case 'Penthouse': return 'penthouseCategory';
        case 'Land': return 'landCategory';
        case 'Commercial': return 'commercialCategory';
        case 'Full Building': return 'fullBuildingCategory';
        default: return c;
    }
};

export const CONDITIONS = ['New', 'Used'] as const;
export const CLASSIFIED_CONDITIONS = ['New', 'Used', 'Like New', 'Refurbished'] as const;
export const TRANSMISSIONS = ['Automatic', 'Manual'] as const;
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Other'] as const;
export const STEERING_SIDES = ['Left', 'Right'] as const;
export const FURNISHING_OPTIONS = ['Furnished', 'Unfurnished', 'Semi-Furnished'] as const;
export const LISTING_TYPES = ['Sale', 'Rent'] as const;

export const MOTOR_IMAGE_LIMIT = 10;
export const CLASSIFIED_IMAGE_LIMIT = 10;
export const PROPERTY_IMAGE_LIMIT = 15;

const BUCKET = 'marketplace-images';
const PAGE_SIZE = 20;

// ─── Image helpers ──────────────────────────────────────────
export async function uploadMarketplaceImage(
    userId: string,
    file: File,
    listingType: 'motors' | 'classifieds' | 'properties',
): Promise<string> {
    let processFile = file;
    let ext = file.name.split('.').pop()?.toLowerCase() || '';
    let contentType = file.type || '';

    // 1. Detect HEIC/HEIF robustly by mime type or extension
    const isHeic =
        contentType.includes('image/heic') ||
        contentType.includes('image/heif') ||
        ext === 'heic' ||
        ext === 'heif';

    if (isHeic) {
        try {
            // 2. Client-side Conversion (Dynamically imported so it doesn't hurt bundle size)
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.92
            });

            // heic2any can return an array of blobs for burst photos/animations
            const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            // Wrap the converted blob back into a File format to match existing pipeline
            processFile = new File([finalBlob], file.name.replace(/\.(heic|heif)$/i, '.jpeg'), {
                type: 'image/jpeg'
            });
        } catch (err) {
            console.error('HEIC conversion failed:', err);
            // 5. Graceful Error Handling: Prevent uploading broken raw HEIC files
            throw new Error('Unreadable image format or corrupted HEIC file. Please try a different photo.');
        }
    }

    // 3. Existing Compression Pipeline (Unmodified behavior for JPEGs, PNGs, and now converted HEICs)
    let uploadData: Blob | File = processFile;
    ext = processFile.name.split('.').pop()?.toLowerCase() || 'jpeg';
    contentType = processFile.type || 'image/jpeg';

    try {
        uploadData = await compressImage(processFile, 1200, 0.82);
        ext = 'webp';
        contentType = 'image/webp';
    } catch (err) {
        console.warn('Image compression failed, using original file', err);
    }

    const path = `${userId}/${listingType}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, uploadData, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

export async function deleteMarketplaceImage(url: string): Promise<void> {
    // Extract path from public URL
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = url.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
}

export async function deleteMarketplaceImages(urls: string[]): Promise<void> {
    await Promise.allSettled(urls.map(url => deleteMarketplaceImage(url)));
}

/** Client-side image compression via OffscreenCanvas / regular Canvas */
async function compressImage(file: File, maxDim: number, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob(
                blob => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
                'image/webp',
                quality,
            );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

// ─── Types ──────────────────────────────────────────────────
export interface MotorListing {
    id: string;
    user_id: string;
    title: string;
    category: string;
    listing_type: string;
    make: string | null;
    model: string | null;
    year: number | null;
    price: number | null;
    condition: string | null;
    mileage: number | null;
    transmission: string | null;
    fuel_type: string | null;
    body_type: string | null;
    exterior_color: string | null;
    interior_color: string | null;
    horsepower: number | null;
    engine_size: string | null;
    warranty: string | null;
    regional_specs: string | null;
    doors: number | null;
    steering_side: string | null;
    trim: string | null;
    features: string[] | null;
    description: string | null;
    contact_number: string;
    emirate: string;
    area: string | null;
    community: string | null;
    images: string[] | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface ClassifiedListing {
    id: string;
    user_id: string;
    category: string;
    title: string;
    price: number | null;
    condition: string | null;
    description: string | null;
    contact_number: string;
    emirate: string;
    area: string | null;
    images: string[] | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface PropertyListing {
    id: string;
    user_id: string;
    listing_type: string;
    property_type: string;
    title: string;
    price: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    size_sqft: number | null;
    furnishing: string | null;
    amenities: string[] | null;
    description: string | null;
    contact_number: string;
    emirate: string;
    area: string | null;
    community: string | null;
    images: string[] | null;
    status: string;
    created_at: string;
    updated_at: string;
}

// ─── Motors CRUD ────────────────────────────────────────────
export async function fetchMotorsListings(filters: Record<string, any> = {}, page = 0) {
    let q = supabase
        .from('motors_listings')
        .select('*', { count: 'exact' })
        .in('status', ['active', 'sold'])
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filters.category) q = q.eq('category', filters.category);
    if (filters.listing_type) q = q.eq('listing_type', filters.listing_type);
    if (filters.emirate) q = q.eq('emirate', filters.emirate);
    if (filters.condition) q = q.eq('condition', filters.condition);
    if (filters.make) q = q.ilike('make', `%${filters.make}%`);
    if (filters.model) q = q.ilike('model', `%${filters.model}%`);
    if (filters.fuel_type) q = q.eq('fuel_type', filters.fuel_type);
    if (filters.minPrice) q = q.gte('price', filters.minPrice);
    if (filters.maxPrice) q = q.lte('price', filters.maxPrice);
    if (filters.minYear) q = q.gte('year', filters.minYear);
    if (filters.maxYear) q = q.lte('year', filters.maxYear);
    if (filters.maxMileage) q = q.lte('mileage', filters.maxMileage);
    if (filters.search) q = q.ilike('title', `%${filters.search}%`);

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: (data || []) as MotorListing[], count: count || 0 };
}

export async function fetchMotorListing(id: string) {
    const { data, error } = await supabase
        .from('motors_listings')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data as MotorListing;
}

export async function fetchUserMotorsListings(userId: string) {
    const { data, error } = await supabase
        .from('motors_listings')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as MotorListing[];
}

// ─── Classifieds CRUD ───────────────────────────────────────
export async function fetchClassifiedListings(filters: Record<string, any> = {}, page = 0) {
    let q = supabase
        .from('classified_listings')
        .select('*', { count: 'exact' })
        .in('status', ['active', 'sold'])
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filters.category) q = q.eq('category', filters.category);
    if (filters.emirate) q = q.eq('emirate', filters.emirate);
    if (filters.condition) q = q.eq('condition', filters.condition);
    if (filters.minPrice) q = q.gte('price', filters.minPrice);
    if (filters.maxPrice) q = q.lte('price', filters.maxPrice);
    if (filters.search) q = q.ilike('title', `%${filters.search}%`);

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: (data || []) as ClassifiedListing[], count: count || 0 };
}

export async function fetchClassifiedListing(id: string) {
    const { data, error } = await supabase
        .from('classified_listings')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data as ClassifiedListing;
}

export async function fetchUserClassifiedListings(userId: string) {
    const { data, error } = await supabase
        .from('classified_listings')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ClassifiedListing[];
}

// ─── Properties CRUD ────────────────────────────────────────
export async function fetchPropertyListings(filters: Record<string, any> = {}, page = 0) {
    let q = supabase
        .from('property_listings')
        .select('*', { count: 'exact' })
        .in('status', ['active', 'sold'])
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filters.listing_type) q = q.eq('listing_type', filters.listing_type);
    if (filters.property_type) q = q.eq('property_type', filters.property_type);
    if (filters.emirate) q = q.eq('emirate', filters.emirate);
    if (filters.minPrice) q = q.gte('price', filters.minPrice);
    if (filters.maxPrice) q = q.lte('price', filters.maxPrice);
    if (filters.bedrooms) q = q.eq('bedrooms', filters.bedrooms);
    if (filters.search) q = q.ilike('title', `%${filters.search}%`);

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: (data || []) as PropertyListing[], count: count || 0 };
}

export async function fetchPropertyListing(id: string) {
    const { data, error } = await supabase
        .from('property_listings')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data as PropertyListing;
}

export async function fetchUserPropertyListings(userId: string) {
    const { data, error } = await supabase
        .from('property_listings')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as PropertyListing[];
}

// ─── Generic status helpers ─────────────────────────────────
type TableName = 'motors_listings' | 'classified_listings' | 'property_listings';

export async function updateListingStatus(
    table: TableName,
    id: string,
    status: 'active' | 'sold' | 'hidden' | 'deleted',
) {
    const { error } = await supabase.from(table).update({ status } as any).eq('id', id);
    if (error) throw error;
}

export async function deleteListing(table: TableName, id: string, images?: string[] | null) {
    if (images && images.length > 0) {
        await deleteMarketplaceImages(images);
    }
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
}

// ─── Admin: fetch ALL listings (including hidden/deleted) ───
export async function adminFetchAllMotors() {
    const { data, error } = await supabase
        .from('motors_listings')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as MotorListing[];
}

export async function adminFetchAllClassifieds() {
    const { data, error } = await supabase
        .from('classified_listings')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ClassifiedListing[];
}

export async function adminFetchAllProperties() {
    const { data, error } = await supabase
        .from('property_listings')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as PropertyListing[];
}
