import { ArrowRight } from 'lucide-react';
import PlateCard from './PlateCard';
import type { EmirateSection as SectionData } from '@/data/listings';

interface SupabaseListing {
  id: string;
  plate_number: string;
  emirate: string;
  plate_style: string | null;
  price: number | null;
  profiles?: { phone_number: string | null } | null;
}

interface Props {
  section: SectionData;
  listings: SupabaseListing[];
}

export default function EmirateSection({ section, listings }: Props) {
  const hasListings = listings.length > 0;

  return (
    <section>
      <div className="flex items-end justify-between mb-12 border-b border-border pb-6">
        <div className="flex items-center gap-5">
          <img
            alt={`${section.name} Logo`}
            className={`${section.emirateKey === 'ajman' ? 'h-9' : 'h-16'} w-auto object-contain flex-shrink-0`}
            src={section.logo}
          />
          <div>
            <h2 className="text-4xl font-display font-bold text-foreground tracking-tight">{section.name}</h2>
          </div>
        </div>
        <a className="group flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors" href={`/marketplace?emirate=${encodeURIComponent(section.name)}`}>
          VIEW ALL
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {hasListings ? (
          listings.slice(0, 4).map((listing) => {
            const parts = listing.plate_number.split(' ');
            const code = parts.length > 1 ? parts[0] : '';
            const number = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
            return (
              <PlateCard
                key={listing.id}
                emirate={section.emirateKey}
                code={code}
                number={number}
                price={listing.price ? `AED ${listing.price.toLocaleString()}` : undefined}
                plateUrl={`/plate/${listing.id}`}
                sellerPhone={listing.profiles?.phone_number}
                plateNumber={listing.plate_number}
              />
            );
          })
        ) : (
          <PlateCard
            emirate={section.emirateKey}
            code="X"
            number="XXX"
            plateUrl="#"
            comingSoon
          />
        )}
      </div>
    </section>
  );
}
