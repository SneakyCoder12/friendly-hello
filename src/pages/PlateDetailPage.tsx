import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Phone, MessageCircle, Shield, ArrowLeft, Share2, Car, X as XIcon } from 'lucide-react';
import { usePlateImage } from '@/hooks/usePlateGenerator';
import { supabase } from '@/integrations/supabase/client';

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
                setError('Listing not found');
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

    // Parse plate_number → code + number (e.g. "A 12345" → code="A", number="12345")
    const parts = listing?.plate_number?.split(' ') || [];
    const code = parts.length > 1 ? parts[0] : '';
    const number = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || '';
    const emirateKey = listing ? (EMIRATE_KEY_MAP[listing.emirate] || listing.emirate.toLowerCase().replace(/\s+/g, '_')) : '';
    const emirateDisplay = listing?.emirate || '';

    const dataUrl = usePlateImage(emirateKey, code, number);

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
            <div className="min-h-screen bg-white pt-24 pb-16">
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
            <div className="min-h-screen bg-white pt-24 pb-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-xl font-bold text-gray-900 mb-4">Listing not found</p>
                    <Link to="/marketplace" className="text-primary font-bold hover:underline">
                        ← Back to Marketplace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-24 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back Button */}
                <Link
                    to="/marketplace"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Marketplace
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                    {/* Left: Plate Image (3 cols) */}
                    <div className="lg:col-span-3">
                        <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center border border-gray-100">
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

                        {/* View on Car Button */}
                        {dataUrl && (
                            <button
                                onClick={() => setShowCarPreview(true)}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                            >
                                <Car className="h-5 w-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
                                View on Car
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
                                                width: '14%',
                                                top: '76%',
                                                left: '58%',
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
                        <div className="mt-6 grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Emirate</p>
                                <p className="text-lg font-bold text-gray-900">{emirateDisplay}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Code</p>
                                <p className="text-lg font-bold text-gray-900">{code || '—'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Number</p>
                                <p className="text-lg font-bold text-gray-900">{number}</p>
                            </div>
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <div className="mt-6 bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Description</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{listing.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Info Panel (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Price */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Price</p>
                            <p className="text-4xl font-black text-gray-900 font-mono tracking-tight">
                                {listing.price ? `AED ${listing.price.toLocaleString()}` : 'Contact Seller'}
                            </p>

                            <button
                                onClick={handleShare}
                                className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <Share2 className="h-4 w-4" /> Share this plate
                            </button>
                        </div>

                        {/* Seller Info */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-4">Seller Information</p>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                                    {sellerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{sellerName}</p>
                                    <p className="text-xs text-gray-400">
                                        {memberYear && `Member since ${memberYear} · `}UAE
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {telUrl && (
                                    <a
                                        href={telUrl}
                                        className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-sm"
                                    >
                                        <Phone className="h-4 w-4" /> Call Seller
                                    </a>
                                )}
                                {whatsappUrl && (
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm"
                                    >
                                        <MessageCircle className="h-4 w-4" /> WhatsApp
                                    </a>
                                )}
                                {!telUrl && !whatsappUrl && (
                                    <p className="text-sm text-gray-500 text-center py-2">No contact info available</p>
                                )}
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <Shield className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-500 leading-relaxed">
                                <span className="font-bold text-gray-700">NOTICE:</span> We facilitate connections but are not liable for private transactions between buyers and sellers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
