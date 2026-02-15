import { memo } from 'react';
import { Gavel, ShoppingCart } from 'lucide-react';
import { usePlateImage } from '@/hooks/usePlateGenerator';
import type { PlateListing } from '@/data/listings';

interface PlateCardProps {
  listing: PlateListing;
}

function PlateCard({ listing }: PlateCardProps) {
  const dataUrl = usePlateImage(listing.emirate, listing.code, listing.number);
  const isBid = listing.priceType === 'bid';
  const priceLabel = isBid ? 'Current Bid' : 'Fixed Price';

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all duration-300 group relative">
      <div className="p-8 flex items-center justify-center bg-surface min-h-[200px] relative">
        <div className="w-[280px] transform group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
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
          <button
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
              isBid
                ? 'bg-surface text-foreground border border-border shadow-sm hover:bg-surface-accent hover:scale-105'
                : 'bg-surface-accent text-foreground border border-border hover:bg-surface'
            }`}
          >
            {isBid ? <Gavel className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(PlateCard);
