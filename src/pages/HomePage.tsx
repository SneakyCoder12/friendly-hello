import Hero from '@/components/Hero';
import MarketplaceCategories from '@/components/MarketplaceCategories';
import FeaturedNumbersStrip from '@/components/FeaturedNumbersStrip';
import NoticeBanner from '@/components/NoticeBanner';
import PlateListings from '@/components/PlateListings';
import BikePlatesSection from '@/components/BikePlatesSection';
import ClassicPlatesSection from '@/components/ClassicPlatesSection';
import MobileNumbers from '@/components/MobileNumbers';
import RequestBanner from '@/components/RequestBanner';
import ListWithUsBanner from '@/components/ListWithUsBanner';
import SEO, { SITE_URL } from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="w-full overflow-x-hidden">
      <SEO
        title="Premium UAE Number Plates & VIP Mobile Numbers"
        description="Buy and sell premium UAE number plates and VIP mobile numbers across all 7 Emirates. Browse Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah and Fujairah plates."
        url="/"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Al Nuami Group',
          url: SITE_URL,
          description: 'Buy and sell premium UAE number plates and VIP mobile numbers across all 7 Emirates.',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/marketplace?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <Hero />
      <div className="md:hidden mt-4 mb-2 text-center px-4 w-full">
        <p className="text-[10px] text-muted-foreground/80 max-w-sm mx-auto leading-tight">
          <span className="font-bold">{t('noticeLabel')}</span> {t('noticeText')}
        </p>
      </div>
      <div className="hidden md:block mt-8 mb-4">
        <NoticeBanner />
      </div>
      <MarketplaceCategories />
      <FeaturedNumbersStrip />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-16 space-y-6 sm:space-y-24 overflow-x-hidden" id="plates">
        <PlateListings />
        <ClassicPlatesSection />
        <BikePlatesSection />
        <MobileNumbers />
        <RequestBanner />
        <ListWithUsBanner />
      </main>
    </div>
  );
}
