import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Palette, Loader2, Car, ChevronLeft, ChevronRight, X as XIcon } from 'lucide-react';
import { usePlateGenerator } from '@/hooks/usePlateGenerator';
import { getConfig } from '@/lib/plate-generator';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { downloadPreviewAsCanvas } from '@/lib/previewDownload';
import SEO from '@/components/SEO';

// ── Emirates Config ──
const EMIRATES_CONFIG = [
    { value: 'abudhabi', labelKey: 'abuDhabiName', logo: '/Abu_Dhabi-logo.webp' },
    { value: 'dubai', labelKey: 'dubaiName', logo: '/dubai-logo.webp' },
    { value: 'sharjah', labelKey: 'sharjahName', logo: '/SHARJAH-LOGO.webp' },
    { value: 'ajman', labelKey: 'ajmanName', logo: '/ajman-logo.webp' },
    { value: 'umm_al_quwain', labelKey: 'uaqName', logo: '/ummalquein-logo.webp' },
    { value: 'rak', labelKey: 'rakName', logo: '/rak-logo.webp' },
    { value: 'fujairah', labelKey: 'fujairahName', logo: '/fujairah-logo.webp' },
];

import { CAR_PREVIEWS, BIKE_PREVIEWS, CLASSIC_CAR_PREVIEWS } from './PlateDetailPage';

