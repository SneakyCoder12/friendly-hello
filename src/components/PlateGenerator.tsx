import { Download, Palette, Loader2 } from 'lucide-react';
import { usePlateGenerator } from '@/hooks/usePlateGenerator';
import { getConfig } from '@/lib/plate-generator';
import { useLanguage } from '@/contexts/LanguageContext';

const EMIRATES_CONFIG = [
  { value: 'abudhabi', label: 'Abu Dhabi', logo: '/Abu_Dhabi-logo.webp' },
  { value: 'dubai', label: 'Dubai', logo: '/dubai-logo.webp' },
  { value: 'sharjah', label: 'Sharjah', logo: '/SHARJAH-LOGO.webp' },
  { value: 'ajman', label: 'Ajman', logo: '/ajman-logo.webp' },
  { value: 'umm_al_quwain', label: 'Umm Al Quwain', logo: '/ummalquein-logo.webp' },
  { value: 'rak', label: 'Ras Al Khaimah', logo: '/rak-logo.webp' },
  { value: 'fujairah', label: 'Fujairah', logo: '/fujairah-logo.webp' },
];

export default function PlateGeneratorSection() {
  const {
    emirate, setEmirate,
    plateStyle, setPlateStyle,
    plateCode, setPlateCode,
    plateNumber, setPlateNumber,
    canvasRef,
    downloadPlate,
    isDownloading,
  } = usePlateGenerator();
  const { t } = useLanguage();

  // Classic plates only available for: AD, Dubai, Sharjah, Ajman, RAK
  const supportsClassic = ['abudhabi', 'dubai', 'sharjah', 'ajman', 'rak'].includes(emirate);

  // If current style is classic but emirate doesn't support it, switch to private
  if (plateStyle === 'classic' && !supportsClassic) {
    setPlateStyle('private');
  }

  const config = getConfig(emirate, plateStyle);

  return (
    <section id="generator" className="scroll-mt-24">
      <div className="flex items-end justify-between mb-12 border-b border-border pb-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 bg-card border border-border rounded-2xl flex flex-col items-center justify-center shadow-md overflow-hidden p-1">
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
              <Palette className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-display font-bold text-foreground tracking-tight">{t('plateVisualizer')}</h2>
            <p className="text-sm font-bold uppercase tracking-[0.2em] mt-1 text-muted-foreground">{t('createHdPlate')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-card rounded-2xl border border-border shadow-card p-8 space-y-8">
          <h3 className="text-lg font-display font-bold text-foreground mb-2">{t('configureYourPlate')}</h3>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              {t('selectEmirate')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EMIRATES_CONFIG.map((item) => {
                const isSelected = emirate === item.value;
                const isClassicUnsupported = plateStyle === 'classic' && ['umm_al_quwain', 'fujairah'].includes(item.value);

                return (
                  <button
                    key={item.value}
                    onClick={() => !isClassicUnsupported && setEmirate(item.value)}
                    disabled={isClassicUnsupported}
                    title={isClassicUnsupported ? "Classic plates not available for this emirate" : ""}
                    className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300 w-full aspect-square sm:aspect-auto sm:h-24 ${isSelected
                      ? 'bg-primary/5 border-primary shadow-[0_0_0_1px_hsl(var(--primary))]'
                      : 'bg-surface border-border hover:bg-surface-accent hover:border-primary/30'
                      } ${isClassicUnsupported ? 'opacity-40 cursor-not-allowed grayscale bg-muted/30' : ''}`}
                  >
                    <img
                      src={item.logo}
                      alt={`${item.label} Logo`}
                      className={`${item.value === 'ajman' ? 'h-5' : 'h-8'} w-auto object-contain transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60'} ${isClassicUnsupported ? 'opacity-30' : ''}`}
                    />
                    <span className={`text-xs font-bold text-center leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {item.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {t('plateStyleLabel')}
            </label>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <button
                className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${plateStyle === 'private' ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-surface border-border text-muted-foreground hover:bg-surface-accent hover:border-primary/30'}`}
                onClick={() => setPlateStyle('private')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                {t('car')}
              </button>
              <button
                className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${plateStyle === 'bike' ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-surface border-border text-muted-foreground hover:bg-surface-accent hover:border-primary/30'}`}
                onClick={() => setPlateStyle('bike')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"><circle cx="18.5" cy="17.5" r="3.5" /><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="15" cy="5" r="1" /><path d="M12 17.5V14l-3-3 4-3 2 3h2" /></svg>
                {t('bike')}
              </button>
              <button
                disabled={!supportsClassic}
                className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${plateStyle === 'classic' ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-surface border-border text-muted-foreground hover:bg-surface-accent hover:border-primary/30'} ${!supportsClassic ? 'opacity-50 cursor-not-allowed bg-muted/50' : ''}`}
                onClick={() => setPlateStyle('classic')}
                title={!supportsClassic ? "Classic not available for this emirate" : ""}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M7 7h10" /><path d="M7 12h10" /><path d="M7 17h10" /></svg>
                {t('classic') || 'Classic'}
              </button>
            </div>
          </div>

          {config.hasCode !== false && (
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2" htmlFor="plateCode">
                {t('plateCode')}
              </label>
              <input
                id="plateCode"
                autoComplete="off"
                maxLength={2}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-2xl font-black text-foreground tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground placeholder:font-normal placeholder:text-sm font-mono"
                placeholder="e.g. B, A, 20"
                value={plateCode}
                onChange={(e) => setPlateCode(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2" htmlFor="plateNumber">
              Plate Number (1 - 5 digits)
            </label>
            <input
              id="plateNumber"
              autoComplete="off"
              maxLength={5}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-2xl font-black text-foreground tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground placeholder:font-normal placeholder:text-sm font-mono"
              placeholder="e.g. 6836, 12345"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
            />
          </div>

          <button
            className="w-full bg-primary text-primary-foreground hover:bg-primary-hover px-8 py-4 rounded-xl font-bold text-base shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
            onClick={downloadPlate}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {t('generating')}</>
            ) : (
              <><Download className="h-5 w-5" /> {t('downloadHdPlate')}</>
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">{t('hdExport')}</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="bg-surface rounded-2xl border border-border p-8 w-full flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6 relative z-10">
              {t('livePreview')}
            </p>
            <canvas
              ref={canvasRef}
              className="relative z-10 rounded-lg shadow-plate max-w-full"
              style={{ imageRendering: '-webkit-optimize-contrast' } as React.CSSProperties}
            />
            <p className="text-[10px] text-muted-foreground mt-4 relative z-10 font-medium">{t('hdExport')}</p>
          </div>
        </div>
      </div>
    </section >
  );
}
