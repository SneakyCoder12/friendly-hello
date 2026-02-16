import { memo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, ExternalLink, Heart } from 'lucide-react';

interface MobileNumberCardProps {
    id: string;
    phoneNumber: string;
    carrier: string;
    price: number | null;
    description: string | null;
    contactPhone: string | null;
    isFavorite: boolean;
    onToggleFavorite: (e: React.MouseEvent, id: string) => void;
}

function MobileNumberCard({
    id, phoneNumber, carrier, price, description, contactPhone,
    isFavorite, onToggleFavorite,
}: MobileNumberCardProps) {
    const [flipped, setFlipped] = useState(false);
    const navigate = useNavigate();

    const detailUrl = `/mobile-number/${id}`;
    const phoneDigits = contactPhone?.replace(/\D/g, '') || '';
    const whatsappUrl = phoneDigits
        ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hi, I'm interested in the number ${phoneNumber}.`)}`
        : null;
    const telUrl = phoneDigits ? `tel:+${phoneDigits}` : null;

    const handleCardClick = () => {
        if (!flipped) {
            setFlipped(true);
        } else {
            navigate(detailUrl);
        }
    };

    return (
        <div
            className="perspective-1000 h-[280px] cursor-pointer"
            onMouseEnter={() => setFlipped(true)}
            onMouseLeave={() => setFlipped(false)}
            onClick={handleCardClick}
        >
            <div
                className={`relative w-full h-full transition-transform duration-500 ease-out transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}
            >
                {/* ── FRONT SIDE ── */}
                <div className="absolute inset-0 backface-hidden">
                    <div className="block h-full bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 group p-6 flex flex-col">
                        {/* Top row: carrier badge + fav */}
                        <div className="flex justify-between items-center mb-5">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider border ${carrier === 'etisalat'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}>
                                <img
                                    src={carrier === 'etisalat' ? '/Eand_Logo.svg' : '/du-logo.png'}
                                    alt={carrier}
                                    className="h-4 w-4 object-contain"
                                />
                                {carrier === 'etisalat' ? 'e&' : 'du'}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(e, id); }}
                                className="h-8 w-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all"
                            >
                                <Heart className={`h-3.5 w-3.5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                            </button>
                        </div>

                        {/* Number */}
                        <p className="text-2xl font-black tracking-widest text-gray-900 mb-2 font-mono group-hover:text-gray-700 transition-colors">
                            {phoneNumber}
                        </p>

                        {/* Description */}
                        {description && (
                            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{description}</p>
                        )}

                        <div className="mt-auto">
                            <div className="h-px w-full bg-gray-100 mb-4" />
                            {/* Price + view hint */}
                            <div className="flex justify-between items-center">
                                <p className="text-gray-900 font-mono font-bold text-xl">
                                    {price ? `AED ${price.toLocaleString()}` : 'Call for Price'}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-600 transition-colors">View →</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── BACK SIDE ── contact options */}
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="h-full bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center px-5 py-4">
                        {/* Header */}
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-1">Contact Seller</p>
                        <p className="text-sm font-display font-bold text-gray-900 mb-0.5">VIP Number</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 ${carrier === 'etisalat' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                            <img src={carrier === 'etisalat' ? '/Eand_Logo.svg' : '/du-logo.png'} alt={carrier} className="h-3 w-3 object-contain" />
                            {carrier === 'etisalat' ? 'e&' : 'du'}
                        </span>

                        {/* Large phone number */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-2.5 mb-4">
                            <p className="font-mono font-black text-gray-900 text-xl tracking-wider text-center">
                                {phoneNumber}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="w-full space-y-2 mb-3">
                            {telUrl && (
                                <a
                                    href={telUrl}
                                    onClick={e => e.stopPropagation()}
                                    className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-2.5 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md"
                                >
                                    <Phone className="h-4 w-4" /> Call Now
                                </a>
                            )}

                            {whatsappUrl && (
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#25D366] to-[#20BD5A] hover:from-[#1da851] hover:to-[#189E49] text-white py-2.5 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md"
                                >
                                    <MessageCircle className="h-4 w-4" /> WhatsApp
                                </a>
                            )}

                            {/* View Details — always visible */}
                            <Link
                                to={detailUrl}
                                onClick={e => e.stopPropagation()}
                                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-full font-bold text-sm transition-all"
                            >
                                <ExternalLink className="h-4 w-4" /> View Details
                            </Link>
                        </div>

                        {/* Phone number at bottom */}
                        {phoneDigits && (
                            <p className="text-[10px] text-gray-400 font-mono tracking-wide">+{phoneDigits}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(MobileNumberCard);
