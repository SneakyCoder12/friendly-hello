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
    sellerWhatsapp?: string | null;
    status?: string;
    isFavorite: boolean;
    onToggleFavorite: (e: React.MouseEvent, id: string) => void;
}

/** Detect touch device to disable flip */
function useIsTouch() {
    const [isTouch, setIsTouch] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        }
        return false;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
        setIsTouch(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => {
            setIsTouch(event.matches);
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else {
            mediaQuery.addListener(handler);
            return () => mediaQuery.removeListener(handler);
        }
    }, []);

    return isTouch;
}

function MobileNumberCard({
    id, phoneNumber, carrier, price, description, contactPhone, sellerWhatsapp, status,
    isFavorite, onToggleFavorite,
}: MobileNumberCardProps) {
    const isTouch = useIsTouch();
    const isSold = status === 'sold';
    const [flipped, setFlipped] = useState(false);
    const navigate = useNavigate();

    const detailUrl = `/mobile-number/${id}`;
    const phoneDigits = contactPhone?.replace(/\D/g, '') || '';
    const telUrl = phoneDigits ? `tel:+${phoneDigits}` : null;

    const waRaw = sellerWhatsapp || contactPhone || '';
    const waDigits = waRaw.replace(/\D/g, '');
    const whatsappUrl = waDigits
        ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hi, I'm interested in the number ${phoneNumber}.`)}`
        : null;

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
                src={carrier === 'etisalat' ? '/Eand_Logo.svg' : '/du-logo.webp'}
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
                className={`block min-h-[260px] bg-card rounded-2xl border border-border hover:shadow-lg transition-all duration-300 p-4 flex flex-col relative overflow-hidden ${isSold ? 'opacity-80' : ''}`}
            >
                {isSold && (
                    <div className="sold-ribbon">
                        <span>SOLD</span>
                    </div>
                )}
                {/* Top: carrier + fav */}
                <div className="flex justify-between items-center mb-3">
                    <CarrierBadge />
                    <button
                        onClick={(e) => { e.preventDefault(); onToggleFavorite(e, id); }}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-red-50 transition-all"
                    >
                        <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                    </button>
                </div>
                {/* Number */}
                <p className="text-xl font-black tracking-widest text-foreground mb-1 font-mono">
                    {phoneNumber}
                </p>
                {description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{description}</p>
                )}
                <div className="mt-auto">
                    <div className="h-px w-full bg-border mb-3" />
                    <div className="flex flex-col gap-2">
                        <p className="text-foreground font-mono font-bold text-lg flex items-center gap-1">
                            {isSold ? (
                                <span className="text-red-500 font-extrabold tracking-widest uppercase text-sm">SOLD</span>
                            ) : price ? (
                                <>
                                    <AedLogo />
                                    <span>{price.toLocaleString()}</span>
                                </>
                            ) : <span className="text-sm text-muted-foreground">Contact for price</span>}
                        </p>
                        <div className="flex justify-end w-full">
                            <span className="shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-white bg-primary px-3 py-1.5 rounded-full shadow-sm">
                                VIEW DETAILS →
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    // ── DESKTOP: flip card ──
    return (
        <div
            className="perspective-1000 h-[240px] cursor-pointer"
            onMouseEnter={() => setFlipped(true)}
            onMouseLeave={() => setFlipped(false)}
            onClick={handleCardClick}
        >
            <div
                className={`relative w-full h-full transition-transform duration-500 ease-out transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}
            >
                {/* ── FRONT SIDE ── */}
                <div className="absolute inset-0 backface-hidden">
                    <div className={`block h-full bg-card rounded-2xl border border-border hover:shadow-lg transition-all duration-300 group p-6 flex flex-col relative overflow-hidden ${isSold ? 'opacity-80' : ''}`}>
                        {isSold && (
                            <div className="sold-ribbon">
                                <span>SOLD</span>
                            </div>
                        )}
                        {/* Top row: carrier badge + fav */}
                        <div className="flex justify-between items-center mb-5">
                            <CarrierBadge />
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(e, id); }}
                                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all"
                            >
                                <Heart className={`h-3.5 w-3.5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                            </button>
                        </div>

                        {/* Number */}
                        <p className="text-2xl font-black tracking-widest text-foreground mb-2 font-mono group-hover:text-foreground/70 transition-colors">
                            {phoneNumber}
                        </p>

                        {description && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{description}</p>
                        )}

                        <div className="mt-auto">
                            <div className="h-px w-full bg-border mb-4" />
                            <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-2">
                                <p className="text-foreground font-mono font-bold text-xl flex items-center gap-1 shrink-0">
                                    {isSold ? (
                                        <span className="text-red-500 font-extrabold tracking-widest uppercase text-lg">SOLD</span>
                                    ) : price ? (
                                        <>
                                            <AedLogo />
                                            <span>{price.toLocaleString()}</span>
                                        </>
                                    ) : <span className="text-muted-foreground text-sm">Contact for price</span>}
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
                                    <p className={`text-[10px] text-muted-foreground font-bold uppercase tracking-wider group-hover:text-primary transition-colors ${(telUrl || whatsappUrl) ? 'hidden group-hover:hidden sm:group-hover:block' : ''}`}>View →</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── BACK SIDE — same fixed size as front ── */}
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className={`h-full bg-card flex flex-col items-center justify-center px-4 py-3 relative rounded-2xl border border-border ${isSold ? 'opacity-80' : ''}`}>
                        {isSold && (
                            <div className="sold-ribbon">
                                <span>SOLD</span>
                            </div>
                        )}
                        {/* Heart button — top right */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(e, id); }}
                            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white border border-border shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-10"
                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <Heart className={`h-3.5 w-3.5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300 hover:text-red-400'}`} />
                        </button>

                        <p className="text-xs font-display font-bold text-foreground mb-0.5">VIP Number</p>
                        <CarrierBadge small />

                        {/* Phone number */}
                        <div className="bg-surface border border-border rounded-xl px-4 py-1.5 mb-2 mt-2">
                            <p className="font-mono font-black text-foreground text-lg tracking-wider text-center">
                                {phoneNumber}
                            </p>
                        </div>

                        {/* Action buttons — horizontal */}
                        <div className="w-full flex gap-2 mb-2">
                            {telUrl && (
                                <a
                                    href={telUrl}
                                    onClick={e => e.stopPropagation()}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-2 rounded-full font-bold text-xs transition-all shadow-sm hover:shadow-md"
                                >
                                    <Phone className="h-3.5 w-3.5" /> Call
                                </a>
                            )}
                            {whatsappUrl && (
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#25D366] to-[#20BD5A] hover:from-[#1da851] hover:to-[#189E49] text-white py-2 rounded-full font-bold text-xs transition-all shadow-sm hover:shadow-md"
                                >
                                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                </a>
                            )}
                        </div>

                        {/* View Details */}
                        <Link
                            to={detailUrl}
                            onClick={e => e.stopPropagation()}
                            className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                        >
                            VIEW DETAILS →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(MobileNumberCard);
