import Hero from '@/components/Hero';
import FeaturedNumbersStrip from '@/components/FeaturedNumbersStrip';
import NoticeBanner from '@/components/NoticeBanner';
import PlateListings from '@/components/PlateListings';
import BikePlatesSection from '@/components/BikePlatesSection';
import ClassicPlatesSection from '@/components/ClassicPlatesSection';
import MobileNumbers from '@/components/MobileNumbers';
import RequestBanner from '@/components/RequestBanner';
import ListWithUsBanner from '@/components/ListWithUsBanner';

export default function HomePage() {
  return (
    <div className="w-full overflow-x-hidden">
      <Hero />
      <FeaturedNumbersStrip />
      {/* NoticeBanner hidden on mobile - now shown inside Hero banner */}
      <div className="hidden sm:block">
        <NoticeBanner />
      </div>
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
