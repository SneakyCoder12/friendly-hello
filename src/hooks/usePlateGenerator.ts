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
export function usePlateImage(emirate: string, code: string, number: string, plateStyle: 'private' | 'bike' | 'classic' = 'private') {
    const cacheKey = `${emirate}_${code}_${number}_${plateStyle}`;
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
                });
                if (!cancelled) {
                    const url = canvas.toDataURL('image/png');
                    plateDataUrlCache[cacheKey] = url;
                    setDataUrl(url);
                }
            } catch (e) {
                console.error('Plate render failed:', e);
            }
        })();

        return () => { cancelled = true; };
    }, [emirate, code, number, plateStyle, cacheKey]);

    return dataUrl;
}

/** Hook for the interactive plate generator with live preview */
export function usePlateGenerator() {
    const [emirate, setEmirate] = useState('abudhabi');
    const [plateStyle, setPlateStyle] = useState<'private' | 'bike' | 'classic'>('private');
    const [plateCode, setPlateCode] = useState('B');
    const [plateNumber, setPlateNumber] = useState('6836');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const current4kRef = useRef<HTMLCanvasElement | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const renderPlate = useCallback(async () => {
        const images = await loadAllTemplateImages();
        // Select image key based on style
        let imgKey = emirate;
        if (plateStyle === 'bike') imgKey = `${emirate}_bike`;
        if (plateStyle === 'classic') imgKey = `${emirate}_classic`;


        // Fallback if specific bike image missing (though we added them all)
        const img = images[imgKey] || images[emirate];
        const previewCanvas = canvasRef.current;
        if (!img || !previewCanvas) return;

        try {
            const canvas4k = await generatePlate({
                emirate,
                plateCode,
                plateNumber,
                blankPlateImage: img,
                plateStyle,
            });
            current4kRef.current = canvas4k;

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
        } catch (err) {
            console.error('Plate generation failed:', err);
        }
    }, [emirate, plateCode, plateNumber, plateStyle]);

    useEffect(() => {
        // Reset code/number when switching styles if needed? No, user might want to keep content.
        renderPlate();
    }, [renderPlate]);

    useEffect(() => {
        const handleResize = () => renderPlate();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [renderPlate]);

    const downloadPlate = useCallback(async () => {
        setIsDownloading(true);
        try {
            if (!current4kRef.current) await renderPlate();
            if (current4kRef.current) {
                const filename = `UAE_Plate_${emirate}_${plateStyle}_${plateCode}_${plateNumber}.png`;
                exportPNG(current4kRef.current, filename);
            }
        } catch (e) {
            console.error(e);
            alert('Download failed: ' + (e as Error).message);
        } finally {
            setIsDownloading(false);
        }
    }, [emirate, plateCode, plateNumber, plateStyle, renderPlate]);

    return {
        emirate, setEmirate,
        plateStyle, setPlateStyle,
        plateCode, setPlateCode,
        plateNumber, setPlateNumber,
        canvasRef,
        downloadPlate,
        isDownloading,
    };
}
