import { ArrowRight } from 'lucide-react';
import PlateCard from './PlateCard';
import type { PlateListing, EmirateSection as SectionData } from '@/data/listings';

interface Props {
  section: SectionData;
  listings: PlateListing[];
}

export default function EmirateSection({ section, listings }: Props) {
  return (
    <section>
      <div className="flex items-end justify-between mb-12 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-5">
          <img
            alt={`${section.name} Logo`}
            className={`${section.emirateKey === 'ajman' ? 'h-9' : 'h-16'} w-auto object-contain flex-shrink-0`}
            src={section.logo}
          />
          <div>
            <h2 className="text-4xl font-display font-bold text-text-main tracking-tight">{section.name}</h2>
            <p className="text-sm font-bold uppercase tracking-[0.2em] mt-1 text-text-main">{section.subtitle}</p>
          </div>
        </div>
        <a className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors" href="#">
          VIEW ALL
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {listings.map((listing, i) => (
          <PlateCard key={`${listing.emirate}-${listing.code}-${listing.number}`} listing={listing} />
        ))}
      </div>
    </section>
  );
}
