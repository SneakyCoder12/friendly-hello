import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PlateCard from './PlateCard';
import { generatePlateSlug } from '@/utils/plateUrl';
import type { EmirateSection as SectionData } from '@/data/listings';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

interface SupabaseListing {
  id: string;
  plate_number: string;
  emirate: string;
  plate_style: string | null;
  plate_image_url: string | null;
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
    <div className="h-[240px] sm:h-[280px] bg-card rounded-2xl border border-border overflow-hidden">
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

function MobileSkeletonCard() {
  return (
    <div className="mobile-plate-card h-[220px] bg-card rounded-2xl border border-border overflow-hidden flex-shrink-0">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-[80%] h-[90px] bg-muted rounded-lg animate-pulse" />
        <div className="mt-4 w-full px-3 border-t border-border/50 pt-3">
          <div className="h-3 bg-muted rounded w-14 animate-pulse mb-2" />
          <div className="h-5 bg-muted rounded w-24 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function EmirateSection({ section, listings, loading }: Props) {
  const { t, locale } = useLanguage();
  const hasListings = listings.length > 0;

  // Since actual URLs may rely on english spelling, we should perhaps pass english name to the View All link 
  // Let's use string fallback for the URL name param if it expects English.
  const sectionEnglishName = section.emirateKey === 'abudhabi' ? 'Abu Dhabi' :
    section.emirateKey === 'dubai' ? 'Dubai' :
      section.emirateKey === 'sharjah' ? 'Sharjah' :
        section.emirateKey === 'ajman' ? 'Ajman' :
          section.emirateKey === 'umm_al_quwain' ? 'Umm Al Quwain' :
            section.emirateKey === 'rak' ? 'Ras Al Khaimah' : 'Fujairah';

  return (
    <section>
      {/* Header row: Flag + Name (left) | View All → (right) */}
      <div className="flex items-center justify-between mb-4 sm:mb-12 border-b border-border pb-3 sm:pb-6">
        <div className="flex items-center gap-2.5 sm:gap-5">
          <img
            alt={`${t(section.nameKey as TranslationKey)} Logo`}
            className={`${section.emirateKey === 'ajman' ? 'h-6 sm:h-9' : 'h-8 sm:h-16'} w-auto object-contain flex-shrink-0`}
            src={section.logo}
          />
          <h2 className="text-lg sm:text-4xl font-display font-bold text-foreground tracking-tight">{t(section.nameKey as TranslationKey)}</h2>
        </div>
        <a className="-m-2 p-2 group flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors whitespace-nowrap" href={`/marketplace?emirate=${encodeURIComponent(sectionEnglishName)}`}>
          {t('viewAll')}
          <ArrowRight className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transform transition-transform ${locale === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
        </a>
      </div>

      {/* ── Mobile: horizontal scroll carousel ── */}
      <div className="sm:hidden">
        <div className="mobile-scroll-row flex gap-3 scrollbar-hide pb-2 -mx-3 px-3">
          {loading ? (
            <>{[1, 2, 3, 4].map(i => <MobileSkeletonCard key={i} />)}</>
          ) : hasListings ? (
            listings.slice(0, 4).map((listing) => {
              const parts = listing.plate_number.split(' ');
              const code = parts.length > 1 ? parts[0] : '';
              const number = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
              return (
                <div key={listing.id} className="mobile-plate-card flex-shrink-0 snap-start">
                  <PlateCard
                    emirate={section.emirateKey}
                    code={code}
                    number={number}
                    price={listing.price ? `AED ${listing.price.toLocaleString()}` : undefined}
                    plateUrl={`/plate/${generatePlateSlug(listing)}`}
                    sellerPhone={listing.contact_phone}
                    plateNumber={listing.plate_number}
                    listingId={listing.id}
                    status={listing.status}
                    plateStyle={listing.plate_style === 'bike' ? 'bike' : 'private'}
                    plateImageUrl={listing.plate_image_url}
                  />
                </div>
              );
            })
          ) : (
            <div className="mobile-plate-card flex-shrink-0">
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
      </div>

      {/* ── Desktop/Tablet: original grid (unchanged) ── */}
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {loading ? (
          <>{[1, 2, 3, 4].map(i => <div key={i}><SkeletonCard /></div>)}</>
        ) : hasListings ? (
          listings.slice(0, 4).map((listing) => {
            const parts = listing.plate_number.split(' ');
            const code = parts.length > 1 ? parts[0] : '';
            const number = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
            return (
              <div key={listing.id}>
                <PlateCard
                  emirate={section.emirateKey}
                  code={code}
                  number={number}
                  price={listing.price ? `AED ${listing.price.toLocaleString()}` : undefined}
                  plateUrl={`/plate/${generatePlateSlug(listing)}`}
                  sellerPhone={listing.contact_phone}
                  plateNumber={listing.plate_number}
                  listingId={listing.id}
                  status={listing.status}
                  plateStyle={listing.plate_style === 'bike' ? 'bike' : 'private'}
                  plateImageUrl={listing.plate_image_url}
                />
              </div>
            );
          })
        ) : (
          <div>
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
