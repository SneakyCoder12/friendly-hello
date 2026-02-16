import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RequestBanner() {
  const { t } = useLanguage();

  return (
    <section className="relative w-full rounded-3xl overflow-hidden border border-primary/20">
      {/* Animated shimmer border */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/15 to-primary/5 animate-pulse" />
      <div className="relative bg-gradient-to-r from-card via-background to-card px-8 md:px-16 py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-start max-w-xl">
            <h2 className="text-3xl md:text-4xl font-display font-black text-foreground tracking-tight mb-3">
              Can't Find Your Dream Number?
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Submit a request and we'll help you find the perfect plate number, VIP mobile number, or custom tag.
            </p>
          </div>
          <Link
            to="/request"
            className="relative flex-shrink-0 inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-base hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden"
          >
            {/* Shimmer effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              {t('submitRequest') || 'Submit a Request'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
