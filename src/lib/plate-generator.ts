/* UAE Number Plate Generator (Pixel-Perfect Multi-Emirate Engine)
   SVG-based rendering for Embossed Plates (High Fidelity - Sharp Micro-Bevel)
   Canvas-based rendering for Flat Plates
*/

const OUTPUT_WIDTH = 3840;

const FONT_PRIMARY = 'PlateFont';
const FONT_FILE = '/fonts/GL-Nummernschild-Mtl.ttf';
const FONT_FALLBACK = 'sans-serif';

interface ComponentConfig {
  type: 'code' | 'number';
  xRatio: number;
  align: 'center' | 'left' | 'right';
  emboss?: boolean;
  fontSizeRatio?: number;
  letterSpacingRatio?: number;
  baselineOffsetRatio?: number;
}

interface EmirateConfig {
  hasCode: boolean;
  fontHeightRatio: number;
  letterSpacingRatio: number;
  baselineRatio?: number;
  verticalCenter: boolean;
  fontFile?: string;
  fontWeight?: string;
  components: ComponentConfig[];
}

const CONFIGS: Record<string, EmirateConfig> = {
  ajman: {
    hasCode: true,
    fontHeightRatio: 0.18,
    letterSpacingRatio: 0.015,
    verticalCenter: true,
    components: [
      { type: 'code', xRatio: 0.09, align: 'center', emboss: true },
      { type: 'number', xRatio: 0.43, align: 'center', emboss: true },
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
      { type: 'code', xRatio: 0.14, align: 'center', fontSizeRatio: 0.12, letterSpacingRatio: 0.0001, baselineOffsetRatio: -0.23, emboss: true },
      { type: 'number', xRatio: 0.70, align: 'center', emboss: true, letterSpacingRatio: 0.0001, },
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
        xRatio: 0.12,
        align: 'center',
        fontSizeRatio: 0.13,
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
      { type: 'code', xRatio: 0.155, align: 'center', emboss: true },
      { type: 'number', xRatio: 0.735, align: 'center', emboss: true },
    ],
  },
  rak: {
    hasCode: true,
    fontHeightRatio: 0.168,
    letterSpacingRatio: 0.015,
    fontFile: '/fonts/DIN-1451.ttf',
    verticalCenter: true,
    components: [
      { type: 'code', xRatio: 0.31, align: 'center', emboss: true },
      { type: 'number', xRatio: 0.65, align: 'center', emboss: true },
    ],
  },
  fujairah: {
    hasCode: true,
    fontHeightRatio: 0.18,
    letterSpacingRatio: 0.015,
    verticalCenter: true,
    components: [
      { type: 'code', xRatio: 0.13, align: 'center', emboss: true },
      { type: 'number', xRatio: 0.65, align: 'center', emboss: true },
    ],
  },
  umm_al_quwain: {
    hasCode: true,
    fontHeightRatio: 0.17,
    letterSpacingRatio: 0.015,
    fontFile: '/fonts/DIN-1451.ttf',
    baselineRatio: 0.80,
    verticalCenter: false,
    components: [
      { type: 'code', xRatio: 0.124, align: 'center', emboss: true },
      { type: 'number', xRatio: 0.671, align: 'center', emboss: true },
    ],
  },
};

export function getConfig(emirate: string): EmirateConfig {
  return CONFIGS[emirate] || CONFIGS['ajman'];
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
}

export async function generatePlate({
  plateCode,
  plateNumber,
  blankPlateImage,
  emirate,
}: GeneratePlateOptions): Promise<HTMLCanvasElement> {
  if (!blankPlateImage || !blankPlateImage.width) throw new Error('Invalid blank plate image');
  const id = (emirate || 'ajman').toLowerCase().replace(/\s+/g, '_');
  const config = CONFIGS[id] || CONFIGS['ajman'];

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_WIDTH;
  const aspect = blankPlateImage.height / blankPlateImage.width;
  canvas.height = Math.round(OUTPUT_WIDTH * aspect);
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

  // Load Fonts
  const targetWeight = config.fontWeight || 'bold';
  const fontFileURL = config.fontFile || FONT_FILE;
  const fontNameId = config.fontFile ? `PlateFont_${id}` : FONT_PRIMARY;

  // Load Font
  const font = new FontFace(fontNameId, `url("${fontFileURL}")`, { weight: targetWeight });
  await font.load();
  document.fonts.add(font);

  ctx.textBaseline = 'alphabetic';

  for (const comp of config.components) {
    let text = '';
    if (comp.type === 'code') text = (plateCode || '').toUpperCase();
    if (comp.type === 'number') text = plateNumber || '';
    if (!text) continue;

    const compFontSize = comp.fontSizeRatio ? W * comp.fontSizeRatio : globalFontHeight;
    const compSpacing = comp.letterSpacingRatio ? W * comp.letterSpacingRatio : W * config.letterSpacingRatio;

    const x = W * comp.xRatio;
    let compY = baselineY;
    if (comp.baselineOffsetRatio) compY = baselineY + H * comp.baselineOffsetRatio;

    ctx.font = `${targetWeight} ${Math.round(compFontSize)}px "${fontNameId}", sans-serif`;

    // Calculate alignment
    const width = ctx.measureText(text).width + (text.length - 1) * compSpacing;
    let startX = x;
    if (comp.align === 'center') startX = x - width / 2;
    if (comp.align === 'right') startX = x - width;

    let cursorX = startX;

    // Scale offsets relative to font size (for 4K clarity)
    const shadowOff = Math.max(3, Math.round(compFontSize * 0.018));
    const strokeW = Math.max(2, Math.round(compFontSize * 0.012));

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

        // ---- LAYER 3: MAIN TEXT (solid black on top) ----
        ctx.save();
        ctx.fillStyle = '#0a0a0a';
        ctx.fillText(char, cursorX, compY);
        ctx.restore();

      } else {
        // ===== FLAT (no emboss) =====
        ctx.fillStyle = '#000000';
        ctx.fillText(char, cursorX, compY);
      }

      cursorX += charWidth + compSpacing;
    }
  }

  return canvas;
}

export function exportPNG(canvas: HTMLCanvasElement, filename: string = 'plate.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}
