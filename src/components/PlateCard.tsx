import { memo, useState, useEffect } from 'react';

import { Link } from 'react-router-dom';
import { usePlateImage } from '@/hooks/usePlateGenerator';
import { Phone, MessageCircle, Heart, Car, Bike } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** Convert internal emirate keys to display names */
const EMIRATE_DISPLAY_NAMES: Record<string, string> = {
  abudhabi: 'Abu Dhabi',
  dubai: 'Dubai',
  sharjah: 'Sharjah',
  ajman: 'Ajman',
  umm_al_quwain: 'Umm Al Quwain',
  rak: 'Ras Al Khaimah',
  fujairah: 'Fujairah',
};

function formatEmirateName(key: string): string {
  if (EMIRATE_DISPLAY_NAMES[key]) return EMIRATE_DISPLAY_NAMES[key];
  // Fallback: replace underscores with spaces, capitalize each word
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

interface PlateCardProps {
  emirate: string;
  code: string;
  number: string;
  price?: string;
  plateUrl: string;
  comingSoon?: boolean;
  sellerPhone?: string | null;
  plateNumber?: string;
  listingId?: string;
  status?: string;
  plateStyle?: 'private' | 'bike' | 'classic';
  /** Explicit vehicle type for icon display; derived from plateStyle if omitted */
  vehicleType?: 'car' | 'bike' | 'classic';
  /** CDN URL for pre-generated plate image — skips canvas generation when set */
  plateImageUrl?: string | null;
  /** Explicit whatsapp number from seller profile */
  sellerWhatsapp?: string | null;
}

/** Detect if device has touch capability — used to fully disable flip cards */
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

/** AED logo SVG inline — the new Dhs logo with D and two arrows */
export function AedLogo({ className = 'aed-logo' }: { className?: string }) {
  return (
    <img
      className={className}
      style={{ height: '0.75em', width: 'auto', display: 'inline-block', verticalAlign: 'middle' }}
      alt="AED"
      src="data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDEwMDAgODcwIiB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI4NzAiPgoJPHRpdGxlPkxheWVyIGNvcHk8L3RpdGxlPgoJPHN0eWxlPgoJCS5zMCB7IGZpbGw6IGN1cnJlbnRDb2xvciB9IAoJPC9zdHlsZT4KCTxwYXRoIGlkPSJMYXllciBjb3B5IiBjbGFzcz0iczAiIGQ9Im04OC4zIDFjMC40IDAuNiAyLjYgMy4zIDQuNyA1LjkgMTUuMyAxOC4yIDI2LjggNDcuOCAzMyA4NS4xIDQuMSAyNC41IDQuMyAzMi4yIDQuMyAxMjUuNnY4N2gtNDEuOGMtMzguMiAwLTQyLjYtMC4yLTUwLjEtMS43LTExLjgtMi41LTI0LTkuMi0zMi4yLTE3LjgtNi41LTYuOS02LjMtNy4zLTUuOSAxMy42IDAuNSAxNy4zIDAuNyAxOS4yIDMuMiAyOC42IDQgMTQuOSA5LjUgMjYgMTcuOCAzNS45IDExLjMgMTMuNiAyMi44IDIxLjIgMzkuMiAyNi4zIDMuNSAxIDEwLjkgMS40IDM3LjEgMS42bDMyLjcgMC41djQzLjMgNDMuNGwtNDYuMS0wLjMtNDYuMy0wLjMtOC0zLjJjLTkuNS0zLjgtMTMuOC02LjYtMjMuMS0xNC45bC02LjgtNi4xIDAuNCAxOS4xYzAuNSAxNy43IDAuNiAxOS43IDMuMSAyOC43IDguNyAzMS44IDI5LjcgNTQuNSA1Ny40IDYxLjkgNi45IDEuOSA5LjYgMiAzOC41IDIuNGwzMC45IDAuNHY4OS42YzAgNTQuMS0wLjMgOTQtMC44IDEwMC44LTAuNSA2LjItMi4xIDE3LjgtMy41IDI1LjktNi41IDM3LjMtMTguMiA2NS40LTM1IDgzLjZsLTMuNCAzLjdoMTY5LjFjMTAxLjEgMCAxNzYuNy0wLjQgMTg3LjgtMC45IDE5LjUtMSA2My01LjMgNzIuOC03LjQgMy4xLTAuNiA4LjktMS41IDEyLjctMi4xIDguMS0xLjIgMjEuNS00IDQwLjgtOC45IDI3LjItNi44IDUyLTE1LjMgNzYuMy0yNi4xIDcuNi0zLjQgMjkuNC0xNC41IDM1LjItMTggMy4xLTEuOCA2LjgtNCA4LjItNC43IDMuOS0yLjEgMTAuNC02LjMgMTkuOS0xMy4xIDQuNy0zLjQgOS40LTYuNyAxMC40LTcuNCA0LjItMi44IDE4LjctMTQuOSAyNS4zLTIxIDI1LjEtMjMuMSA0Ni4xLTQ4LjggNjIuNC03Ni4zIDIuMy00IDUuMy05IDYuNi0xMS4xIDMuMy01LjYgMTYuOS0zMy42IDE4LjItMzcuOCAwLjYtMS45IDEuNC0zLjkgMS44LTQuMyAyLjYtMy40IDE3LjYtNTAuNiAxOS40LTYwLjkgMC42LTMuMyAwLjktMy44IDMuNC00LjMgMS42LTAuMyAyNC45LTAuMyA1MS44LTAuMSA1My44IDAuNCA1My44IDAuNCA2NS43IDUuOSA2LjcgMy4xIDguNyA0LjUgMTYuMSAxMS4yIDkuNyA4LjcgOC44IDEwLjEgOC4yLTExLjctMC40LTEyLjgtMC45LTIwLjctMS44LTIzLjktMy40LTEyLjMtNC4yLTE0LjktNy4yLTIxLjEtOS44LTIxLjQtMjYuMi0zNi43LTQ3LjItNDRsLTguMi0zLTMzLjQtMC40LTMzLjMtMC41IDAuNC0xMS43YzAuNC0xNS40IDAuNC00NS45LTAuMS02MS42bC0wLjQtMTIuNiA0NC42LTAuMmMzOC4yLTAuMiA0NS4zIDAgNDkuNSAxLjEgMTIuNiAzLjUgMjEuMSA4LjMgMzEuNSAxNy44bDUuOCA1LjR2LTE0LjhjMC0xNy42LTAuOS0yNS40LTQuNS0zNy03LjEtMjMuNS0yMS4xLTQxLTQxLjEtNTEuOC0xMy03LTEzLjgtNy4yLTU4LjUtNy41LTI2LjItMC4yLTM5LjktMC42LTQwLjYtMS4yLTAuNi0wLjYtMS4xLTEuNi0xLjEtMi40IDAtMC44LTEuNS03LjEtMy41LTEzLjktMjMuNC04Mi43LTY3LjEtMTQ4LjQtMTMxLTE5Ny4xLTguNy02LjctMzAtMjAuOC0zOC42LTI1LjYtMy4zLTEuOS02LjktMy45LTcuOC00LjUtNC4yLTIuMy0yOC4zLTE0LjEtMzQuMy0xNi42LTMuNi0xLjYtOC4zLTMuNi0xMC40LTQuNC0zNS4zLTE1LjMtOTQuNS0yOS44LTEzOS43LTM0LjMtNy40LTAuNy0xNy4yLTEuOC0yMS43LTIuMi0yMC40LTIuMy00OC43LTIuNi0yMDkuNC0yLjYtMTM1LjggMC0xNjkuOSAwLjMtMTY5LjQgMXptMzMwLjcgNDMuM2MzMy44IDIgNTQuNiA0LjYgNzguOSAxMC41IDc0LjIgMTcuNiAxMjYuNCA1NC44IDE2NC4zIDExNyAzLjUgNS44IDE4LjMgMzYgMjAuNSA0Mi4xIDEwLjUgMjguMyAxNS42IDQ1LjEgMjAuMSA2Ny4zIDEuMSA1LjQgMi42IDEyLjYgMy4zIDE2IDAuNyAzLjMgMSA2LjQgMC43IDYuNy0wLjUgMC40LTEwMC45IDAuNi0yMjMuMyAwLjVsLTIyMi41LTAuMi0wLjMtMTI4LjVjLTAuMS03MC42IDAtMTI5LjMgMC4zLTEzMC40bDAuNC0xLjloNzEuMWMzOSAwIDc4IDAuNCA4Ni41IDAuOXptMjk3LjUgMzUwLjNjMC43IDQuMyAwLjcgNzcuMyAwIDgwLjlsLTAuNiAyLjctMjI3LjUtMC4yLTIyNy40LTAuMy0wLjItNDIuNGMtMC4yLTIzLjMgMC00Mi43IDAuMi00My4xIDAuMy0wLjUgOTcuMi0wLjggMjI3LjctMC44aDIyNy4yem0tMTAuMiAxNzEuN2MwLjUgMS41LTEuOSAxMy44LTYuOCAzMy44LTUuNiAyMi41LTEzLjIgNDUuMi0yMC45IDYyLTMuOCA4LjYtMTMuMyAyNy4yLTE1LjYgMzAuNy0xLjEgMS42LTQuMyA2LjctNy4xIDExLjItMTggMjguMi00My43IDUzLjktNzMgNzIuOS0xMC43IDYuOC0zMi43IDE4LjQtMzguNiAyMC4yLTEuMiAwLjMtMi41IDAuOS0zIDEuMy0wLjcgMC42LTkuOCA0LTIwLjQgNy44LTE5LjUgNi45LTU2LjYgMTQuNC04Ni40IDE3LjUtMTkuMyAxLjktMjIuNCAyLTk2LjcgMmgtNzYuOXYtMTI5LjctMTI5LjhsMjIwLjktMC40YzEyMS41LTAuMiAyMjEuNi0wLjUgMjIyLjQtMC43IDAuOS0wLjEgMS44IDAuNSAyLjEgMS4yeiIvPgo8L3N2Zz4="
    />
  );
}

function PlateCard({ emirate, code, number, price, plateUrl, comingSoon, sellerPhone, sellerWhatsapp, plateNumber, listingId, status, plateStyle = 'private', vehicleType, plateImageUrl }: PlateCardProps) {
  const { t } = useLanguage();
  const isTouch = useIsTouch();
  const displayType: 'car' | 'bike' | 'classic' = vehicleType ?? (plateStyle === 'bike' ? 'bike' : plateStyle === 'classic' ? 'classic' : 'car');
  const isSold = status === 'sold';
  // Use CDN image if available, fallback to canvas generation for pre-migration listings
  const canvasFallback = usePlateImage(plateImageUrl ? '' : emirate, plateImageUrl ? '' : code, plateImageUrl ? '' : number, plateStyle);
  const plateImg = plateImageUrl || canvasFallback;
  const [flipped, setFlipped] = useState(false);
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  const displayPlate = plateNumber || `${code} ${number}`.trim();
  const phoneDigits = sellerPhone?.replace(/\D/g, '') || '';
  const telUrl = phoneDigits ? `tel:+${phoneDigits}` : null;

  const waRaw = sellerWhatsapp || sellerPhone || '';
  const waDigits = waRaw.replace(/\D/g, '');
  const whatsappUrl = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hi, I'm interested in plate ${displayPlate}`)}`
    : null;

  // Check if this listing is already favorited
  useEffect(() => {
    if (!user || !listingId) return;
    (async () => {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_type', 'plate')
        .eq('listing_id', listingId)
        .maybeSingle();
      if (data) setIsFavorite(true);
    })();
  }, [user, listingId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please log in to save favorites'); return; }
    if (!listingId) return;

    if (isFavorite) {
      await supabase.from('favorites').delete()
        .eq('user_id', user.id)
        .eq('listing_type', 'plate')
        .eq('listing_id', listingId);
      setIsFavorite(false);
      toast.success('Removed from favorites');
    } else {
      await supabase.from('favorites').insert({
        user_id: user.id,
        listing_type: 'plate',
        listing_id: listingId,
      });
      setIsFavorite(true);
      toast.success('Added to favorites');
    }
  };

  if (comingSoon) {
    return (
      <div className="h-[240px] sm:h-[260px] bg-card/50 rounded-2xl border border-border/50 flex flex-col items-center justify-center opacity-60">
        <div className="w-[90%] mx-auto h-[120px] flex items-center justify-center">
          {plateImg ? (
            <img src={plateImg} alt="Coming Soon" className="w-full h-full object-contain object-center opacity-40" />
          ) : (
            <div className="animate-pulse bg-muted rounded w-full h-full" />
          )}
        </div>
        <p className="text-sm font-bold text-muted-foreground mt-4 uppercase tracking-wider">Coming Soon</p>
      </div>
    );
  }

  // ── TOUCH DEVICES: simple card, no flip ──
  const MobileCard = (
    <div className="block md:hidden pb-1">
      <Link
        to={plateUrl}
        className={`flex flex-col h-[180px] sm:h-[200px] bg-card rounded-xl border border-border active:scale-[0.98] transition-all duration-200 overflow-hidden relative ${isSold ? 'opacity-80' : ''}`}
      >
        {isSold && (
          <div className="sold-ribbon"><span>SOLD</span></div>
        )}
        <div className="relative p-2 pb-0 pt-6 flex-1 flex flex-col items-center justify-center">
          {/* Vehicle type badge */}
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border bg-card/100 shadow-sm border-border/80 text-muted-foreground">
            {displayType === 'bike' ? (
              <><Bike className="h-2.5 w-2.5" /> Bike</>
            ) : displayType === 'classic' ? (
              <><span className="text-[8px] font-serif italic">C</span> Classic</>
            ) : (
              <><Car className="h-2.5 w-2.5" /> Car</>
            )}
          </div>
          {/* Favorite button */}
          {listingId && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(e);
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="absolute top-1.5 right-1.5 z-10 h-6 w-6 rounded-full bg-white border border-border/60 shadow-sm flex items-center justify-center transition-all active:scale-90"
            >
              <Heart className={`h-3 w-3 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
            </button>
          )}
          {/* Plate image */}
          <div className="w-[95%] mx-auto flex items-center justify-center h-[70px] sm:h-[80px] mb-2">
            {plateImg ? (
              <img
                src={plateImg}
                alt={`${emirate} ${code} ${number}`}
                className="w-full h-full object-contain object-center drop-shadow-md"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />
            ) : (
              <div className="animate-pulse bg-muted rounded w-full h-full" />
            )}
          </div>
        </div>

        {/* Price + View button */}
        <div className="p-2 w-full border-t border-border/50 bg-background/50">
          <div className="flex flex-col gap-1 items-center justify-center">
            <p className="text-[11px] font-bold text-foreground font-mono tracking-tight flex items-center gap-1">
              {isSold ? (
                <span className="text-red-500 font-extrabold tracking-widest uppercase">SOLD</span>
              ) : price ? (
                <>
                  <AedLogo />
                  <span className="text-foreground">{price.replace(/^AED\s*/, '')}</span>
                </>
              ) : (
                <span className="text-muted-foreground text-[10px]">{t('contactForPrice') || 'Contact'}</span>
              )}
            </p>
            <div className="w-full mt-0.5">
              <span className="block w-full whitespace-nowrap text-[9px] font-bold uppercase tracking-wider text-white bg-primary py-1.5 rounded-md shadow-sm text-center">
                {t('viewDetailsBtn') || 'View Details →'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );

  // ── DESKTOP: flip card ──
  const handleFrontClick = () => {
    setFlipped(true);
  };

  const DesktopCard = (
    <div
      className="hidden md:block perspective-1000 h-[240px] cursor-pointer"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ease-out transform-style-3d will-change-transform ${flipped ? 'rotate-y-180' : ''}`}
      >
        {/* FRONT SIDE — plate card; disable pointer events when flipped so back face can be clicked */}
        <div className={`absolute inset-0 backface-hidden ${flipped ? 'pointer-events-none' : ''}`}>
          <div
            className={`block h-full bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group overflow-hidden cursor-pointer ${isSold ? 'opacity-80' : ''}`}
            onClick={handleFrontClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleFrontClick()}
          >
            {/* SOLD Ribbon */}
            {isSold && (
              <div className="sold-ribbon">
                <span>SOLD</span>
              </div>
            )}
            <div className="flex flex-col items-center justify-center h-full relative">
              {/* Vehicle type badge — top-left */}
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-card/90 backdrop-blur-sm shadow-sm border-border/60 text-muted-foreground">
                {displayType === 'bike' ? (
                  <><Bike className="h-3 w-3" /> Bike</>
                ) : displayType === 'classic' ? (
                  <><span className="text-[9px] font-serif italic">C</span> Classic</>
                ) : (
                  <><Car className="h-3 w-3" /> Car</>
                )}
              </div>

              {/* Plate image */}
              <div className="w-[90%] mx-auto h-[100px] flex items-center justify-center">
                {plateImg ? (
                  <img
                    src={plateImg}
                    alt={`${emirate} ${code} ${number}`}
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                    style={{ imageRendering: '-webkit-optimize-contrast' } as React.CSSProperties}
                  />
                ) : (
                  <div className="animate-pulse bg-muted rounded w-full h-full" />
                )}
              </div>
              {/* Price section */}
              <div className="mt-2 p-2.5 w-full border-t border-border/50">
                <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-1.5 min-h-[24px]">
                  <p className="text-[11px] font-bold text-foreground font-mono tracking-tight flex items-center gap-1 shrink-0">
                    {isSold ? (
                      <span className="text-red-500 font-extrabold tracking-widest uppercase">SOLD</span>
                    ) : price ? (
                      <>
                        <AedLogo />
                        <span>{price.replace(/^AED\s*/, '')}</span>
                      </>
                    ) : <span className="text-muted-foreground text-xs">{t('contactForPrice')}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider group-hover:text-primary transition-colors shrink-0">
                    {t('hoverToViewBtn')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE — disable pointer events when not flipped */}
        <div
          className={`absolute inset-0 backface-hidden rotate-y-180 ${flipped ? '' : 'pointer-events-none'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className={`h-full bg-card rounded-2xl border border-border flex flex-col items-center justify-center px-4 py-3 relative ${isSold ? 'opacity-80' : ''}`}>
            {isSold && (
              <div className="sold-ribbon"><span>SOLD</span></div>
            )}
            {/* Heart button — top right */}
            {listingId && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(e);
                }}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white border border-border shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-10"
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`h-3.5 w-3.5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300 hover:text-red-400'}`} />
              </button>
            )}
            <p className="text-sm font-display font-black text-foreground mb-0.5">AL NUAMI</p>
            <p className="text-[10px] text-muted-foreground font-medium mb-2">{formatEmirateName(emirate)}</p>

            {/* Plate number */}
            <div className="bg-surface border border-border rounded-xl px-4 py-1.5 mb-3">
              <p className="font-mono font-black text-foreground text-xl tracking-wider text-center">
                {code && <span>{code}</span>}
                {code && number && <span className="mx-1"> </span>}
                <span>{number}</span>
              </p>
            </div>

            {/* Action buttons — horizontal */}
            <div className="w-full flex gap-2 mb-5">
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
              to={plateUrl}
              className="text-xs font-bold text-foreground/70 hover:text-primary transition-colors uppercase tracking-wider"
            >
              VIEW DETAILS →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {MobileCard}
      {DesktopCard}
    </>
  );
}

export default memo(PlateCard);
