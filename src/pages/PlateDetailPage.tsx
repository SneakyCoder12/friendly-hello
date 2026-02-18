import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Phone, MessageCircle, Shield, ArrowLeft, Share2, Car, X as XIcon } from 'lucide-react';
import ListWithUsBanner from '@/components/ListWithUsBanner';
import { usePlateImage } from '@/hooks/usePlateGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

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
    price: number | null;
    description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    created_at: string;
    user_id: string;
}

interface SellerProfile {
    full_name: string | null;
    phone_number: string | null;
    email: string | null;
    created_at: string | null;
}

export default function PlateDetailPage() {
    const { plateId } = useParams<{ plateId: string }>();
    const [listing, setListing] = useState<ListingDetail | null>(null);
    const [seller, setSeller] = useState<SellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCarPreview, setShowCarPreview] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        if (!plateId) return;
        (async () => {
            setLoading(true);
            // Fetch listing by UUID
            const { data, error: fetchError } = await supabase
                .from('listings')
                .select('*')
                .eq('id', plateId)
                .single();

            if (fetchError || !data) {
                setError(t('listingNotFound'));
                setLoading(false);
                return;
            }

            const listingData = data as unknown as ListingDetail;
            setListing(listingData);

            // Fetch seller profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, phone_number, email, created_at')
                .eq('id', listingData.user_id)
                .single();

            if (profileData) {
                setSeller(profileData as SellerProfile);
            }
            setLoading(false);
        })();
    }, [plateId]);

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

    const dataUrl = usePlateImage(emirateKey, code, number, plateStyle);

    // Contact info — prefer listing contact_phone, fall back to seller phone_number
    const phone = listing?.contact_phone || seller?.phone_number || '';
    const phoneDigits = phone.replace(/\D/g, '');
    const telUrl = phoneDigits ? `tel:+${phoneDigits}` : null;
    const whatsappUrl = phoneDigits
        ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hi, I'm interested in the ${emirateDisplay} ${code} ${number} plate.`)}`
        : null;

    const sellerName = seller?.full_name || seller?.email || 'Seller';
    const memberYear = seller?.created_at ? new Date(seller.created_at).getFullYear().toString() : '';

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

    if (loading) {
        return (
            <div className="min-h-screen bg-background pt-24 pb-16">
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
            <div className="min-h-screen bg-background pt-24 pb-16">
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
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

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
                        <div className="bg-surface rounded-2xl p-8 flex items-center justify-center border border-border">
                            {dataUrl ? (
                                <img
                                    src={dataUrl}
                                    alt={`${emirateDisplay} ${code} ${number}`}
                                    className="w-full max-w-[600px] h-auto object-contain"
                                    style={{ imageRendering: '-webkit-optimize-contrast' } as React.CSSProperties}
                                />
                            ) : (
                                <div className="animate-pulse bg-gray-200 rounded w-full h-[200px]" />
                            )}
                        </div>

                        {/* View on Car Button — only for car (private) plates */}
                        {dataUrl && !isClassic && !isBike && (
                            <button
                                onClick={() => setShowCarPreview(true)}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border bg-card text-foreground font-bold text-sm hover:bg-surface hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                            >
                                <Car className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                {t('viewOnCar')}
                            </button>
                        )}

                        {/* Car Preview Modal */}
                        {showCarPreview && dataUrl && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowCarPreview(false)}>
                                {/* Backdrop */}
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                                {/* Modal Content */}
                                <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setShowCarPreview(false)}
                                        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                                    >
                                        <XIcon className="h-5 w-5" />
                                    </button>

                                    {/* Car with Plate */}
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                        <img
                                            src="/Preview-Plate.png"
                                            alt="Car Preview"
                                            className="w-full h-auto"
                                        />
                                        {/* Plate overlay — positioned on the front bumper white area */}
                                        <img
                                            src={dataUrl}
                                            alt={`${emirateDisplay} ${code} ${number} on car`}
                                            className="absolute drop-shadow-lg"
                                            style={{
                                                width: '17%',
                                                top: '71%',
                                                left: '73%',
                                                transform: 'translate(-50%, -50%) perspective(600px) rotateX(4deg) rotateY(-3deg) rotateZ(-1deg)',
                                                filter: 'brightness(0.92) contrast(1.05)',
                                                imageRendering: '-webkit-optimize-contrast',
                                            } as React.CSSProperties}
                                        />
                                    </div>

                                    {/* Label */}
                                    <div className="mt-4 text-center">
                                        <p className="text-white/80 text-sm font-medium">
                                            {emirateDisplay} · {code} {number}
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{isClassic ? 'PLATE TYPE' : t('number')}</p>
                                <p className="text-lg font-bold text-foreground">{isClassic ? 'Classic' : number}</p>
                            </div>
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
                    <div className="lg:col-span-2 space-y-6">

                        {/* Price */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{t('price')}</p>
                            <p className="text-4xl font-black text-foreground font-mono tracking-tight">
                                {listing.price ? `AED ${listing.price.toLocaleString()}` : t('contactSeller')}
                            </p>

                            <button
                                onClick={handleShare}
                                className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Share2 className="h-4 w-4" /> {t('shareThisPlate')}
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
                                        {memberYear && `${t('memberSince')} ${memberYear} · `}UAE
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {telUrl && (
                                    <a
                                        href={telUrl}
                                        className="flex items-center justify-center gap-2 w-full bg-foreground text-background py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                                    >
                                        <Phone className="h-4 w-4" /> {t('callNow')}
                                    </a>
                                )}
                                {whatsappUrl && (
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm"
                                    >
                                        <MessageCircle className="h-4 w-4" /> {t('whatsapp')}
                                    </a>
                                )}
                                {!telUrl && !whatsappUrl && (
                                    <p className="text-sm text-muted-foreground text-center py-2">{t('noContactInfo')}</p>
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
        </div>
    );
}
