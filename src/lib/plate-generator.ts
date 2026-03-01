/* UAE Number Plate Generator (Pixel-Perfect Multi-Emirate Engine)
   SVG-based rendering for Embossed Plates (High Fidelity - Sharp Micro-Bevel)
   Canvas-based rendering for Flat Plates
*/

import { loadPlateFonts } from './plateFontLoader';

const OUTPUT_WIDTH = 3840;

const FONT_PRIMARY = 'PlateFont';
const FONT_FILE = '/fonts/GL-Nummernschild-Mtl.ttf';
const FONT_FALLBACK = 'sans-serif';

interface ComponentConfig {
  type: 'code' | 'number' | 'arabic_number';
  xRatio: number;
  align: 'center' | 'left' | 'right';
  emboss?: boolean;
  fontSizeRatio?: number;
  letterSpacingRatio?: number;
  baselineOffsetRatio?: number;
  yRatio?: number; // Explicit Y position ratio (0.0 to 1.0) overrides baseline
  color?: string; // Override text color (default: '#0a0a0a')
}

interface EmirateConfig {
  hasCode: boolean;
  fontHeightRatio: number;
  letterSpacingRatio: number;
  verticalCenter: boolean;
  fontFile?: string;
  arabicFontFile?: string;
  fontWeight?: string;
  baselineRatio?: number;
  components: ComponentConfig[];
}

const CONFIGS: Record<string, EmirateConfig> = {
  ajman: {
    hasCode: true,
    fontHeightRatio: 0.22,
    letterSpacingRatio: 0.001,
    verticalCenter: true,
    components: [
      { type: 'code', xRatio: 0.10, yRatio: 0.77, align: 'center', emboss: true, fontSizeRatio: 0.19 },
      { type: 'number', xRatio: 0.42, yRatio: 0.81, align: 'center', emboss: true },
    ],
  },
  abudhabi: {
    hasCode: true,
    fontHeightRatio: 0.18,
    letterSpacingRatio: 0.02,
    fontFile: '/fonts/GL-Nummernschild-Mtl.ttf',
    baselineRatio: 0.50,
    verticalCenter: true,
    components: [
      { type: 'code', xRatio: 0.09, yRatio: 0.46, align: 'center', fontSizeRatio: 0.12, letterSpacingRatio: 0.0001, baselineOffsetRatio: -0.23, emboss: true },
      { type: 'number', xRatio: 0.70, yRatio: 0.81, align: 'center', fontSizeRatio: 0.24, emboss: true, letterSpacingRatio: 0.0001, baselineOffsetRatio: -0.03 },
    ],
  },
  abudhabi2: {
    hasCode: true,
    fontHeightRatio: 0.18,
    letterSpacingRatio: 0.02,
    fontFile: '/fonts/GL-Nummernschild-Mtl.ttf',
    baselineRatio: 0.50,
    verticalCenter: true,
    components: [
      { type: 'code', xRatio: 0.085, yRatio: 0.71, align: 'center', fontSizeRatio: 0.165, letterSpacingRatio: 0.0001, baselineOffsetRatio: -0.23, emboss: true, color: '#ffffff' },
      { type: 'number', xRatio: 0.70, yRatio: 0.80, align: 'center', fontSizeRatio: 0.23, emboss: true, letterSpacingRatio: 0.0001, baselineOffsetRatio: -0.03 },
    ],
  },
  dubai: {
    hasCode: true,
    fontHeightRatio: 0.20,
    letterSpacingRatio: 0.015,
    fontFile: '/fonts/Rough Motion.otf',
    verticalCenter: true,
    components: [
      {
        type: 'code',
        letterSpacingRatio: 0.0001,
        baselineOffsetRatio: 0.04,
        xRatio: 0.13,
        align: 'center',
        fontSizeRatio: 0.12,
        emboss: true
      },
      {
        type: 'number',
        xRatio: 0.62,
        align: 'center',
        emboss: true
      },
    ],
  },
  sharjah: {
    hasCode: true,
    fontHeightRatio: 0.133,
    letterSpacingRatio: 0.015,
    baselineRatio: 0.70,
    verticalCenter: false,
    components: [
      { type: 'code', xRatio: 0.165, align: 'center', emboss: true },
      { type: 'number', xRatio: 0.760, yRatio: 0.74, fontSizeRatio: 0.18, letterSpacingRatio: 0.0001, align: 'center', emboss: true },
    ],
  },
  rak: {
    hasCode: true,
    fontHeightRatio: 0.168,
    letterSpacingRatio: 0.001,
    fontFile: '/fonts/Rough Motion.otf',
    verticalCenter: true,
    components: [
      { type: 'code', xRatio: 0.31, yRatio: 0.82, align: 'center', emboss: true, fontSizeRatio: 0.20 },
      { type: 'number', xRatio: 0.65, yRatio: 0.82, align: 'center', emboss: true, fontSizeRatio: 0.20 },
    ],
  },
  fujairah: {
    hasCode: true,
    fontHeightRatio: 0.18,
    letterSpacingRatio: 0.001,
    fontFile: '/fonts/Rough Motion.otf',
    verticalCenter: true,
    components: [
      { type: 'code', xRatio: 0.13, yRatio: 0.74, align: 'center', emboss: true, fontSizeRatio: 0.15 },
      { type: 'number', xRatio: 0.70, yRatio: 0.74, align: 'center', emboss: true, fontSizeRatio: 0.15 },
    ],
  },
  umm_al_quwain: {
    hasCode: true,
    fontHeightRatio: 0.17,
    letterSpacingRatio: 0.01,
    fontFile: '/fonts/Rough Motion.otf',
    baselineRatio: 0.80,
    verticalCenter: false,
    components: [
      { type: 'code', xRatio: 0.124, align: 'center', emboss: true },
      { type: 'number', xRatio: 0.68, align: 'center', emboss: true, letterSpacingRatio: 0.003, },
    ],
  },
};

