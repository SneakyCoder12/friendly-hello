import { useState, useEffect, useCallback, useRef } from 'react';
import { generatePlate, exportPNG, type GeneratePlateOptions } from '@/lib/plate-generator';
import { PLATE_TEMPLATES } from '@/data/listings';

// Per-image cache (loaded on demand, not all at once)
const imageCache: Record<string, HTMLImageElement> = {};
const imageLoadPromises: Record<string, Promise<HTMLImageElement | null>> = {};

// Cache for rendered plate data URLs to avoid re-rendering
const plateDataUrlCache: Record<string, string> = {};

function loadSingleImage(key: string): Promise<HTMLImageElement | null> {
    if (imageCache[key]) return Promise.resolve(imageCache[key]);
    if (key in imageLoadPromises) return imageLoadPromises[key];

    const src = PLATE_TEMPLATES[key];
    if (!src) return Promise.resolve(null);

    imageLoadPromises[key] = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            imageCache[key] = img;
            resolve(img);
        };
        img.onerror = () => {
            console.warn('Failed to load:', src);
            resolve(null);
        };
        img.src = src;
    });
    return imageLoadPromises[key];
}

// Keep loadAllTemplateImages for the interactive generator which needs all images
let imagesLoadedPromise: Promise<Record<string, HTMLImageElement>> | null = null;

function loadAllTemplateImages(): Promise<Record<string, HTMLImageElement>> {
    if (imagesLoadedPromise) return imagesLoadedPromise;

    imagesLoadedPromise = new Promise((resolve) => {
        const keys = Object.keys(PLATE_TEMPLATES);
        let loaded = 0;

        keys.forEach((key) => {
            if (imageCache[key]) {
                if (++loaded === keys.length) resolve(imageCache);
                return;
            }
            const img = new Image();
            img.onload = () => {
                imageCache[key] = img;
                if (++loaded === keys.length) resolve(imageCache);
            };
            img.onerror = () => {
                console.warn('Failed to load:', PLATE_TEMPLATES[key]);
                if (++loaded === keys.length) resolve(imageCache);
            };
            img.src = PLATE_TEMPLATES[key];
        });
    });

    return imagesLoadedPromise;
}

/** Hook for rendering a single plate to a data URL (for cards) */
export function usePlateImage(emirate: string, code: string, number: string, plateStyle: 'private' | 'bike' | 'classic' = 'private', version: number = 1) {
    const cacheKey = `${emirate}_${code}_${number}_${plateStyle}_v${version}`;
    const [dataUrl, setDataUrl] = useState<string | null>(plateDataUrlCache[cacheKey] || null);

    useEffect(() => {
        let cancelled = false;

        // If already cached, use it immediately
        if (plateDataUrlCache[cacheKey]) {
            setDataUrl(plateDataUrlCache[cacheKey]);
            return;
        }

        (async () => {
            // Load only the specific template image needed
            let imgKey = emirate;
            if (version === 2) imgKey = `${emirate}2`;
            if (plateStyle === 'bike') imgKey = `${emirate}_bike`;
            if (plateStyle === 'classic') imgKey = `${emirate}_classic`;

            // Try specific key first, fallback to base emirate
            let img = await loadSingleImage(imgKey);
            if (!img && imgKey !== emirate) img = await loadSingleImage(emirate);
            if (!img || cancelled) return;

            try {
                const canvas = await generatePlate({
                    emirate,
                    plateCode: code,
                    plateNumber: number,
                    blankPlateImage: img,
                    plateStyle,
                    version,
                });
                if (!cancelled) {
                    // Pre-scale the 4K canvas down to ~900px for the preview UI.
                    // This stops the browser from choking on a 4000px 3D transform and fixes pixelation.
                    const uiCanvas = document.createElement('canvas');
                    const targetWidth = Math.min(canvas.width, 2160);
                    const scale = targetWidth / canvas.width;
                    uiCanvas.width = targetWidth;
                    uiCanvas.height = canvas.height * scale;
                    const bCtx = uiCanvas.getContext('2d')!;
                    bCtx.imageSmoothingEnabled = true;
                    bCtx.imageSmoothingQuality = 'high';
                    bCtx.drawImage(canvas, 0, 0, uiCanvas.width, uiCanvas.height);

                    const url = uiCanvas.toDataURL('image/png', 1.0);
                    plateDataUrlCache[cacheKey] = url;
                    setDataUrl(url);
                }
            } catch (e) {
                console.error('Plate render failed:', e);
            }
        })();

        return () => { cancelled = true; };
    }, [emirate, code, number, plateStyle, version, cacheKey]);

    return dataUrl;
}

