import EmirateSection from './EmirateSection';
import { LISTINGS, SECTIONS } from '@/data/listings';

export default function PlateListings() {
  // Group listings by section (4 per section)
  const grouped: typeof LISTINGS[] = [];
  for (let i = 0; i < LISTINGS.length; i += 4) {
    grouped.push(LISTINGS.slice(i, i + 4));
  }

  return (
    <div className="space-y-32">
      {grouped.map((group, idx) => {
        const section = SECTIONS[idx];
        if (!section) return null;
        return <EmirateSection key={section.emirateKey} section={section} listings={group} />;
      })}
    </div>
  );
}
