import { Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NoticeBanner() {
  const { t } = useLanguage();

  return (
    <div className="sm:bg-card sm:border-y sm:border-border text-foreground py-1 sm:py-4 px-2 sm:px-4 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-row items-center gap-2 text-left">
        <Info className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-primary hidden sm:block flex-shrink-0" />
        <p className="text-[10px] sm:text-sm font-medium text-white/90 sm:text-muted-foreground tracking-wide leading-tight">
          <span className="font-bold text-white sm:text-foreground uppercase tracking-wider mr-1 sm:mr-2">{t('noticeLabel')}</span>
          <span className="text-white/80 sm:text-muted-foreground">{t('noticeText')}</span>
        </p>
      </div>
    </div>
  );
}
