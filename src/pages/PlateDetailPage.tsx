import { useParams, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Phone, MessageCircle, Shield, ArrowLeft, Share2, Car, X as XIcon, Heart, Download } from 'lucide-react';
import ListWithUsBanner from '@/components/ListWithUsBanner';
import { usePlateImage } from '@/hooks/usePlateGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { downloadPreviewAsCanvas } from '@/lib/previewDownload';
import SEO from '@/components/SEO';

const EMIRATE_KEY_MAP: Record<string, string> = {
    'Abu Dhabi': 'abudhabi',
    'Dubai': 'dubai',
    'Sharjah': 'sharjah',
    'Ajman': 'ajman',
    'Umm Al Quwain': 'umm_al_quwain',
    'Ras Al Khaimah': 'rak',
    'Fujairah': 'fujairah',
};

interface ListingDetail {
    id: string;
    plate_number: string;
    emirate: string;
    plate_style: string | null;
    plate_image_url: string | null;
    price: number | null;
    description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    created_at: string;
    user_id: string;
    status?: string;
}

interface SellerProfile {
    full_name: string | null;
    phone_number: string | null;
    whatsapp_number: string | null;
    email: string | null;
    created_at: string | null;
}

interface CarStyling {
    top: string;
    left: string;
    width: string;
    transform: string;
    filter?: string;
}

interface PriceStyling {
    top: string;
    left: string;
    transform: string;
    color?: string;
    textShadow?: string;
    textScale?: number;
}

interface CarPreview {
    id: number;
    image: string;
    plateStyling: CarStyling;
    rakClassicPlateStyling?: CarStyling;
    plateStyling2?: CarStyling;
    rakClassicPlateStyling2?: CarStyling;
    priceStyling?: PriceStyling;
    mobileStyling?: PriceStyling;
    mobileConfig?: {
        image: string;
        plateStyling: CarStyling;
        rakClassicPlateStyling?: CarStyling;
        plateStyling2?: CarStyling;
        rakClassicPlateStyling2?: CarStyling;
        priceStyling: PriceStyling;
        mobileStyling: PriceStyling;
    };
}

