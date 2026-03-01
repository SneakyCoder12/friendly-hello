/**
 * Centralized plate font loader.
 * Loads all custom plate fonts via the FontFace API before any canvas rendering.
 * Must be awaited before calling generatePlate().
 *
 * Font names here MUST match exactly what plate-generator.ts uses in ctx.font:
 *   PlateFont                 → GL-Nummernschild-Mtl.ttf  (ajman, fujairah, sharjah default)
 *   PlateFont_abudhabi        → GL-Nummernschild-Mtl.ttf
 *   PlateFont_abudhabi_bike   → GL-Nummernschild-Mtl.ttf
 *   PlateFont_abudhabi_classic→ GL-Nummernschild-Mtl.ttf
 *   PlateFont_ajman_classic   → GL-Nummernschild-Mtl.ttf
 *   PlateFont_rak_classic     → GL-Nummernschild-Mtl.ttf
 *   PlateFont_rak             → DIN-1451.ttf
 *   PlateFont_umm_al_quwain   → DIN-1451.ttf
 *   PlateFont_sharjah_classic → DIN-1451.ttf
 *   PlateFont_sharjah_bike    → DIN-1451.ttf
 *   PlateFont_ajman_bike      → DIN-1451.ttf
 *   PlateFont_dubai           → RoughMotion.otf
 *   PlateFont_dubai_bike      → RoughMotion.otf
 *   PlateFont_dubai_classic   → RoughMotion.otf
 *   PlateFont_rak_bike        → RoughMotion.otf
 *   PlateFont_umm_al_quwain_bike → RoughMotion.otf
 *   PlateFont_fujairah_bike   → RoughMotion.otf
 *   ArabicFont_abudhabi       → Amiri-Bold.ttf
 */

interface FontDef {
  name: string;
  url: string;
  weight?: string;
}

// Each entry maps the exact font name used in ctx.font → the font file URL.
// IMPORTANT: Names here must match the logic in plate-generator.ts that resolves
//   fontNameId via `PlateFont_${configKey}` (e.g. PlateFont_abudhabi_bike).
const PLATE_FONTS: FontDef[] = [
  // ── GL Nummernschild ──────────────────────────────────────────────────────
  // Registered under every configKey that uses this file so document.fonts.check() succeeds
  { name: 'PlateFont', url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_ajman', url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_ajman_classic', url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_abudhabi', url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_abudhabi2', url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_abudhabi_bike', url: '/fonts/DIN-1451.ttf', weight: 'bold' },
  { name: 'PlateFont_abudhabi_classic', url: '/fonts/DIN-1451.ttf', weight: 'bold' },
  { name: 'PlateFont_rak_classic', url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_fujairah', url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_sharjah', url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },

  // ── DIN-1451 ──────────────────────────────────────────────────────────────
  { name: 'PlateFont_rak', url: '/fonts/DIN-1451.ttf', weight: 'bold' },
  { name: 'PlateFont_sharjah_classic', url: '/fonts/DIN-1451.ttf', weight: 'bold' },
  { name: 'PlateFont_sharjah_bike', url: '/fonts/DIN-1451.ttf', weight: 'bold' },
  { name: 'PlateFont_ajman_bike', url: '/fonts/DIN-1451.ttf', weight: 'bold' },

  // ── Rough Motion ──────────────────────────────────────────────────────────
  { name: 'PlateFont_dubai', url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_rak', url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_umm_al_quwain', url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_dubai_bike', url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_dubai_classic', url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_rak_bike', url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_umm_al_quwain_bike', url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_fujairah', url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_fujairah_bike', url: '/fonts/Rough Motion.otf', weight: 'bold' },

  // ── Arabic ────────────────────────────────────────────────────────────────
  { name: 'ArabicFont_abudhabi', url: '/fonts/Amiri-Bold.ttf', weight: 'bold' },
];

let fontsLoaded: Promise<void> | null = null;

/**
 * Loads all plate fonts exactly once. Blocks until every font is ready.
 * Throws if any font cannot be fetched — plate generation must NOT proceed on failure.
 */
export function loadPlateFonts(): Promise<void> {
  if (fontsLoaded) return fontsLoaded;

  fontsLoaded = (async () => {
    // 1. Register every font name via FontFace API so canvas can use them
    const faceLoads = PLATE_FONTS.map(async (def) => {
      const encodedUrl = def.url.replace(/ /g, '%20');
      const weight = def.weight ?? 'bold';

      // Never rely on document.fonts.check() — it can return true for system
      // fallback fonts, causing the real custom font to be skipped entirely.
      // Instead, check if we already added a FontFace with this exact name.
      const alreadyRegistered = Array.from(document.fonts).some(
        (f) => f.family === def.name || f.family === `"${def.name}"`
      );
      if (alreadyRegistered) return;

      try {
        const face = new FontFace(def.name, `url("${encodedUrl}")`, { weight, display: 'swap' });
        await face.load();
        document.fonts.add(face);
      } catch (e) {
        console.warn(`[PlateFontLoader] Failed to load "${def.name}" (${def.url}): ${e}`);
        // Continue — plate-generator.ts will use fallback font
      }
    });

    await Promise.all(faceLoads);

    // 2. Wait for the browser to fully process all registered fonts
    await document.fonts.ready;

    // 3. Log results
    const loaded = PLATE_FONTS.filter(def => {
      const weight = def.weight ?? 'bold';
      return document.fonts.check(`${weight} 12px "${def.name}"`);
    });
    console.log(`[PlateFontLoader] ${loaded.length}/${PLATE_FONTS.length} plate fonts loaded.`);
  })();

  return fontsLoaded;
}

/** Reset font cache (for testing only). */
export function _resetFontCache() {
  fontsLoaded = null;
}