import { memo, useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlateImage } from '@/hooks/usePlateGenerator';
import type { PlateListing } from '@/data/listings';

interface PlateCardProps {
  listing: PlateListing;
}

function PlateCard({ listing }: PlateCardProps) {
  const dataUrl = usePlateImage(listing.emirate, listing.code, listing.number);
  const [isHovered, setIsHovered] = useState(false);

  const phoneNumber = '+971 50 123 4567';
  const plateUrl = `/plate/${listing.emirate}-${listing.code}-${listing.number}`;

  return (
    <div
      className="perspective-1000 cursor-pointer h-[340px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isHovered ? 'rotate-y-180' : ''}`}>
        {/* Front Face */}
        <Link to={plateUrl} className="absolute inset-0 backface-hidden bg-transparent rounded-2xl overflow-visible block">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-[90%] mx-auto h-[120px] flex items-center justify-center">
              {dataUrl ? (
                <img
                  src={dataUrl}
                  alt={`${listing.emirate} ${listing.code} ${listing.number}`}
                  className="w-full h-full object-contain object-center"
                  style={{ imageRendering: '-webkit-optimize-contrast' } as React.CSSProperties}
                />
              ) : (
                <div className="animate-pulse bg-muted rounded w-full h-full" />
              )}
            </div>
            <div className="mt-4 p-4 w-full border-t border-border/50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Price</p>
                  <p className="text-2xl font-bold text-foreground font-mono tracking-tight">{listing.price}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Click to View →</p>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Back Face */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card/95 rounded-2xl overflow-hidden border border-border shadow-card flex flex-col items-center justify-center p-8 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-4">Contact Seller</p>
          <div className="mb-6">
            <p className="text-gray-900 font-bold text-lg mb-2">Premium Plate</p>
            <p className="text-sm text-gray-500 font-mono">{listing.emirate}</p>
            <p className="text-2xl font-black text-gray-900 mt-2 font-mono tracking-wider">
              {listing.code} {listing.number}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            <a
              href={`tel:${phoneNumber}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
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
          <Link
            to={plateUrl}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gray-400 mt-4 hover:text-gray-700 transition-colors underline"
          >
            View Full Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default memo(PlateCard);