// --- Bike Configurations (Shared Defaults) ---
const BIKE_SQUARE_DEFAULTS = {
  fontHeightRatio: 0.28,
  letterSpacingRatio: 0.015,
  verticalCenter: false, // We use explicit positioning for 2 lines
  baselineRatio: 0.5,
};



// --- Add Bike Configs ---
// Helper to extend config
const withBike = (base: EmirateConfig, overrides: Partial<EmirateConfig>): EmirateConfig => ({ ...base, ...overrides });

// Abu Dhabi Bike
CONFIGS['abudhabi_bike'] = {
  ...BIKE_SQUARE_DEFAULTS,
  hasCode: true,
  fontFile: '/fonts/GL-Nummernschild-Mtl.ttf',
  components: [
    { type: 'code', xRatio: 0.87, yRatio: 0.39, align: 'center', emboss: true, fontSizeRatio: 0.19 },
    { type: 'number', xRatio: 0.51, yRatio: 0.90, align: 'center', emboss: true, fontSizeRatio: 0.22 },
  ],
};


// Dubai Bike
CONFIGS['dubai_bike'] = {
  ...BIKE_SQUARE_DEFAULTS,
  hasCode: true,
  fontFile: '/fonts/Rough Motion.otf',
  letterSpacingRatio: 0.001,
  components: [
    { type: 'code', xRatio: 0.877, yRatio: 0.44, align: 'center', emboss: true, fontSizeRatio: 0.20 },
    { type: 'number', xRatio: 0.5, yRatio: 0.875, align: 'center', emboss: true, fontSizeRatio: 0.25 },
  ],
};


// Sharjah Bike
CONFIGS['sharjah_bike'] = {
  ...BIKE_SQUARE_DEFAULTS,
  hasCode: true,
  fontFile: '/fonts/DIN-1451.ttf',
  letterSpacingRatio: 0.01,
  components: [
    { type: 'code', xRatio: 0.177, yRatio: 0.44, align: 'center', emboss: true, fontSizeRatio: 0.20 },
    { type: 'number', xRatio: 0.66, yRatio: 0.885, align: 'center', emboss: true, fontSizeRatio: 0.20 },
  ],
};

