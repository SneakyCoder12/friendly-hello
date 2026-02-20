/**
 * plateImageService.ts
 * 
 * Generates a plate image using the existing client-side canvas renderer,
 * converts it to WebP, and uploads to Supabase Storage.
 * Called ONCE during listing creation/edit — never during page rendering.
 */

import { generatePlate } from '@/lib/plate-generator';
import { PLATE_TEMPLATES } from '@/data/listings';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'plate-images';

/** Emirate key → human-readable folder name for storage paths */
const EMIRATE_FOLDER: Record<string, string> = {
    abudhabi: 'abu-dhabi',
    dubai: 'dubai',
    sharjah: 'sharjah',
    ajman: 'ajman',
    umm_al_quwain: 'umm-al-quwain',
    rak: 'ras-al-khaimah',
    fujairah: 'fujairah',
};

/** Load a single template image by key */
function loadImage(key: string): Promise<HTMLImageElement | null> {
    const src = PLATE_TEMPLATES[key];
    if (!src) return Promise.resolve(null);

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn('Failed to load template:', src);
            resolve(null);
        };
        img.src = src;
    });
}

/** Convert canvas to WebP Blob */
function canvasToWebP(canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Canvas to WebP conversion failed'));
            },
            'image/webp',
            quality
        );
    });
}

export interface PlateImageResult {
    url: string;   // Public CDN URL
    path: string;  // Storage path for deletion
}

/**
 * Generate a plate image and upload it to Supabase Storage.
 * Returns the public URL and storage path.
 */
export async function generateAndUploadPlateImage(params: {
    listingId: string;
    emirate: string;
    plateCode: string;
    plateNumber: string;
    plateStyle: 'private' | 'bike' | 'classic';
}): Promise<PlateImageResult> {
    const { listingId, emirate, plateCode, plateNumber, plateStyle } = params;

    // 1. Load the correct template image
    let imgKey = emirate;
    if (plateStyle === 'bike') imgKey = `${emirate}_bike`;
    if (plateStyle === 'classic') imgKey = `${emirate}_classic`;

    let img = await loadImage(imgKey);
    if (!img && imgKey !== emirate) img = await loadImage(emirate);
    if (!img) throw new Error(`No template image found for ${imgKey}`);

    // 2. Generate the plate on canvas
    const canvas = await generatePlate({
        emirate,
        plateCode,
        plateNumber,
        blankPlateImage: img,
        plateStyle,
    });

    // 3. Convert to WebP blob
    const blob = await canvasToWebP(canvas);

    // 4. Build storage path using listing ID
    const folder = EMIRATE_FOLDER[emirate] || emirate.replace(/_/g, '-');
    const storagePath = `${folder}/${listingId}.webp`;

    // 5. Upload to Supabase Storage (upsert to handle re-uploads on edit)
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, blob, {
            contentType: 'image/webp',
            cacheControl: '31536000', // 1 year cache
            upsert: true,
        });

    if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 6. Get public URL
    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

    return {
        url: urlData.publicUrl,
        path: storagePath,
    };
}

/**
 * Delete a plate image from Supabase Storage.
 * Called when editing a listing (to remove old image before uploading new one).
 */
export async function deletePlateImage(storagePath: string): Promise<void> {
    if (!storagePath) return;
    const { error } = await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);

    if (error) {
        console.error('Failed to delete plate image:', error.message);
    }
}
