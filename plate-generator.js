
/* UAE Number Plate Generator (Pixel-Perfect Multi-Emirate Engine)
   Based on absolute pixel measurements extracted from reference images.
   Strictly adheres to: Fixed font sizes, fixed positioning, no eyeballing.
*/

(function () {
    // Canvas dimensions for high-res output
    const OUTPUT_WIDTH = 3840; // 4K width

    // Default Fonts
    // User requested "Proper Bold". Using GL Mtl with clipping.
    // We will strip the lines programmatically.
    const FONT_PRIMARY = 'PlateFont';
    const FONT_FILE = 'fonts/GL-Nummernschild-Mtl.ttf';
    const FONT_FALLBACK = 'sans-serif';

    const CONFIGS = {
        ajman: {
            hasCode: true,
            fontHeightRatio: 0.18,
            letterSpacingRatio: 0.015,
            verticalCenter: true,
            components: [
                { type: 'code', xRatio: 0.09, align: 'center', emboss: true },
                { type: 'number', xRatio: 0.43, align: 'center', emboss: true }
            ]
        },
        abudhabi: {
            hasCode: true,
            fontHeightRatio: 0.15, // Global (for Number)
            letterSpacingRatio: 0.02,
            baselineRatio: 0.50,
            verticalCenter: true,
            components: [
                // Code: Smaller (0.12), Above 'A' (x=0.16), Up (offset=-0.05)
                { type: 'code', xRatio: 0.16, align: 'center', fontSizeRatio: 0.12, letterSpacingRatio: 0.001, baselineOffsetRatio: -0.05, emboss: true },
                // Number: Middle-Right (0.70)
                { type: 'number', xRatio: 0.70, align: 'center', emboss: true }
            ]
        },
        /* 
           HOW TO ADJUST POSITIONING MANUALLY:
           -----------------------------------
           xRatio: 0.0 (Left) to 1.0 (Right). Example: 0.5 is Center.
           fontSizeRatio: Size of text relative to plate width. Example: 0.15.
           letterSpacingRatio: Space between letters. Example: 0.01.
           baselineOffsetRatio: Move Up (Negative) or Down (Positive). Example: -0.05 moves UP.
        */
        // Dubai: "DUBAI" text is on the blank image (dubai-plate.png). We only draw code (B) and number (6836).
        // Move code right so it does not overlap the DUBAI label on the template.
        dubai: {
            hasCode: true,
            fontHeightRatio: 0.125,
            letterSpacingRatio: 0.015,
            fontFile: 'fonts/DIN-1451.ttf',
            verticalCenter: false,
            baselineRatio: 0.60,
            components: [
                { type: 'code', xRatio: 0.26, align: 'center', emboss: true },
                { type: 'number', xRatio: 0.70, align: 'center', emboss: true }
            ]
        },
        sharjah: {
            hasCode: true,
            fontHeightRatio: 0.133,
            letterSpacingRatio: 0.015,
            baselineRatio: 0.43, // Moved further down and code right
            verticalCenter: false,
            components: [
                { type: 'code', xRatio: 0.155, align: 'center', emboss: true },
                { type: 'number', xRatio: 0.735, align: 'center', emboss: true }
            ]
        },
        rak: {
            hasCode: true,
            fontHeightRatio: 0.168,
            letterSpacingRatio: 0.015,
            fontFile: 'fonts/DIN-1451.ttf',
            verticalCenter: true,
            components: [
                { type: 'code', xRatio: 0.30, align: 'center', emboss: true },
                { type: 'number', xRatio: 0.65, align: 'center', emboss: true }
            ]
        },
        fujairah: {
            hasCode: true,
            fontHeightRatio: 0.14,
            letterSpacingRatio: 0.015,
            verticalCenter: true,
            components: [
                { type: 'code', xRatio: 0.13, align: 'center', emboss: true },
                { type: 'number', xRatio: 0.65, align: 'center', emboss: true }
            ]
        },
        umm_al_quwain: {
            hasCode: true,
            fontHeightRatio: 0.168,
            letterSpacingRatio: 0.015,
            fontFile: 'fonts/DIN-1451.ttf',
            baselineRatio: 0.457, // from top
            verticalCenter: false,
            components: [
                { type: 'code', xRatio: 0.124, align: 'center', emboss: true },
                { type: 'number', xRatio: 0.671, align: 'center', emboss: true }
            ]
        }
    };

    class UAEPlateGenerator {
        static getConfig(emirate) {
            return CONFIGS[emirate] || CONFIGS['ajman'];
        }

        static async loadFont(fontName, fontFile, weight = 'bold') {
            // Handle defaults
            const name = fontName || FONT_PRIMARY;
            const file = fontFile || FONT_FILE;

            if (document.fonts && document.fonts.load) {
                try {
                    // Check if already loaded to avoid errors?
                    // We can just try to load.
                    const font = new FontFace(name, `url("${file}")`, { weight: weight });
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

        static async generatePlate({ plateCode, plateNumber, blankPlateImage, emirate }) {
            if (!blankPlateImage || !blankPlateImage.width) throw new Error('Invalid blank plate image');
            const id = (emirate || 'ajman').toLowerCase().replace(/\s+/g, '_');
            const config = CONFIGS[id] || CONFIGS['ajman'];

            const canvas = document.createElement('canvas');
            canvas.width = OUTPUT_WIDTH;
            const aspect = blankPlateImage.height / blankPlateImage.width;
            canvas.height = Math.round(OUTPUT_WIDTH * aspect);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(blankPlateImage, 0, 0, canvas.width, canvas.height);

            const W = canvas.width;
            const H = canvas.height;
            const globalFontHeight = W * config.fontHeightRatio;

            let baselineY = 0;
            if (config.verticalCenter) {
                baselineY = (H / 2) + (globalFontHeight * 0.35); // Approx baseline
            } else {
                baselineY = H * config.baselineRatio;
            }

            const targetWeight = config.fontWeight || 'bold';

            // Determine Font File
            const fontFile = config.fontFile || FONT_FILE;
            // Create a unique font name per emirate/file combo to prevent conflicts
            const fontNameId = config.fontFile ? `PlateFont_${id}` : FONT_PRIMARY;

            const fontName = await this.loadFont(fontNameId, fontFile, targetWeight);

            ctx.textBaseline = 'alphabetic';

            config.components.forEach(comp => {
                let text = '';
                if (comp.type === 'code') text = (plateCode || '').toUpperCase();
                if (comp.type === 'number') text = (plateNumber || '');

                if (!text) return;

                const x = W * comp.xRatio;

                // Component Overrides
                const compFontSize = comp.fontSizeRatio ? (W * comp.fontSizeRatio) : globalFontHeight;
                const compSpacing = comp.letterSpacingRatio ? (W * comp.letterSpacingRatio) : (W * config.letterSpacingRatio);

                // Baseline Offset
                let compY = baselineY;
                if (comp.baselineOffsetRatio) {
                    compY = baselineY + (H * comp.baselineOffsetRatio);
                }

                // Update font for this component
                ctx.font = `${targetWeight} ${Math.round(compFontSize)}px "${fontName}", "${FONT_FALLBACK}", sans-serif`;

                this.drawEmbossText(ctx, text, x, compY, compFontSize, compSpacing, comp.align);
            });

            return canvas;
        }

        static drawEmbossText(ctx, text, x, y, fontSize, letterSpacing, align) {
            // Measure total width
            let totalWidth = 0;
            const widths = [];
            for (let i = 0; i < text.length; i++) {
                const w = ctx.measureText(text[i]).width;
                widths.push(w);
                totalWidth += w;
                if (i < text.length - 1) totalWidth += letterSpacing;
            }

            // Determine Start X
            let startX = x;
            if (align === 'center') startX = x - (totalWidth / 2);
            if (align === 'right') startX = x - totalWidth;

            // Offscreen Canvas for Clipping
            const offCanvas = document.createElement('canvas');
            offCanvas.width = Math.ceil(totalWidth + fontSize); // + margin
            offCanvas.height = Math.ceil(fontSize * 2);
            const offCtx = offCanvas.getContext('2d');

            offCtx.font = ctx.font;
            offCtx.fillStyle = '#000000';
            offCtx.textBaseline = 'alphabetic';

            // Draw text on offscreen canvas at (0, baseline)
            // Baseline needs to be positioned. Let's put baseline at fontSize * 1.2
            const localBaseY = fontSize * 1.2;

            let cursorX = 0;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                offCtx.fillText(char, cursorX, localBaseY);
                cursorX += widths[i] + letterSpacing;
            }

            // CLIP ARTIFACTS
            // Safer: Clear rects
            // Top Line: usually above Cap Height.
            // Clear from Y=0 to Y=(localBaseY - fontSize * 0.82)
            offCtx.clearRect(0, 0, offCanvas.width, localBaseY - (fontSize * 0.82));

            // Bottom Line: usually below Baseline.
            // Clear from Y=(localBaseY + fontSize * 0.15) to Height
            offCtx.clearRect(0, localBaseY + (fontSize * 0.15), offCanvas.width, offCanvas.height);

            // Draw cleaned text to main canvas
            ctx.drawImage(offCanvas, Math.round(startX), Math.round(y - localBaseY));
        }

        static exportPNG(canvas, filename) {
            const link = document.createElement('a');
            link.download = filename || 'plate.png';
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        }
    }

    window.UAEPlateGenerator = UAEPlateGenerator;
})();
