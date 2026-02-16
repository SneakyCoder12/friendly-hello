import { useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-gray-900">
      <div className="relative h-[700px] w-full">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=3000&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-20">
          {/* Group 1: Badge + Title */}
          <div
            className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-mono text-white/90 tracking-widest uppercase font-bold">
                {t('livePlatform')}
              </span>
            </div>
            <h2 className="text-white text-5xl md:text-6xl lg:text-8xl font-display font-black mb-6 tracking-tighter leading-[1.05]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              {t('heroTitle')} <br />
              <span className="text-white">{t('heroTitleAccent')}</span>
            </h2>
          </div>

          {/* Group 2: Subtitle */}
          <p
            className={`text-white/80 text-lg md:text-xl font-medium tracking-wide max-w-2xl mx-auto mb-10 transition-all duration-700 ease-out delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            {t('heroSubtitle')}
          </p>

          {/* Group 3: Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 ease-out delay-[400ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            <Link
              className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              to="/marketplace"
            >
              {t('browsePlates')} <ArrowDown className="h-4 w-4" />
            </Link>
            <Link
              className="bg-white/10 text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 hover:border-white/50 backdrop-blur-sm transition-all duration-300"
              to="/dashboard"
            >
              {t('listYourPlate')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
