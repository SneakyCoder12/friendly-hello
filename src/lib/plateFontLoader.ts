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
 *   PlateFont_dubai           → Rough Motion.otf
 *   PlateFont_dubai_bike      → Rough Motion.otf
 *   PlateFont_dubai_classic   → Rough Motion.otf
 *   PlateFont_rak_bike        → Rough Motion.otf
 *   PlateFont_umm_al_quwain_bike → Rough Motion.otf
 *   PlateFont_fujairah_bike   → Rough Motion.otf
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
  { name: 'PlateFont',                    url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_ajman',             url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_ajman_classic',     url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_abudhabi',          url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_abudhabi_bike',     url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_abudhabi_classic',  url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_rak_classic',       url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_fujairah',          url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_sharjah',           url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },

  // ── DIN-1451 ──────────────────────────────────────────────────────────────
  { name: 'PlateFont_rak',               url: '/fonts/DIN-1451.ttf', weight: 'bold' },
  { name: 'PlateFont_umm_al_quwain',     url: '/fonts/DIN-1451.ttf', weight: 'bold' },
  { name: 'PlateFont_sharjah_classic',   url: '/fonts/DIN-1451.ttf', weight: 'bold' },
  { name: 'PlateFont_sharjah_bike',      url: '/fonts/DIN-1451.ttf', weight: 'bold' },
  { name: 'PlateFont_ajman_bike',        url: '/fonts/DIN-1451.ttf', weight: 'bold' },

  // ── Rough Motion ──────────────────────────────────────────────────────────
  { name: 'PlateFont_dubai',             url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_dubai_bike',        url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_dubai_classic',     url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_rak_bike',          url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_umm_al_quwain_bike',url: '/fonts/Rough Motion.otf', weight: 'bold' },
  { name: 'PlateFont_fujairah_bike',     url: '/fonts/Rough Motion.otf', weight: 'bold' },

  // ── Arabic ────────────────────────────────────────────────────────────────
  { name: 'ArabicFont_abudhabi',         url: '/fonts/Amiri-Bold.ttf',   weight: 'bold' },
];

let fontsLoaded: Promise<void> | null = null;

/**
 * Loads all plate fonts exactly once. Blocks until every font is ready.
 * Throws if any font cannot be fetched — plate generation must NOT proceed on failure.
 */
export function loadPlateFonts(): Promise<void> {
  if (fontsLoaded) return fontsLoaded;

  fontsLoaded = (async () => {
    // 1. Verify all font files are reachable (deduplicated by URL)
    const seen = new Set<string>();
    const fetchChecks: Promise<void>[] = [];

    for (const def of PLATE_FONTS) {
      if (seen.has(def.url)) continue;
      seen.add(def.url);

      fetchChecks.push(
        (async () => {
          const encodedUrl = def.url.replace(/ /g, '%20');
          let response: Response;
          try {
            response = await fetch(encodedUrl);
          } catch (e) {
            const msg = `[PlateFontLoader] Network error fetching font: ${def.url} — ${e}`;
            console.error(msg);
            throw new Error(msg);
          }
          if (!response.ok) {
            const msg = `[PlateFontLoader] Font file not found (${response.status}): ${def.url}`;
            console.error(msg);
            throw new Error(msg);
          }
        })()
      );
    }

    // Fail fast — abort everything if any font file is missing
    await Promise.all(fetchChecks);

    // 2. Register every font name via FontFace API so canvas can use them
    const faceLoads = PLATE_FONTS.map(async (def) => {
      const encodedUrl = def.url.replace(/ /g, '%20');
      const weight = def.weight ?? 'bold';

      // Skip if this exact font name is already registered
      if (document.fonts.check(`${weight} 12px "${def.name}"`)) return;

      const face = new FontFace(def.name, `url("${encodedUrl}")`, { weight });
      try {
        await face.load();
      } catch (e) {
        const msg = `[PlateFontLoader] FontFace.load() failed for "${def.name}" (${def.url}): ${e}`;
        console.error(msg);
        throw new Error(msg);
      }
      document.fonts.add(face);
    });

    // Fail fast if any FontFace fails to load
    await Promise.all(faceLoads);

    // 3. Wait for the browser to fully process all registered fonts
    await document.fonts.ready;

    // 4. Final verification — confirm every font name is actually available to canvas
    for (const def of PLATE_FONTS) {
      const weight = def.weight ?? 'bold';
      if (!document.fonts.check(`${weight} 12px "${def.name}"`)) {
        const msg = `[PlateFontLoader] Font "${def.name}" still not available after load. Aborting.`;
        console.error(msg);
        throw new Error(msg);
      }
    }

    console.log('[PlateFontLoader] All plate fonts loaded and verified.');
  })();

  return fontsLoaded;
}

/** Reset font cache (for testing only). */
export function _resetFontCache() {
  fontsLoaded = null;
}
