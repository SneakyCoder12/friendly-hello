import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Search, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RequestBanner() {
  const { t } = useLanguage();

  return (
    <div className="w-full overflow-hidden">
      <section className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-primary/10 shadow-xl shadow-primary/5">
        {/* Gold gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.08]" />
        {/* Decorative dots pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#b8860b_1px,transparent_1px)] [background-size:20px_20px]" />
        {/* Top-right glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
        {/* Bottom-left glow */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />

        <div className="relative px-4 sm:px-8 md:px-14 py-8 md:py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">

            {/* Left side — text */}
            <div className="text-center md:text-start max-w-xl w-full min-w-0">
              <div className="inline-flex items-center gap-2 mb-4 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 max-w-full overflow-hidden">
                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-primary truncate">{t('premiumService')}</span>
              </div>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-black text-foreground tracking-tight mb-3 leading-tight">
                {t('cantFindDream')}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {t('cantFindDreamDesc')}
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-5 justify-center md:justify-start">
                <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                  <Search className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">{t('weSearchForYou')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                  <Star className="h-3.5 w-3.5 text-primary/60 fill-primary/40 flex-shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">{t('vipService')}</span>
                </div>
              </div>
            </div>

            {/* Right side — CTA */}
            <div className="flex flex-col items-center gap-5 w-full md:w-auto flex-shrink-0">
              {/* Decorative plates stack — hidden on mobile */}
              <div className="relative w-[200px] h-[70px] hidden md:block">
                <img
                  src="/dubai-plate.webp"
                  alt=""
                  className="absolute top-0 left-0 w-[160px] h-auto object-contain -rotate-3 opacity-60 drop-shadow-md"
                />
                <img
                  src="/abudhabi-plate.webp"
                  alt=""
                  className="absolute top-1 left-8 w-[160px] h-auto object-contain rotate-2 opacity-80 drop-shadow-lg"
                />
              </div>
              <Link
                to="/request"
                className="relative w-full md:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-base hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-300 group overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center gap-2">
                  {t('submitRequest')} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
