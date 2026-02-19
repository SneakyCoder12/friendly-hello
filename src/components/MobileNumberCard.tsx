import { memo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, Heart } from 'lucide-react';
import { AedLogo } from '@/components/PlateCard';

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

/** Detect touch device to disable flip */
function useIsTouch() {
    const [isTouch, setIsTouch] = useState(false);
    useEffect(() => {
        setIsTouch(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    }, []);
    return isTouch;
}

function MobileNumberCard({
    id, phoneNumber, carrier, price, description, contactPhone,
    isFavorite, onToggleFavorite,
}: MobileNumberCardProps) {
    const isTouch = useIsTouch();
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

    const CarrierBadge = ({ small = false }: { small?: boolean }) => (
        <span className={`inline-flex items-center gap-1.5 font-black px-3 py-1.5 rounded-full uppercase tracking-wider border ${carrier === 'etisalat'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
            } ${small ? 'text-[9px]' : 'text-[10px]'}`}>
            <img
                src={carrier === 'etisalat' ? '/Eand_Logo.svg' : '/du-logo.png'}
                alt={carrier}
                className={`object-contain ${small ? 'h-3 w-3' : 'h-4 w-4'}`}
            />
            {carrier === 'etisalat' ? 'e&' : 'du'}
        </span>
    );

    // ── TOUCH DEVICES: no flip ──
    if (isTouch) {
        return (
            <Link
                to={detailUrl}
                className="block h-[240px] bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 p-4 flex flex-col"
            >
                {/* Top: carrier + fav */}
                <div className="flex justify-between items-center mb-3">
                    <CarrierBadge />
                    <button
                        onClick={(e) => { e.preventDefault(); onToggleFavorite(e, id); }}
                        className="h-8 w-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center"
                    >
                        <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    </button>
                </div>
                {/* Number */}
                <p className="text-xl font-black tracking-widest text-gray-900 mb-1 font-mono">
                    {phoneNumber}
                </p>
                {description && (
                    <p className="text-xs text-gray-400 mb-2 line-clamp-1">{description}</p>
                )}
                <div className="mt-auto">
                    <div className="h-px w-full bg-gray-100 mb-3" />
                    <div className="flex justify-between items-center">
                        <p className="text-gray-900 font-mono font-bold text-lg flex items-center gap-1">
                            {price ? (
                                <>
                                    <AedLogo />
                                    <span>{price.toLocaleString()}</span>
                                </>
                            ) : <span className="text-sm text-gray-500">Call for Price</span>}
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-primary px-2.5 py-1 rounded-full">
                            View →
                        </span>
                    </div>
                </div>
            </Link>
        );
    }

    // ── DESKTOP: flip card ──
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
                            <CarrierBadge />
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

                        {description && (
                            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{description}</p>
                        )}

                        <div className="mt-auto">
                            <div className="h-px w-full bg-gray-100 mb-4" />
                            <div className="flex justify-between items-center">
                                <p className="text-gray-900 font-mono font-bold text-xl flex items-center gap-1">
                                    {price ? (
                                        <>
                                            <AedLogo />
                                            <span>{price.toLocaleString()}</span>
                                        </>
                                    ) : 'Call for Price'}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {telUrl && (
                                        <a
                                            href={telUrl}
                                            onClick={e => e.stopPropagation()}
                                            className="hidden group-hover:flex h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 items-center justify-center text-white transition-all shadow-sm hover:shadow-md hover:scale-110 active:scale-95"
                                            title="Call Now"
                                        >
                                            <Phone className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                    {whatsappUrl && (
                                        <a
                                            href={whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="hidden group-hover:flex h-8 w-8 rounded-full bg-[#25D366] hover:bg-[#1da851] items-center justify-center text-white transition-all shadow-sm hover:shadow-md hover:scale-110 active:scale-95"
                                            title="WhatsApp"
                                        >
                                            <MessageCircle className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                    <p className={`text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-primary transition-colors ${(telUrl || whatsappUrl) ? 'hidden group-hover:hidden sm:group-hover:block' : ''}`}>View →</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── BACK SIDE — same fixed size as front ── */}
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="h-full bg-white rounded-2xl border border-gray-200 flex flex-col items-center px-5 pt-5 pb-4 relative">
                        {/* Heart button — top right */}
                        <div className="w-full flex justify-end mb-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(e, id); }}
                                className="h-9 w-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-90"
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <Heart className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`} />
                            </button>
                        </div>

                        {/* Header */}
                        <p className="text-sm font-display font-bold text-gray-900 mb-0.5">VIP Number</p>
                        <CarrierBadge small />

                        {/* Large phone number */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-2 mb-3 mt-3">
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
                        </div>

                        {/* View Details */}
                        <Link
                            to={detailUrl}
                            onClick={e => e.stopPropagation()}
                            className="text-xs font-bold text-gray-500 hover:text-primary transition-colors uppercase tracking-wider"
                        >
                            VIEW DETAILS →
                        </Link>

                        {phoneDigits && (
                            <p className="text-[10px] text-gray-400 font-mono tracking-wide mt-1">+{phoneDigits}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(MobileNumberCard);
