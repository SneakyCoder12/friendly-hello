import PlateGeneratorSection from '@/components/PlateGenerator';
import Footer from '@/components/Footer';

export default function VisualizerPage() {
  return (
    <>
      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PlateGeneratorSection />
        </div>
      </div>
      <Footer />
    </>
  );
}
