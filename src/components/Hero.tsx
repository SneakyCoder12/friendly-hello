import { useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import NoticeBanner from './NoticeBanner';

export default function Hero() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-gray-900">
      {/* Mobile: bigger banner ~45vh, left-aligned | Tablet+: original heights, centered */}
      <div className="relative h-[45vh] min-h-[300px] max-h-[400px] sm:h-[600px] sm:min-h-0 sm:max-h-none md:h-[700px] w-full">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=3000&auto=format&fit=crop')",
          }}
        />
        {/* Mobile: stronger overlay for readability */}
        <div className="absolute inset-0 bg-black/55 sm:bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent sm:from-black/50 sm:via-transparent sm:to-black/20" />

        {/* Mobile: left-aligned layout | Desktop: original centered layout */}
        <div className="relative z-10 h-full flex flex-col items-start sm:items-center justify-end sm:justify-center text-left sm:text-center px-5 sm:px-6 pb-8 sm:pb-0 pt-10 sm:pt-20">
          {/* Group 1: Badge + Title */}
          <div
            className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            {/* Badge: hidden on mobile */}
            <div className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-mono text-white/90 tracking-widest uppercase font-bold">
                {t('livePlatform')}
              </span>
            </div>
            {/* Mobile: left-aligned, bigger title | Desktop: original */}
            <h2 className="text-white text-2xl sm:text-5xl md:text-6xl lg:text-8xl font-display font-black mb-2 sm:mb-6 tracking-tighter leading-[1.1] sm:leading-[1.05]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              <span className="sm:hidden">Premium UAE<br />Number Plates</span>
              <span className="hidden sm:inline">
                {t('heroTitle')} <br />
                <span className="text-white">{t('heroTitleAccent')}</span>
              </span>
            </h2>
          </div>

          {/* Group 2: Subtitle */}
          <p
            className={`text-white/80 text-sm sm:text-lg md:text-xl font-medium tracking-wide max-w-2xl sm:mx-auto mb-4 sm:mb-10 transition-all duration-700 ease-out delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            <span className="sm:hidden">Buy & sell exclusive number plates</span>
            <span className="hidden sm:inline">{t('heroSubtitle')}</span>
          </p>

          {/* Group 3: Buttons — mobile: both buttons side by side | Desktop: both buttons */}
          <div
            className={`flex flex-row gap-3 sm:gap-4 sm:justify-center transition-all duration-700 ease-out delay-[400ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            <Link
              className="bg-white text-gray-900 px-4 sm:px-8 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-1.5"
              to="/marketplace"
            >
              {t('browsePlates')} <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
            <Link
              className="bg-white/10 text-white border border-white/30 px-4 sm:px-8 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg hover:bg-white/20 hover:border-white/50 backdrop-blur-sm transition-all duration-300 flex items-center justify-center"
              to="/dashboard"
            >
              <span className="sm:hidden">List Your Number</span>
              <span className="hidden sm:inline">{t('listYourPlate')}</span>
            </Link>
          </div>

          {/* Mobile-only: Notice inside banner under buttons */}
          <div className="sm:hidden w-full mt-3">
            <NoticeBanner />
          </div>
        </div>
      </div>
    </div>
  );
}
