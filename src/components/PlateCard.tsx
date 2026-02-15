import { memo, useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { usePlateImage } from '@/hooks/usePlateGenerator';
import type { PlateListing } from '@/data/listings';

interface PlateCardProps {
  listing: PlateListing;
}

function PlateCard({ listing }: PlateCardProps) {
  const dataUrl = usePlateImage(listing.emirate, listing.code, listing.number);
  const isBid = listing.priceType === 'bid';
  const priceLabel = isBid ? 'Current Bid' : 'Fixed Price';
  const [isHovered, setIsHovered] = useState(false);

  // Mock phone number for demonstration
  const phoneNumber = '+971 50 123 4567';

  return (
    <div
      className="perspective-1000 cursor-pointer h-[340px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isHovered ? 'rotate-y-180' : ''}`}>
        {/* Front Face */}
        <div className="absolute inset-0 backface-hidden bg-card rounded-2xl overflow-hidden border border-border shadow-card">
          <div className="p-8 flex items-center justify-center bg-surface min-h-[200px] relative">
            <div className="w-[280px] flex items-center justify-center">
              {dataUrl ? (
                <img
                  src={dataUrl}
                  alt={`${listing.emirate} ${listing.code} ${listing.number}`}
                  className="w-full h-auto rounded shadow-plate"
                  style={{ imageRendering: '-webkit-optimize-contrast' } as React.CSSProperties}
                />
              ) : (
                <div className="animate-pulse bg-surface-accent rounded-lg w-[260px] h-[65px]" />
              )}
            </div>
          </div>
          <div className="p-6 border-t border-border">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">{priceLabel}</p>
                <p className="text-2xl font-bold text-foreground font-mono tracking-tight">{listing.price}</p>
              </div>
              <div className="text-[10px] text-primary font-bold uppercase tracking-wider">
                Hover for Info →
              </div>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card rounded-2xl overflow-hidden border border-border shadow-card flex flex-col items-center justify-center p-8 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-4">Contact Seller</p>
          <div className="mb-6">
            <p className="text-foreground font-bold text-lg mb-2">Premium Plate</p>
            <p className="text-sm text-muted-foreground font-mono">{listing.emirate}</p>
            <p className="text-2xl font-black text-foreground mt-2 font-mono tracking-wider">
              {listing.code} {listing.number}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            <a
              href={`tel:${phoneNumber}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold hover:bg-primary-hover transition-all"
            >
              <Phone className="h-4 w-4" /> Call Now
            </a>
            <a
              href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">{phoneNumber}</p>
        </div>
      </div>
    </div>
  );
}

export default memo(PlateCard);