// Ajman Bike
CONFIGS['ajman_bike'] = {
  ...BIKE_SQUARE_DEFAULTS,
  hasCode: true,
  fontFile: '/fonts/DIN-1451.ttf',
  components: [
    { type: 'code', xRatio: 0.177, yRatio: 0.44, align: 'center', emboss: true, fontSizeRatio: 0.20 },
    { type: 'number', xRatio: 0.64, yRatio: 0.895, align: 'center', emboss: true, fontSizeRatio: 0.20 },
  ],
};

// Umm Al Quwain Bike
CONFIGS['umm_al_quwain_bike'] = {
  ...BIKE_SQUARE_DEFAULTS,
  hasCode: true,
  letterSpacingRatio: 0.01,
  fontFile: '/fonts/Rough Motion.otf',
  components: [
    { type: 'code', xRatio: 0.171, yRatio: 0.87, align: 'center', emboss: true, fontSizeRatio: 0.18 },
    { type: 'number', xRatio: 0.62, yRatio: 0.87, align: 'center', emboss: true, fontSizeRatio: 0.18 },
  ],
};

// Ras Al Khaimah Bike
CONFIGS['rak_bike'] = {
  ...BIKE_SQUARE_DEFAULTS,
  hasCode: true,
  fontFile: '/fonts/Rough Motion.otf',
  letterSpacingRatio: 0.01,
  components: [
    { type: 'code', xRatio: 0.12, yRatio: 0.43, align: 'center', emboss: true, fontSizeRatio: 0.18 },
    { type: 'number', xRatio: 0.52, yRatio: 0.87, align: 'center', emboss: true, fontSizeRatio: 0.18 },
  ],
};

// Fujairah Bike
CONFIGS['fujairah_bike'] = {
  ...BIKE_SQUARE_DEFAULTS,
  hasCode: false,
  fontFile: '/fonts/Rough Motion.otf',
  letterSpacingRatio: 0.01,
  components: [
    { type: 'number', xRatio: 0.5, yRatio: 0.89, align: 'center', emboss: true, fontSizeRatio: 0.20 },
  ],
};

// --- Classic Plate Configs ---

// Abu Dhabi Classic
CONFIGS['abudhabi_classic'] = {
  hasCode: false,
  fontHeightRatio: 0.22,
  letterSpacingRatio: 0.01,
  fontFile: '/fonts/GL-Nummernschild-Mtl.ttf',
  arabicFontFile: '/fonts/Amiri-Bold.ttf',
  verticalCenter: true,
  components: [
    { type: 'number', xRatio: 0.20, yRatio: 0.68, align: 'center', emboss: true, fontSizeRatio: 0.14, letterSpacingRatio: 0.001 },
    { type: 'arabic_number', xRatio: 0.79, yRatio: 0.64, align: 'center', emboss: true, fontSizeRatio: 0.125, letterSpacingRatio: -0.01 },
  ],
};

// Dubai Classic
CONFIGS['dubai_classic'] = {
  hasCode: false,
  fontHeightRatio: 0.20,
  letterSpacingRatio: -0.0001,
  fontFile: '/fonts/Rough Motion.otf',
  verticalCenter: true,
  components: [

    { type: 'number', xRatio: 0.60, align: 'center', emboss: true, fontSizeRatio: 0.2 },
  ],
};

// Ajman Classic
CONFIGS['ajman_classic'] = {
  hasCode: false,
  fontHeightRatio: 0.22,
  letterSpacingRatio: 0.001,
  fontFile: '/fonts/GL-Nummernschild-Mtl.ttf',
  verticalCenter: true,
  components: [
    { type: 'number', xRatio: 0.50, yRatio: 0.69, align: 'center', emboss: true, fontSizeRatio: 0.16, color: 'white' },
  ],
};

