import { Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const TiktokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.95v5.25c-.01 3.9-3.15 7.15-7.05 7.15-3.9 0-7.05-3.26-7.05-7.15 0-3.9 3.15-7.15 7.05-7.15.54 0 1.08.06 1.6.18v4.06c-.53-.19-1.06-.29-1.6-.29-1.69 0-3.04 1.34-3.04 3.01 0 1.68 1.35 3.01 3.04 3.01 1.69 0 3.04-1.34 3.04-3.01V.02z" />
    </svg>
  );

  const SnapchatIcon = ({ className }: { className?: string }) => (
    <img src="/snapchat-logo.png" alt="Snapchat" className={`${className} object-contain`} />
  );

  return (
    <footer className="bg-black border-t border-white/10 mt-auto pt-10 sm:pt-20 pb-24 sm:pb-10 relative z-50">
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
            <p className="text-gray-300 leading-relaxed text-sm mb-6">
              {t('footerDesc')}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">{t('marketplaceTitle')}</h4>
            <ul className="space-y-4 text-sm text-gray-300 font-medium">
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
            <ul className="space-y-4 text-sm text-gray-300 font-medium">
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/contact">{t('contactUs')}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/terms">{t('terms')}</Link></li>
              <li><Link className="hover:text-[hsl(40,86%,44%)] transition-colors" to="/privacy">{t('privacy')}</Link></li>
              <li className="pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Phone Number</p>
                <a href="tel:+971509912129" className="text-gray-300 hover:text-[hsl(40,86%,44%)] transition-colors text-sm font-medium block">
                  +971 50 991 2129
                </a>
              </li>
              <li className="pt-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Email</p>
                <a href="mailto:alnuamigroups@gmail.com" className="text-gray-300 hover:text-[hsl(40,86%,44%)] transition-colors text-sm font-medium block">
                  alnuamigroups@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-gray-500 font-medium">{t('copyright')}</p>
          <div className="flex gap-4">
            {[
              { Icon: SnapchatIcon, label: "Snapchat Profile", href: "https://snapchat.com/t/rJdooLC5" },
              { Icon: TiktokIcon, label: "TikTok Profile", href: "https://www.tiktok.com/@bu.mohmmad242?_r=1&_t=ZS-94FkPg1cu5I" },
              { Icon: Instagram, label: "Instagram Profile", href: "https://www.instagram.com/bomohammad242?igsh=N2Y3cDJobHNiZWpk&utm_source=qr" }
            ].map(({ Icon, label, href }, i) => (
              <a key={i} aria-label={label} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-[hsl(40,86%,44%)] hover:text-white hover:border-transparent transition-all duration-300" href={href}>
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
