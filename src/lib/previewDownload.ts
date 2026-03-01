/**
 * Canvas-based car/bike/classic preview download.
 *
 * Instead of relying on html-to-image (which uses SVG foreignObject and
 * can't handle -webkit-background-clip:text or custom fonts reliably),
 * this renders the entire preview onto a Canvas — matching the approach
 * used by the flat plate download which renders fonts perfectly.
 */

interface DownloadPreviewOptions {
    /** The car/bike background image URL */
    backgroundImage: string;
    /** The plate data URL (base64 image) */
    plateDataUrl: string;
    /** CSS-style plate positioning (top, left, width, transform) */
    plateStyling: Record<string, string | undefined>;
    /** Optional secondary plate styling (top corner plate) */
    plateStyling2?: Record<string, string | undefined>;
    /** Price value (number) or null */
    price: number | string | null;
    /** Phone number string */
    phone: string;
    /** Output filename */
    filename: string;
    /** Price styling from config */
    priceStyling?: Record<string, any>;
    /** Mobile/phone styling from config */
    mobileStyling?: Record<string, any>;
    /** Whether this is a bike preview (different text layout) */
    isBike?: boolean;
}

export async function downloadPreviewAsCanvas(opts: DownloadPreviewOptions): Promise<void> {
    const {
        backgroundImage, plateDataUrl, plateStyling, plateStyling2,
        price, phone, filename, priceStyling, mobileStyling, isBike
    } = opts;

    // Load the background image first to get its natural dimensions
    const bgImg = await loadImage(backgroundImage);

    // Use the background image's native aspect ratio at high resolution
    // Scale up to ~4K width for crisp output
    const scale = 7680 / bgImg.width;
    const canvasWidth = Math.round(bgImg.width * scale);
    const canvasHeight = Math.round(bgImg.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d')!;

    // 1. Draw car/bike background
    ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);

    // 2. Draw the plate overlay (primary)
    if (plateDataUrl && plateStyling) {
        await drawPlateOnCanvas(ctx, plateDataUrl, plateStyling, canvasWidth, canvasHeight);
    }

    // 3. Draw secondary plate overlay (top corner)
    if (plateDataUrl && plateStyling2) {
        await drawPlateOnCanvas(ctx, plateDataUrl, plateStyling2, canvasWidth, canvasHeight);
    }

    // 5. Ensure Cinzel Decorative is loaded
    await document.fonts.load('700 100px "Cinzel Decorative"');

    // 6. Draw price and phone text (if not a bike — bikes have different layout)
    if (!isBike && priceStyling) {
        drawGoldText(ctx, canvasWidth, canvasHeight, priceStyling,
            price ? `AED ${Number(price).toLocaleString()}` : 'Contact Seller',
            price ? 2.4 : 1.4
        );
    }

    if (!isBike && mobileStyling && phone) {
        drawGoldText(ctx, canvasWidth, canvasHeight, mobileStyling,
            formatPhoneWithSpaces(phone),
            1.6
        );
    }

    // For bike previews, draw price and phone at the bottom
    if (isBike) {
        drawBikeText(ctx, canvasWidth, canvasHeight, price, phone);
    }

    // 7. Export and download
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
}

/** Draw a plate image onto the canvas based on CSS-style positioning */
async function drawPlateOnCanvas(
    ctx: CanvasRenderingContext2D,
    plateDataUrl: string,
    styling: Record<string, any>,
    canvasWidth: number,
    canvasHeight: number
): Promise<void> {
    const plateImg = await loadImage(plateDataUrl);

    const top = parsePercent(styling.top) || 0.5;
    const left = parsePercent(styling.left) || 0.5;
    const width = parsePercent(styling.width) || 0.15;

    const plateWidth = canvasWidth * width;
    const plateHeight = (plateImg.height / plateImg.width) * plateWidth;

    // The CSS uses translate(-50%, -50%) to center around the position
    const x = canvasWidth * left - plateWidth / 2;
    const y = canvasHeight * top - plateHeight / 2;

    // Parse rotation from transform if present
    const transform = styling.transform || '';
    const rotateMatch = transform.match(/rotateZ\(([-\d.]+)deg\)/);
    const rotation = rotateMatch ? parseFloat(rotateMatch[1]) * (Math.PI / 180) : 0;

    // Apply brightness/contrast filter
    const filter = styling.filter;
    if (filter && typeof filter === 'string') {
        ctx.filter = filter;
    } else {
        ctx.filter = 'brightness(0.92) contrast(1.05)';
    }

    ctx.save();
    if (rotation !== 0) {
        ctx.translate(x + plateWidth / 2, y + plateHeight / 2);
        ctx.rotate(rotation);
        ctx.drawImage(plateImg, -plateWidth / 2, -plateHeight / 2, plateWidth, plateHeight);
    } else {
        ctx.drawImage(plateImg, x, y, plateWidth, plateHeight);
    }
    ctx.restore();
    ctx.filter = 'none';
}