// Sharjah Classic
CONFIGS['sharjah_classic'] = {
  hasCode: true,
  fontHeightRatio: 0.22,
  letterSpacingRatio: 0.005,
  fontFile: '/fonts/DIN-1451.ttf',
  verticalCenter: true,
  components: [
    { type: 'code', xRatio: 0.10, yRatio: 0.82, align: 'center', emboss: true, fontSizeRatio: 0.10, color: 'white' },
    { type: 'number', xRatio: 0.72, yRatio: 0.69, align: 'center', emboss: true, fontSizeRatio: 0.13 },
  ],
};

// RAK Classic
CONFIGS['rak_classic'] = {
  hasCode: false,
  fontHeightRatio: 0.22,
  letterSpacingRatio: 0.015,
  fontFile: '/fonts/GL-Nummernschild-Mtl.ttf',
  verticalCenter: true,
  components: [
    { type: 'number', xRatio: 0.50, yRatio: 0.84, align: 'center', emboss: true, fontSizeRatio: 0.3, color: 'white' },
  ],
};

export function getConfig(emirate: string, plateStyle: 'private' | 'bike' | 'classic' = 'private', version: number = 1): EmirateConfig {
  const emId = (emirate || 'ajman').toLowerCase().replace(/\s+/g, '_');
  const versionSuffix = version === 2 ? '2' : '';
  const styleSuffix = plateStyle && plateStyle !== 'private' ? `_${plateStyle}` : '';
  const configKey = `${emId}${versionSuffix}${styleSuffix}`;

  return CONFIGS[configKey] || CONFIGS[`${emId}${versionSuffix}`] || CONFIGS[`${emId}${styleSuffix}`] || CONFIGS[emId] || CONFIGS['ajman'];
}

// Global font cache
const fontCache: Record<string, string> = {};

async function fetchFontAsBase64(url: string): Promise<string> {
  if (fontCache[url]) return fontCache[url];
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        fontCache[url] = base64;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Failed to load font:', url, e);
    return '';
  }
}

export interface GeneratePlateOptions {
  plateCode: string;
  plateNumber: string;
  blankPlateImage: HTMLImageElement;
  emirate: string;
  plateStyle?: 'private' | 'bike' | 'classic';
  version?: number;
  outputWidth?: number; // Optional output resolution for performance optimization
}

