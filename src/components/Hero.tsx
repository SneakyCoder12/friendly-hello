import { ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <div className="relative h-[600px] w-full overflow-hidden flex items-center justify-center text-center">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea904a848bd?q=80&w=2800&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 mt-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border backdrop-blur-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase font-bold">
            {t('livePlatform')}
          </span>
        </div>
        <h2 className="text-foreground text-5xl md:text-7xl lg:text-8xl font-display font-black mb-6 tracking-tighter leading-tight">
          {t('heroTitle')} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-teal-300">
            {t('heroTitleAccent')}
          </span>
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl font-medium tracking-wide max-w-2xl mx-auto mb-10">
          {t('heroSubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            to="/marketplace"
          >
            {t('browsePlates')} <ArrowDown className="h-4 w-4" />
          </Link>
          <Link
            className="bg-card text-foreground border border-border px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface hover:border-primary/30 transition-all duration-300"
            to="/dashboard"
          >
            {t('listYourPlate')}
          </Link>
        </div>
      </div>
    </div>
  );
}
