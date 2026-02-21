import { Facebook, Camera, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-black border-t border-white/10 mt-auto pt-10 sm:pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 pr-0 md:pr-12">
            <div className="flex items-center gap-4 mb-6">
              <img src="/Logo.png" alt="Alnuami Groups" className="h-28 sm:h-32 w-auto object-contain drop-shadow-lg" />
              <div className="leading-none flex flex-col mt-2">
                <span className="font-display font-black text-3xl sm:text-4xl text-[hsl(40,86%,44%)] drop-shadow-md">ALNUAMI</span>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-white self-end mt-1 mr-1 drop-shadow-sm">GROUPS</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm">
              {t('footerDesc')}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">{t('marketplaceTitle')}</h4>
            <ul className="space-y-4 text-sm text-gray-400 font-medium">
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/marketplace?emirate=Abu+Dhabi">{t('abuDhabiPlates')}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/marketplace?emirate=Dubai">{t('dubaiPlates')}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/marketplace?emirate=Sharjah">{t('sharjahPlates')}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/marketplace?emirate=Ajman">{t('ajmanPlates') || 'Ajman Plates'}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/marketplace?emirate=Ras+Al+Khaimah">{t('rakPlates') || 'Ras Al Khaimah Plates'}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/marketplace?emirate=Fujairah">{t('fujariahPlates') || 'Fujairah Plates'}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/marketplace?emirate=Umm+Al+Quwain">{t('uaqPlates') || 'Umm Al Quwain Plates'}</Link></li>
              <li className="pt-2"><Link className="hover:text-[hsl(40,86%,44%)] transition-colors text-white font-bold" to="/mobile-numbers">VIP Mobile Numbers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">{t('supportTitle')}</h4>
            <ul className="space-y-4 text-sm text-gray-400 font-medium">
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/contact">{t('contactUs')}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/request">{t('submitRequest') || 'Submit Request'}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/terms">{t('terms')}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/privacy">{t('privacy')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-gray-500 font-medium">{t('copyright')}</p>
          <div className="flex gap-4">
            {[Facebook, Camera, AtSign].map((Icon, i) => (
              <a key={i} className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[hsl(40,86%,44%)] hover:text-white hover:border-transparent transition-all duration-300" href="#">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
