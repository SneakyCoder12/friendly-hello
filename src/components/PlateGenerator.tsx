import { Download, Palette, Loader2 } from 'lucide-react';
import { usePlateGenerator } from '@/hooks/usePlateGenerator';
import { getConfig } from '@/lib/plate-generator';

const EMIRATES = [
  { value: 'abudhabi', label: 'Abu Dhabi' },
  { value: 'dubai', label: 'Dubai' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'ajman', label: 'Ajman' },
  { value: 'umm_al_quwain', label: 'Umm Al Quwain' },
  { value: 'rak', label: 'Ras Al Khaimah' },
  { value: 'fujairah', label: 'Fujairah' },
];

export default function PlateGeneratorSection() {
  const {
    emirate, setEmirate,
    plateCode, setPlateCode,
    plateNumber, setPlateNumber,
    canvasRef,
    downloadPlate,
    isDownloading,
  } = usePlateGenerator();

  const config = getConfig(emirate);

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
            <h2 className="text-4xl font-display font-bold text-foreground tracking-tight">Plate Visualizer</h2>
            <p className="text-sm font-bold uppercase tracking-[0.2em] mt-1 text-muted-foreground">Create Your HD Number Plate</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-card rounded-2xl border border-border shadow-card p-8 space-y-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-2">Configure Your Plate</h3>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2" htmlFor="emirateSelect">
              Emirate
            </label>
            <select
              id="emirateSelect"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
              value={emirate}
              onChange={(e) => setEmirate(e.target.value)}
            >
              {EMIRATES.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          {config.hasCode !== false && (
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2" htmlFor="plateCode">
                Plate Code
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
              <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</>
            ) : (
              <><Download className="h-5 w-5" /> Download HD Plate (PNG)</>
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">High resolution PNG export</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="bg-surface rounded-2xl border border-border p-8 w-full flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6 relative z-10">
              Live Preview
            </p>
            <canvas
              ref={canvasRef}
              className="relative z-10 rounded-lg shadow-plate max-w-full"
              style={{ imageRendering: '-webkit-optimize-contrast' } as React.CSSProperties}
            />
            <p className="text-[10px] text-muted-foreground mt-4 relative z-10 font-medium">High resolution export</p>
          </div>
        </div>
      </div>
    </section>
  );
}