export default function PlateDetailPage() {
    const { plateId } = useParams<{ plateId: string }>();
    const [listing, setListing] = useState<ListingDetail | null>(null);
    const [seller, setSeller] = useState<SellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCarPreview, setShowCarPreview] = useState(false);
    const [showBikePreview, setShowBikePreview] = useState(false);
    const [showClassicPreview, setShowClassicPreview] = useState(false);
    const { t } = useLanguage();
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [downloadGraphicUrl, setDownloadGraphicUrl] = useState<string | null>(null);
    const [downloadGraphicUrl2, setDownloadGraphicUrl2] = useState<string | null>(null);
    const [plateVersion, setPlateVersion] = useState(1);

    // Preload font to ensure DOM preview nodes render correctly before canvas download
    useEffect(() => {
        document.fonts.load('700 240px "Montserrat"').catch(console.error);
    }, []);

    useEffect(() => {
        if (!plateId) return;
        (async () => {
            setLoading(true);

            let listingData: ListingDetail | null = null;
            let fetchError: any = null;

            // Check if it's a legacy exact UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plateId);

            if (isUUID) {
                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('id', plateId)
                    .single();
                fetchError = error;
                listingData = data as unknown as ListingDetail;
            } else {
                // Parse slug: e.g. dubai-e-65246-a1b2c3d4
                const parts = plateId.split('-');
                const shortId = parts.pop();
                const restSlug = parts.join('-');

                const emirateMap: Record<string, string> = {
                    'abu-dhabi': 'Abu Dhabi',
                    'dubai': 'Dubai',
                    'sharjah': 'Sharjah',
                    'ajman': 'Ajman',
                    'umm-al-quwain': 'Umm Al Quwain',
                    'ras-al-khaimah': 'Ras Al Khaimah',
                    'fujairah': 'Fujairah'
                };

                let matchedEmirateKey = '';
                for (const key of Object.keys(emirateMap)) {
                    if (restSlug.startsWith(key + '-')) {
                        matchedEmirateKey = key;
                        break;
                    }
                }

                if (matchedEmirateKey && shortId) {
                    const dbEmirate = emirateMap[matchedEmirateKey];
                    const rawPlateNumber = restSlug.substring(matchedEmirateKey.length + 1).replace(/-/g, ' ');

                    const { data, error } = await supabase
                        .from('listings')
                        .select('*')
                        .eq('emirate', dbEmirate)
                        .ilike('plate_number', rawPlateNumber);

                    fetchError = error;

                    if (data && data.length > 0) {
                        listingData = data.find((p: any) => p.id.startsWith(shortId)) as unknown as ListingDetail || data[0] as unknown as ListingDetail;
                    }
                } else {
                    fetchError = new Error("Invalid URL format");
                }
            }

            if (fetchError || !listingData) {
                setError(t('listingNotFound'));
                setLoading(false);
                return;
            }

            setListing(listingData);

            // Fetch seller profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, phone_number, whatsapp_number, email, created_at')
                .eq('id', listingData.user_id)
                .single();

            if (profileData) {
                setSeller(profileData as SellerProfile);
            }
            setLoading(false);
        })();
    }, [plateId, t]);

    // Derive plate type from DB plate_style
    const isClassic = listing?.plate_style === 'classic';
    const isBike = listing?.plate_style === 'bike';
    const plateStyle: 'private' | 'bike' | 'classic' = isClassic ? 'classic' : isBike ? 'bike' : 'private';

    // Parse plate_number → code + number (e.g. "A 12345" → code="A", number="12345")
    // Classic plates have no code — plate_number is just the number
    const parts = listing?.plate_number?.split(' ') || [];
    const code = isClassic ? '' : (parts.length > 1 ? parts[0] : '');
    const number = isClassic ? (listing?.plate_number || '') : (parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || '');
    const emirateKey = listing ? (EMIRATE_KEY_MAP[listing.emirate] || listing.emirate.toLowerCase().replace(/\s+/g, '_')) : '';
    const emirateDisplay = listing?.emirate || '';

    // Use CDN image if available, fallback to canvas generation for pre-migration listings
    // Force canvas fallback if version 2 is selected for Abu Dhabi
    const shouldForceCanvas = emirateKey === 'abudhabi' && plateVersion === 2;
    const canvasFallback = usePlateImage(listing?.plate_image_url && !shouldForceCanvas ? '' : emirateKey, listing?.plate_image_url && !shouldForceCanvas ? '' : code, listing?.plate_image_url && !shouldForceCanvas ? '' : number, plateStyle, plateVersion);
    const dataUrl = (!shouldForceCanvas && listing?.plate_image_url) || canvasFallback;

    // Contact info — prefer listing contact_phone, fall back to seller phone_number
    const phone = listing?.contact_phone || seller?.phone_number || '';
    const phoneDigits = phone.replace(/\D/g, '');
    const telUrl = phoneDigits ? `tel:+${phoneDigits}` : null;

    // Use specific WhatsApp number from profile if available, fallback to the call phone otherwise
    const waRaw = seller?.whatsapp_number || phone;
    const waDigits = waRaw.replace(/\D/g, '');
    const whatsappUrl = waDigits
        ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
            t('language') === 'ar'
                ? `مرحباً، أنا مهتم بلوحة ${emirateDisplay} ${code} ${number}.`
                : `Hi, I'm interested in the ${emirateDisplay} ${code} ${number} plate.`
        )}`
        : null;

    const sellerName = seller?.full_name || seller?.email || 'Seller';
    const memberYear = seller?.created_at ? new Date(seller.created_at).getFullYear().toString() : '';

    const isSold = listing?.status === 'sold';

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${emirateDisplay} ${code} ${number} — Premium Number Plate`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    // Check if this listing is already favorited
    useEffect(() => {
        if (!user || !plateId) return;
        (async () => {
            const { data } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('listing_type', 'plate')
                .eq('listing_id', plateId)
                .maybeSingle();
            if (data) setIsFavorite(true);
        })();
    }, [user, plateId]);

    const toggleFavorite = async () => {
        if (!user) { toast.error('Please log in to save favorites'); return; }
        if (!plateId) return;

        if (isFavorite) {
            await supabase.from('favorites').delete()
                .eq('user_id', user.id)
                .eq('listing_type', 'plate')
                .eq('listing_id', plateId);
            setIsFavorite(false);
            toast.success('Removed from favorites');
        } else {
            await supabase.from('favorites').insert({
                user_id: user.id,
                listing_type: 'plate',
                listing_id: plateId,
            });
            setIsFavorite(true);
            toast.success('Added to favorites');
        }
    };

    const handleDownload = async () => {
        if (!downloadGraphicUrl) {
            const [url1] = await generateDownloadGraphic();
            if (!url1) return;
            triggerDownload(url1);
            return;
        }
        triggerDownload(downloadGraphicUrl);
    };

    const triggerDownload = (url: string) => {
        const link = document.createElement('a');
        link.download = `Plate-${emirateDisplay}-${code}-${number}.png`;
        link.href = url;
        link.click();
        toast.success('Plate downloaded successfully!');
    };

    const generateDownloadGraphic = async (): Promise<[string | null, string | null]> => {
        if (!dataUrl) return [null, null];

        const canvas1 = document.createElement('canvas');
        canvas1.width = 2160;
        canvas1.height = 2160;
        const ctx1 = canvas1.getContext('2d');
        if (!ctx1) return [null, null];

        const canvas2 = document.createElement('canvas');
        canvas2.width = 2160;
        canvas2.height = 2160;
        const ctx2 = canvas2.getContext('2d');
        if (!ctx2) return [null, null];

        try {
            // Load all assets once
            const [bgImage, plateImg, watermarkImg] = await Promise.all([
                new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image(); img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img); img.onerror = reject; img.src = '/Plate-Download.png';
                }),
                new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image(); img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img); img.onerror = reject; img.src = dataUrl;
                }),
                new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image(); img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img); img.onerror = reject; img.src = '/Logo.png';
                })
            ]);

            const targetWidth = 2160 * 0.92;
            const scale = targetWidth / plateImg.width;
            const targetHeight = plateImg.height * scale;
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

            const drawText = async (ctx: CanvasRenderingContext2D) => {
                const firstRowY = 160;
                const priceText = isSold ? 'SOLD' : (listing?.price ? `AED ${listing.price.toLocaleString()}` : t('contactSeller'));
                const isContactText = !listing?.price && !isSold;
                const priceFontSize = isContactText ? 190 : 220;

                ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                const goldGradient = ctx.createLinearGradient(0, firstRowY, 0, firstRowY + priceFontSize);
                goldGradient.addColorStop(0, '#F6D972'); goldGradient.addColorStop(0.4, '#C39A31');
                goldGradient.addColorStop(0.5, '#F9EEA2'); goldGradient.addColorStop(1, '#8C6C16');
                ctx.fillStyle = goldGradient;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'; ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 8;
                await document.fonts.load('700 220px "Montserrat"');
                ctx.font = `700 ${priceFontSize}px "Montserrat", sans-serif`;
                ctx.fillText(priceText, 1080, firstRowY);

                const secondRowY = 2160 - 300;
                let formattedPhone = phone || t('noContactInfo');
                if (phone) {
                    const cleaned = phone.replace(/[^\d+]/g, '');
                    if (cleaned.startsWith('+971')) {
                        const withoutCountry = cleaned.slice(4);
                        if (withoutCountry.length >= 2) {
                            const network = withoutCountry.substring(0, 2);
                            const body1 = withoutCountry.substring(2, 5);
                            const body2 = withoutCountry.substring(5);
                            formattedPhone = `+971 ${network} ${body1} ${body2}`.trim();
                        }
                    } else if (cleaned.startsWith('05')) {
                        const network = cleaned.substring(0, 3);
                        const body1 = cleaned.substring(3, 6);
                        const body2 = cleaned.substring(6);
                        formattedPhone = `${network} ${body1} ${body2}`.trim();
                    } else if (cleaned.length >= 10) {
                        formattedPhone = cleaned.replace(/(\d{3})(?=\d)/g, '$1 ');
                    }
                }
                const phoneFontSize = 200; // Fixed size in this component for now
                const phoneGoldGradient = ctx.createLinearGradient(0, secondRowY, 0, secondRowY + phoneFontSize);
                phoneGoldGradient.addColorStop(0, '#F6D972'); phoneGoldGradient.addColorStop(0.4, '#C39A31');
                phoneGoldGradient.addColorStop(0.5, '#F9EEA2'); phoneGoldGradient.addColorStop(1, '#8C6C16');
                ctx.fillStyle = phoneGoldGradient;
                ctx.font = `600 ${phoneFontSize}px "Montserrat", sans-serif`;
                ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
                ctx.fillText(formattedPhone, 1080, secondRowY);
                ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
            };

            // Variant 1: Logo OVER Plate
            drawBase(ctx1);
            ctx1.drawImage(plateImg, plateX, plateY, targetWidth, targetHeight);
            ctx1.globalAlpha = 0.20;
            ctx1.globalCompositeOperation = 'multiply';
            ctx1.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
            ctx1.globalCompositeOperation = 'source-over';
            ctx1.globalAlpha = 1.0;
            drawBottomOverlay(ctx1);
            await drawText(ctx1);

            // Variant 2: Logo BEHIND Plate (Non-transparent)
            drawBase(ctx2);
            ctx2.globalAlpha = 0.20;
            ctx2.globalCompositeOperation = 'multiply';
            ctx2.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
            ctx2.globalCompositeOperation = 'source-over';
            ctx2.globalAlpha = 1.0;
            ctx2.fillStyle = '#FFFFFF';
            ctx2.fillRect(plateX, plateY, targetWidth, targetHeight);
            ctx2.drawImage(plateImg, plateX, plateY, targetWidth, targetHeight);
            drawBottomOverlay(ctx2);
            await drawText(ctx2);

            return [canvas1.toDataURL('image/png', 1.0), canvas2.toDataURL('image/png', 1.0)];
        } catch (error) {
            console.error('Error generating download images:', error);
            return [null, null];
        }
    };

    useEffect(() => {
        if (dataUrl) {
            generateDownloadGraphic().then(([url1, url2]) => {
                if (url1) setDownloadGraphicUrl(url1);
                if (url2) setDownloadGraphicUrl2(url2);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataUrl, isSold, listing?.price, phone]);

    if (loading) {
        return (
            <div className="min-h-screen pt-28 sm:pt-32 pb-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-6 bg-gray-200 rounded w-40" />
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                            <div className="lg:col-span-3">
                                <div className="bg-gray-100 rounded-2xl h-[300px]" />
                            </div>
                            <div className="lg:col-span-2 space-y-6">
                                <div className="h-32 bg-gray-100 rounded-2xl" />
                                <div className="h-48 bg-gray-100 rounded-2xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="min-h-screen pt-24 pb-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-xl font-bold text-foreground mb-4">{t('listingNotFound')}</p>
                    <Link to="/marketplace" className="text-primary font-bold hover:underline">
                        ← {t('backToMarketplace')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 sm:pt-32 pb-16">
            <SEO
                title={`${emirateDisplay} ${listing.plate_number} Plate for Sale`}
                description={`Buy ${emirateDisplay} number plate ${listing.plate_number}${listing.price ? ` for AED ${listing.price.toLocaleString()}` : ''} in the UAE. Contact seller directly at Al Nuami Group.`}
                url={`/plate/${plateId}`}
                image={listing.plate_image_url || undefined}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    name: `${emirateDisplay} Number Plate ${listing.plate_number}`,
                    description: listing.description || `Premium ${emirateDisplay} number plate for sale in the UAE.`,
                    url: `https://alnuamigroup.ae/plate/${plateId}`,
                    ...(listing.plate_image_url ? { image: listing.plate_image_url } : {}),
                    ...(listing.price ? {
                        offers: {
                            '@type': 'Offer',
                            price: listing.price,
                            priceCurrency: 'AED',
                            availability: isSold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
                        },
                    } : {}),
                }}
            />
            {/* Main Content Container (relative z-10 puts it above the fixed watermark) */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Back Button */}
                <Link
                    to="/marketplace"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" /> {t('backToMarketplace')}
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                    {/* Left: Plate Image (3 cols) */}
                    <div className="lg:col-span-3">
                        <div className={`bg-surface rounded-2xl p-8 flex items-center justify-center border border-border relative overflow-hidden ${isSold ? 'opacity-80' : ''}`}>

                            {isSold && (
                                <div className="sold-ribbon z-20">
                                    <span>{t('sold')}</span>
                                </div>
                            )}
                            {dataUrl ? (
                                <img
                                    src={dataUrl}
                                    alt={`${emirateDisplay} ${code} ${number}`}
                                    className="w-full max-w-[600px] h-auto object-contain relative z-10 drop-shadow-lg"
                                    style={{ imageRendering: '-webkit-optimize-contrast' } as React.CSSProperties}
                                />
                            ) : (
                                <div className="animate-pulse bg-gray-200 rounded w-full h-[200px] relative z-10" />
                            )}
                        </div>

                        {/* View on Car Button — only for car (private) plates */}
                        {dataUrl && !isClassic && !isBike && (
                            <button
                                onClick={() => setShowCarPreview(true)}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border bg-card text-foreground font-bold text-sm hover:bg-surface hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                            >
                                <Car className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                {t('viewOnCar') || 'View your number'}
                            </button>
                        )}
                        {/* View on Bike Button — only for bike plates */}
                        {dataUrl && isBike && (
                            <button
                                onClick={() => setShowBikePreview(true)}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border bg-card text-foreground font-bold text-sm hover:bg-surface hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                            >
                                <Car className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                {t('viewOnBike' as any)}
                            </button>
                        )}
                        {/* View on Classic Car Button — only for classic plates */}
                        {dataUrl && isClassic && (
                            <button
                                onClick={() => setShowClassicPreview(true)}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border bg-card text-foreground font-bold text-sm hover:bg-surface hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                            >
                                <Car className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                {t('viewOnCar') || 'View your number'}
                            </button>
                        )}

                        {/* Car Preview Modal */}
                        {showCarPreview && dataUrl && createPortal(
                            <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm" onClick={() => setShowCarPreview(false)}>
                                <div className="min-h-full flex items-center justify-center p-4">
                                    <CarPreviewModal
                                        dataUrl={dataUrl}
                                        coverImage={downloadGraphicUrl}
                                        coverImage2={downloadGraphicUrl2}
                                        onClose={() => setShowCarPreview(false)}
                                        emirateDisplay={emirateDisplay}
                                        emirateKey={emirateKey}
                                        isClassic={isClassic}
                                        code={code}
                                        number={number}
                                        price={listing.price}
                                        mobile={phone}
                                    />
                                </div>
                            </div>,
                            document.body
                        )}

                        {/* Bike Preview Modal */}
                        {showBikePreview && dataUrl && createPortal(
                            <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm" onClick={() => setShowBikePreview(false)}>
                                <div className="min-h-full flex items-center justify-center p-4">
                                    <BikePreviewModal
                                        dataUrl={dataUrl}
                                        coverImage={downloadGraphicUrl}
                                        coverImage2={downloadGraphicUrl2}
                                        onClose={() => setShowBikePreview(false)}
                                        emirateDisplay={emirateDisplay}
                                        code={code}
                                        number={number}
                                        price={listing?.price}
                                        mobile={phone}
                                    />
                                </div>
                            </div>,
                            document.body
                        )}

                        {/* Classic Car Preview Modal */}
                        {showClassicPreview && dataUrl && createPortal(
                            <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm" onClick={() => setShowClassicPreview(false)}>
                                <div className="min-h-full flex items-center justify-center p-4">
                                    <ClassicPreviewModal
                                        dataUrl={dataUrl}
                                        coverImage={downloadGraphicUrl}
                                        coverImage2={downloadGraphicUrl2}
                                        onClose={() => setShowClassicPreview(false)}
                                        emirateDisplay={emirateDisplay}
                                        emirateKey={emirateKey}
                                        code={code}
                                        number={number}
                                        price={listing?.price}
                                        mobile={phone}
                                    />
                                </div>
                            </div>,
                            document.body
                        )}

                        {/* Plate Details */}
                        <div className={`mt-6 grid gap-4 ${isClassic ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            <div className="bg-surface rounded-xl p-4 border border-border text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{t('emirate')}</p>
                                <p className="text-lg font-bold text-foreground">{emirateDisplay}</p>
                            </div>
                            {!isClassic && (
                                <div className="bg-surface rounded-xl p-4 border border-border text-center">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{t('code')}</p>
                                    <p className="text-lg font-bold text-foreground">{code || '—'}</p>
                                </div>
                            )}
                            <div className="bg-surface rounded-xl p-4 border border-border text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{isClassic ? t('classicPlate' as any).toUpperCase() : t('number' as any)}</p>
                                <p className="text-lg font-bold text-foreground">{isClassic ? t('classic' as any) : number}</p>
                            </div>

                            {/* Abu Dhabi Plate Version Switcher */}
                            {emirateKey === 'abudhabi' && plateStyle === 'private' && (
                                <div className="bg-surface rounded-xl p-1 border border-border flex col-span-2">
                                    <button
                                        onClick={() => setPlateVersion(1)}
                                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${plateVersion === 1 ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('modernDesign')}
                                    </button>
                                    <button
                                        onClick={() => setPlateVersion(2)}
                                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${plateVersion === 2 ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t('standardDesign')}
                                    </button>
                                </div>
                            )}
                            {isClassic && (
                                <div className="bg-surface rounded-xl p-4 border border-border text-center col-span-2">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{t('number')}</p>
                                    <p className="text-lg font-bold text-foreground">{number}</p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <div className="mt-6 bg-surface rounded-xl p-5 border border-border">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{t('description')}</p>
                                <p className="text-sm text-foreground/80 leading-relaxed">{listing.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Info Panel (2 cols) */}
                    < div className="lg:col-span-2 space-y-6" >

                        {/* Price */}
                        < div className="bg-card rounded-2xl border border-border p-6" >
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{t('price')}</p>
                            <p className="text-4xl font-black text-foreground font-mono tracking-tight">
                                {isSold ? (
                                    <span className="text-red-500 font-extrabold tracking-widest uppercase">{t('statusSold' as any)}</span>
                                ) : listing.price ? (
                                    `AED ${listing.price.toLocaleString()}`
                                ) : t('contactSeller')}
                            </p>

                            <button
                                onClick={handleShare}
                                className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Share2 className="h-4 w-4" /> {t('shareThisPlate')}
                            </button>
                            <button
                                onClick={toggleFavorite}
                                className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} /> {isFavorite ? t('saved' as any) : t('save')}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Download className="h-4 w-4" /> {t('downloadPlate')}
                            </button>
                        </div>

                        {/* Seller Info */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-4">{t('sellerInformation')}</p>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground font-bold text-lg">
                                    {sellerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{sellerName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {memberYear && `${t('memberSince' as any)} ${memberYear} · `}UAE
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {isSold ? (
                                    <p className="text-sm text-red-500 font-bold text-center py-4 bg-red-50 rounded-xl border border-red-100 uppercase tracking-widest">
                                        {t('plateSoldMessage' as any)}
                                    </p>
                                ) : (
                                    <>
                                        {telUrl && (
                                            <a href={telUrl}
                                                className="flex items-center justify-center gap-2 w-full bg-foreground text-background py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm">
                                                <Phone className="h-4 w-4" /> {t('callSeller') || 'Call Seller'}
                                            </a>
                                        )}
                                        {whatsappUrl && (
                                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#1da851] transition-all shadow-sm">
                                                <MessageCircle className="h-4 w-4" /> {t('whatsapp') || 'WhatsApp'}
                                            </a>
                                        )}
                                        {!telUrl && !whatsappUrl && (
                                            <p className="text-sm text-muted-foreground text-center py-2">{t('noContactInfo') || 'No contact info available'}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="flex items-start gap-3 p-4 bg-surface rounded-xl border border-border">
                            <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-bold text-foreground/70">{t('noticeDisclaimerTitle')}</span> {t('noticeDisclaimerText')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* List With Us Banner */}
                <ListWithUsBanner />
            </div>
        </div >
    );
}

// ============================================================================
// BIKE PREVIEW CONFIGURATIONS
// ============================================================================
interface BikePreview {
    id: string;
    image: string;
    plateStyling: React.CSSProperties;
    plateStyling2?: React.CSSProperties;
    rakClassicPlateStyling2?: React.CSSProperties;
    mobileConfig?: {
        image: string;
        plateStyling: React.CSSProperties;
        plateStyling2?: React.CSSProperties;
        rakClassicPlateStyling2?: React.CSSProperties;
    };
}

export const BIKE_PREVIEWS: BikePreview[] = [
    {
        id: 'bike1',
        image: '/Preview-Plate-Bike.webp',
        plateStyling: {
            width: '11%',
            top: '63%',
            left: '50%',
            transform: 'translate(-50%, -50%) perspective(600px)',
        },
        plateStyling2: {
            width: '28%',
            top: '33%',
            left: '81%',
            transform: 'translate(-50%, -50%)',
        },
        rakClassicPlateStyling2: {
            width: '37.8%',
            top: '33%',
            left: '81%',
            transform: 'translate(-50%, -50%)',
        },
        mobileConfig: {
            image: '/Preview-Plate-Bikem.png',
            plateStyling: {
                width: '16%',
                top: '62.5%',
                left: '50%',
                transform: 'translate(-50%, -50%) perspective(600px)',
            },
            plateStyling2: {
                width: '38%',
                top: '25%',
                left: '78%',
                transform: 'translate(-50%, -50%)',
            },
            rakClassicPlateStyling2: {
                width: '47.3%',
                top: '33%',
                left: '81%',
                transform: 'translate(-50%, -50%)',
            },
        },
    },
    {
        id: 'bike2',
        image: '/Preview-Plate-Bike2.png',
        plateStyling: {
            width: '9%',
            top: '43%',
            left: '48%',
            transform: 'translate(-50%, -50%)', rotate: '-6deg'
        },
        plateStyling2: {
            width: '23%',
            top: '33%',
            left: '78%',
            transform: 'translate(-50%, -50%)',
        },
        rakClassicPlateStyling2: {
            width: '31.1%',
            top: '33%',
            left: '78%',
            transform: 'translate(-50%, -50%)',
        },
        mobileConfig: {
            image: '/Preview-Plate-Bike2m.png',
            plateStyling: {
                width: '16%',
                top: '42.5%',
                left: '47.5%',
                transform: 'translate(-50%, -50%)', rotate: '-6deg'
            },
            plateStyling2: {
                width: '27%',
                top: '25%',
                left: '84%',
                transform: 'translate(-50%, -50%)',
            },
            rakClassicPlateStyling2: {
                width: '40.5%',
                top: '33%',
                left: '78%',
                transform: 'translate(-50%, -50%)',
            },
        },
    },
    {
        id: 'bike3',
        image: '/Preview-Plate-Bike3.png',
        plateStyling: {
            width: '10%',
            top: '57%',
            left: '50.3%',
            transform: 'translate(-50%, -50%)', rotate: '-3.5deg'
        },
        plateStyling2: {
            width: '23%',
            top: '33%',
            left: '78%',
            transform: 'translate(-50%, -50%)',
        },
        rakClassicPlateStyling2: {
            width: '31.1%',
            top: '33%',
            left: '78%',
            transform: 'translate(-50%, -50%)',
        },
        mobileConfig: {
            image: '/Preview-Plate-Bike3m.png',
            plateStyling: {
                width: '18.5%',
                top: '56%',
                left: '50.3%',
                transform: 'translate(-50%, -50%)', rotate: '-3.5deg'
            },
            plateStyling2: {
                width: '30%',
                top: '16%',
                left: '78%',
                transform: 'translate(-50%, -50%)',
            },
            rakClassicPlateStyling2: {
                width: '40.5%',
                top: '33%',
                left: '78%',
                transform: 'translate(-50%, -50%)',
            },
        },
    },
    {
        id: 'bike4',
        image: '/Preview-Plate-Bike4.png',
        plateStyling: {
            width: '8%',
            top: '60.2%',
            left: '41%',
            transform: 'translate(-50%, -50%)', rotate: '-6.9deg'
        },
        plateStyling2: {
            width: '23%',
            top: '33%',
            left: '78%',
            transform: 'translate(-50%, -50%)',
        },
        rakClassicPlateStyling2: {
            width: '31.1%',
            top: '33%',
            left: '78%',
            transform: 'translate(-50%, -50%)',
        },
        mobileConfig: {
            image: '/Preview-Plate-Bike4m.png',
            plateStyling: {
                width: '13.5%',
                top: '59.7%',
                left: '37.2%',
                transform: 'translate(-50%, -50%)', rotate: '-6.9deg'
            },
            plateStyling2: {
                width: '33%',
                top: '29%',
                left: '79%',
                transform: 'translate(-50%, -50%)',
            },
            rakClassicPlateStyling2: {
                width: '40.5%',
                top: '33%',
                left: '78%',
                transform: 'translate(-50%, -50%)',
            },
        },
    },
];

function BikePreviewModal({ dataUrl, coverImage, coverImage2, onClose, emirateDisplay, code, number, price, mobile }: any) {
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Drag-to-scroll for thumbnails
    const thumbRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [scrollStartX, setScrollStartX] = useState(0);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!thumbRef.current) return;
        setIsDragging(true);
        setDragStartX(e.pageX);
        setScrollStartX(thumbRef.current.scrollLeft);
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !thumbRef.current) return;
        e.preventDefault();
        const dx = e.pageX - dragStartX;
        thumbRef.current.scrollLeft = scrollStartX - dx;
    };
    const onMouseUp = () => setIsDragging(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const rawBike = BIKE_PREVIEWS[currentIndex];
    const activeBike = isMobile && rawBike?.mobileConfig ? { ...rawBike, ...rawBike.mobileConfig } : rawBike;

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            if (currentIndex === -1 && coverImage) {
                const a = document.createElement('a');
                a.href = coverImage;
                a.download = `Plate-${code}-${number}-Graphic.png`;
                a.click();
                setIsDownloading(false);
                return;
            }

            if (!activeBike) return;

            await downloadPreviewAsCanvas({
                backgroundImage: activeBike.image,
                plateDataUrl: dataUrl,
                plateStyling: activeBike.plateStyling as any,
                plateStyling2: activeBike.plateStyling2 as any,
                price,
                phone: mobile || '',
                filename: `Plate-${code}-${number}-BikePreview.jpg`,
                isBike: true,
            });
        } catch (e) {
            console.error('Download failed', e);
            toast.error('Failed to download image. Try again.');
        }
        setIsDownloading(false);
    };

    return (
        <div className="relative w-full max-w-5xl z-[70]" onClick={e => e.stopPropagation()}>
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
            >
                <XIcon className="h-5 w-5" />
            </button>

            <div id="bike-preview-node" className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#0a0a0a]" style={{ containerType: 'inline-size' }}>
                {currentIndex === -1 ? (
                    <img src={coverImage} alt="Plate Graphic" className="max-h-[45vh] md:max-h-[50vh] w-auto mx-auto object-contain bg-black p-4 sm:p-8" />
                ) : currentIndex === -2 ? (
                    <img src={coverImage2} alt="Plate Graphic V2" className="max-h-[45vh] md:max-h-[50vh] w-auto mx-auto object-contain bg-black p-4 sm:p-8" />
                ) : activeBike ? (
                    <>
                        <img id="preview-bike-image" src={activeBike.image} alt="Bike Preview" className="w-full h-auto" />

                        {/* Primary plate overlay */}
                        <img
                            src={dataUrl}
                            alt={`${emirateDisplay} ${code} ${number} on bike`}
                            className="absolute drop-shadow-2xl"
                            style={{
                                ...activeBike.plateStyling,
                                filter: 'brightness(0.92) contrast(1.05)',
                                imageRendering: 'auto',
                            } as React.CSSProperties}
                        />

                        {/* Secondary plate overlay */}
                        {activeBike.plateStyling2 && (
                            <img
                                src={dataUrl}
                                alt={`${emirateDisplay} ${code} ${number} on bike (secondary)`}
                                className="absolute drop-shadow-2xl"
                                style={{
                                    ...activeBike.plateStyling2,
                                    filter: activeBike.plateStyling2.filter || 'brightness(1) contrast(1.05)',
                                    imageRendering: 'auto',
                                } as React.CSSProperties}
                            />
                        )}

                        {/* Price & Phone Number — centered together in the middle */}
                        <div
                            className="absolute left-10 right-0 bottom-0 flex items-center justify-center gap-[20%] px-[4%] py-[2.5%]"

                        >
                            <div
                                className="tracking-tight font-black leading-none whitespace-nowrap"
                                style={{
                                    fontFamily: '"Montserrat", serif',
                                    fontWeight: 700,
                                    background: 'linear-gradient(to bottom, #F6D972 0%, #C39A31 40%, #F9EEA2 50%, #8C6C16 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    color: 'transparent',
                                    textShadow: 'none',
                                    filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))',
                                    fontSize: price ? '5.5cqi' : '4.6cqi',
                                }}
                            >
                                {price ? `AED ${price.toLocaleString()}` : 'Contact Seller'}
                            </div>
                            {mobile && (
                                <div
                                    className="tracking-tight font-bold leading-none whitespace-nowrap"
                                    style={{
                                        fontFamily: '"Montserrat", serif',
                                        fontWeight: 700,
                                        background: 'linear-gradient(to bottom, #F6D972 0%, #C39A31 40%, #F9EEA2 50%, #8C6C16 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        color: 'transparent',
                                        textShadow: 'none',
                                        filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))',
                                        fontSize: '5.3cqi',
                                        opacity: 0.9,
                                    }}
                                >
                                    {formatPhoneWithSpaces(mobile)}
                                </div>
                            )}
                        </div>
                    </>
                ) : null}
            </div>

            {/* Thumbnails to switch bikes */}
            <div
                ref={thumbRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onDragStart={e => e.preventDefault()}
                className={`mt-6 flex gap-3 overflow-x-auto pb-4 px-4 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
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
                        onClick={() => setCurrentIndex(-1)}
                        className={`relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-[3px] transition-all shadow-md bg-black/80
                        ${currentIndex === -1 ? 'border-primary scale-110 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                    >
                        <img src={coverImage} alt="Flat Graphic Preview" className="w-full h-full object-contain pointer-events-none p-1" draggable={false} />
                        <div className={`absolute inset-0 bg-black/20 ${currentIndex === -1 ? 'hidden' : ''}`} />
                    </button>
                )}
                {BIKE_PREVIEWS.map((bike, idx) => (
                    <button
                        key={bike.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-[3px] transition-all shadow-md bg-black/80
                        ${currentIndex === idx ? 'border-primary scale-110 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                    >
                        <img
                            src={bike.image}
                            alt={`Bike option ${idx + 1}`}
                            className="w-full h-full object-cover pointer-events-none"
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                        />
                        <div className={`absolute inset-0 bg-black/20 ${currentIndex === idx ? 'hidden' : ''}`} />
                    </button>
                ))}
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex justify-between items-center text-center px-6">
                <p className="text-white text-base font-bold">
                    {emirateDisplay} <span className="opacity-60 font-medium">·</span> {code} {number}
                </p>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="bg-white text-black hover:bg-gray-100 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                >
                    {isDownloading ? (
                        <span className="flex items-center gap-2">Generating...</span>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Image
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}// ============================================================================
// CAR PREVIEW CONFIGURATIONS
// You can manually adjust the positions for each car image here:
// `top`  : Moves the plate UP (lower %) or DOWN (higher %)
// `left` : Moves the plate LEFT (lower %) or RIGHT (higher %)
// `width`: Makes the plate smaller or larger
export const CAR_PREVIEWS: CarPreview[] = [
    {
        id: 1,
        // Default Car
        image: '/Preview-Plate.png',
        plateStyling: {
            top: '67%', left: '33.5%', width: '13%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-5deg) rotateZ(2deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '67%', left: '33.5%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-5deg) rotateZ(2deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '12%', left: '54%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '12%', left: '54%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '12%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Platem.png',
            plateStyling: { top: '68%', left: '29%', width: '20%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(-17deg) rotateZ(2deg)' },
            rakClassicPlateStyling: { top: '68%', left: '29%', width: '27%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(-17deg) rotateZ(2deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '89.2%', left: '76%', transform: 'translate(-50%, -59%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '89%', left: '25%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 2,
        image: '/Preview-Plate2.png',
        plateStyling: {
            top: '67.4%', left: '50%', width: '14%', transform: 'translate(-50%, -50%) perspective(300px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '67.4%', left: '50%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(300px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '9%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '9%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate2m.png',
            plateStyling: { top: '64.5%', left: '50.5%', width: '21%', transform: 'translate(-50%, -50%) perspective(600px)', },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '89%', left: '76%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '89%', left: '25%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 3,
        image: '/Preview-Plate3.png',
        plateStyling: {
            top: '63.5%', left: '51%', width: '17%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined, // Dimmed for the car in Preview 3
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate3m.png',
            plateStyling: { top: '59.5%', left: '50.5%', width: '21%', transform: 'translate(-50%, -50%) perspective(600px)', },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 301,
        image: '/Preview-Plate3a.png',
        plateStyling: {
            top: '51.5%', left: '50.2%', width: '17%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '51.5%', left: '50.2%', width: '23%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate3am.png',
            plateStyling: { top: '49.5%', left: '50.5%', width: '21%', transform: 'translate(-50%, -50%) perspective(600px)', },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 4,
        image: '/Preview-Plate4.png',
        plateStyling: {
            top: '64.5%', left: '64%', width: '12%', transform: 'translate(-50%, -50%) perspective(300px) rotateX(0deg) rotateY(0deg) rotateZ(-1deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '64.5%', left: '64%', width: '16.2%', transform: 'translate(-50%, -50%) perspective(300px) rotateX(0deg) rotateY(0deg) rotateZ(-1deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10.4%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(300px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10.4%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(300px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate4m.png',
            plateStyling: { top: '60.5%', left: '67.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(-1.3deg)' },
            rakClassicPlateStyling: { top: '60.5%', left: '67.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(-1.3deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '89%', left: '76%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '89%', left: '25%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 5,
        image: '/Preview-Plate5.png',
        plateStyling: {
            top: '64.8%', left: '66.9%', width: '11.5%', transform: 'translate(-50%, -50%) perspective(300px) rotateX(0deg) rotateY(0deg) rotateZ(-1deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '64.8%', left: '66.9%', width: '15.5%', transform: 'translate(-50%, -50%) perspective(300px) rotateX(0deg) rotateY(0deg) rotateZ(-1deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate5m.png',
            plateStyling: { top: '60.7%', left: '73.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(-1.9deg)' },
            rakClassicPlateStyling: { top: '60.7%', left: '73.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(-1.9deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '89%', left: '76%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '89%', left: '25%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 6,
        image: '/Preview-Plate6.png',
        plateStyling: {
            top: '64.4%', left: '67.2%', width: '16.5%', transform: 'translate(-50%, -50%) perspective(600px)rotateX(0deg) rotateY(0deg) rotateZ(0.6deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '64.4%', left: '67.2%', width: '22.3%', transform: 'translate(-50%, -50%) perspective(600px)rotateX(0deg) rotateY(0deg) rotateZ(0.6deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate6m.png',
            plateStyling: { top: '59%', left: '65%', width: '18%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(1deg)' },
            rakClassicPlateStyling: { top: '59%', left: '65%', width: '24.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(1deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '89%', left: '76%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '89%', left: '25%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 7,
        image: '/Preview-Plate7.png',
        plateStyling: {
            top: '64.9%', left: '67.2%', width: '16.5%', transform: 'translate(-50%, -50%) perspective(600px)rotateX(0deg) rotateY(0deg) rotateZ(0.6deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '64.9%', left: '67.2%', width: '22.3%', transform: 'translate(-50%, -50%) perspective(600px)rotateX(0deg) rotateY(0deg) rotateZ(0.6deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate7m.png',
            plateStyling: { top: '59.7%', left: '65.5%', width: '19%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(1deg)' },
            rakClassicPlateStyling: { top: '59.7%', left: '65.5%', width: '25.7%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(1deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '89%', left: '76%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '89%', left: '25%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 8,
        image: '/Preview-Plate8.png',
        plateStyling: {
            top: '50.4%', left: '67%', width: '14%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0.6deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '50.4%', left: '67%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0.6deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate8m.png',
            plateStyling: { top: '52%', left: '67.5%', width: '19%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(1deg)' },
            rakClassicPlateStyling: { top: '52%', left: '67.5%', width: '25.7%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(1deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 9,
        image: '/Preview-Plate9.png',
        plateStyling: {
            top: '50.7%', left: '67.7%', width: '14%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0.6deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '50.7%', left: '67.7%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0.6deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate9m.png',
            plateStyling: { top: '51%', left: '69.2%', width: '19%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(1deg)' },
            rakClassicPlateStyling: { top: '51%', left: '69.2%', width: '25.7%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(1deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 10,
        image: '/Preview-Plate10.png',
        plateStyling: {
            top: '50.8%', left: '69.2%', width: '14%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0.6deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '50.8%', left: '69.2%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0.6deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate10m.png',
            plateStyling: { top: '52%', left: '66.5%', width: '17%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(1deg)' },
            rakClassicPlateStyling: { top: '52%', left: '66.5%', width: '23%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(2deg) rotateY(0deg) rotateZ(1deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 11,
        image: '/Preview-Plate11.png',
        plateStyling: {
            top: '55%', left: '20.5%', width: '14%', transform: 'translate(-50%, -50%) perspective(400px) rotateX(0deg) rotateY(-22deg) rotateZ(1deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '55%', left: '20.5%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(400px) rotateX(0deg) rotateY(-22deg) rotateZ(1deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate11m.png',
            plateStyling: { top: '54%', left: '15.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-23deg) rotateZ(2deg)' },
            rakClassicPlateStyling: { top: '54%', left: '15.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-23deg) rotateZ(2deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 12,
        image: '/Preview-Plate12.png',
        plateStyling: {
            top: '55.4%', left: '20.5%', width: '14%', transform: 'translate(-50%, -50%) perspective(400px) rotateY(-22deg) rotateZ(1deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '55.4%', left: '20.5%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(400px) rotateY(-22deg) rotateZ(1deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate12m.png',
            plateStyling: { top: '57%', left: '15.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-23deg) rotateZ(2deg)' },
            rakClassicPlateStyling: { top: '57%', left: '15.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-23deg) rotateZ(2deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 13,
        image: '/Preview-Plate13.png',
        plateStyling: {
            top: '66.8%', left: '68%', width: '12.5%', transform: 'translate(-50%, -50%) perspective(600px)rotateX(0deg) rotateY(0deg) rotateZ(-2deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '66.8%', left: '68%', width: '16.9%', transform: 'translate(-50%, -50%) perspective(600px)rotateX(0deg) rotateY(0deg) rotateZ(-2deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate13m.png',
            plateStyling: { top: '58.5%', left: '75%', width: '18%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(20deg) rotateZ(-2deg)' },
            rakClassicPlateStyling: { top: '58.5%', left: '75%', width: '24.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(20deg) rotateZ(-2deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 14,
        image: '/Preview-Plate14.png',
        plateStyling: {
            top: '66.8%', left: '68%', width: '12.5%', transform: 'translate(-50%, -50%) perspective(600px)rotateX(0deg) rotateY(0deg) rotateZ(-2deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '66.8%', left: '68%', width: '16.9%', transform: 'translate(-50%, -50%) perspective(600px)rotateX(0deg) rotateY(0deg) rotateZ(-2deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '90%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '90%', left: '12%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate14m.png',
            plateStyling: { top: '62.8%', left: '76.7%', width: '18%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(20deg) rotateZ(-1deg)' },
            rakClassicPlateStyling: { top: '62.8%', left: '76.7%', width: '24.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(20deg) rotateZ(-1deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 16,
        image: '/Preview-Plate16.png',
        plateStyling: {
            top: '63.9%', left: '67.3%', width: '12.5%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(-0.5deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '63.9%', left: '67.3%', width: '16.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(-0.5deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate16m.png',
            plateStyling: { top: '63.8%', left: '68.2%', width: '16%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(5deg) rotateZ(-0.5deg)' },
            rakClassicPlateStyling: { top: '63.8%', left: '68.2%', width: '21.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(5deg) rotateZ(-0.5deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 17,
        image: '/Preview-Plate17.png',
        plateStyling: {
            top: '55%', left: '50.2%', width: '12%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '55%', left: '50.2%', width: '16.2%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate17m.png',
            plateStyling: { top: '54.2%', left: '50.5%', width: '17%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '54.2%', left: '50.5%', width: '23%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '11%', left: '50%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '50%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 18,
        image: '/Preview-Plate18.png',
        plateStyling: {
            top: '61%', left: '41%', width: '11%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(1deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '61%', left: '41%', width: '14.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(1deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate18m.png',
            plateStyling: { top: '62%', left: '34.5%', width: '18%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(1deg)' },
            rakClassicPlateStyling: { top: '62%', left: '34.5%', width: '24.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(1deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 19,
        image: '/Preview-Plate19.png',
        plateStyling: {
            top: '64.5%', left: '68%', width: '14%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(-2deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '64.5%', left: '68%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(-2deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate19m.png',
            plateStyling: { top: '57%', left: '74%', width: '22%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(-2deg)' },
            rakClassicPlateStyling: { top: '57%', left: '74%', width: '29.7%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(-2deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },

    {
        id: 21,
        image: '/Preview-Plate21.png',
        plateStyling: {
            top: '61%', left: '20%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-22deg) rotateZ(3deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '61%', left: '20%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-22deg) rotateZ(3deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate21m.png',
            plateStyling: { top: '59%', left: '16.4%', width: '18%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-5deg) rotateZ(3deg)' },
            rakClassicPlateStyling: { top: '59%', left: '16.4%', width: '24.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-5deg) rotateZ(3deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 22,
        image: '/Preview-Plate22.png',
        plateStyling: {
            top: '65%', left: '68.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(5deg) rotateY(10deg) rotateZ(-3deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65%', left: '68.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(5deg) rotateY(10deg) rotateZ(-3deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate22m.png',
            plateStyling: { top: '64.9%', left: '74.7%', width: '18%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(-2.1deg)' },
            rakClassicPlateStyling: { top: '64.9%', left: '74.7%', width: '24.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(-2.1deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 23,
        image: '/Preview-Plate23.png',
        plateStyling: {
            top: '65%', left: '68.9%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(5deg) rotateY(10deg) rotateZ(-3deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65%', left: '68.9%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(5deg) rotateY(10deg) rotateZ(-3deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate23m.png',
            plateStyling: { top: '73.9%', left: '74.7%', width: '18%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(-2.1deg)' },
            rakClassicPlateStyling: { top: '73.9%', left: '74.7%', width: '24.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(-2.1deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 24,
        image: '/Preview-Plate24.png',
        plateStyling: {
            top: '65%', left: '50.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate24m.png',
            plateStyling: { top: '64.2%', left: '51%', width: '24%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '64.2%', left: '51%', width: '32.4%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 25,
        image: '/Preview-Plate25.png',
        plateStyling: {
            top: '65%', left: '50.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate25m.png',
            plateStyling: { top: '63.2%', left: '50%', width: '20%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '63.2%', left: '50%', width: '27%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 26,
        image: '/Preview-Plate26.png',
        plateStyling: {
            top: '65%', left: '50.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate26m.png',
            plateStyling: { top: '62.2%', left: '51%', width: '22%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '62.2%', left: '51%', width: '29.7%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 27,
        image: '/Preview-Plate27.png',
        plateStyling: {
            top: '65%', left: '50.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate27m.png',
            plateStyling: { top: '64.2%', left: '51%', width: '24%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '64.2%', left: '51%', width: '32.4%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '11%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '11%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 28,
        image: '/Preview-Plate28.png',
        plateStyling: {
            top: '65.5%', left: '50.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65.5%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate28m.png',
            plateStyling: { top: '66.2%', left: '50%', width: '24%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '66.2%', left: '50%', width: '32.4%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '13%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '13%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 29,
        image: '/Preview-Plate29.png',
        plateStyling: {
            top: '65.5%', left: '50.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65.5%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate29m.png',
            plateStyling: { top: '67.2%', left: '51%', width: '24%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '67.2%', left: '51%', width: '32.4%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '13%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '13%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 30,
        image: '/Preview-Plate30.png',
        plateStyling: {
            top: '65.5%', left: '50.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65.5%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate30m.png',
            plateStyling: { top: '66.2%', left: '52%', width: '24%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '66.2%', left: '52%', width: '32.4%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '13%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '13%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 31,
        image: '/Preview-Plate31.png',
        plateStyling: {
            top: '65.5%', left: '50.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65.5%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate31m.png',
            plateStyling: { top: '63.2%', left: '50%', width: '20%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '63.2%', left: '50%', width: '27%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '13%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '13%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 32,
        image: '/Preview-Plate32.png',
        plateStyling: {
            top: '65.5%', left: '50.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65.5%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate32m.png',
            plateStyling: { top: '71.4%', left: '51.3%', width: '20%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '71.4%', left: '51.3%', width: '27%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '13%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '13%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 33,
        image: '/Preview-Plate33.png',
        plateStyling: {
            top: '42.2%', left: '69.7%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '42.2%', left: '69.7%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '9%', left: '50%', width: '28%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '9%', left: '50%', width: '37.8%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate33m.png',
            plateStyling: { top: '44.9%', left: '69.7%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(10deg) rotateZ(0.4deg)' },
            rakClassicPlateStyling: { top: '44.9%', left: '69.7%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(10deg) rotateZ(0.4deg)' },
            plateStyling2: { top: '13%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '13%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 34,
        image: '/Preview-Plate34.png',
        plateStyling: {
            top: '42.2%', left: '69.7%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '42.2%', left: '69.7%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '9%', left: '50%', width: '28%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '9%', left: '50%', width: '37.8%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate34m.png',
            plateStyling: { top: '44.2%', left: '73.2%', width: '17%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0.2deg)' },
            rakClassicPlateStyling: { top: '44.2%', left: '73.2%', width: '23%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0.2deg)' },
            plateStyling2: { top: '13%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '13%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 35,
        image: '/Preview-Plate35.png',
        plateStyling: {
            top: '42.9%', left: '70.7%', width: '14%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '42.9%', left: '70.7%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '9%', left: '50%', width: '28%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '9%', left: '50%', width: '37.8%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate35m.png',
            plateStyling: { top: '49.6%', left: '71.2%', width: '14%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '49.6%', left: '71.2%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '17%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '17%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 36,
        image: '/Preview-Plate36.png',
        plateStyling: {
            top: '42.9%', left: '70.7%', width: '14%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '42.9%', left: '70.7%', width: '18.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '9%', left: '50%', width: '28%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '9%', left: '50%', width: '37.8%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate36m.png',
            plateStyling: { top: '45.9%', left: '73.8%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '45.9%', left: '73.8%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '17%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '17%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 37,
        image: '/Preview-Plate37.png',
        plateStyling: {
            top: '62.6%', left: '32.7%', width: '15.5%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-22deg) rotateZ(1deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '62.6%', left: '32.7%', width: '20.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-22deg) rotateZ(1deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate37m.png',
            plateStyling: { top: '62%', left: '27.2%', width: '20%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-20deg) rotateZ(1deg)' },
            rakClassicPlateStyling: { top: '62%', left: '27.2%', width: '27%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-20deg) rotateZ(1deg)' },
            plateStyling2: { top: '17%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '17%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 38,
        image: '/Preview-Plate38.png',
        plateStyling: {
            top: '62.6%', left: '31.7%', width: '15.5%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-22deg) rotateZ(1deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '62.6%', left: '31.7%', width: '20.9%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-22deg) rotateZ(1deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate38m.png',
            plateStyling: { top: '61%', left: '27.2%', width: '19%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-20deg) rotateZ(1deg)' },
            rakClassicPlateStyling: { top: '61%', left: '27.2%', width: '25.7%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-20deg) rotateZ(1deg)' },
            plateStyling2: { top: '17%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '17%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 40,
        image: '/Preview-Plate39.png',
        plateStyling: {
            top: '63%', left: '30.7%', width: '14.7%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-22deg) rotateZ(1deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '63%', left: '30.7%', width: '19.8%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-22deg) rotateZ(1deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate39m.png',
            plateStyling: { top: '62%', left: '25.2%', width: '19%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-20deg) rotateZ(1deg)' },
            rakClassicPlateStyling: { top: '62%', left: '25.2%', width: '25.7%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-20deg) rotateZ(1deg)' },
            plateStyling2: { top: '17%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '17%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        },
    },
    {
        id: 41,
        image: '/Preview-Plate40.png',
        plateStyling: {
            top: '70.5%', left: '50.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65.5%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate40m.png',
            plateStyling: { top: '58.4%', left: '50%', width: '20%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling: { top: '71.4%', left: '51.3%', width: '27%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '13%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '13%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 42,
        image: '/Preview-Plate41.png',
        plateStyling: {
            top: '65.5%', left: '31.7%', width: '13.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(-4deg) rotateY(-18deg) rotateZ(2deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65.5%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate41m.png',
            plateStyling: { top: '58.2%', left: '32%', width: '14%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-25deg) rotateZ(3deg)' },
            rakClassicPlateStyling: { top: '71.4%', left: '51.3%', width: '27%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '13%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '13%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
    {
        id: 43,
        image: '/Preview-Plate42.png',
        plateStyling: {
            top: '67.5%', left: '30.5%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(-2deg) rotateY(-22deg) rotateZ(2deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65.5%', left: '50.5%', width: '20.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '40%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '54%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate42m.png',
            plateStyling: { top: '61.4%', left: '26.3%', width: '19%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(-25deg) rotateZ(3deg)' },
            rakClassicPlateStyling: { top: '71.4%', left: '51.3%', width: '27%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            plateStyling2: { top: '13%', left: '60%', width: '55%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            rakClassicPlateStyling2: { top: '13%', left: '60%', width: '74.3%', transform: 'translate(-50%, -50%) perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
            priceStyling: { top: '90%', left: '74%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.6 },
            mobileStyling: { top: '90%', left: '28%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.6 }
        }
    },
];

/**
 * Formats a phone number string with spaces for display on car previews.
 * Handles UAE numbers: +971 55 123 1234
 * Also handles numbers without country code by adding +971 prefix.
 */
function formatPhoneWithSpaces(phone: string): string {
    if (!phone) return '';
    // Strip all non-digit characters except leading +
    const digits = phone.replace(/[^\d]/g, '');
    if (!digits) return phone;

    // Handle UAE numbers (971...)
    if (digits.startsWith('971') && digits.length >= 12) {
        // +971 XX XXX XXXX
        return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    if (digits.startsWith('971') && digits.length >= 10) {
        // +971 XX XXXX XXX  (shorter variant)
        return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    // Handle numbers starting with 0 (local UAE format like 055...)
    if (digits.startsWith('0') && digits.length >= 10) {
        return `+971 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    // Handle raw 9-digit numbers (no prefix, e.g. 551231234)
    if (digits.length === 9 && (digits.startsWith('5') || digits.startsWith('4'))) {
        return `+971 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    // Fallback: insert spaces every 3-4 digits
    if (digits.length > 7) {
        return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    return phone;
}

function CarPreviewModal({ dataUrl, coverImage, coverImage2, onClose, emirateDisplay, emirateKey, isClassic, code, number, price, mobile }: any) {
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Drag-to-scroll for thumbnails
    const thumbRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [scrollStartX, setScrollStartX] = useState(0);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!thumbRef.current) return;
        setIsDragging(true);
        setDragStartX(e.pageX);
        setScrollStartX(thumbRef.current.scrollLeft);
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !thumbRef.current) return;
        e.preventDefault();
        const dx = e.pageX - dragStartX;
        thumbRef.current.scrollLeft = scrollStartX - dx;
    };
    const onMouseUp = () => setIsDragging(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const rawCar = CAR_PREVIEWS[currentIndex];
    // Use matching mobile overrides if we are on a small screen and the car supports it
    const activeCar = isMobile && rawCar?.mobileConfig ? { ...rawCar, ...rawCar.mobileConfig } : rawCar;

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            if (currentIndex === -1 && coverImage) {
                const a = document.createElement('a');
                a.href = coverImage;
                a.download = `Plate-${code}-${number}-Graphic.png`;
                a.click();
                setIsDownloading(false);
                return;
            }

            if (!activeCar) return;

            // Determine the correct plate styling based on emirate and plate type
            const primaryPlate = isClassic && emirateKey === 'rak' && activeCar.rakClassicPlateStyling
                ? activeCar.rakClassicPlateStyling
                : activeCar.plateStyling;
            const secondaryPlate = isClassic && emirateKey === 'rak' && activeCar.rakClassicPlateStyling2
                ? activeCar.rakClassicPlateStyling2
                : activeCar.plateStyling2;

            await downloadPreviewAsCanvas({
                backgroundImage: activeCar.image,
                plateDataUrl: dataUrl,
                plateStyling: primaryPlate as any,
                plateStyling2: secondaryPlate as any,
                price,
                phone: mobile || '',
                filename: `Plate-${code}-${number}-CarPreview.jpg`,
                priceStyling: activeCar.priceStyling as any,
                mobileStyling: activeCar.mobileStyling as any,
            });
        } catch (e) {
            console.error('Download failed', e);
            toast.error('Failed to download image. Try again.');
        }
        setIsDownloading(false);
    };

    return (
        <div className="relative w-full max-w-5xl z-[70]" onClick={e => e.stopPropagation()}>
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
            >
                <XIcon className="h-5 w-5" />
            </button>

            <div id="car-preview-node" className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#0a0a0a]" style={{ containerType: 'inline-size' }}>
                {currentIndex === -1 ? (
                    <img src={coverImage} alt="Plate Graphic" className="max-h-[45vh] md:max-h-[50vh] w-auto mx-auto object-contain bg-black p-4 sm:p-8" />
                ) : (
                    <>
                        <img id="preview-car-image" src={activeCar?.image} alt="Car Preview" className="w-full h-auto" />

                        {/* Overlaying the generated plate image using CSS matching the styling array */}
                        {activeCar && (
                            <img
                                src={dataUrl}
                                alt={`${emirateDisplay} ${code} ${number} on car`}
                                className="absolute drop-shadow-2xl"
                                style={{
                                    ...(isClassic && emirateKey === 'rak' && activeCar.rakClassicPlateStyling ? activeCar.rakClassicPlateStyling : activeCar.plateStyling),
                                    filter: (isClassic && emirateKey === 'rak' && activeCar.rakClassicPlateStyling ? activeCar.rakClassicPlateStyling.filter : activeCar.plateStyling.filter) || 'brightness(0.92) contrast(1.05)',
                                    imageRendering: 'auto',
                                } as React.CSSProperties}
                            />
                        )}

                        {/* Secondary Plate Overlay */}
                        {activeCar?.plateStyling2 && (
                            <img
                                src={dataUrl}
                                alt={`${emirateDisplay} ${code} ${number} on car (secondary)`}
                                className="absolute drop-shadow-2xl"
                                style={{
                                    ...(isClassic && emirateKey === 'rak' && activeCar.rakClassicPlateStyling2 ? activeCar.rakClassicPlateStyling2 : activeCar.plateStyling2),
                                    filter: (isClassic && emirateKey === 'rak' && activeCar.rakClassicPlateStyling2 ? activeCar.rakClassicPlateStyling2.filter : activeCar.plateStyling2.filter) || 'brightness(0.92) contrast(1.05)',
                                    imageRendering: 'auto',
                                } as React.CSSProperties}
                            />
                        )}

                        {/* Overlaying the price or Contact Seller */}
                        {activeCar?.priceStyling && (
                            <div
                                id="preview-price"
                                className="absolute tracking-tight font-black leading-none whitespace-nowrap"
                                style={{
                                    ...activeCar.priceStyling,
                                    fontFamily: '"Montserrat", serif',
                                    fontWeight: 700,
                                    background: 'linear-gradient(to bottom, #F6D972 0%, #C39A31 40%, #F9EEA2 50%, #8C6C16 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    color: 'transparent',
                                    textShadow: 'none',
                                    filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))',
                                    fontSize: `${(price ? 2.4 : 1.4) * ((activeCar.priceStyling as any)?.textScale || 1)}cqi`,
                                }}
                            >
                                {price ? `AED ${price.toLocaleString()}` : 'Contact Seller'}
                            </div>
                        )}

                        {/* Overlaying the mobile number if present */}
                        {mobile && activeCar?.mobileStyling && (
                            <div
                                id="preview-mobile"
                                className="absolute tracking-tight font-bold leading-none whitespace-nowrap"
                                style={{
                                    ...activeCar.mobileStyling,
                                    fontFamily: '"Montserrat", serif',
                                    fontWeight: 700,
                                    background: 'linear-gradient(to bottom, #F6D972 0%, #C39A31 40%, #F9EEA2 50%, #8C6C16 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    color: 'transparent',
                                    textShadow: 'none',
                                    filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))',
                                    // textScale base 1.6cqi aligns perfectly with 0.016 canvas multiplier
                                    fontSize: `${1.6 * ((activeCar.mobileStyling as any)?.textScale || 1)}cqi`,
                                }}
                            >
                                {formatPhoneWithSpaces(mobile)}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Thumbnails to switch cars */}
            <div
                ref={thumbRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onDragStart={e => e.preventDefault()}
                className={`mt-6 flex gap-3 overflow-x-auto pb-4 px-4 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} 
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
                        onClick={() => setCurrentIndex(-1)}
                        className={`relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-[3px] transition-all shadow-md bg-black/80
                        ${currentIndex === -1 ? 'border-primary scale-110 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                    >
                        <img src={coverImage} alt="Flat Graphic Preview" className="w-full h-full object-contain pointer-events-none p-1" draggable={false} />
                        <div className={`absolute inset-0 bg-black/20 ${currentIndex === -1 ? 'hidden' : ''}`} />
                    </button>
                )}
                {CAR_PREVIEWS.map((car, idx) => {
                    const thumbImage = isMobile && car.mobileConfig ? car.mobileConfig.image : car.image;
                    return (
                        <button
                            key={car.id}
                            onClick={() => setCurrentIndex(idx)}
                            className={`relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-[3px] transition-all shadow-md bg-black/80
                            ${currentIndex === idx ? 'border-primary scale-110 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                        >
                            <img
                                src={thumbImage}
                                alt={`Car option ${idx + 1}`}
                                className="w-full h-full object-cover pointer-events-none"
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                            />
                            <div className={`absolute inset-0 bg-black/20 ${currentIndex === idx ? 'hidden' : ''}`} />
                        </button>
                    )
                })}
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex justify-between items-center text-center px-6">
                <p className="text-white text-base font-bold">
                    {emirateDisplay} <span className="opacity-60 font-medium">·</span> {code} {number}
                </p>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="bg-white text-black hover:bg-gray-100 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                >
                    {isDownloading ? (
                        <span className="flex items-center gap-2">Generating...</span>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Image
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// CLASSIC CAR PREVIEW CONFIGURATIONS
// Dedicated car preview images for all Classic plates.
// `top`  : Moves the plate UP (lower %) or DOWN (higher %)
// `left` : Moves the plate LEFT (lower %) or RIGHT (higher %)
// `width`: Makes the plate smaller or larger
// ============================================================================
export const CLASSIC_CAR_PREVIEWS: CarPreview[] = [
    {
        id: 101,
        image: '/Preview-Plate-RAK1.png',
        plateStyling: {
            top: '68.8%', left: '29.4%', width: '13.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(2.4deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '68.8%', left: '29.4%', width: '9.4%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(2.4deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '11%', left: '50%', width: '21.3%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate-RAK1m.png',
            plateStyling: { top: '63.8%', left: '23.4%', width: '16%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(2.4deg)' },
            rakClassicPlateStyling: { top: '62.8%', left: '23.8%', width: '10.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(2.1deg)' },
            plateStyling2: { top: '10%', left: '53%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '11%', left: '55%', width: '35%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 102,
        image: '/Preview-Plate-RAK2.png',
        plateStyling: {
            top: '58.8%', left: '73.4%', width: '12.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(12deg) rotateX(-5deg) rotateZ(-2.8deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '59.5%', left: '73%', width: '9%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(35deg) rotateX(0deg) rotateZ(0deg) rotate(-2deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '13%', left: '50%', width: '25%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '12%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate-RAK2m.png',
            plateStyling: { top: '52.8%', left: '74.8%', width: '13%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(15deg) rotateX(0deg) rotateZ(-3.1deg)' },
            rakClassicPlateStyling: { top: '59.5%', left: '73%', width: '12%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(35deg) rotateX(0deg) rotateZ(0deg) rotate(2deg)' },
            plateStyling2: { top: '10%', left: '53%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '10%', left: '50%', width: '25%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 103,
        image: '/Preview-Plate-RAK3.png',
        plateStyling: {
            top: '57.5%', left: '50%', width: '16.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '57.5%', left: '50%', width: '10.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '20%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate-RAK3m.png',
            plateStyling: { top: '56.5%', left: '50%', width: '21.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            rakClassicPlateStyling: { top: '56.5%', left: '50%', width: '14.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            plateStyling2: { top: '10%', left: '55%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '10%', left: '55%', width: '35%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 104,
        image: '/Preview-Plate-RAK4.png',
        plateStyling: {
            top: '72.5%', left: '50%', width: '15.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '72.5%', left: '50%', width: '13.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        plateStyling2: {
            top: '8.2%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '8.2%', left: '50%', width: '17%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate-RAK4m.png',
            plateStyling: { top: '70.5%', left: '50%', width: '21.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            rakClassicPlateStyling: { top: '72.5%', left: '50%', width: '17.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            plateStyling2: { top: '8.2%', left: '55%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '11.2%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 105,
        image: '/Preview-Plate-RAK5.png',
        plateStyling: {
            top: '57.5%', left: '50%', width: '14.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '57.5%', left: '50%', width: '10.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '20%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate-RAK5m.png',
            plateStyling: { top: '55.5%', left: '50%', width: '19.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            rakClassicPlateStyling: { top: '56%', left: '50%', width: '14.5%', transform: 'translate(-50%, -50%) perspective(600px)' },

            plateStyling2: { top: '10%', left: '55%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '11%', left: '55%', width: '35%', transform: 'translate(-50%, -50%)' },

            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 106,
        image: '/Preview-Plate-RAK6.png',
        plateStyling: {
            top: '68.5%', left: '50%', width: '15.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '68.5%', left: '50%', width: '9.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '20%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate-RAK6m.png',
            plateStyling: { top: '65.5%', left: '50%', width: '22.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            rakClassicPlateStyling: { top: '65.5%', left: '50%', width: '13.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            plateStyling2: { top: '10%', left: '53%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '11%', left: '55%', width: '35%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 107,
        image: '/Preview-Plate-RAK7.png',
        plateStyling: {
            top: '68.8%', left: '29.4%', width: '13.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(2.4deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '66.8%', left: '29.4%', width: '9.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(2.4deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '20%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate-RAK7m.png',
            plateStyling: { top: '60.8%', left: '26.4%', width: '15%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(2.4deg)' },
            rakClassicPlateStyling: { top: '62.8%', left: '25.54%', width: '10.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(3.1deg)' },
            plateStyling2: { top: '10%', left: '53%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '11%', left: '55%', width: '35%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 109,
        image: '/Preview-Plate-RAK8.png',
        plateStyling: {
            top: '64.5%', left: '66%', width: '13%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(10deg) rotateX(-5deg) rotateZ(-1deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '65%', left: '66.4%', width: '8.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(20deg) rotateX(-5deg) rotateZ(-1deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '20%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate-RAK8m.png',
            plateStyling: { top: '61.8%', left: '73.1%', width: '16%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(15deg) rotateX(0deg) rotateZ(-1deg)' },
            rakClassicPlateStyling: { top: '61.8%', left: '73.1%', width: '11%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(15deg) rotateX(0deg) rotateZ(-1deg)' },
            plateStyling2: { top: '10%', left: '53%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '15%', left: '55%', width: '35%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 110,
        image: '/Preview-Plate28.png',
        plateStyling: {
            top: '66.5%', left: '51%', width: '12.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '66.5%', left: '51%', width: '9.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        plateStyling2: {
            top: '11%', left: '50%', width: '40%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '11.2%', left: '51%', width: '24%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate28m.png',
            plateStyling: { top: '65.5%', left: '50%', width: '22.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            rakClassicPlateStyling: { top: '66.5%', left: '50.5%', width: '13.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            plateStyling2: { top: '8.2%', left: '55%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '14.8%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 111,
        image: '/Preview-Plate29.png',
        plateStyling: {
            top: '66.5%', left: '51%', width: '12.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '66.5%', left: '51%', width: '9.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        plateStyling2: {
            top: '11%', left: '50%', width: '40%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '11.2%', left: '51%', width: '24%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate29m.png',
            plateStyling: { top: '66%', left: '51.3%', width: '22.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            rakClassicPlateStyling: { top: '67.5%', left: '51%', width: '14.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            plateStyling2: { top: '8.2%', left: '55%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '14.8%', left: '51%', width: '31%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 112,
        image: '/Preview-Plate30.png',
        plateStyling: {
            top: '66.5%', left: '51%', width: '12.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '66.5%', left: '51%', width: '9.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        plateStyling2: {
            top: '11%', left: '50%', width: '40%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '11.2%', left: '51%', width: '24%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate30m.png',
            plateStyling: { top: '65%', left: '51.3%', width: '22.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            rakClassicPlateStyling: { top: '65.5%', left: '51.8%', width: '14%', transform: 'translate(-50%, -50%) perspective(600px)' },
            plateStyling2: { top: '8.2%', left: '55%', width: '50%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '14.8%', left: '51%', width: '31%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 113,
        image: '/Preview-Plate31.png',
        plateStyling: {
            top: '66.5%', left: '51%', width: '12.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '66.5%', left: '51%', width: '9.5%', transform: 'translate(-50%, -50%) perspective(600px)',
            filter: undefined,
        },
        plateStyling2: {
            top: '11%', left: '50%', width: '40%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '11.2%', left: '51%', width: '24%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate31m.png',
            plateStyling: { top: '62%', left: '50.3%', width: '21.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            rakClassicPlateStyling: { top: '62.5%', left: '50.5%', width: '12.5%', transform: 'translate(-50%, -50%) perspective(600px)' },
            plateStyling2: { top: '8.2%', left: '55%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '14.8%', left: '50%', width: '31%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
    {
        id: 114,
        image: '/Preview-Plate-RAK9.png',
        plateStyling: {
            top: '65.6%', left: '31.4%', width: '14.5%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(3deg)',
            filter: undefined,
        },
        rakClassicPlateStyling: {
            top: '66.8%', left: '29.4%', width: '9.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(2.4deg)',
            filter: undefined,
        },
        plateStyling2: {
            top: '10%', left: '50%', width: '35%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        rakClassicPlateStyling2: {
            top: '10%', left: '50%', width: '20%', transform: 'translate(-50%, -50%)',
            filter: undefined,
        },
        priceStyling: {
            top: '92%', left: '60%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.0
        },
        mobileStyling: {
            top: '92%', left: '15%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.85
        },
        mobileConfig: {
            image: '/Preview-Plate-RAK9m.png',
            plateStyling: { top: '57.8%', left: '26.8%', width: '17.5%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(2.9deg)' },
            rakClassicPlateStyling: { top: '62.8%', left: '25.54%', width: '10.6%', transform: 'translate(-50%, -50%) perspective(600px) rotateY(-25deg) rotateX(-5deg) rotateZ(3.1deg)' },
            plateStyling2: { top: '10%', left: '53%', width: '48%', transform: 'translate(-50%, -50%)' },
            rakClassicPlateStyling2: { top: '11%', left: '55%', width: '35%', transform: 'translate(-50%, -50%)' },
            priceStyling: { top: '92%', left: '55%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 2.7 },
            mobileStyling: { top: '92%', left: '5%', transform: 'translate(0%, -50%)', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textScale: 3.1 }
        }
    },
];

function ClassicPreviewModal({ dataUrl, coverImage, coverImage2, onClose, emirateDisplay, emirateKey, code, number, price, mobile }: any) {
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Drag-to-scroll for thumbnails
    const thumbRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [scrollStartX, setScrollStartX] = useState(0);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!thumbRef.current) return;
        setIsDragging(true);
        setDragStartX(e.pageX);
        setScrollStartX(thumbRef.current.scrollLeft);
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !thumbRef.current) return;
        e.preventDefault();
        const dx = e.pageX - dragStartX;
        thumbRef.current.scrollLeft = scrollStartX - dx;
    };
    const onMouseUp = () => setIsDragging(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Use the dedicated classic car previews for all classic plates
    const previewList = CLASSIC_CAR_PREVIEWS;

    const rawCar = previewList[currentIndex];
    const activeCar = isMobile && rawCar?.mobileConfig ? { ...rawCar, ...rawCar.mobileConfig } : rawCar;

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            if (currentIndex === -1 && coverImage) {
                const a = document.createElement('a');
                a.href = coverImage;
                a.download = `Plate-${code}-${number}-Graphic.png`;
                a.click();
                setIsDownloading(false);
                return;
            }

            if (!activeCar) return;

            // Determine the correct plate styling for classic plates
            const primaryPlate = emirateKey === 'rak' && activeCar.rakClassicPlateStyling
                ? activeCar.rakClassicPlateStyling
                : activeCar.plateStyling;
            const secondaryPlate = emirateKey === 'rak' && activeCar.rakClassicPlateStyling2
                ? activeCar.rakClassicPlateStyling2
                : activeCar.plateStyling2;

            await downloadPreviewAsCanvas({
                backgroundImage: activeCar.image,
                plateDataUrl: dataUrl,
                plateStyling: primaryPlate as any,
                plateStyling2: secondaryPlate as any,
                price,
                phone: mobile || '',
                filename: `Plate-${code}-${number}-ClassicPreview.jpg`,
                priceStyling: activeCar.priceStyling as any,
                mobileStyling: activeCar.mobileStyling as any,
            });
        } catch (e) {
            console.error('Download failed', e);
            toast.error('Failed to download image. Try again.');
        }
        setIsDownloading(false);
    };

    return (
        <div className="relative w-full max-w-5xl z-[70]" onClick={e => e.stopPropagation()}>
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
            >
                <XIcon className="h-5 w-5" />
            </button>

            <div id="classic-preview-node" className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#0a0a0a]" style={{ containerType: 'inline-size' }}>
                {currentIndex === -1 ? (
                    <img src={coverImage} alt="Plate Graphic" className="max-h-[45vh] md:max-h-[50vh] w-auto mx-auto object-contain bg-black p-4 sm:p-8" />
                ) : activeCar ? (
                    <>
                        <img id="preview-classic-image" src={activeCar.image} alt="Car Preview" className="w-full h-auto" />

                        {/* Plate overlay */}
                        <img
                            src={dataUrl}
                            alt={`${emirateDisplay} ${code} ${number} on car`}
                            className="absolute drop-shadow-2xl"
                            style={{
                                ...(emirateKey === 'rak' && activeCar.rakClassicPlateStyling ? activeCar.rakClassicPlateStyling : activeCar.plateStyling),
                                filter: (emirateKey === 'rak' && activeCar.rakClassicPlateStyling ? activeCar.rakClassicPlateStyling.filter : activeCar.plateStyling.filter) || 'brightness(0.92) contrast(1.05)',
                                imageRendering: 'auto',
                            } as React.CSSProperties}
                        />

                        {activeCar.plateStyling2 && (
                            <img
                                src={dataUrl}
                                alt={`${emirateDisplay} ${code} ${number} on car (secondary)`}
                                className="absolute drop-shadow-2xl"
                                style={{
                                    ...(emirateKey === 'rak' && activeCar.rakClassicPlateStyling2 ? activeCar.rakClassicPlateStyling2 : activeCar.plateStyling2),
                                    filter: (emirateKey === 'rak' && activeCar.rakClassicPlateStyling2 ? activeCar.rakClassicPlateStyling2.filter : activeCar.plateStyling2.filter) || 'brightness(0.92) contrast(1.05)',
                                    imageRendering: 'auto',
                                } as React.CSSProperties}
                            />
                        )}

                        {/* Overlaying the price or Contact Seller */}
                        {activeCar?.priceStyling && (
                            <div
                                id="preview-price"
                                className="absolute tracking-tight font-black leading-none whitespace-nowrap"
                                style={{
                                    ...activeCar.priceStyling,
                                    fontFamily: '"Montserrat", serif',
                                    fontWeight: 700,
                                    background: 'linear-gradient(to bottom, #F6D972 0%, #C39A31 40%, #F9EEA2 50%, #8C6C16 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    color: 'transparent',
                                    textShadow: 'none',
                                    filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))',
                                    fontSize: `${(price ? 2.4 : 1.6) * ((activeCar.priceStyling as any)?.textScale || 1)}cqi`,
                                }}
                            >
                                {price ? `AED ${price.toLocaleString()}` : 'Contact Seller'}
                            </div>
                        )}

                        {/* Overlaying the mobile number if present */}
                        {mobile && activeCar?.mobileStyling && (
                            <div
                                id="preview-mobile"
                                className="absolute tracking-tight font-bold leading-none whitespace-nowrap"
                                style={{
                                    ...activeCar.mobileStyling,
                                    fontFamily: '"Montserrat", serif',
                                    fontWeight: 700,
                                    background: 'linear-gradient(to bottom, #F6D972 0%, #C39A31 40%, #F9EEA2 50%, #8C6C16 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    color: 'transparent',
                                    textShadow: 'none',
                                    filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))',
                                    fontSize: `${1.6 * ((activeCar.mobileStyling as any)?.textScale || 1)}cqi`,
                                }}
                            >
                                {formatPhoneWithSpaces(mobile)}
                            </div>
                        )}
                    </>
                ) : null}
            </div>

            {/* Thumbnails to switch cars */}
            <div
                ref={thumbRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onDragStart={e => e.preventDefault()}
                className={`mt-6 flex gap-3 overflow-x-auto pb-4 px-4 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} 
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
                        onClick={() => setCurrentIndex(-1)}
                        className={`relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-[3px] transition-all shadow-md bg-black/80
                        ${currentIndex === -1 ? 'border-primary scale-110 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                    >
                        <img src={coverImage} alt="Flat Graphic Preview" className="w-full h-full object-contain pointer-events-none p-1" draggable={false} />
                        <div className={`absolute inset-0 bg-black/20 ${currentIndex === -1 ? 'hidden' : ''}`} />
                    </button>
                )}
                {previewList.map((car, idx) => {
                    const thumbImage = isMobile && car.mobileConfig ? car.mobileConfig.image : car.image;
                    return (
                        <button
                            key={car.id}
                            onClick={() => setCurrentIndex(idx)}
                            className={`relative flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-[3px] transition-all shadow-md bg-black/80
                            ${currentIndex === idx ? 'border-primary scale-110 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                        >
                            <img
                                src={thumbImage}
                                alt={`Car option ${idx + 1}`}
                                className="w-full h-full object-cover pointer-events-none"
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                            />
                            <div className={`absolute inset-0 bg-black/20 ${currentIndex === idx ? 'hidden' : ''}`} />
                        </button>
                    )
                })}
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex justify-between items-center text-center px-6">
                <p className="text-white text-base font-bold">
                    {emirateDisplay} <span className="opacity-60 font-medium">·</span> {code} {number}
                </p>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="bg-white text-black hover:bg-gray-100 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                >
                    {isDownloading ? (
                        <span className="flex items-center gap-2">Generating...</span>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Image
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
