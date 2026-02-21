import { useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const EMIRATES = [
  { name: 'Abu Dhabi', image: '/abudhabi-plate.png' },
  { name: 'Dubai', image: '/dubai-plate.png' },
  { name: 'Sharjah', image: '/sharjah-plate.png' },
  { name: 'Ajman', image: '/ajman-plate.png' },
  { name: 'RAK', image: '/rak-plate.png' },
  { name: 'Fujairah', image: '/fujariah-plate.png' },
  { name: 'UAQ', image: '/umm-al-q-plate.png' },
];

export default function Hero() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden bg-gray-900">
      {/* Mobile: bigger banner ~45vh, left-aligned | Tablet+: original heights, centered */}
      <div className="relative h-[45vh] min-h-[300px] max-h-[420px] sm:h-[600px] sm:min-h-0 sm:max-h-none md:h-[700px] w-full overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/Background-Main.png')",
          }}
        />
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content Container */}
        <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">

          {/* Right Side: Shattered Plates */}
          <div
            className={`absolute right-0 sm:right-4 md:right-8 lg:right-12 top-24 sm:top-32 z-20 pointer-events-auto transition-all duration-1000 ease-out delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            <div className="relative w-[180px] sm:w-[250px] md:w-[350px] lg:w-[450px] h-[200px] sm:h-[300px] md:h-[400px]">
              {EMIRATES.map((emirate, index) => {
                const positions = [
                  { top: '5%', right: '5%', rotate: 'rotate-[6deg]', zIndex: 40 }, // Abu Dhabi
                  { top: '15%', right: '25%', rotate: '-rotate-[4deg]', zIndex: 30 }, // Dubai
                  { top: '35%', right: '10%', rotate: '-rotate-[6deg]', zIndex: 35 }, // Sharjah
                  { top: '45%', right: '30%', rotate: 'rotate-[3deg]', zIndex: 25 }, // Ajman
                  { top: '65%', right: '15%', rotate: 'rotate-[7deg]', zIndex: 20 }, // RAK
                  { top: '25%', right: '45%', rotate: '-rotate-[9deg]', zIndex: 15 }, // Fujairah
                  { top: '55%', right: '40%', rotate: '-rotate-[5deg]', zIndex: 10 }, // UAQ
                ];
                const pos = positions[index];
                return (
                  <Link
                    key={emirate.name}
                    to={`/marketplace?emirate=${encodeURIComponent(emirate.name)}`}
                    className={`absolute group transform transition-all duration-500 hover:scale-110 hover:!z-50 ${pos.rotate}`}
                    style={{
                      top: pos.top,
                      right: pos.right,
                      zIndex: pos.zIndex,
                    }}
                  >
                    <img
                      src={emirate.image}
                      alt={emirate.name}
                      className="h-5 sm:h-8 md:h-10 lg:h-12 w-auto object-contain outline outline-2 outline-white rounded-[2px] bg-white drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_30px_40px_rgba(0,0,0,0.8)]"
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Left Side: Main Texts */}
          <div className="absolute left-4 sm:left-16 md:left-24 lg:left-31 top-[25%] sm:top-[20%] md:top-[20%] flex flex-col items-start z-10 pointer-events-auto">
            <div
              className={`transition-all duration-700 ease-out delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            >
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 mb-2 sm:mb-4 lg:mb-6 z-20 relative">
                <img
                  src="/Logo.png"
                  alt="Alnuami Logo"
                  className="h-[80px] sm:h-[155px] md:h-[185px] lg:h-[215px] w-auto object-contain drop-shadow-lg z-10"
                />
                <div className="leading-none flex flex-col items-center sm:items-start mt-0 sm:mt-8 md:mt-10 lg:mt-11">
                  <h1 className="font-display font-black text-3xl sm:text-7xl md:text-4xl lg:text-[4rem] tracking-tighter text-[hsl(40,86%,44%)] uppercase drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] text-center sm:text-left">
                    ALNUAMI
                  </h1>
                  <p className="text-[10px] sm:text-sm md:text-base font-black uppercase tracking-[0.4em] text-gray-100 self-center sm:self-end mt-1 sm:mt-2 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] translate-x-[2px] sm:translate-x-[5px]">
                    GROUPS
                  </p>
                </div>
              </div>

              <h2 className="text-white text-sm sm:text-2xl md:text-3xl lg:text-4xl font-display font-black tracking-wider uppercase leading-[1.15] relative z-10 text-center sm:text-left w-full sm:w-auto mt-4 sm:mt-0" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
                BUYING & SELLING<br />
                <span className="text-white/90">PREMIUM NUMBER PLATES</span>
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