/** Draw gold gradient text at A CSS-style position */
function drawGoldText(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    styling: Record<string, any>,
    text: string,
    baseFontScale: number
): void {
    const top = parsePercent(styling.top) || 0.9;
    const left = parsePercent(styling.left) || 0.5;
    const textScale = styling.textScale || 1;

    const x = canvasWidth * left;
    const y = canvasHeight * top;

    // cqi = container query inline size. We approximate it as canvasWidth / 100
    const fontSize = Math.round(baseFontScale * textScale * (canvasWidth / 100));

    ctx.save();
    ctx.font = `700 ${fontSize}px "Cinzel Decorative", serif`;
    ctx.textBaseline = 'middle';

    // Check if transform contains translate to determine alignment
    const transform = styling.transform || '';
    if (transform.includes('translate(-50%')) {
        ctx.textAlign = 'center';
    } else {
        ctx.textAlign = 'left';
    }

    // Create gold gradient
    const gradient = ctx.createLinearGradient(0, y - fontSize / 2, 0, y + fontSize / 2);
    gradient.addColorStop(0, '#F6D972');
    gradient.addColorStop(0.4, '#C39A31');
    gradient.addColorStop(0.5, '#F9EEA2');
    gradient.addColorStop(1, '#8C6C16');

    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;

    ctx.fillText(text, x, y);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.restore();
}

/** Draw bike-style text (price + phone side by side at bottom) */
function drawBikeText(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    price: number | string | null,
    phone: string
): void {
    const fontSize = Math.round(canvasWidth * 0.048);
    const y = canvasHeight * 0.94;

    ctx.save();
    ctx.font = `700 ${fontSize}px "Cinzel Decorative", serif`;
    ctx.textBaseline = 'middle';

    const gradient = ctx.createLinearGradient(0, y - fontSize / 2, 0, y + fontSize / 2);
    gradient.addColorStop(0, '#F6D972');
    gradient.addColorStop(0.4, '#C39A31');
    gradient.addColorStop(0.5, '#F9EEA2');
    gradient.addColorStop(1, '#8C6C16');

    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;

    const priceText = price ? `AED ${Number(price).toLocaleString()}` : 'Contact Seller';

    // Draw phone on the left, price on the right — matching the on-screen preview
    if (phone) {
        ctx.textAlign = 'center';
        ctx.fillText(formatPhoneWithSpaces(phone), canvasWidth * 0.30, y);
        ctx.fillText(priceText, canvasWidth * 0.70, y);
    } else {
        ctx.textAlign = 'center';
        ctx.fillText(priceText, canvasWidth / 2, y);
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.restore();
}

/** Parse a CSS percentage string like "67%" to 0.67 */
function parsePercent(value: string | undefined): number | null {
    if (!value) return null;
    const match = value.match(/([\d.]+)%/);
    return match ? parseFloat(match[1]) / 100 : null;
}

/** Load an image and return a promise */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/** Format a phone number with readable spacing */
function formatPhoneWithSpaces(pn: string): string {
    const cleaned = pn.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+971')) {
        const withoutCountry = cleaned.slice(4);
        if (withoutCountry.length >= 2) {
            const network = withoutCountry.substring(0, 2);
            const body1 = withoutCountry.substring(2, 5);
            const body2 = withoutCountry.substring(5);
            return `+971 ${network} ${body1} ${body2}`.trim();
        }
    } else if (cleaned.startsWith('05')) {
        const network = cleaned.substring(0, 3);
        const body1 = cleaned.substring(3, 6);
        const body2 = cleaned.substring(6);
        return `${network} ${body1} ${body2}`.trim();
    }
    return pn;
}
