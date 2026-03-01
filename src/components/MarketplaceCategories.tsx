import { Link } from 'react-router-dom';
import { Car, Tag, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

const CATEGORIES: { labelKey: TranslationKey; descKey: TranslationKey; icon: any; path: string }[] = [
  { labelKey: 'motorsCategory', descKey: 'motorsDesc', icon: Car, path: '/motors' },
  { labelKey: 'classifiedsCategory', descKey: 'classifiedsDesc', icon: Tag, path: '/classifieds' },
  { labelKey: 'propertiesCategory', descKey: 'propertiesDesc', icon: Building2, path: '/properties' },
];

export default function MarketplaceCategories() {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <h2 className="font-display font-bold text-lg sm:text-2xl text-foreground text-center mb-4 sm:mb-6">
        {t('exploreMarketplace')}
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {CATEGORIES.map(({ labelKey, descKey, icon: Icon, path }) => (
          <Link
            key={path}
            to={path}
            className="group flex flex-col items-center gap-2 sm:gap-3 rounded-2xl border border-border bg-card p-4 sm:p-6 text-center transition-all hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5"
          >
            <div className="rounded-xl bg-primary/10 p-3 sm:p-4 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <p className="font-display font-bold text-sm sm:text-lg text-foreground">{t(labelKey)}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">{t(descKey)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
