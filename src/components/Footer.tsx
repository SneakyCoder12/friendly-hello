import { Facebook, Camera, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t border-border mt-auto pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 pr-0 md:pr-12">
            <div className="flex items-center gap-3 mb-6">
              <img src="/Logo.png" alt="Al Nuami" className="h-14 w-auto object-contain" />
              <span className="font-display font-black text-2xl text-foreground">AL NUAMI</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {t('footerDesc')}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-6 text-sm uppercase tracking-wider">{t('marketplaceTitle')}</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-medium">
              <li><Link className="hover:text-primary transition-colors" to="/marketplace?emirate=Abu+Dhabi">Abu Dhabi Plates</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/marketplace?emirate=Dubai">Dubai Plates</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/marketplace?emirate=Sharjah">Sharjah Plates</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-6 text-sm uppercase tracking-wider">{t('supportTitle')}</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-medium">
              <li><Link className="hover:text-primary transition-colors" to="/contact">{t('contactUs')}</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/request">{t('submitRequest') || 'Submit Request'}</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/visualizer">{t('generator')}</Link></li>
              <li><a className="hover:text-primary transition-colors" href="#">{t('terms')}</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">{t('privacy')}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-muted-foreground font-medium">{t('copyright')}</p>
          <div className="flex gap-4">
            {[Facebook, Camera, AtSign].map((Icon, i) => (
              <a key={i} className="h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300" href="#">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
