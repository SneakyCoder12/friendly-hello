import { ArrowRight } from 'lucide-react';
import PlateCard from './PlateCard';
import type { EmirateSection as SectionData } from '@/data/listings';

interface SupabaseListing {
  id: string;
  plate_number: string;
  emirate: string;
  plate_style: string | null;
  price: number | null;
  contact_phone?: string | null;
  status: string;
}

interface Props {
  section: SectionData;
  listings: SupabaseListing[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="h-[280px] bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-[80%] h-[100px] bg-muted rounded-lg animate-pulse" />
        <div className="mt-6 w-full px-4 border-t border-border/50 pt-4">
          <div className="h-3 bg-muted rounded w-16 animate-pulse mb-2" />
          <div className="h-6 bg-muted rounded w-28 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function EmirateSection({ section, listings, loading }: Props) {
  const hasListings = listings.length > 0;

  return (
    <section>
      <div className="flex items-end justify-between mb-6 sm:mb-12 border-b border-border pb-4 sm:pb-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <img
            alt={`${section.name} Logo`}
            className={`${section.emirateKey === 'ajman' ? 'h-7 sm:h-9' : 'h-10 sm:h-16'} w-auto object-contain flex-shrink-0`}
            src={section.logo}
          />
          <div>
            <h2 className="text-xl sm:text-4xl font-display font-bold text-foreground tracking-tight">{section.name}</h2>
          </div>
        </div>
        <a className="group flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors whitespace-nowrap" href={`/marketplace?emirate=${encodeURIComponent(section.name)}`}>
          VIEW ALL
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transform group-hover:translate-x-1 transition-transform" />
        </a>
      </div>

      {/* Mobile: horizontal scroll | Desktop: grid */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:overflow-visible sm:pb-0">
        {loading ? (
          <>{[1, 2, 3, 4].map(i => <div key={i} className="min-w-[220px] sm:min-w-0 snap-start"><SkeletonCard /></div>)}</>
        ) : hasListings ? (
          listings.slice(0, 4).map((listing) => {
            const parts = listing.plate_number.split(' ');
            const code = parts.length > 1 ? parts[0] : '';
            const number = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
            return (
              <div key={listing.id} className="min-w-[220px] sm:min-w-0 snap-start">
                <PlateCard
                  emirate={section.emirateKey}
                  code={code}
                  number={number}
                  price={listing.price ? `AED ${listing.price.toLocaleString()}` : undefined}
                  plateUrl={`/plate/${listing.id}`}
                  sellerPhone={listing.contact_phone}
                  plateNumber={listing.plate_number}
                  listingId={listing.id}
                  status={listing.status}
                  plateStyle={listing.plate_style === 'bike' ? 'bike' : 'private'}
                />
              </div>
            );
          })
        ) : (
          <div className="min-w-[220px] sm:min-w-0 snap-start">
            <PlateCard
              emirate={section.emirateKey}
              code="X"
              number="XXX"
              plateUrl="#"
              comingSoon
            />
          </div>
        )}
      </div>
    </section>
  );
}
