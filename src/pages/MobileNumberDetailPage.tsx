import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ListWithUsBanner from '@/components/ListWithUsBanner';
import { Phone, MessageCircle, Shield, ArrowLeft, Share2, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

interface MobileNumberDetail {
    id: string;
    phone_number: string;
    carrier: string;
    price: number | null;
    description: string | null;
    contact_phone: string | null;
    created_at: string;
    user_id: string;
}

interface SellerProfile {
    full_name: string | null;
    phone_number: string | null;
    whatsapp_number: string | null;
    email: string | null;
    created_at: string | null;
}

export default function MobileNumberDetailPage() {
    const { numberId } = useParams<{ numberId: string }>();
    const { user } = useAuth();
    const [listing, setListing] = useState<MobileNumberDetail | null>(null);
    const [seller, setSeller] = useState<SellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    useEffect(() => {
        if (!numberId) return;
        (async () => {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('mobile_numbers')
                .select('*')
                .eq('id', numberId)
                .single();

            if (fetchError || !data) {
                setError('Number not found');
                setLoading(false);
                return;
            }

            const detail = data as unknown as MobileNumberDetail;
            setListing(detail);

            // Fetch seller
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, phone_number, whatsapp_number, email, created_at')
                .eq('id', detail.user_id)
                .single();

            if (profileData) setSeller(profileData as SellerProfile);
            setLoading(false);
        })();
    }, [numberId]);

    // Check if favorited
    useEffect(() => {
        if (!user || !numberId) return;
        (async () => {
            const { data } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('listing_type', 'mobile_number')
                .eq('listing_id', numberId)
                .maybeSingle();
            setIsFavorited(!!data);
        })();
    }, [user, numberId]);

    const toggleFavorite = async () => {
        if (!user) { toast.error('Please log in to save favorites'); return; }
        if (!numberId) return;
        setFavLoading(true);
        if (isFavorited) {
            await supabase.from('favorites').delete()
                .eq('user_id', user.id)
                .eq('listing_type', 'mobile_number')
                .eq('listing_id', numberId);
            setIsFavorited(false);
            toast.success('Removed from favorites');
        } else {
            await supabase.from('favorites').insert({
                user_id: user.id,
                listing_type: 'mobile_number',
                listing_id: numberId,
            });
            setIsFavorited(true);
            toast.success('Added to favorites');
        }
        setFavLoading(false);
    };

    const phone = listing?.contact_phone || seller?.phone_number || '';
    const phoneDigits = phone.replace(/\D/g, '');
    const telUrl = phoneDigits ? `tel:+${phoneDigits}` : null;

    // Use specific WhatsApp number from profile if available, fallback to the call phone otherwise
    const waRaw = seller?.whatsapp_number || phone;
    const waDigits = waRaw.replace(/\D/g, '');
    const whatsappUrl = waDigits
        ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hi, I'm interested in the number ${listing?.phone_number || ''}.`)}`
        : null;

    const sellerName = seller?.full_name || seller?.email || 'Seller';
    const memberYear = seller?.created_at ? new Date(seller.created_at).getFullYear().toString() : '';
    const carrierDisplay = listing?.carrier === 'etisalat' ? 'Etisalat (e&)' : 'Du';
    const carrierLogo = listing?.carrier === 'etisalat' ? '/Eand_Logo.svg' : '/du-logo.webp';

    const isSold = (listing as any)?.status === 'sold';

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: `${listing?.phone_number} — VIP Number`, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-28 sm:pt-32 pb-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-6 bg-gray-200 rounded w-40" />
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                            <div className="lg:col-span-3"><div className="bg-gray-100 rounded-2xl h-[300px]" /></div>
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
            <div className="min-h-screen pt-28 sm:pt-32 pb-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-xl font-bold text-gray-900 mb-4">Number not found</p>
                    <Link to="/mobile-numbers" className="text-primary font-bold hover:underline">
                        ← Back to Mobile Numbers
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 sm:pt-32 pb-16">
            <SEO
                title={`${listing.phone_number} - VIP ${carrierDisplay} Number`}
                description={`Buy VIP ${carrierDisplay} mobile number ${listing.phone_number} in the UAE${listing.price ? ` for AED ${listing.price.toLocaleString()}` : ''}. Contact seller directly.`}
                url={`/mobile-number/${numberId}`}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    name: `VIP Mobile Number ${listing.phone_number}`,
                    description: listing.description || `Premium ${carrierDisplay} VIP mobile number for sale in the UAE.`,
                    url: `https://alnuamigroup.ae/mobile-number/${numberId}`,
                    brand: { '@type': 'Brand', name: carrierDisplay },
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
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Back Button */}
                <Link
                    to="/mobile-numbers"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Mobile Numbers
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                    {/* Left: Number Display (3 cols) */}
                    <div className="lg:col-span-3">

                        {/* Main Number Card */}
                        <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-10 flex flex-col items-center justify-center border border-gray-200 relative overflow-hidden ${isSold ? 'opacity-80' : ''}`}>
                            {isSold && (
                                <div className="sold-ribbon">
                                    <span>SOLD</span>
                                </div>
                            )}
                            {/* Carrier Logo */}
                            <div className="absolute top-5 left-5 flex items-center gap-2">
                                <img src={carrierLogo} alt={carrierDisplay} className="h-6 w-6 object-contain" />
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{carrierDisplay}</span>
                            </div>

                            {/* Favorite Button */}
                            <button
                                onClick={toggleFavorite}
                                disabled={favLoading}
                                className="absolute top-5 right-5 h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-all shadow-sm disabled:opacity-50"
                            >
                                <Heart className={`h-5 w-5 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
                            </button>

                            {/* Phone Number */}
                            <p className="text-5xl md:text-6xl font-black tracking-[0.15em] text-gray-900 font-mono mt-6">
                                {listing.phone_number}
                            </p>

                            {/* Carrier Badge */}
                            <div className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${listing.carrier === 'etisalat'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}>
                                <img src={carrierLogo} alt="" className="h-4 w-4 object-contain" />
                                {carrierDisplay} • VIP Number
                            </div>
                        </div>

                        {/* Number Details */}
                        <div className="mt-6 grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold mb-1">Carrier</p>
                                <p className="text-lg font-bold text-gray-900">{carrierDisplay}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold mb-1">Listed</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {new Date(listing.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold mb-1">Type</p>
                                <p className="text-lg font-bold text-gray-900">VIP</p>
                            </div>
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <div className="mt-6 bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold mb-2">Description</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{listing.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Info Panel (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Price */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold mb-2">Price</p>
                            <p className="text-4xl font-black text-gray-900 font-mono tracking-tight">
                                {isSold ? (
                                    <span className="text-red-500 font-extrabold tracking-widest uppercase">SOLD</span>
                                ) : listing.price ? (
                                    `AED ${listing.price.toLocaleString()}`
                                ) : 'Contact Seller'}
                            </p>

                            <button
                                onClick={handleShare}
                                className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <Share2 className="h-4 w-4" /> Share this number
                            </button>
                        </div>

                        {/* Seller Info */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold mb-4">Seller Information</p>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                                    {sellerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{sellerName}</p>
                                    <p className="text-xs text-gray-300">
                                        {memberYear && `Member since ${memberYear} · `}UAE
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {isSold ? (
                                    <p className="text-sm text-red-500 font-bold text-center py-4 bg-red-50 rounded-xl border border-red-100 uppercase tracking-widest">
                                        This Number Is SOLD
                                    </p>
                                ) : (
                                    <>
                                        {telUrl && (
                                            <a href={telUrl}
                                                className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-sm">
                                                <Phone className="h-4 w-4" /> Call Seller
                                            </a>
                                        )}
                                        {whatsappUrl && (
                                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm">
                                                <MessageCircle className="h-4 w-4" /> WhatsApp
                                            </a>
                                        )}
                                        {!telUrl && !whatsappUrl && (
                                            <p className="text-sm text-gray-500 text-center py-2">No contact info available</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <Shield className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-500 leading-relaxed">
                                <span className="font-bold text-gray-700">NOTICE:</span> We facilitate connections but are not liable for private transactions between buyers and sellers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List With Us Banner */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <ListWithUsBanner />
            </div>
        </div>
    );
}