/** Hook for the interactive plate generator with live preview */
export function usePlateGenerator() {
    const [emirate, setEmirate] = useState('abudhabi');
    const [plateStyle, setPlateStyle] = useState<'private' | 'bike' | 'classic'>('private');
    const [plateCode, setPlateCode] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [version, setVersion] = useState(1);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const current4kRef = useRef<HTMLCanvasElement | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [plateRenderCount, setPlateRenderCount] = useState(0);
    const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const renderPlate = useCallback(async (isExport = false) => {
        const images = await loadAllTemplateImages();
        // Select image key based on style
        let imgKey = emirate;
        if (version === 2) imgKey = `${emirate}2`;
        if (plateStyle === 'bike') imgKey = `${emirate}_bike`;
        if (plateStyle === 'classic') imgKey = `${emirate}_classic`;


        // Fallback if specific bike image missing (though we added them all)
        const img = images[imgKey] || images[emirate];
        const previewCanvas = canvasRef.current;
        if (!img || !previewCanvas) return;

        try {
            // Use 1200px for live preview, 3840px for export
            const targetWidth = isExport ? 3840 : 1200;
            const canvas4k = await generatePlate({
                emirate,
                plateCode,
                plateNumber,
                blankPlateImage: img,
                plateStyle,
                version,
                outputWidth: targetWidth,
            });

            // ALWAYS store the current generated canvas for the Live Preview Gallery (even if 1200px)
            current4kRef.current = canvas4k;

            if (isExport) {
                return canvas4k; // Return it for the download function
            }

            // For live preview, just update the preview canvas
            const ctx = previewCanvas.getContext('2d')!;
            const parentWidth = previewCanvas.parentElement?.clientWidth || 600;
            const maxPreviewW = Math.min(parentWidth - 40, 600);
            const aspect = canvas4k.height / canvas4k.width;
            const previewH = Math.round(maxPreviewW * aspect);

            previewCanvas.width = maxPreviewW;
            previewCanvas.height = previewH;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(canvas4k, 0, 0, maxPreviewW, previewH);

            // Signal that drawing is complete
            setPlateRenderCount(c => c + 1);
            return null;
        } catch (err) {
            console.error('Plate generation failed:', err);
            return null;
        }
    }, [emirate, plateCode, plateNumber, plateStyle, version]);

    useEffect(() => {
        setVersion(1);
    }, [emirate]);

    useEffect(() => {
        if (renderTimeoutRef.current) {
            clearTimeout(renderTimeoutRef.current);
        }
        renderTimeoutRef.current = setTimeout(() => {
            renderPlate(false);
        }, 100); // 100ms debounce

        return () => {
            if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
        };
    }, [renderPlate]);

    useEffect(() => {
        const handleResize = () => {
            if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
            renderTimeoutRef.current = setTimeout(() => renderPlate(false), 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
        };
    }, [renderPlate]);

    const downloadPlate = useCallback(async () => {
        setIsDownloading(true);
        try {
            // Always generate a fresh 4K canvas specifically for this download
            // to ensure maximum quality and avoid relying on scaled down preview state
            const highResCanvas = await renderPlate(true);

            if (highResCanvas) {
                const filename = `UAE_Plate_${emirate}_${plateStyle}_${plateCode}_${plateNumber}_v${version}.png`;
                exportPNG(highResCanvas, filename);
            }
        } catch (e) {
            console.error(e);
            alert('Download failed: ' + (e as Error).message);
        } finally {
            setIsDownloading(false);
        }
    }, [emirate, plateCode, plateNumber, plateStyle, version, renderPlate]);

    return {
        emirate, setEmirate,
        plateStyle, setPlateStyle,
        plateCode, setPlateCode,
        plateNumber, setPlateNumber,
        version, setVersion,
        canvasRef,
        current4kRef,
        downloadPlate,
        renderPlate,
        isDownloading,
        plateRenderCount,
    };
}
