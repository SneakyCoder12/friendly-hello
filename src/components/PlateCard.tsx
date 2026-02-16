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

        {/* BACK SIDE — contact options */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full bg-card rounded-2xl border border-border flex flex-col items-center justify-center gap-4 p-6">
            <p className="font-mono font-bold text-foreground text-lg tracking-wider">{displayPlate}</p>
            <p className="text-sm text-muted-foreground font-bold">{price || 'Contact for price'}</p>

            {telUrl ? (
              <a
                href={telUrl}
                onClick={e => e.stopPropagation()}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                <Phone className="h-4 w-4" /> Call Seller
              </a>
            ) : null}

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            ) : null}

            {!telUrl && !whatsappUrl && (
              <p className="text-sm text-muted-foreground text-center">Contact for details</p>
            )}

            <Link
              to={plateUrl}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mt-1"
            >
              <ExternalLink className="h-3 w-3" /> View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PlateCard);
