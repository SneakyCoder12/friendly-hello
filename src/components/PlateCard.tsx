import { memo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlateImage } from '@/hooks/usePlateGenerator';
import { Phone, MessageCircle, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

function PlateCard({ emirate, code, number, price, plateUrl, comingSoon, sellerPhone, plateNumber, listingId, status }: PlateCardProps) {
  const isSold = status === 'sold';
  const dataUrl = usePlateImage(emirate, code, number);
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  const displayPlate = plateNumber || `${code} ${number}`.trim();
  const phoneDigits = sellerPhone?.replace(/\D/g, '') || '';
  const whatsappUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hi, I'm interested in plate ${displayPlate}`)}`
    : null;
  const telUrl = phoneDigits ? `tel:+${phoneDigits}` : null;

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
      <div className="h-[260px] bg-card/50 rounded-2xl border border-border/50 flex flex-col items-center justify-center opacity-60">
        <div className="w-[90%] mx-auto h-[120px] flex items-center justify-center">
          {dataUrl ? (
            <img src={dataUrl} alt="Coming Soon" className="w-full h-full object-contain object-center opacity-40" />
          ) : (
            <div className="animate-pulse bg-muted rounded w-full h-full" />
          )}
        </div>
        <p className="text-sm font-bold text-muted-foreground mt-4 uppercase tracking-wider">Coming Soon</p>
      </div>
    );
  }

  const handleCardClick = () => {
    // On mobile, first tap flips; second tap navigates
    if (!flipped) {
      setFlipped(true);
    } else {
      navigate(plateUrl);
    }
  };

  return (
    <div
      className="perspective-1000 h-[260px] cursor-pointer"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={handleCardClick}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ease-out transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}
      >
        {/* FRONT SIDE — plate card */}
        <div className="absolute inset-0 backface-hidden">
          <Link to={plateUrl} className={`block h-full bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group overflow-hidden ${isSold ? 'opacity-80' : ''}`} onClick={e => flipped && e.preventDefault()}>
            {/* SOLD Ribbon */}
            {isSold && (
              <div className="sold-ribbon">
                <span>SOLD</span>
              </div>
            )}
            <div className="flex flex-col items-center justify-center h-full relative">
              {/* Mobile-only heart button (visible on front since mobile can't hover-flip) */}
              {listingId && (
                <button
                  onClick={toggleFavorite}
                  className="sm:hidden absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/90 border border-border/60 shadow-sm flex items-center justify-center transition-all active:scale-90"
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              )}

              <div className="w-[90%] mx-auto h-[120px] flex items-center justify-center">
                {dataUrl ? (
                  <img
                    src={dataUrl}
                    alt={`${emirate} ${code} ${number}`}
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                    style={{ imageRendering: '-webkit-optimize-contrast' } as React.CSSProperties}
                  />
                ) : (
                  <div className="animate-pulse bg-muted rounded w-full h-full" />
                )}
              </div>
              <div className="mt-4 p-4 w-full border-t border-border/50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Price</p>
                    <p className="text-xl font-bold text-foreground font-mono tracking-tight">{price || 'Contact'}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider group-hover:text-primary transition-colors">View →</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* BACK SIDE — contact options */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className={`h-full bg-card rounded-2xl border border-border flex flex-col items-center justify-center px-5 py-4 overflow-hidden relative ${isSold ? 'opacity-80' : ''}`}>
            {/* SOLD Ribbon */}
            {isSold && (
              <div className="sold-ribbon">
                <span>SOLD</span>
              </div>
            )}
            {/* Header with heart */}
            <div className="w-full flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Contact Seller</p>
              {listingId && (
                <button
                  onClick={toggleFavorite}
                  className="h-8 w-8 rounded-full bg-surface border border-border/60 flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400'}`} />
                </button>
              )}
            </div>
            <p className="text-sm font-display font-bold text-foreground mb-0.5">Premium Plate</p>
            <p className="text-[10px] text-muted-foreground font-medium mb-3">{emirate}</p>

            {/* Large plate number */}
            <div className="bg-surface border border-border rounded-xl px-5 py-2.5 mb-4">
              <p className="font-mono font-black text-foreground text-2xl tracking-wider text-center">
                {code && <span>{code}</span>}
                {code && number && <span className="mx-1.5"> </span>}
                <span>{number}</span>
              </p>
            </div>

            {/* Action buttons — only show if phone number exists */}
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

            {/* View Details — small text link instead of button */}
            <Link
              to={plateUrl}
              onClick={e => e.stopPropagation()}
              className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
            >
              View Details →
            </Link>

            {/* Phone number at bottom */}
            {phoneDigits && (
              <p className="text-[10px] text-muted-foreground font-mono tracking-wide mt-2">{phoneDigits}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PlateCard);