export async function generatePlate({
  plateCode,
  plateNumber,
  blankPlateImage,
  emirate,
  plateStyle = 'private',
  version = 1,
  outputWidth = 3840,
}: GeneratePlateOptions): Promise<HTMLCanvasElement> {
  if (!blankPlateImage || !blankPlateImage.width) throw new Error('Invalid blank plate image');

  const config = getConfig(emirate, plateStyle, version);
  const emId = (emirate || 'ajman').toLowerCase().replace(/\s+/g, '_');
  const versionSuffix = version === 2 ? '2' : '';
  const styleSuffix = plateStyle && plateStyle !== 'private' ? `_${plateStyle}` : '';
  const configKey = `${emId}${versionSuffix}${styleSuffix}`;

  // English-to-Arabic-Indic digit conversion
  const ARABIC_DIGITS = ['\u0660', '\u0661', '\u0662', '\u0663', '\u0664', '\u0665', '\u0666', '\u0667', '\u0668', '\u0669'];
  const toArabicIndic = (str: string) => str.replace(/[0-9]/g, d => ARABIC_DIGITS[parseInt(d)]);

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  const aspect = blankPlateImage.height / blankPlateImage.width;
  canvas.height = Math.round(outputWidth * aspect);
  const ctx = canvas.getContext('2d')!;

  // Draw Background
  ctx.drawImage(blankPlateImage, 0, 0, canvas.width, canvas.height);

  const W = canvas.width;
  const H = canvas.height;
  const globalFontHeight = W * config.fontHeightRatio;

  // Calculate Baseline
  let baselineY = 0;
  if (config.verticalCenter) {
    baselineY = H / 2 + globalFontHeight * 0.35;
  } else {
    baselineY = H * (config.baselineRatio || 0.5);
  }

  // Load all plate fonts before rendering (centralized, fail-safe)
  try {
    await loadPlateFonts();
  } catch (e) {
    console.warn('[PlateGenerator] Font loading had errors, will use fallbacks:', e);
  }

  // Derive the specific font name for this emirate+style config.
  // MUST match the exact registered name in plateFontLoader.ts.
  // Priority: PlateFont_<configKey> → PlateFont_<emId> → PlateFont (default)
  const targetWeight = config.fontWeight || 'bold';
  // Use the most specific registered font name: PlateFont_<configKey> first, then PlateFont_<emId>, then default
  const fontNameId = config.fontFile
    ? `PlateFont_${configKey}`
    : FONT_PRIMARY;

  let arabicFontNameId = '';
  if (config.arabicFontFile) {
    arabicFontNameId = `ArabicFont_${emId}`;
  }

  ctx.textBaseline = 'alphabetic';

  for (const comp of config.components) {
    let text = '';
    if (comp.type === 'code') text = (plateCode || '').toUpperCase();
    if (comp.type === 'number') text = plateNumber || '';
    if (comp.type === 'arabic_number') text = toArabicIndic(plateNumber || '');
    if (!text) continue;

    // Use Arabic font for arabic_number components
    const isArabic = comp.type === 'arabic_number' && arabicFontNameId;
    const activeFontName = isArabic ? arabicFontNameId : fontNameId;

    const compFontSize = comp.fontSizeRatio ? W * comp.fontSizeRatio : globalFontHeight;
    const compSpacing = comp.letterSpacingRatio ? W * comp.letterSpacingRatio : W * config.letterSpacingRatio;

    const x = W * comp.xRatio;
    let compY = baselineY;
    if (comp.yRatio !== undefined) {
      compY = H * comp.yRatio;
    } else if (comp.baselineOffsetRatio) {
      compY = baselineY + H * comp.baselineOffsetRatio;
    }

    // NO fallback font — only the custom plate font is allowed
    ctx.font = `${targetWeight} ${Math.round(compFontSize)}px "${activeFontName}"`;

    // Calculate alignment
    const width = ctx.measureText(text).width + (text.length - 1) * compSpacing;
    let startX = x;
    if (comp.align === 'center') startX = x - width / 2;
    if (comp.align === 'right') startX = x - width;

    let cursorX = startX;

    // Scale offsets relative to canvas height (for consistent 4K clarity)
    const shadowOff = Math.max(3, Math.round(H * 0.005));
    const strokeW = Math.max(2, Math.round(H * 0.003));

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charWidth = ctx.measureText(char).width;

      if (comp.emboss) {
        // ===== 3D EMBOSS (Rakmoon-style "pressed metal") =====

        // ---- LAYER 1: DEPTH SHADOW (behind everything) ----
        // Solid dark shape offset to bottom-right — creates depth
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(char, cursorX + shadowOff, compY + shadowOff);
        ctx.restore();

        // ---- LAYER 2: WHITE OUTLINE (raised edge) ----
        // Thin white stroke around the character position
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = strokeW;
        ctx.lineJoin = 'round';
        ctx.strokeText(char, cursorX, compY);
        ctx.restore();

        // ---- LAYER 3: MAIN TEXT (solid color on top) ----
        ctx.save();
        ctx.fillStyle = comp.color || '#0a0a0a';
        ctx.fillText(char, cursorX, compY);
        ctx.restore();

      } else {
        // ===== FLAT (no emboss) =====
        ctx.fillStyle = comp.color || '#000000';
        ctx.fillText(char, cursorX, compY);
      }

      cursorX += charWidth + compSpacing;
    }
  }

  return canvas;
}

export function exportPNG(canvas: HTMLCanvasElement, filename: string = 'plate.png') {
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('Failed to generate image blob');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }, 'image/png', 1.0);
}
