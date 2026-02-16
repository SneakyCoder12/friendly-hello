import { memo } from 'react';
import { Link } from 'react-router-dom';
import { usePlateImage } from '@/hooks/usePlateGenerator';

interface PlateCardProps {
  emirate: string;
  code: string;
  number: string;
  price?: string;
  plateUrl: string;
  comingSoon?: boolean;
}

function PlateCard({ emirate, code, number, price, plateUrl, comingSoon }: PlateCardProps) {
  const dataUrl = usePlateImage(emirate, code, number);

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
    <Link to={plateUrl} className="block h-[260px] bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
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
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Price</p>
              <p className="text-xl font-bold text-foreground font-mono tracking-tight">{price || 'Contact'}</p>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-primary transition-colors">View →</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default memo(PlateCard);
