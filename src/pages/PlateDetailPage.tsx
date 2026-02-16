import { useParams, Link } from 'react-router-dom';
import { Phone, MessageCircle, Shield, ArrowLeft, Share2 } from 'lucide-react';
import { usePlateImage } from '@/hooks/usePlateGenerator';
import { LISTINGS } from '@/data/listings';

export default function PlateDetailPage() {
    const { plateId } = useParams<{ plateId: string }>();

    // Parse plateId format: "dubai-A-333"
    const parts = plateId?.split('-') || [];
    const emirate = parts[0] || '';
    const code = parts[1] || '';
    const number = parts.slice(2).join('-') || '';

    // Find matching listing
    const listing = LISTINGS.find(
        (l) => l.emirate === emirate && l.code === code && l.number === number
    );

    const dataUrl = usePlateImage(emirate, code, number);

    // Mock seller info
    const seller = {
        name: 'Al Nuami Groups',
        phone: '+971 50 123 4567',
        whatsapp: '971501234567',
        location: 'UAE',
        memberSince: '2024',
    };

    const emirateDisplay = emirate.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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

                        {/* Plate Details */}
                        <div className="mt-6 grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Emirate</p>
                                <p className="text-lg font-bold text-gray-900">{emirateDisplay}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Code</p>
                                <p className="text-lg font-bold text-gray-900">{code}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Number</p>
                                <p className="text-lg font-bold text-gray-900">{number}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info Panel (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Price */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Price</p>
                            <p className="text-4xl font-black text-gray-900 font-mono tracking-tight">
                                {listing?.price || 'Contact Seller'}
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
                                    {seller.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{seller.name}</p>
                                    <p className="text-xs text-gray-400">Member since {seller.memberSince} · {seller.location}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href={`tel:${seller.phone}`}
                                    className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-sm"
                                >
                                    <Phone className="h-4 w-4" /> Call Seller
                                </a>
                                <a
                                    href={`https://wa.me/${seller.whatsapp}?text=Hi, I'm interested in the ${emirateDisplay} ${code} ${number} plate.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm"
                                >
                                    <MessageCircle className="h-4 w-4" /> WhatsApp
                                </a>
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
