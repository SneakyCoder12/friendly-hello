import Hero from '@/components/Hero';
import NoticeBanner from '@/components/NoticeBanner';
import PlateListings from '@/components/PlateListings';
import MobileNumbers from '@/components/MobileNumbers';
import RequestBanner from '@/components/RequestBanner';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Hero />
      <NoticeBanner />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-32" id="plates">
        <PlateListings />
        <RequestBanner />
        <MobileNumbers />
        <RequestBanner />
      </main>
      <Footer />
    </>
  );
}
