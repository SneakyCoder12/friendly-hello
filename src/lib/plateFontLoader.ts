/**
 * Centralized plate font loader.
 * Loads all custom plate fonts via the FontFace API before any canvas rendering.
 * Must be awaited before calling generatePlate().
 */

interface FontDef {
  name: string;
  url: string;
  weight?: string;
}

const PLATE_FONTS: FontDef[] = [
  { name: 'PlateFont',              url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_abudhabi',     url: '/fonts/GL-Nummernschild-Mtl.ttf', weight: 'bold' },
  { name: 'PlateFont_rak',          url: '/fonts/DIN-1451.ttf',             weight: 'bold' },
  { name: 'PlateFont_umm_al_quwain',url: '/fonts/DIN-1451.ttf',             weight: 'bold' },
  { name: 'PlateFont_sharjah_classic', url: '/fonts/DIN-1451.ttf',          weight: 'bold' },
  { name: 'PlateFont_dubai',        url: '/fonts/Rough Motion.otf',          weight: 'bold' },
  { name: 'PlateFont_dubai_bike',   url: '/fonts/Rough Motion.otf',          weight: 'bold' },
  { name: 'PlateFont_rak_bike',     url: '/fonts/Rough Motion.otf',          weight: 'bold' },
  { name: 'PlateFont_umm_al_quwain_bike', url: '/fonts/Rough Motion.otf',    weight: 'bold' },
  { name: 'PlateFont_fujairah_bike',url: '/fonts/Rough Motion.otf',          weight: 'bold' },
  { name: 'PlateFont_dubai_classic',url: '/fonts/Rough Motion.otf',          weight: 'bold' },
  { name: 'ArabicFont_abudhabi',    url: '/fonts/Amiri-Bold.ttf',            weight: 'bold' },
];

let fontsLoaded: Promise<void> | null = null;

/**
 * Loads all plate fonts exactly once. Blocks until every font is ready or
 * throws if any critical font (e.g. Rough Motion) cannot be fetched.
 */
export function loadPlateFonts(): Promise<void> {
  if (fontsLoaded) return fontsLoaded;

  fontsLoaded = (async () => {
    // Deduplicate by URL so we don't fetch the same file multiple times
    const seen = new Set<string>();
    const loads: Promise<void>[] = [];

    for (const def of PLATE_FONTS) {
      if (seen.has(def.url)) continue;
      seen.add(def.url);

      loads.push(
        (async () => {
          const encodedUrl = def.url.replace(/ /g, '%20');
          let response: Response;
          try {
            response = await fetch(encodedUrl);
          } catch (e) {
            const msg = `Font network error: ${def.url} — ${e}`;
            console.error(msg);
            throw new Error(msg);
          }
          if (!response.ok) {
            const msg = `Font not found (${response.status}): ${def.url}`;
            console.error(msg);
            throw new Error(msg);
          }
        })()
      );
    }

    // Fail fast if any font 404s
    await Promise.all(loads);

    // Now load all FontFace instances so the browser has them
    const faceLoads = PLATE_FONTS.map(async (def) => {
      const encodedUrl = def.url.replace(/ /g, '%20');
      // Skip if already loaded under this name
      if (document.fonts.check(`${def.weight ?? 'bold'} 12px "${def.name}"`)) return;
      const face = new FontFace(def.name, `url("${encodedUrl}")`, {
        weight: def.weight ?? 'bold',
      });
      await face.load();
      document.fonts.add(face);
    });

    await Promise.all(faceLoads);
    await document.fonts.ready;
  })();

  return fontsLoaded;
}

/** Reset font cache (for testing only). */
export function _resetFontCache() {
  fontsLoaded = null;
}
