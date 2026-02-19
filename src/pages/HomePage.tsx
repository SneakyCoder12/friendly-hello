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
    <>
      <Hero />
      <FeaturedNumbersStrip />
      {/* NoticeBanner hidden on mobile - now shown inside Hero banner */}
      <div className="hidden sm:block">
        <NoticeBanner />
      </div>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-20 space-y-8 sm:space-y-32" id="plates">
        <PlateListings />
        <ClassicPlatesSection />
        <BikePlatesSection />
        <MobileNumbers />
        <RequestBanner />
        <ListWithUsBanner />
      </main>
    </>
  );
}
