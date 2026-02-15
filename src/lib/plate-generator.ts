/* UAE Number Plate Generator (Pixel-Perfect Multi-Emirate Engine)
   Ported from plate-generator.js — strict pixel measurements, no eyeballing.
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
    fontHeightRatio: 0.15,
    letterSpacingRatio: 0.02,
    baselineRatio: 0.50,
    verticalCenter: true,
    components: [
      { type: 'code', xRatio: 0.16, align: 'center', fontSizeRatio: 0.12, letterSpacingRatio: 0.001, baselineOffsetRatio: -0.05, emboss: true },
      { type: 'number', xRatio: 0.70, align: 'center', emboss: true },
    ],
  },
  dubai: {
    hasCode: true,
    fontHeightRatio: 0.125,
    letterSpacingRatio: 0.015,
    fontFile: '/fonts/DIN-1451.ttf',
    verticalCenter: false,
    baselineRatio: 0.44,
    components: [
      { type: 'code', xRatio: 0.115, align: 'center', emboss: true },
      { type: 'number', xRatio: 0.67, align: 'center', emboss: true },
    ],
  },
  sharjah: {
    hasCode: true,
    fontHeightRatio: 0.133,
    letterSpacingRatio: 0.015,
    baselineRatio: 0.43,
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
      { type: 'code', xRatio: 0.30, align: 'center', emboss: true },
      { type: 'number', xRatio: 0.65, align: 'center', emboss: true },
    ],
  },
  fujairah: {
    hasCode: true,
    fontHeightRatio: 0.14,
    letterSpacingRatio: 0.015,
    verticalCenter: true,
    components: [
      { type: 'code', xRatio: 0.13, align: 'center', emboss: true },
      { type: 'number', xRatio: 0.65, align: 'center', emboss: true },
    ],
  },
  umm_al_quwain: {
    hasCode: true,
    fontHeightRatio: 0.168,
    letterSpacingRatio: 0.015,
    fontFile: '/fonts/DIN-1451.ttf',
    baselineRatio: 0.457,
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

async function loadFont(fontName: string, fontFile: string, weight: string = 'bold'): Promise<string> {
  const name = fontName || FONT_PRIMARY;
  const file = fontFile || FONT_FILE;

  if (document.fonts) {
    try {
      const font = new FontFace(name, `url("${file}")`, { weight });
      await font.load();
      document.fonts.add(font);
      return name;
    } catch (e) {
      console.warn('Font load failed, using fallback', e);
      return FONT_FALLBACK;
    }
  }
  return FONT_FALLBACK;
}

function drawEmbossText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  letterSpacing: number,
  align: string
) {
  let totalWidth = 0;
  const widths: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const w = ctx.measureText(text[i]).width;
    widths.push(w);
    totalWidth += w;
    if (i < text.length - 1) totalWidth += letterSpacing;
  }

  let startX = x;
  if (align === 'center') startX = x - totalWidth / 2;
  if (align === 'right') startX = x - totalWidth;

  const offCanvas = document.createElement('canvas');
  offCanvas.width = Math.ceil(totalWidth + fontSize);
  offCanvas.height = Math.ceil(fontSize * 2);
  const offCtx = offCanvas.getContext('2d')!;

  offCtx.font = ctx.font;
  offCtx.fillStyle = '#000000';
  offCtx.textBaseline = 'alphabetic';

  const localBaseY = fontSize * 1.2;

  let cursorX = 0;
  for (let i = 0; i < text.length; i++) {
    offCtx.fillText(text[i], cursorX, localBaseY);
    cursorX += widths[i] + letterSpacing;
  }

  // Clip artifacts
  offCtx.clearRect(0, 0, offCanvas.width, localBaseY - fontSize * 0.82);
  offCtx.clearRect(0, localBaseY + fontSize * 0.15, offCanvas.width, offCanvas.height);

  ctx.drawImage(offCanvas, Math.round(startX), Math.round(y - localBaseY));
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

  ctx.drawImage(blankPlateImage, 0, 0, canvas.width, canvas.height);

  const W = canvas.width;
  const H = canvas.height;
  const globalFontHeight = W * config.fontHeightRatio;

  let baselineY = 0;
  if (config.verticalCenter) {
    baselineY = H / 2 + globalFontHeight * 0.35;
  } else {
    baselineY = W * (config.baselineRatio || 0.5);
  }

  const targetWeight = config.fontWeight || 'bold';
  const fontFile = config.fontFile || FONT_FILE;
  const fontNameId = config.fontFile ? `PlateFont_${id}` : FONT_PRIMARY;
  const fontName = await loadFont(fontNameId, fontFile, targetWeight);

  ctx.textBaseline = 'alphabetic';

  config.components.forEach((comp) => {
    let text = '';
    if (comp.type === 'code') text = (plateCode || '').toUpperCase();
    if (comp.type === 'number') text = plateNumber || '';
    if (!text) return;

    const x = W * comp.xRatio;
    const compFontSize = comp.fontSizeRatio ? W * comp.fontSizeRatio : globalFontHeight;
    const compSpacing = comp.letterSpacingRatio ? W * comp.letterSpacingRatio : W * config.letterSpacingRatio;

    let compY = baselineY;
    if (comp.baselineOffsetRatio) {
      compY = baselineY + W * comp.baselineOffsetRatio;
    }

    ctx.font = `${targetWeight} ${Math.round(compFontSize)}px "${fontName}", "${FONT_FALLBACK}", sans-serif`;
    drawEmbossText(ctx, text, x, compY, compFontSize, compSpacing, comp.align);
  });

  return canvas;
}

export function exportPNG(canvas: HTMLCanvasElement, filename: string = 'plate.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}
