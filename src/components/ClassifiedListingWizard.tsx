/**
 * Premium Step-by-Step Classified Listing Wizard
 * UI-only redesign — all backend logic, field names, and Supabase calls are preserved.
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import {
  Monitor, Shirt, Sofa, Briefcase, Home, Dumbbell, PawPrint, Package,
  ChevronRight, ChevronLeft, Check, Upload, X, Loader2,
  Image as ImageIcon, MapPin, Eye, Sparkles, Tag, FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  uploadMarketplaceImage,
  EMIRATES, CLASSIFIED_CATEGORIES, CLASSIFIED_CONDITIONS, CONDITIONS,
  CLASSIFIED_IMAGE_LIMIT,
} from '@/lib/marketplace';
import PhoneInput from '@/components/PhoneInput';

interface WizardProps {
  initialForm: Record<string, any>;
  initialImages: string[];
  editId: string | null;
  onSave: (form: Record<string, any>, images: string[]) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const STEPS = [
  { labelKey: 'category', icon: Tag },
  { labelKey: 'basics', icon: FileText },
  { labelKey: 'description', icon: FileText },
  { labelKey: 'photos', icon: ImageIcon },
  { labelKey: 'location', icon: MapPin },
  { labelKey: 'review', icon: Eye },
];

const CATEGORY_CARDS = [
  { value: 'Electronics', labelKey: 'electronics', descKey: 'electronicsDesc', icon: Monitor },
  { value: 'Fashion', labelKey: 'fashion', descKey: 'fashionDesc', icon: Shirt },
  { value: 'Furniture', labelKey: 'furniture', descKey: 'furnitureDesc', icon: Sofa },
  { value: 'Business & Industrial', labelKey: 'businessIndustrial', descKey: 'businessIndustrialDesc', icon: Briefcase },
  { value: 'Home & Garden', labelKey: 'homeGarden', descKey: 'homeGardenDesc', icon: Home },
  { value: 'Sports & Outdoors', labelKey: 'sportsOutdoors', descKey: 'sportsOutdoorsDesc', icon: Dumbbell },
  { value: 'General Items', labelKey: 'generalItems', descKey: 'generalItemsDesc', icon: Package },
];

const inputCls = 'w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all';
const selectCls = inputCls;
const labelCls = 'block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide';

// ─── In-memory cache (survives tab switch, cleared on page refresh) ───
let _classifiedCache: { form: Record<string, any>; images: string[]; step: number; editId: string | null } | null = null;

export default function ClassifiedListingWizard({ initialForm, initialImages, editId, onSave, onCancel, saving }: WizardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Restore from cache if same context (both new or same editId)
  const cached = _classifiedCache && _classifiedCache.editId === editId ? _classifiedCache : null;

  const [step, setStep] = useState(cached?.step ?? 0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<Record<string, any>>(cached?.form ?? initialForm);
  const [images, setImages] = useState<string[]>(cached?.images ?? initialImages);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Persist to in-memory cache on every change
  useEffect(() => {
    _classifiedCache = { form, images, step, editId };
  }, [form, images, step, editId]);

  const clearCache = () => { _classifiedCache = null; };

  const set = useCallback((key: string, val: any) => setForm(f => ({ ...f, [key]: val })), []);
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  const goNext = () => {
    if (step === 1 && !form.title?.trim()) { toast.error('Title is required'); return; }
    if (step === 4 && !form.contact_number?.trim()) { toast.error('Contact number is required'); return; }
    setDir(1);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goBack = () => {
    setDir(-1);
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = CLASSIFIED_IMAGE_LIMIT - images.length;
    if (remaining <= 0) { toast.error(`Maximum ${CLASSIFIED_IMAGE_LIMIT} images`); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      let count = 0;
      for (const file of toUpload) {
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} too large (max 10 MB)`); continue; }
        const url = await uploadMarketplaceImage(user.id, file, 'classifieds');
        setImages(prev => [...prev, url]);
        count++;
      }
      if (count > 0) toast.success(`${count} image(s) uploaded`);
    } catch (err: any) { toast.error(err.message || 'Upload failed'); }
    setUploading(false);
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };
  const handlePublish = () => { clearCache(); onSave(form, images); };

  const renderStep = () => {
    switch (step) {
      case 0: return <StepCategory form={form} set={set} />;
      case 1: return <StepBasics form={form} set={set} />;
      case 2: return <StepDescription form={form} set={set} />;
      case 3: return (
        <StepPhotos images={images} uploading={uploading} dragOver={dragOver}
          setDragOver={setDragOver} handleDrop={handleDrop}
          handleFiles={handleFiles} removeImage={removeImage} fileRef={fileRef} />
      );
      case 4: return <StepLocation form={form} set={set} />;
      case 5: return <StepReview form={form} images={images} />;
      default: return null;
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
      {/* Progress Header */}
      <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold text-foreground">
            {editId ? t('editClassified' as any) : t('createClassified' as any)}
          </h2>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <button key={i} onClick={() => { if (i < step) { setDir(-1); setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-primary scale-110' : done ? 'text-primary/60 cursor-pointer' : 'text-muted-foreground/40'}`}>
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${active ? 'bg-primary text-primary-foreground shadow-lg' : done ? 'bg-primary/15 text-primary' : 'bg-surface border border-border'}`}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="text-[10px] font-bold hidden sm:block">{t(s.labelKey as any)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="px-4 sm:px-6 py-6 min-h-[340px] relative overflow-y-auto">
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          {renderStep()}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4 border-t border-border flex items-center justify-between">
        <button onClick={step === 0 ? () => { clearCache(); onCancel(); } : goBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-foreground hover:bg-surface-accent transition-colors">
          <ChevronLeft className="h-4 w-4" /> {step === 0 ? t('cancel') : t('back')}
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={goNext} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">
            {t('next')} <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handlePublish} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Sparkles className="h-4 w-4" />
            {editId ? t('updateListing' as any) : t('publishListing' as any)}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}

// ═══ Step 1: Category ═══
function StepCategory({ form, set }: { form: Record<string, any>; set: (k: string, v: any) => void }) {
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('whatSelling' as any)}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('chooseCategoryItem' as any)}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORY_CARDS.map(c => {
          const Icon = c.icon;
          const active = form.category === c.value;
          return (
            <button key={c.value}
              onClick={() => set('category', c.value)}
              className={`relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-95 text-center ${active ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-surface hover:border-primary/30 hover:bg-surface-accent'}`}>
              {active && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-200">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-primary text-primary-foreground' : 'bg-surface-accent text-muted-foreground'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-bold text-xs text-foreground">{t(c.labelKey as any)}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{t(c.descKey as any)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══ Step 2: Basics ═══
function StepBasics({ form, set }: { form: Record<string, any>; set: (k: string, v: any) => void }) {
  const { t } = useLanguage();
  let titlePlaceholder = "e.g. Item Name & Details";
  switch (form.category) {
    case 'Electronics': titlePlaceholder = "e.g. iPhone 15 Pro Max 256GB"; break;
    case 'Fashion': titlePlaceholder = "e.g. Vintage Leather Jacket, Nike AJ1"; break;
    case 'Furniture': titlePlaceholder = "e.g. 3-Seater Velvet Sofa"; break;
    case 'Business & Industrial': titlePlaceholder = "e.g. Commercial Espresso Machine"; break;
    case 'Home & Garden': titlePlaceholder = "e.g. Outdoor Patio Set"; break;
    case 'Sports & Outdoors': titlePlaceholder = "e.g. Mountain Bike, Tennis Racket"; break;
    case 'General Items': titlePlaceholder = "e.g. Vintage Coin Collection"; break;
  }

  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('basicInfo' as any)}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('tellUsAboutItem' as any)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>{t('titleStar' as any)}</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder={titlePlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('priceAed' as any)}</label>
          <input value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 3500" type="number" inputMode="numeric" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('condition' as any)}</label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map(c => (
              <button key={c} type="button" onClick={() => set('condition', c)}
                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.condition === c ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface text-muted-foreground hover:border-primary/30'}`}>
                {c === 'Used' ? t('used' as any) : t('newCondition' as any)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ Step 3: Description ═══
function StepDescription({ form, set }: { form: Record<string, any>; set: (k: string, v: any) => void }) {
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('description')}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('provideDetailsToAttract' as any)}</p>
      <label className={labelCls}>{t('itemDescription' as any)}</label>
      <textarea value={form.description} onChange={e => set('description', e.target.value)}
        placeholder="Describe your item in detail — brand, model, condition, what's included, reason for selling…"
        rows={8} className={`${inputCls} resize-none`} />
    </div>
  );
}

// ═══ Step 4: Photos ═══
function StepPhotos({ images, uploading, dragOver, setDragOver, handleDrop, handleFiles, removeImage, fileRef }: {
  images: string[]; uploading: boolean; dragOver: boolean;
  setDragOver: (v: boolean) => void; handleDrop: (e: React.DragEvent) => void;
  handleFiles: (files: FileList | null) => Promise<void>;
  removeImage: (i: number) => void; fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('addPhotos' as any)}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('greatPhotos' as any)}</p>
      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40 hover:bg-surface-accent'}`}>
        <div className="flex flex-col items-center gap-3">
          {uploading ? <Loader2 className="h-10 w-10 animate-spin text-primary" /> : (
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Upload className="h-7 w-7 text-primary" /></div>
          )}
          <div>
            <p className="font-bold text-foreground text-sm">{uploading ? t('uploading' as any) : t('dragDropPhotos' as any)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('orClickBrowse' as any)} {CLASSIFIED_IMAGE_LIMIT} {t('photosMaxLimit' as any)}</p>
          </div>
        </div>
      </div>
      {images.length > 0 && (
        <div className="mt-5">
          <span className="text-xs font-bold text-muted-foreground">{images.length} / {CLASSIFIED_IMAGE_LIMIT} photos</span>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 mt-2">
            {images.map((url, i) => (
              <div key={url}
                className="relative aspect-square rounded-xl overflow-hidden border border-border group animate-in fade-in zoom-in-95 duration-300">
                <img src={url} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md">Cover</span>}
                <button onClick={e => { e.stopPropagation(); removeImage(i); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ Step 5: Location & Contact ═══
function StepLocation({ form, set }: { form: Record<string, any>; set: (k: string, v: any) => void }) {
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('location')}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('whereIsItem' as any)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t('emirate')} *</label>
          <select value={form.emirate} onChange={e => set('emirate', e.target.value)} className={selectCls}>
            {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t('area' as any)}</label>
          <input value={form.area} onChange={e => set('area', e.target.value)} placeholder="e.g. Downtown, JBR" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>{t('contactNumber' as any)} *</label>
          <PhoneInput value={form.contact_number} onChange={v => set('contact_number', v)} required />
        </div>
      </div>
    </div>
  );
}

// ═══ Step 6: Review ═══
function StepReview({ form, images }: { form: Record<string, any>; images: string[] }) {
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('reviewPublish' as any)}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('almostDone' as any)}</p>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {images.length > 0 ? (
          <div className="relative h-48 sm:h-56">
            <img src={images[0]} alt="" className="w-full h-full object-cover" />
            {images.length > 1 && <span className="absolute bottom-2 right-2 bg-foreground/60 text-primary-foreground text-xs font-bold px-2 py-1 rounded-lg">+{images.length - 1} photos</span>}
          </div>
        ) : (
          <div className="h-48 bg-surface-accent flex items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground/30" /></div>
        )}
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-display font-bold text-foreground text-lg leading-tight">{form.title || 'Untitled'}</h4>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /><span>{form.emirate}{form.area ? `, ${form.area}` : ''}</span>
              </div>
            </div>
            {form.price && <span className="text-lg font-bold text-primary whitespace-nowrap">AED {Number(form.price).toLocaleString()}</span>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg">{form.category ? t(CATEGORY_CARDS.find(c => c.value === form.category)?.labelKey as any) : ''}</span>
            {form.condition && <span className="text-[11px] font-bold bg-surface-accent text-muted-foreground px-2 py-1 rounded-lg">{form.condition === 'Used' ? t('used' as any) : t('newCondition' as any)}</span>}
          </div>
          {form.description && <p className="text-xs text-muted-foreground line-clamp-3">{form.description}</p>}
        </div>
      </div>
    </div>
  );
}
