/**
 * plateImageMigration.ts
 *
 * One-time / on-demand utility to regenerate ALL existing plate images
 * using the correct custom fonts, then update Supabase Storage + DB rows
 * with versioned URLs (appending ?v=<timestamp> cache-buster on the public URL).
 *
 * This ONLY runs from the Admin panel — never during browsing.
 */

import { supabase } from '@/integrations/supabase/client';
import { loadPlateFonts } from './plateFontLoader';
import { generatePlate } from './plate-generator';
import { PLATE_TEMPLATES } from '@/data/listings';

const BUCKET = 'plate-images';

/** Emirate display name → internal key */
const EMIRATE_TO_KEY: Record<string, string> = {
  'Abu Dhabi': 'abudhabi',
  'Dubai': 'dubai',
  'Sharjah': 'sharjah',
  'Ajman': 'ajman',
  'Umm Al Quwain': 'umm_al_quwain',
  'Ras Al Khaimah': 'rak',
  'Fujairah': 'fujairah',
};

/** Emirate key → storage folder */
const EMIRATE_FOLDER: Record<string, string> = {
  abudhabi: 'abu-dhabi',
  dubai: 'dubai',
  sharjah: 'sharjah',
  ajman: 'ajman',
  umm_al_quwain: 'umm-al-quwain',
  rak: 'ras-al-khaimah',
  fujairah: 'fujairah',
};

interface MigrationResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: { id: string; plate_number: string; error: string }[];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load template image: ${src}`));
    img.src = src;
  });
}

function canvasToWebP(canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas → WebP failed'))),
      'image/webp',
      quality
    );
  });
}

export async function regenerateAllPlateImages(
  onProgress?: (done: number, total: number, current: string) => void
): Promise<MigrationResult> {
  const result: MigrationResult = { total: 0, succeeded: 0, failed: 0, errors: [] };

  // 1. Ensure all fonts are loaded before any canvas work
  console.log('[Migration] Loading plate fonts…');
  await loadPlateFonts();
  console.log('[Migration] Fonts ready.');

  // 2. Fetch ALL listings (no RLS row limit concern — admin context)
  const { data: listings, error: fetchErr } = await supabase
    .from('listings')
    .select('id, plate_number, emirate, plate_style, plate_image_path')
    .order('created_at', { ascending: true });

  if (fetchErr) throw new Error(`Failed to fetch listings: ${fetchErr.message}`);
  if (!listings || listings.length === 0) {
    console.log('[Migration] No listings found.');
    return result;
  }

  result.total = listings.length;
  const version = Date.now(); // single timestamp for this migration run

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const label = `${listing.emirate} ${listing.plate_number}`;
    onProgress?.(i, result.total, label);

    try {
      // Resolve emirate key
      const emirateKey =
        EMIRATE_TO_KEY[listing.emirate] ||
        listing.emirate.toLowerCase().replace(/\s+/g, '_');

      // Resolve plate style
      const plateStyle = (['bike', 'classic'].includes(listing.plate_style ?? '')
        ? listing.plate_style
        : 'private') as 'private' | 'bike' | 'classic';

      // Determine plate code and number
      // plate_number stored as "A 12345" or just "12345"
      const parts = (listing.plate_number || '').trim().split(/\s+/);
      const plateCode = parts.length > 1 ? parts[0] : '';
      const plateNumber = parts.length > 1 ? parts.slice(1).join('') : parts[0];

      // Load template image
      const imgKey = plateStyle !== 'private' ? `${emirateKey}_${plateStyle}` : emirateKey;
      const templateSrc = PLATE_TEMPLATES[imgKey] || PLATE_TEMPLATES[emirateKey];
      if (!templateSrc) throw new Error(`No template for key "${imgKey}"`);

      const img = await loadImage(templateSrc);

      // Generate canvas
      const canvas = await generatePlate({
        emirate: emirateKey,
        plateCode,
        plateNumber,
        blankPlateImage: img,
        plateStyle,
      });

      // Convert to WebP
      const blob = await canvasToWebP(canvas);

      // Build storage path (same as original, upsert overwrites)
      const folder = EMIRATE_FOLDER[emirateKey] || emirateKey.replace(/_/g, '-');
      const storagePath = `${folder}/${listing.id}.webp`;

      // Upload (upsert)
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, blob, {
          contentType: 'image/webp',
          cacheControl: '3600', // shorter cache so CDN picks up the new file faster
          upsert: true,
        });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

      // Get public URL and append version to bust CDN cache
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      const versionedUrl = `${urlData.publicUrl}?v=${version}`;

      // Update DB row
      const { error: dbErr } = await supabase
        .from('listings')
        .update({ plate_image_url: versionedUrl, plate_image_path: storagePath })
        .eq('id', listing.id);
      if (dbErr) throw new Error(`DB update failed: ${dbErr.message}`);

      result.succeeded++;
      console.log(`[Migration] ✓ ${label} → ${versionedUrl}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.failed++;
      result.errors.push({ id: listing.id, plate_number: listing.plate_number, error: msg });
      console.error(`[Migration] ✗ ${label}:`, msg);
    }
  }

  onProgress?.(result.total, result.total, 'Done');
  return result;
}
