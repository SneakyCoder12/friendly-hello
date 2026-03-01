/**
 * Dashboard Marketplace Sections — Motors, Classifieds, Properties
 * These are rendered inside the existing DashboardPage when the corresponding
 * sidebar section is active. Each type has its own listing table, create form,
 * and action buttons.
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    Loader2, Plus, Pencil, Trash2, Eye, EyeOff, CheckCircle, X, ExternalLink,
    Car, Building2, Tag, Upload, Image as ImageIcon, Motorbike,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import MotorListingWizard from '@/components/MotorListingWizard';
import ClassifiedListingWizard from '@/components/ClassifiedListingWizard';
import PropertyListingWizard from '@/components/PropertyListingWizard';
import {
    fetchUserMotorsListings, fetchUserClassifiedListings, fetchUserPropertyListings,
    uploadMarketplaceImage, deleteMarketplaceImages, updateListingStatus,
    generateMotorSlug,
    EMIRATES, MOTOR_CATEGORIES, CLASSIFIED_CATEGORIES, PROPERTY_TYPES,
    CONDITIONS, CLASSIFIED_CONDITIONS, TRANSMISSIONS, FUEL_TYPES, STEERING_SIDES,
    FURNISHING_OPTIONS, LISTING_TYPES,
    MOTOR_IMAGE_LIMIT, CLASSIFIED_IMAGE_LIMIT, PROPERTY_IMAGE_LIMIT,
    type MotorListing, type ClassifiedListing, type PropertyListing,
} from '@/lib/marketplace';

const selectCls = 'w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30';
const inputCls = selectCls;
const statusColor = (s: string) => {
    if (s === 'active') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (s === 'sold') return 'bg-red-500/10 text-red-600 border-red-500/20';
    if (s === 'hidden') return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
};

// ─── In-memory caches for section state (survive tab switch, cleared on page refresh) ───
let _motorsSectionCache: { showForm: boolean; editId: string | null; form: Record<string, any>; images: string[] } | null = null;
let _classifiedsSectionCache: { showForm: boolean; editId: string | null; form: Record<string, any>; images: string[] } | null = null;
let _propertiesSectionCache: { showForm: boolean; editId: string | null; form: Record<string, any>; images: string[] } | null = null;

// ═══════════════════════════════════════════════════════════════
//  Image Upload Component
// ═══════════════════════════════════════════════════════════════
function ImageUploader({ images, onChange, maxImages }: {
    images: string[];
    onChange: (urls: string[]) => void;
    maxImages: number;
}) {
    const { user } = useAuth();
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFiles = async (files: FileList | null) => {
        if (!files || !user) return;
        const remaining = maxImages - images.length;
        if (remaining <= 0) { toast.error(`Maximum ${maxImages} images`); return; }
        const toUpload = Array.from(files).slice(0, remaining);
        setUploading(true);
        try {
            const urls: string[] = [];
            for (const file of toUpload) {
                if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10 MB)`); continue; }
                const url = await uploadMarketplaceImage(user.id, file, 'motors');
                urls.push(url);
                // Update parent after each successful upload for better visibility on mobile
                onChange([...images, ...urls]);
            }
            if (urls.length) toast.success(`${urls.length} image(s) uploaded`);
        } catch (err: any) { toast.error(err.message || 'Upload failed'); }
        setUploading(false);
    };

    const remove = (idx: number) => {
        const updated = [...images];
        updated.splice(idx, 1);
        onChange(updated);
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {images.map((url, i) => (
                    <div key={i} className="relative h-20 w-24 rounded-lg overflow-hidden border border-border group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => remove(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                {images.length < maxImages && (
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="h-20 w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50">
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-5 w-5" /><span className="text-[9px] mt-0.5">{images.length}/{maxImages}</span></>}
                    </button>
                )}
            </div>
            <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  MOTORS SECTION
// ═══════════════════════════════════════════════════════════════
export function MotorsSection() {
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const [items, setItems] = useState<MotorListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const emptyForm = {
        title: '', category: 'Cars', listing_type: 'Sale', make: '', model: '', year: '', price: '',
        condition: 'Used', mileage: '', transmission: 'Automatic', fuel_type: 'Petrol',
        body_type: '', exterior_color: '', interior_color: '', horsepower: '',
        engine_size: '', warranty: '', regional_specs: '', doors: '', steering_side: 'Left',
        trim: '', description: '', contact_number: profile?.phone_number || '',
        emirate: 'Dubai', area: '', community: '',
    };

    const getMotorCategoryTranslation = (c: string) => {
        const map: Record<string, string> = {
            'Cars': 'carsCategory', 'Motorcycles': 'motorcyclesCategory', 'Heavy Vehicles': 'heavyVehiclesCategory',
            'Boats': 'boatsCategory', 'Auto Accessories & Parts': 'autoAccessoriesCategory'
        };
        return map[c] ? t(map[c] as any) : c;
    };

    // Restore from cache on mount
    const cached = _motorsSectionCache;
    const [showForm, setShowForm] = useState(cached?.showForm ?? false);
    const [editId, setEditId] = useState<string | null>(cached?.editId ?? null);
    const [form, setForm] = useState(cached?.form ?? emptyForm);
    const [images, setImages] = useState<string[]>(cached?.images ?? []);

    // Persist to cache on change
    useEffect(() => {
        _motorsSectionCache = { showForm, editId, form, images };
    }, [showForm, editId, form, images]);

    const load = async () => {
        if (!user) return;
        setLoading(true);
        try { setItems(await fetchUserMotorsListings(user.id)); }
        catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };
    useEffect(() => { load(); }, [user]);

    const openCreate = () => {
        if (!profile?.phone_number || !profile?.whatsapp_number) {
            toast.error('Add your Phone Number and WhatsApp in Profile first'); return;
        }
        setForm({ ...emptyForm, contact_number: profile.phone_number || '' });
        setImages([]);
        setEditId(null);
        setShowForm(true);
    };

    const openEdit = (item: MotorListing) => {
        setForm({
            title: item.title, category: item.category, listing_type: item.listing_type || 'Sale', make: item.make || '', model: item.model || '',
            year: item.year?.toString() || '', price: item.price?.toString() || '',
            condition: item.condition || 'Used', mileage: item.mileage?.toString() || '',
            transmission: item.transmission || 'Automatic', fuel_type: item.fuel_type || 'Petrol',
            body_type: item.body_type || '', exterior_color: item.exterior_color || '',
            interior_color: item.interior_color || '', horsepower: item.horsepower?.toString() || '',
            engine_size: item.engine_size || '', warranty: item.warranty || '',
            regional_specs: item.regional_specs || '', doors: item.doors?.toString() || '',
            steering_side: item.steering_side || 'Left', trim: item.trim || '',
            description: item.description || '', contact_number: item.contact_number,
            emirate: item.emirate, area: item.area || '', community: item.community || '',
        });
        setImages(item.images || []);
        setEditId(item.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!user) return;
        if (!form.title.trim()) { toast.error('Title is required'); return; }
        if (!form.contact_number.trim()) { toast.error('Contact number is required'); return; }
        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                category: form.category,
                listing_type: form.listing_type || 'Sale',
                make: form.make || null,
                model: form.model || null,
                year: form.year ? Number(form.year) : null,
                price: form.price ? Number(form.price) : null,
                condition: form.condition || null,
                mileage: form.mileage ? Number(form.mileage) : null,
                transmission: form.transmission || null,
                fuel_type: form.fuel_type || null,
                body_type: form.body_type || null,
                exterior_color: form.exterior_color || null,
                interior_color: form.interior_color || null,
                horsepower: form.horsepower ? Number(form.horsepower) : null,
                engine_size: form.engine_size || null,
                warranty: form.warranty || null,
                regional_specs: form.regional_specs || null,
                doors: form.doors ? Number(form.doors) : null,
                steering_side: form.steering_side || null,
                trim: form.trim || null,
                description: form.description || null,
                contact_number: form.contact_number,
                emirate: form.emirate,
                area: form.area || null,
                community: form.community || null,
                images,
            };

            if (editId) {
                const { error } = await supabase.from('motors_listings').update(payload as any).eq('id', editId);
                if (error) throw error;
                toast.success(t('listingUpdated' as any));
            } else {
                const slug = generateMotorSlug(payload.make, payload.model, payload.year);
                const { error } = await supabase.from('motors_listings').insert({ ...payload, slug, user_id: user.id } as any);
                if (error) throw error;
                toast.success(t('listingCreated' as any));
            }
            setShowForm(false);
            load();
        } catch (err: any) { toast.error(err.message || t('failedToSave' as any)); }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const item = items.find(i => i.id === deleteId);
            if (item?.images?.length) await deleteMarketplaceImages(item.images);
            const { error } = await supabase.from('motors_listings').delete().eq('id', deleteId);
            if (error) throw error;
            toast.success(t('listingDeleted' as any)); load();
        } catch (err: any) { toast.error(err.message); }
        setDeleteId(null);
    };

    const toggleStatus = async (item: MotorListing, status: 'active' | 'sold' | 'hidden') => {
        try { await updateListingStatus('motors_listings', item.id, status); load(); }
        catch (err: any) { toast.error(err.message); }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            {/* Create Button */}
            <button onClick={openCreate}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                <Plus className="h-4 w-4" /> {t('addMotorListing' as any)}
            </button>

            {/* Create / Edit Form */}
            {showForm && (
                <MotorListingWizard
                    initialForm={form}
                    initialImages={images}
                    editId={editId}
                    onSave={async (wizardForm, wizardImages) => {
                        setForm(wizardForm as any);
                        setImages(wizardImages);
                        // Trigger save with wizard data
                        if (!user) return;
                        if (!wizardForm.title?.trim()) { toast.error('Title is required'); return; }
                        if (!wizardForm.contact_number?.trim()) { toast.error('Contact number is required'); return; }
                        setSaving(true);
                        try {
                            const payload = {
                                title: wizardForm.title.trim(),
                                category: wizardForm.category,
                                listing_type: wizardForm.listing_type || 'Sale',
                                make: wizardForm.make || null,
                                model: wizardForm.model || null,
                                year: wizardForm.year ? Number(wizardForm.year) : null,
                                price: wizardForm.price ? Number(wizardForm.price) : null,
                                condition: wizardForm.condition || null,
                                mileage: wizardForm.mileage ? Number(wizardForm.mileage) : null,
                                transmission: wizardForm.transmission || null,
                                fuel_type: wizardForm.fuel_type || null,
                                body_type: wizardForm.body_type || null,
                                exterior_color: wizardForm.exterior_color || null,
                                interior_color: wizardForm.interior_color || null,
                                horsepower: wizardForm.horsepower ? Number(wizardForm.horsepower) : null,
                                engine_size: wizardForm.engine_size || null,
                                warranty: wizardForm.warranty || null,
                                regional_specs: wizardForm.regional_specs || null,
                                doors: wizardForm.doors ? Number(wizardForm.doors) : null,
                                steering_side: wizardForm.steering_side || null,
                                trim: wizardForm.trim || null,
                                description: wizardForm.description || null,
                                contact_number: wizardForm.contact_number,
                                emirate: wizardForm.emirate,
                                area: wizardForm.area || null,
                                community: wizardForm.community || null,
                                images: wizardImages,
                            };
                            if (editId) {
                                const { error } = await supabase.from('motors_listings').update(payload as any).eq('id', editId);
                                if (error) throw error;
                                toast.success(t('listingUpdated' as any));
                            } else {
                                const slug = generateMotorSlug(payload.make, payload.model, payload.year);
                                const { error } = await supabase.from('motors_listings').insert({ ...payload, slug, user_id: user.id } as any);
                                if (error) throw error;
                                toast.success(t('listingCreated' as any));
                            }
                            setShowForm(false);
                            load();
                        } catch (err: any) { toast.error(err.message || t('failedToSave' as any)); }
                        setSaving(false);
                    }}
                    onCancel={() => setShowForm(false)}
                    saving={saving}
                />
            )}

            {/* Listing Table */}
            {items.length === 0 ? (
                <div className="text-center py-12">
                    <Car className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">{t('noMotorListingsYet' as any)}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className="bg-card border border-border rounded-xl p-3 sm:p-4 flex items-center gap-3">
                            <div className="h-14 w-20 rounded-lg bg-surface overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {item.images?.[0] ? (
                                    <img src={item.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    item.category === 'Motorcycles' ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                            <Motorbike className="h-5 w-5 text-muted-foreground/30" />
                                            <span className="text-[7px] font-bold text-muted-foreground/60 uppercase">Bike</span>
                                        </div>
                                    ) : (
                                        <Car className="h-6 w-6 text-muted-foreground/30" />
                                    )
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-foreground text-sm truncate">{item.title}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>{item.status === 'active' ? t('statusActive' as any) : item.status === 'sold' ? t('statusSold' as any) : t('statusHidden' as any)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{getMotorCategoryTranslation(item.category || '')} • {item.emirate} {item.price ? `• AED ${item.price.toLocaleString()}` : ''}</p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                                <Link to={`/motors/${item.slug || item.id}`} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></Link>
                                <button onClick={() => openEdit(item)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={() => toggleStatus(item, item.status === 'hidden' ? 'active' : 'hidden')} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                                    {item.status === 'hidden' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                </button>
                                <button onClick={() => toggleStatus(item, item.status === 'sold' ? 'active' : 'sold')} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setDeleteId(item.id)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && createPortal(
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-card border border-border/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl modal-enter">
                        <p className="text-foreground font-semibold mb-4">{t('deleteMotorPrompt' as any)}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-foreground">{t('cancel')}</button>
                            <button onClick={handleDelete} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold">{t('yesDelete' as any)}</button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
//  CLASSIFIEDS SECTION
// ═══════════════════════════════════════════════════════════════
export function ClassifiedsSection() {
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const [items, setItems] = useState<ClassifiedListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const emptyForm = {
        title: '', category: 'Electronics', price: '', condition: 'Used',
        description: '', contact_number: profile?.phone_number || '',
        emirate: 'Dubai', area: '',
    };

    const getClassifiedCategoryTranslation = (c: string) => {
        const map: Record<string, string> = {
            'Electronics': 'electronicsCategory', 'Fashion': 'fashionCategory', 'Furniture': 'furnitureCategory',
            'Business & Industrial': 'businessCategory', 'Home & Garden': 'homeCategory',
            'Sports & Outdoors': 'sportsCategory', 'General Items': 'generalCategory'
        };
        return map[c] ? t(map[c] as any) : c;
    };

    // Restore from cache on mount
    const cached = _classifiedsSectionCache;
    const [showForm, setShowForm] = useState(cached?.showForm ?? false);
    const [editId, setEditId] = useState<string | null>(cached?.editId ?? null);
    const [form, setForm] = useState(cached?.form ?? emptyForm);
    const [images, setImages] = useState<string[]>(cached?.images ?? []);

    // Persist to cache on change
    useEffect(() => {
        _classifiedsSectionCache = { showForm, editId, form, images };
    }, [showForm, editId, form, images]);

    const load = async () => {
        if (!user) return;
        setLoading(true);
        try { setItems(await fetchUserClassifiedListings(user.id)); }
        catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };
    useEffect(() => { load(); }, [user]);

    const openCreate = () => {
        if (!profile?.phone_number || !profile?.whatsapp_number) {
            toast.error('Add your Phone Number and WhatsApp in Profile first'); return;
        }
        setForm({ ...emptyForm, contact_number: profile.phone_number || '' });
        setImages([]);
        setEditId(null);
        setShowForm(true);
    };

    const openEdit = (item: ClassifiedListing) => {
        setForm({
            title: item.title, category: item.category, price: item.price?.toString() || '',
            condition: item.condition || 'Used', description: item.description || '',
            contact_number: item.contact_number, emirate: item.emirate, area: item.area || '',
        });
        setImages(item.images || []);
        setEditId(item.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!user) return;
        if (!form.title.trim()) { toast.error('Title is required'); return; }
        if (!form.contact_number.trim()) { toast.error('Contact number is required'); return; }
        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(), category: form.category,
                price: form.price ? Number(form.price) : null,
                condition: form.condition || null, description: form.description || null,
                contact_number: form.contact_number, emirate: form.emirate,
                area: form.area || null, images,
            };
            if (editId) {
                const { error } = await supabase.from('classified_listings').update(payload as any).eq('id', editId);
                if (error) throw error;
                toast.success(t('listingUpdated' as any));
            } else {
                const { error } = await supabase.from('classified_listings').insert({ ...payload, user_id: user.id } as any);
                if (error) throw error;
                toast.success(t('listingCreated' as any));
            }
            setShowForm(false); load();
        } catch (err: any) { toast.error(err.message || t('failedToSave' as any)); }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const item = items.find(i => i.id === deleteId);
            if (item?.images?.length) await deleteMarketplaceImages(item.images);
            const { error } = await supabase.from('classified_listings').delete().eq('id', deleteId);
            if (error) throw error;
            toast.success(t('listingDeleted' as any)); load();
        } catch (err: any) { toast.error(err.message); }
        setDeleteId(null);
    };

    const toggleStatus = async (item: ClassifiedListing, status: 'active' | 'sold' | 'hidden') => {
        try { await updateListingStatus('classified_listings', item.id, status); load(); }
        catch (err: any) { toast.error(err.message); }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90"><Plus className="h-4 w-4" /> {t('addClassified' as any)}</button>

            {showForm && (
                <ClassifiedListingWizard
                    initialForm={form}
                    initialImages={images}
                    editId={editId}
                    onSave={async (wizardForm, wizardImages) => {
                        if (!user) return;
                        if (!wizardForm.title?.trim()) { toast.error('Title is required'); return; }
                        if (!wizardForm.contact_number?.trim()) { toast.error('Contact number is required'); return; }
                        setSaving(true);
                        try {
                            const payload = {
                                title: wizardForm.title.trim(), category: wizardForm.category,
                                price: wizardForm.price ? Number(wizardForm.price) : null,
                                condition: wizardForm.condition || null, description: wizardForm.description || null,
                                contact_number: wizardForm.contact_number, emirate: wizardForm.emirate,
                                area: wizardForm.area || null, images: wizardImages,
                            };
                            if (editId) {
                                const { error } = await supabase.from('classified_listings').update(payload as any).eq('id', editId);
                                if (error) throw error;
                                toast.success(t('listingUpdated' as any));
                            } else {
                                const { error } = await supabase.from('classified_listings').insert({ ...payload, user_id: user.id } as any);
                                if (error) throw error;
                                toast.success(t('listingCreated' as any));
                            }
                            setShowForm(false); load();
                        } catch (err: any) { toast.error(err.message || t('failedToSave' as any)); }
                        setSaving(false);
                    }}
                    onCancel={() => setShowForm(false)}
                    saving={saving}
                />
            )}

            {items.length === 0 ? (
                <div className="text-center py-12"><Tag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground text-sm">{t('noClassifiedsYet' as any)}</p></div>
            ) : (
                <div className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className="bg-card border border-border rounded-xl p-3 sm:p-4 flex items-center gap-3">
                            <div className="h-14 w-20 rounded-lg bg-surface overflow-hidden flex-shrink-0">
                                {item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Tag className="h-6 w-6 text-muted-foreground/30 m-auto mt-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-foreground text-sm truncate">{item.title}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>{item.status === 'active' ? t('statusActive' as any) : item.status === 'sold' ? t('statusSold' as any) : t('statusHidden' as any)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{getClassifiedCategoryTranslation(item.category || '')} • {item.emirate} {item.price ? `• AED ${item.price.toLocaleString()}` : ''}</p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                                <Link to={`/classifieds/${item.id}`} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></Link>
                                <button onClick={() => openEdit(item)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={() => toggleStatus(item, item.status === 'hidden' ? 'active' : 'hidden')} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                                    {item.status === 'hidden' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                </button>
                                <button onClick={() => toggleStatus(item, item.status === 'sold' ? 'active' : 'sold')} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><CheckCircle className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setDeleteId(item.id)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {deleteId && createPortal(
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-card border border-border/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl modal-enter">
                        <p className="text-foreground font-semibold mb-4">{t('deleteClassifiedPrompt' as any)}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-foreground">{t('cancel')}</button>
                            <button onClick={handleDelete} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold">{t('yesDelete' as any)}</button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
//  PROPERTIES SECTION
// ═══════════════════════════════════════════════════════════════
export function PropertiesSection() {
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const [items, setItems] = useState<PropertyListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const emptyForm = {
        title: '', listing_type: 'Sale', property_type: 'Apartment', price: '',
        bedrooms: '', bathrooms: '', size_sqft: '', furnishing: '',
        description: '', contact_number: profile?.phone_number || '',
        emirate: 'Dubai', area: '', community: '',
    };

    const getPropertyCategoryTranslation = (c: string) => {
        const map: Record<string, string> = {
            'Apartment': 'apartmentCategory', 'Villa': 'villaCategory', 'Townhouse': 'townhouseCategory',
            'Penthouse': 'penthouseCategory', 'Land': 'landCategory', 'Commercial': 'commercialCategory',
            'Full Building': 'fullBuildingCategory'
        };
        return map[c] ? t(map[c] as any) : c;
    };

    // Restore from cache on mount
    const cached = _propertiesSectionCache;
    const [showForm, setShowForm] = useState(cached?.showForm ?? false);
    const [editId, setEditId] = useState<string | null>(cached?.editId ?? null);
    const [form, setForm] = useState(cached?.form ?? emptyForm);
    const [images, setImages] = useState<string[]>(cached?.images ?? []);

    // Persist to cache on change
    useEffect(() => {
        _propertiesSectionCache = { showForm, editId, form, images };
    }, [showForm, editId, form, images]);

    const load = async () => {
        if (!user) return;
        setLoading(true);
        try { setItems(await fetchUserPropertyListings(user.id)); }
        catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };
    useEffect(() => { load(); }, [user]);

    const openCreate = () => {
        if (!profile?.phone_number || !profile?.whatsapp_number) {
            toast.error('Add your Phone Number and WhatsApp in Profile first'); return;
        }
        setForm({ ...emptyForm, contact_number: profile.phone_number || '' });
        setImages([]);
        setEditId(null);
        setShowForm(true);
    };

    const openEdit = (item: PropertyListing) => {
        setForm({
            title: item.title, listing_type: item.listing_type, property_type: item.property_type,
            price: item.price?.toString() || '', bedrooms: item.bedrooms?.toString() || '',
            bathrooms: item.bathrooms?.toString() || '', size_sqft: item.size_sqft?.toString() || '',
            furnishing: item.furnishing || '', description: item.description || '',
            contact_number: item.contact_number, emirate: item.emirate,
            area: item.area || '', community: item.community || '',
        });
        setImages(item.images || []);
        setEditId(item.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!user) return;
        if (!form.title.trim()) { toast.error('Title is required'); return; }
        if (!form.contact_number.trim()) { toast.error('Contact number is required'); return; }
        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(), listing_type: form.listing_type, property_type: form.property_type,
                price: form.price ? Number(form.price) : null,
                bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
                bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
                size_sqft: form.size_sqft ? Number(form.size_sqft) : null,
                furnishing: form.furnishing || null,
                description: form.description || null,
                contact_number: form.contact_number, emirate: form.emirate,
                area: form.area || null, community: form.community || null, images,
            };
            if (editId) {
                const { error } = await supabase.from('property_listings').update(payload as any).eq('id', editId);
                if (error) throw error;
                toast.success(t('listingUpdated' as any));
            } else {
                const { error } = await supabase.from('property_listings').insert({ ...payload, user_id: user.id } as any);
                if (error) throw error;
                toast.success(t('listingCreated' as any));
            }
            setShowForm(false); load();
        } catch (err: any) { toast.error(err.message || t('failedToSave' as any)); }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const item = items.find(i => i.id === deleteId);
            if (item?.images?.length) await deleteMarketplaceImages(item.images);
            const { error } = await supabase.from('property_listings').delete().eq('id', deleteId);
            if (error) throw error;
            toast.success(t('listingDeleted' as any)); load();
        } catch (err: any) { toast.error(err.message); }
        setDeleteId(null);
    };

    const toggleStatus = async (item: PropertyListing, status: 'active' | 'sold' | 'hidden') => {
        try { await updateListingStatus('property_listings', item.id, status); load(); }
        catch (err: any) { toast.error(err.message); }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90"><Plus className="h-4 w-4" /> {t('addProperty' as any)}</button>

            {showForm && (
                <PropertyListingWizard
                    initialForm={form}
                    initialImages={images}
                    editId={editId}
                    onSave={async (wizardForm, wizardImages) => {
                        if (!user) return;
                        if (!wizardForm.title?.trim()) { toast.error('Title is required'); return; }
                        if (!wizardForm.contact_number?.trim()) { toast.error('Contact number is required'); return; }
                        setSaving(true);
                        try {
                            const payload = {
                                title: wizardForm.title.trim(), listing_type: wizardForm.listing_type, property_type: wizardForm.property_type,
                                price: wizardForm.price ? Number(wizardForm.price) : null,
                                bedrooms: wizardForm.bedrooms ? Number(wizardForm.bedrooms) : null,
                                bathrooms: wizardForm.bathrooms ? Number(wizardForm.bathrooms) : null,
                                size_sqft: wizardForm.size_sqft ? Number(wizardForm.size_sqft) : null,
                                furnishing: wizardForm.furnishing || null,
                                amenities: wizardForm.amenities?.length ? wizardForm.amenities : null,
                                description: wizardForm.description || null,
                                contact_number: wizardForm.contact_number, emirate: wizardForm.emirate,
                                area: wizardForm.area || null, community: wizardForm.community || null, images: wizardImages,
                            };
                            if (editId) {
                                const { error } = await supabase.from('property_listings').update(payload as any).eq('id', editId);
                                if (error) throw error;
                                toast.success(t('listingUpdated' as any));
                            } else {
                                const { error } = await supabase.from('property_listings').insert({ ...payload, user_id: user.id } as any);
                                if (error) throw error;
                                toast.success(t('listingCreated' as any));
                            }
                            setShowForm(false); load();
                        } catch (err: any) { toast.error(err.message || t('failedToSave' as any)); }
                        setSaving(false);
                    }}
                    onCancel={() => setShowForm(false)}
                    saving={saving}
                />
            )}

            {items.length === 0 ? (
                <div className="text-center py-12"><Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground text-sm">{t('noPropertyListingsYet' as any)}</p></div>
            ) : (
                <div className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className="bg-card border border-border rounded-xl p-3 sm:p-4 flex items-center gap-3">
                            <div className="h-14 w-20 rounded-lg bg-surface overflow-hidden flex-shrink-0">
                                {item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Building2 className="h-6 w-6 text-muted-foreground/30 m-auto mt-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-foreground text-sm truncate">{item.title}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>{item.status === 'active' ? t('statusActive' as any) : item.status === 'sold' ? t('statusSold' as any) : t('statusHidden' as any)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{getPropertyCategoryTranslation(item.property_type || '')} • {item.listing_type === 'Sale' ? t('forSale' as any) : t('forRent' as any)} • {item.emirate} {item.price ? `• AED ${item.price.toLocaleString()}` : ''}</p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                                <Link to={`/properties/${item.id}`} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></Link>
                                <button onClick={() => openEdit(item)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={() => toggleStatus(item, item.status === 'hidden' ? 'active' : 'hidden')} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                                    {item.status === 'hidden' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                </button>
                                <button onClick={() => toggleStatus(item, item.status === 'sold' ? 'active' : 'sold')} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><CheckCircle className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setDeleteId(item.id)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {deleteId && createPortal(
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-card border border-border/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl modal-enter">
                        <p className="text-foreground font-semibold mb-4">{t('deletePropertyPrompt' as any)}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-foreground">{t('cancel')}</button>
                            <button onClick={handleDelete} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold">{t('yesDelete' as any)}</button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
}
