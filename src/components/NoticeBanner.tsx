import { Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NoticeBanner() {
  const { t } = useLanguage();

  return (
    <div className="bg-card border-y border-border text-foreground py-4 px-4 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 text-center sm:text-left">
        <Info className="h-5 w-5 text-primary hidden sm:block flex-shrink-0" />
        <p className="text-sm font-medium text-muted-foreground tracking-wide leading-tight mx-auto sm:mx-0">
          <span className="font-bold text-foreground uppercase tracking-wider mr-2">{t('noticeLabel')}</span>
          {t('noticeText')}
        </p>
      </div>
    </div>
  );
}
