import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RequestBanner() {
  const { t } = useLanguage();

  return (
    <section className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-between px-8 md:px-16 py-14 gap-8">
        <div className="text-center md:text-start max-w-xl">
          <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight mb-3">
            Your Exclusive Number, Made Simple.
          </h2>
          <p className="text-white/60 text-sm md:text-base leading-relaxed">
            Request your favourite number plate, a VIP phone number, or a #Tag that mirrors who you are.
          </p>
        </div>
        <Link
          to="/request"
          className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-base hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {t('submitRequest') || 'Submit a Request'} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
