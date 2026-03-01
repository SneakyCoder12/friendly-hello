import { ArrowRight, Star, Smartphone } from 'lucide-react';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface MobileListing {
  id: string;
  phone_number: string;
  carrier: string;
  price: number | null;
  status: string;
}

function CarrierLogo({ carrier }: { carrier: string }) {
  const isEtisalat = carrier?.toLowerCase() === 'etisalat';

  if (isEtisalat) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
        <img src="/Eand_Logo.svg" alt="Etisalat" className="h-4 w-4 object-contain" />
        <span className="text-xs font-bold text-emerald-600">e&</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
      <img src="/du-logo.webp" alt="Du" className="h-4 w-4 object-contain" />
      <span className="text-xs font-bold" style={{ color: '#003b71' }}>du</span>
    </span>
  );
}

export default function MobileNumbers() {
  const { t } = useLanguage();
  const [numbers, setNumbers] = useState<MobileListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNumbers() {
      const { data, error } = await supabase
        .from('mobile_numbers')
        .select('*')
        .neq('status', 'hidden')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) console.error('Error fetching mobile numbers:', error);
      else setNumbers(data as unknown as MobileListing[]);
      setLoading(false);
    }
    fetchNumbers();
  }, []);
  return (
    <section id="numbers">
      <div className="flex items-end justify-between mb-6 sm:mb-12 border-b border-border pb-4 sm:pb-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="h-10 w-10 sm:h-16 sm:w-16 bg-card border border-border rounded-2xl flex flex-col items-center justify-center shadow-md overflow-hidden p-1">
            <div className="w-full h-full bg-primary/10 rounded-xl flex items-center justify-center">
              <Smartphone className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-4xl font-display font-bold text-foreground tracking-tight">{t('vipMobileNumbers')}</h2>
            <p className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.2em] mt-0.5 sm:mt-1 text-muted-foreground">{t('exclusivePlatinum')}</p>
          </div>
        </div>
        <Link className="group flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors whitespace-nowrap" to="/mobile-numbers">
          {t('viewAll')}
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Mobile: horizontal scroll | Desktop: grid */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:overflow-visible sm:pb-0">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="min-w-[220px] sm:min-w-0 snap-start h-64 bg-muted animate-pulse rounded-xl" />)
        ) : numbers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-card rounded-2xl border border-dashed border-border/60 min-w-full">
            <Smartphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">{t('comingSoon')}</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
              {t('curatingCurated')}
            </p>
          </div>
        ) : (
          numbers.map((item) => {
            const isSold = item.status === 'sold';
            const carrierLower = item.carrier.toLowerCase();
            return (
              <Link
                key={item.id}
                to={`/mobile-number/${item.id}`}
                className={`block min-w-[220px] sm:min-w-0 snap-start relative bg-card backdrop-blur-md border border-border rounded-xl p-6 sm:p-8 hover:bg-surface hover:shadow-xl transition-all cursor-pointer group shadow-sm hover:border-primary/30 overflow-hidden ${isSold ? 'opacity-80' : ''}`}
              >
                {isSold && (
                  <div className="sold-ribbon">
                    <span>{t('sold').toUpperCase()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <CarrierLogo carrier={item.carrier} />
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-lg sm:text-2xl font-black tracking-widest text-foreground mb-2 font-mono transition-colors group-hover:text-primary truncate">
                  {item.phone_number}
                </p>
                <div className="h-px w-full bg-border my-3 sm:my-4" />
                <p className="text-foreground font-mono font-bold text-base sm:text-xl">
                  {isSold ? (
                    <span className="text-red-500 font-extrabold tracking-widest uppercase">{t('sold')}</span>
                  ) : item.price ? (
                    `AED ${item.price.toLocaleString()}`
                  ) : (
                    t('contactForPrice')
                  )}
                </p>
                <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/5 rounded-xl transition-all pointer-events-none" />
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