// ── Main Component ──
export default function DrawMyPlatePage() {
    const {
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
    } = usePlateGenerator();
    const { t } = useLanguage();

    const [previewIndex, setPreviewIndex] = useState(-1);
    const [isMobile, setIsMobile] = useState(false);
    const [plateDataUrl, setPlateDataUrl] = useState<string | null>(null);
    const [isDownloadingPreview, setIsDownloadingPreview] = useState(false);

    // New fields
    const [price, setPrice] = useState('');
    const [phone, setPhone] = useState('');
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [coverImage2, setCoverImage2] = useState<string | null>(null);

    // Preload font to ensure DOM preview nodes render correctly before canvas download
    useEffect(() => {
        document.fonts.load('700 240px "Montserrat"').catch(console.error);
    }, []);

    // Detect mobile
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Get low-quality plate data URL exclusively for the live car preview gallery overlays
    // This updates immediately when plateRenderCount signals a completed canvas generation
    useEffect(() => {
        if (!current4kRef.current) return;
        try {
            // Fast encoding specifically for the car preview UI
            const url = current4kRef.current.toDataURL('image/webp', 0.85);
            setPlateDataUrl(url);
        } catch {
            // canvas might be tainted
        }
    }, [plateRenderCount, current4kRef]);

    // Format phone helper
    const formatPhoneWithSpaces = (pn: string) => {
        let formatted = pn || t('noContactInfo');
        const cleaned = pn.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+971')) {
            const withoutCountry = cleaned.slice(4);
            if (withoutCountry.length >= 2) {
                const network = withoutCountry.substring(0, 2);
                const body1 = withoutCountry.substring(2, 5);
                const body2 = withoutCountry.substring(5);
                formatted = `+971 ${network} ${body1} ${body2}`.trim();
            }
        } else if (cleaned.startsWith('05')) {
            const network = cleaned.substring(0, 3);
            const body1 = cleaned.substring(3, 6);
            const body2 = cleaned.substring(6);
            formatted = `${network} ${body1} ${body2}`.trim();
        }
        return formatted;
    };

    // Helper: draw text overlays (price + phone) on a cover canvas
    const drawCoverText = async (ctx: CanvasRenderingContext2D) => {
        const firstRowY = 160;
        const priceText = price ? `AED ${Number(price).toLocaleString()}` : t('contactSeller');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const goldGradient = ctx.createLinearGradient(0, firstRowY, 0, firstRowY + 220);
        goldGradient.addColorStop(0, '#F6D972');
        goldGradient.addColorStop(0.4, '#C39A31');
        goldGradient.addColorStop(0.5, '#F9EEA2');
        goldGradient.addColorStop(1, '#8C6C16');
        ctx.fillStyle = goldGradient;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 8;
        await document.fonts.load('700 260px "Montserrat"');
        const priceFontSize = !price ? 120 : 220;
        ctx.font = `700 ${priceFontSize}px "Montserrat", serif`;
        ctx.fillText(priceText, 1080, firstRowY);

        const secondRowY = 2160 - 300;
        const formattedPhone = formatPhoneWithSpaces(phone);
        const phoneGoldGradient = ctx.createLinearGradient(0, secondRowY, 0, secondRowY + 180);
        phoneGoldGradient.addColorStop(0, '#F6D972');
        phoneGoldGradient.addColorStop(0.4, '#C39A31');
        phoneGoldGradient.addColorStop(0.5, '#F9EEA2');
        phoneGoldGradient.addColorStop(1, '#8C6C16');
        ctx.fillStyle = phoneGoldGradient;
        const phoneFontSize = phone ? 200 : 110;
        ctx.font = `600 ${phoneFontSize}px "Montserrat", sans-serif`;
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;
        ctx.fillText(formattedPhone, 1080, secondRowY);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    };

    // Generate Cover Images (variant 1: logo over plate, variant 2: logo behind plate)
    const generateDownloadGraphic = useCallback(async (customPlateCanvas?: HTMLCanvasElement, forceVariant?: 1 | 2) => {
        const plateSource = customPlateCanvas || current4kRef.current;
        if (!plateSource) return null;

        // Load shared assets once
        const bgImage = new Image();
        bgImage.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => { bgImage.onload = resolve; bgImage.onerror = reject; bgImage.src = '/Plate-Download.png'; });

        const watermarkImg = new Image();
        watermarkImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => { watermarkImg.onload = resolve; watermarkImg.onerror = reject; watermarkImg.src = '/Logo.png'; });

        const plateWidth = plateSource.width;
        const plateHeight = plateSource.height;

        const targetWidth = 2160 * 0.92;
        const scale = targetWidth / plateWidth;
        const targetHeight = plateHeight * scale;
        const plateX = (2160 - targetWidth) / 2;
        const plateY = (2160 - targetHeight) / 2;
        const wmWidth = targetWidth * 0.90;
        const wmHeight = (watermarkImg.height / watermarkImg.width) * wmWidth;
        const wmX = (2160 - wmWidth) / 2;
        const wmY = (2160 - wmHeight) / 2;

        const drawBase = (ctx: CanvasRenderingContext2D) => {
            ctx.drawImage(bgImage, 0, 0, 2160, 2160);
            const topGradient = ctx.createLinearGradient(0, 0, 0, 700);
            topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
            topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = topGradient;
            ctx.fillRect(0, 0, 2160, 700);
        };

        const drawBottomOverlay = (ctx: CanvasRenderingContext2D) => {
            const gradientOverlay = ctx.createLinearGradient(0, 2160 - 700, 0, 2160);
            gradientOverlay.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradientOverlay.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
            ctx.fillStyle = gradientOverlay;
            ctx.fillRect(0, 2160 - 700, 2160, 700);
        };

        try {
            if (!forceVariant || forceVariant === 1) {
                // ── Variant 1: Logo OVER plate (current) ──
                const c1 = document.createElement('canvas');
                c1.width = 2160; c1.height = 2160;
                const ctx1 = c1.getContext('2d')!;
                drawBase(ctx1);
                ctx1.drawImage(plateSource, plateX, plateY, targetWidth, targetHeight);
                ctx1.globalAlpha = 0.20;
                ctx1.globalCompositeOperation = 'multiply';
                ctx1.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
                ctx1.globalCompositeOperation = 'source-over';
                ctx1.globalAlpha = 1.0;
                drawBottomOverlay(ctx1);
                await drawCoverText(ctx1);
                if (forceVariant === 1) return c1.toDataURL('image/png', 1.0);
                setCoverImage(c1.toDataURL('image/png', 0.9));
            }

            if (!forceVariant || forceVariant === 2) {
                // ── Variant 2: Logo BEHIND plate (non-transparent) ──
                const c2 = document.createElement('canvas');
                c2.width = 2160; c2.height = 2160;
                const ctx2 = c2.getContext('2d')!;
                drawBase(ctx2);
                // Draw watermark FIRST (behind everything)
                ctx2.globalAlpha = 0.20;
                ctx2.globalCompositeOperation = 'multiply';
                ctx2.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
                ctx2.globalCompositeOperation = 'source-over';
                ctx2.globalAlpha = 1.0;
                // Fill white behind the plate area so transparent parts become solid
                ctx2.fillStyle = '#FFFFFF';
                ctx2.fillRect(plateX, plateY, targetWidth, targetHeight);
                // Draw plate on top (covers the logo)
                ctx2.drawImage(plateSource, plateX, plateY, targetWidth, targetHeight);
                drawBottomOverlay(ctx2);
                await drawCoverText(ctx2);
                if (forceVariant === 2) return c2.toDataURL('image/png', 1.0);
                setCoverImage2(c2.toDataURL('image/png', 0.9));
            }
        } catch (error) {
            console.error('Error generating graphic:', error);
        }
    }, [plateRenderCount, current4kRef, price, phone, t]);

    useEffect(() => {
        if (plateRenderCount > 0) {
            generateDownloadGraphic();
        }
    }, [generateDownloadGraphic, plateRenderCount]);

    // Classic plates only for: AD, Dubai, Sharjah, Ajman, RAK
    const supportsClassic = ['abudhabi', 'dubai', 'sharjah', 'ajman', 'rak'].includes(emirate);
    if (plateStyle === 'classic' && !supportsClassic) {
        setPlateStyle('private');
    }

    const config = getConfig(emirate, plateStyle);

    // Select the right preview array based on plate style
    const previews = plateStyle === 'bike' ? BIKE_PREVIEWS : (plateStyle === 'classic' ? CLASSIC_CAR_PREVIEWS : CAR_PREVIEWS) as any[];
    const safeIndex = Math.min(previewIndex, previews.length - 1);
    const activePreview = previews[safeIndex];
    const previewConfig = isMobile && activePreview?.mobileConfig ? activePreview.mobileConfig : activePreview;

    // RAK Classic Plates have a unique positioning
    const isRakClassic = plateStyle === 'classic' && emirate === 'rak';
    const plateStylingToUse = isRakClassic && previewConfig?.rakClassicPlateStyling ? previewConfig.rakClassicPlateStyling : previewConfig?.plateStyling;
    const plateStyling2ToUse = isRakClassic && previewConfig?.rakClassicPlateStyling2 ? previewConfig.rakClassicPlateStyling2 : previewConfig?.plateStyling2;

    const prevPreview = () => setPreviewIndex(i => i <= -2 ? previews.length - 1 : i - 1);
    const nextPreview = () => setPreviewIndex(i => i >= previews.length - 1 ? -2 : i + 1);

    // Drag to scroll thumbnails
    const thumbRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [scrollStartX, setScrollStartX] = useState(0);
    const onMouseDown = (e: React.MouseEvent) => { if (!thumbRef.current) return; setIsDragging(true); setDragStartX(e.pageX); setScrollStartX(thumbRef.current.scrollLeft); };
    const onMouseMove = (e: React.MouseEvent) => { if (!isDragging || !thumbRef.current) return; e.preventDefault(); thumbRef.current.scrollLeft = scrollStartX - (e.pageX - dragStartX); };
    const onMouseUp = () => setIsDragging(false);

    // Download the car preview
    const handleDownloadPreview = useCallback(async () => {
        setIsDownloadingPreview(true);
        try {
            if ((previewIndex === -1 && coverImage) || (previewIndex === -2 && coverImage2)) {
                const variant = previewIndex === -1 ? 1 : 2;

                // 1. Generate full 4K plate strictly for this download to ensure crisp edges
                const highResPlateCanvas = await renderPlate(true);

                if (highResPlateCanvas) {
                    // 2. Build 2160px cover graphic using the 4K plate instead of the low-res 1200px live preview
                    const highResCoverDataUrl = await generateDownloadGraphic(highResPlateCanvas as HTMLCanvasElement, variant);

                    if (highResCoverDataUrl) {
                        const a = document.createElement('a');
                        a.href = highResCoverDataUrl;
                        a.download = `Plate-${emirate}-${plateCode}-${plateNumber}-Graphic${variant === 2 ? '-v2' : ''}.png`;
                        a.click();
                        setIsDownloadingPreview(false);
                        return;
                    }
                }
            }

            if (!previewConfig || !plateDataUrl) return;

            // Determine correct plate styling (RAK classic or standard)
            const isRakClassicPreview = plateStyle === 'classic' && emirate === 'rak';
            const primaryPlate = isRakClassicPreview && previewConfig.rakClassicPlateStyling
                ? previewConfig.rakClassicPlateStyling
                : plateStylingToUse;

            await downloadPreviewAsCanvas({
                backgroundImage: previewConfig.image || activePreview?.image,
                plateDataUrl: plateDataUrl,
                plateStyling: primaryPlate as any,
                plateStyling2: plateStyling2ToUse as any,
                price: price || null,
                phone: phone || '',
                filename: `Plate-${emirate}-${plateCode}-${plateNumber}-Preview.jpg`,
                priceStyling: (previewConfig.priceStyling || activePreview?.priceStyling) as any,
                mobileStyling: (previewConfig.mobileStyling || activePreview?.mobileStyling) as any,
                isBike: plateStyle === 'bike',
            });
            toast.success('Preview image downloaded!');
        } catch (e) {
            console.error('Download failed', e);
            toast.error('Failed to download preview.');
        }
        setIsDownloadingPreview(false);
    }, [emirate, plateCode, plateNumber, previewIndex, coverImage, coverImage2, previewConfig, plateDataUrl, activePreview, plateStyle, plateStylingToUse, plateStyling2ToUse, price, phone, t, renderPlate, generateDownloadGraphic]);

    // Reset preview index when switching plate style
    useEffect(() => {
        setPreviewIndex(-1);
    }, [plateStyle]);

    return (
        <div className="min-h-screen pt-24 pb-16">
            <SEO
                title="Draw My Plate - UAE Number Plate Visualizer"
                description="Design and preview your UAE number plate online. Choose any Emirate, enter your plate number, and see how it looks on premium vehicles. Free high-resolution download."
                url="/draw-my-plate"
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* ── Header ── */}
                <div className="flex items-end justify-between mb-12 border-b border-border pb-6">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 bg-card border border-border rounded-2xl flex flex-col items-center justify-center shadow-md overflow-hidden p-1">
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                                <Palette className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">{t('drawMyPlate')}</h1>
                            <p className="text-sm font-bold uppercase tracking-[0.2em] mt-1 text-muted-foreground">{t('drawMyPlateSubtitle')}</p>
                        </div>
                    </div>
                </div>

                {/* ── Plate Generator ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
                    {/* Left: Config */}
                    <div className="bg-card rounded-2xl border border-border shadow-card p-8 space-y-8">
                        <h3 className="text-lg font-display font-bold text-foreground mb-2">{t('configureYourPlate')}</h3>

                        {/* Emirate Picker */}
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('selectEmirate')}</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {EMIRATES_CONFIG.map((item) => {
                                    const isSelected = emirate === item.value;
                                    const isClassicUnsupported = plateStyle === 'classic' && ['umm_al_quwain', 'fujairah'].includes(item.value);
                                    return (
                                        <button
                                            key={item.value}
                                            onClick={() => !isClassicUnsupported && setEmirate(item.value)}
                                            disabled={isClassicUnsupported}
                                            title={isClassicUnsupported ? "Classic plates not available for this emirate" : ""}
                                            className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300 w-full aspect-square sm:aspect-auto sm:h-24 ${isSelected ? 'bg-primary/5 border-primary shadow-[0_0_0_1px_hsl(var(--primary))]' : 'bg-surface border-border hover:bg-surface-accent hover:border-primary/30'} ${isClassicUnsupported ? 'opacity-40 cursor-not-allowed grayscale bg-muted/30' : ''}`}
                                        >
                                            <img src={item.logo} alt={`${t(item.labelKey as any)} Logo`} className={`${item.value === 'ajman' ? 'h-5' : 'h-8'} w-auto object-contain transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60'} ${isClassicUnsupported ? 'opacity-30' : ''}`} />
                                            <span className={`text-xs font-bold text-center leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>{t(item.labelKey as any)}</span>
                                            {isSelected && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Style Picker */}
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('plateStyleLabel')}</label>
                            <div className="grid grid-cols-3 gap-3 mt-3">
                                <button className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${plateStyle === 'private' ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-surface border-border text-muted-foreground hover:bg-surface-accent hover:border-primary/30'}`} onClick={() => setPlateStyle('private')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                                    {t('car')}
                                </button>
                                <button className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${plateStyle === 'bike' ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-surface border-border text-muted-foreground hover:bg-surface-accent hover:border-primary/30'}`} onClick={() => setPlateStyle('bike')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"><circle cx="18.5" cy="17.5" r="3.5" /><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="15" cy="5" r="1" /><path d="M12 17.5V14l-3-3 4-3 2 3h2" /></svg>
                                    {t('bike')}
                                </button>
                                <button disabled={!supportsClassic} className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${plateStyle === 'classic' ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-surface border-border text-muted-foreground hover:bg-surface-accent hover:border-primary/30'} ${!supportsClassic ? 'opacity-50 cursor-not-allowed bg-muted/50' : ''}`} onClick={() => setPlateStyle('classic')} title={!supportsClassic ? "Classic not available for this emirate" : ""}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M7 7h10" /><path d="M7 12h10" /><path d="M7 17h10" /></svg>
                                    {t('classic')}
                                </button>
                            </div>
                        </div>

                        {/* Plate Version Picker - Abu Dhabi only */}
                        {emirate === 'abudhabi' && plateStyle === 'private' && (
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('plateVersion')}</label>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <button
                                        className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${version === 1 ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-surface border-border text-muted-foreground hover:bg-surface-accent hover:border-primary/30'}`}
                                        onClick={() => setVersion(1)}
                                    >
                                        {t('modern')}
                                    </button>
                                    <button
                                        className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${version === 2 ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-surface border-border text-muted-foreground hover:bg-surface-accent hover:border-primary/30'}`}
                                        onClick={() => setVersion(2)}
                                    >
                                        {t('standard')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Plate Code */}
                        {config.hasCode !== false && (
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2" htmlFor="plateCode">{t('plateCode')}</label>
                                <input id="plateCode" autoComplete="off" maxLength={2} className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-2xl font-black text-foreground tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground placeholder:font-normal placeholder:text-sm font-mono" placeholder="e.g. B, A, 20" value={plateCode} onChange={(e) => setPlateCode(e.target.value)} />
                            </div>
                        )}

                        {/* Plate Number */}
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2" htmlFor="plateNumber">{t('plateNumberLabel')}</label>
                            <input id="plateNumber" autoComplete="off" maxLength={5} className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-2xl font-black text-foreground tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground placeholder:font-normal placeholder:text-sm font-mono" placeholder={t('plateNumberPlaceholder')} value={plateNumber} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 5); setPlateNumber(val); }} />
                        </div>

                        {/* Price & Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2" htmlFor="platePrice">{t('priceAed')}</label>
                                <input id="platePrice" type="number" className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-xl font-black text-foreground tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground placeholder:font-normal placeholder:text-sm font-mono" placeholder={t('platePricePlaceholder')} value={price} onChange={(e) => setPrice(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2" htmlFor="platePhone">{t('phoneExt')}</label>
                                <input id="platePhone" type="text" className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-xl font-black text-foreground tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground placeholder:font-normal placeholder:text-sm font-mono" placeholder={t('phonePlaceholderDraw')} value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </div>
                        </div>

                        {/* Download Button */}
                        <button className="w-full bg-primary text-primary-foreground hover:bg-primary-hover px-8 py-4 rounded-xl font-bold text-base shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 mt-4 disabled:opacity-50" onClick={downloadPlate} disabled={isDownloading}>
                            {isDownloading ? (<><Loader2 className="h-5 w-5 animate-spin" /> {t('generating')}</>) : (<><Download className="h-5 w-5" /> {t('downloadHdPlate')}</>)}
                        </button>
                        <p className="text-xs text-muted-foreground text-center mt-2">{t('hdExport')}</p>
                    </div>

                    {/* Right: Plate Canvas Preview */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="bg-surface rounded-2xl border border-border p-8 w-full flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6 relative z-10">{t('livePreview')}</p>
                            <canvas ref={canvasRef} className="relative z-10 rounded-lg shadow-plate max-w-full" style={{ imageRendering: '-webkit-optimize-contrast' } as React.CSSProperties} />
                            <p className="text-[10px] text-muted-foreground mt-4 relative z-10 font-medium">{t('hdExport')}</p>
                        </div>
                    </div>
                </div>

                {/* ── Car/Bike Preview Gallery ── */}
                {plateDataUrl && (
                    <div className="mb-16">
                        <div className="flex items-center gap-5 mb-8 border-b border-border pb-6">
                            <div className="h-16 w-16 bg-card border border-border rounded-2xl flex flex-col items-center justify-center shadow-md overflow-hidden p-1">
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                                    <Car className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
                                    {plateStyle === 'bike' ? t('viewOnBike') : t('viewOnCar')}
                                </h2>
                                <p className="text-sm font-bold uppercase tracking-[0.2em] mt-1 text-muted-foreground">{t('seeYourPlateOnVehicle')}</p>
                            </div>
                        </div>

                        {/* Main Preview Image */}
                        <div className="relative max-w-5xl mx-auto">
                            <div id="draw-car-preview-node" className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#0a0a0a]" style={{ containerType: 'inline-size' }}>
                                {previewIndex === -1 ? (
                                    coverImage ? <img src={coverImage} alt="Cover Graphic" className="max-h-[60vh] md:max-h-[65vh] w-auto mx-auto object-contain bg-black p-4 sm:p-8" />
                                        : <div className="max-h-[60vh] h-[600px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : previewIndex === -2 ? (
                                    coverImage2 ? <img src={coverImage2} alt="Cover Graphic V2" className="max-h-[60vh] md:max-h-[65vh] w-auto mx-auto object-contain bg-black p-4 sm:p-8" />
                                        : <div className="max-h-[60vh] h-[600px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : (
                                    <>
                                        <img
                                            src={previewConfig?.image || activePreview?.image}
                                            alt="Vehicle Preview"
                                            className="w-full h-auto"
                                        />
                                        {plateDataUrl && previewConfig && (
                                            <img
                                                src={plateDataUrl}
                                                alt="Your plate on vehicle"
                                                className="absolute drop-shadow-2xl"
                                                style={{
                                                    ...plateStylingToUse,
                                                    filter: 'brightness(0.92) contrast(1.05)',
                                                    imageRendering: 'auto',
                                                } as React.CSSProperties}
                                            />
                                        )}

                                        {/* Secondary plate overlay (top corner) */}
                                        {plateDataUrl && plateStyling2ToUse && (
                                            <img
                                                src={plateDataUrl}
                                                alt="Your plate (secondary)"
                                                className="absolute drop-shadow-2xl"
                                                style={{
                                                    ...plateStyling2ToUse,
                                                    filter: (plateStyling2ToUse as any)?.filter || 'brightness(0.92) contrast(1.05)',
                                                    imageRendering: 'auto',
                                                } as React.CSSProperties}
                                            />
                                        )}

                                        {(previewConfig?.priceStyling || activePreview?.priceStyling) && plateStyle !== 'bike' && (
                                            <div
                                                className="absolute tracking-tight font-black leading-none whitespace-nowrap"
                                                style={{
                                                    ...(previewConfig?.priceStyling || activePreview?.priceStyling),
                                                    fontFamily: '"Montserrat", serif',
                                                    fontWeight: 700,
                                                    background: 'linear-gradient(to bottom, #F6D972 0%, #C39A31 40%, #F9EEA2 50%, #8C6C16 100%)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    color: 'transparent',
                                                    textShadow: 'none',
                                                    fontSize: `${(price ? 2.4 : 1.0) * (((previewConfig?.priceStyling || activePreview?.priceStyling) as any)?.textScale || 1)}cqi`,
                                                }}
                                            >
                                                {price ? `AED ${Number(price).toLocaleString()}` : t('contactSeller')}
                                            </div>
                                        )}
                                        {(previewConfig?.mobileStyling || activePreview?.mobileStyling) && plateStyle !== 'bike' && (
                                            <div
                                                className="absolute tracking-tight font-bold leading-none whitespace-nowrap"
                                                style={{
                                                    ...(previewConfig?.mobileStyling || activePreview?.mobileStyling),
                                                    fontFamily: '"Montserrat", serif',
                                                    fontWeight: 600,
                                                    background: 'linear-gradient(to bottom, #F6D972 0%, #C39A31 40%, #F9EEA2 50%, #8C6C16 100%)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    color: 'transparent',
                                                    textShadow: 'none',
                                                    filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))',
                                                    fontSize: `${(phone ? 1.6 : 0.85) * (((previewConfig?.mobileStyling || activePreview?.mobileStyling) as any)?.textScale || 1)}cqi`,
                                                }}
                                            >
                                                {formatPhoneWithSpaces(phone)}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Navigation arrows (Now inside relative container!) */}
                                <button
                                    onClick={prevPreview}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all backdrop-blur-sm shadow-xl"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={nextPreview}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all backdrop-blur-sm shadow-xl"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Thumbnail Strip */}
                        <div
                            ref={thumbRef}
                            onMouseDown={onMouseDown}
                            onMouseMove={onMouseMove}
                            onMouseUp={onMouseUp}
                            onMouseLeave={onMouseUp}
                            onDragStart={e => e.preventDefault()}
                            className={`mt-6 flex gap-3 overflow-x-auto pb-4 px-4 max-w-5xl mx-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
              [&::-webkit-scrollbar]:h-1.5
              [&::-webkit-scrollbar-track]:bg-white/5
              [&::-webkit-scrollbar-track]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-gradient-to-r
              [&::-webkit-scrollbar-thumb]:from-[#c8962e]
              [&::-webkit-scrollbar-thumb]:to-[#e0b555]
              [&::-webkit-scrollbar-thumb]:rounded-full
              hover:[&::-webkit-scrollbar-thumb]:from-[#e0b555]
              hover:[&::-webkit-scrollbar-thumb]:to-[#f5d070]`}
                        >
                            {coverImage && (
                                <button
                                    onClick={() => setPreviewIndex(-1)}
                                    className={`relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-[3px] transition-all shadow-md bg-black/80
                      ${previewIndex === -1 ? 'border-primary scale-110 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                >
                                    <img src={coverImage} alt="Cover graphic" className="w-full h-full object-contain p-1 pointer-events-none" />
                                    <div className={`absolute inset-0 bg-black/20 ${previewIndex === -1 ? 'hidden' : ''}`} />
                                </button>
                            )}
                            {coverImage2 && (
                                <button
                                    onClick={() => setPreviewIndex(-2)}
                                    className={`relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-[3px] transition-all shadow-md bg-black/80
                      ${previewIndex === -2 ? 'border-primary scale-110 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                >
                                    <img src={coverImage2} alt="Cover graphic v2" className="w-full h-full object-contain p-1 pointer-events-none" />
                                    <div className={`absolute inset-0 bg-black/20 ${previewIndex === -2 ? 'hidden' : ''}`} />
                                </button>
                            )}
                            {previews.map((preview, idx) => {
                                const thumbImage = isMobile && preview.mobileConfig ? preview.mobileConfig.image : preview.image;
                                return (
                                    <button
                                        key={preview.id}
                                        onClick={() => setPreviewIndex(idx)}
                                        className={`relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-[3px] transition-all shadow-md bg-black/80
                      ${previewIndex === idx ? 'border-primary scale-110 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                    >
                                        <img
                                            src={thumbImage}
                                            alt={`Preview ${idx + 1}`}
                                            className="w-full h-full object-cover pointer-events-none"
                                            loading="lazy"
                                            decoding="async"
                                            draggable={false}
                                        />
                                        <div className={`absolute inset-0 bg-black/20 ${previewIndex === idx ? 'hidden' : ''}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Download Preview */}
                <div className="mt-6 flex justify-center max-w-5xl mx-auto">
                    <button
                        onClick={handleDownloadPreview}
                        disabled={isDownloadingPreview}
                        className="bg-primary text-primary-foreground hover:bg-primary-hover px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDownloadingPreview ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> {t('generating')}</>
                        ) : (
                            <><Download className="h-4 w-4" /> {t('downloadPreviewImage')}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
