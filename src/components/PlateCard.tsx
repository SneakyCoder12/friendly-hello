import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlateImage } from '@/hooks/usePlateGenerator';
import { Phone, MessageCircle, ExternalLink } from 'lucide-react';

interface PlateCardProps {
  emirate: string;
  code: string;
  number: string;
  price?: string;
  plateUrl: string;
  comingSoon?: boolean;
  sellerPhone?: string | null;
  plateNumber?: string;
}

function PlateCard({ emirate, code, number, price, plateUrl, comingSoon, sellerPhone, plateNumber }: PlateCardProps) {
  const dataUrl = usePlateImage(emirate, code, number);
  const [flipped, setFlipped] = useState(false);

  const displayPlate = plateNumber || `${code} ${number}`.trim();
  const phoneDigits = sellerPhone?.replace(/\D/g, '') || '';
  const whatsappUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hi, I'm interested in plate ${displayPlate}`)}`
    : null;
  const telUrl = phoneDigits ? `tel:+${phoneDigits}` : null;

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

  return (
    <div
      className="perspective-1000 h-[260px] cursor-pointer"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped(f => !f)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ease-out transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}
      >
        {/* FRONT SIDE — original plate card (UNTOUCHED rendering) */}
        <div className="absolute inset-0 backface-hidden">
          <Link to={plateUrl} className="block h-full bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group" onClick={e => flipped && e.preventDefault()}>
            <div className="flex flex-col items-center justify-center h-full">
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

        {/* BACK SIDE — contact options (matches reference design) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full bg-card rounded-2xl border border-border flex flex-col items-center justify-center px-5 py-4">
            {/* Header */}
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-1">Contact Seller</p>
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

            {/* Action buttons */}
            <div className="w-full space-y-2 mb-3">
              {telUrl ? (
                <a
                  href={telUrl}
                  onClick={e => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-2.5 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md"
                >
                  <Phone className="h-4 w-4" /> Call Now
                </a>
              ) : null}

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#25D366] to-[#20BD5A] hover:from-[#1da851] hover:to-[#189E49] text-white py-2.5 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              ) : null}

              {!telUrl && !whatsappUrl && (
                <Link
                  to={plateUrl}
                  onClick={e => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-full font-bold text-sm transition-all"
                >
                  <ExternalLink className="h-4 w-4" /> View Details
                </Link>
              )}
            </div>

            {/* Phone number at bottom */}
            {phoneDigits && (
              <p className="text-[10px] text-muted-foreground font-mono tracking-wide">+{phoneDigits}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PlateCard);
