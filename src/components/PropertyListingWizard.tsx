/**
 * Premium Step-by-Step Property Listing Wizard
 * UI-only redesign — all backend logic, field names, and Supabase calls are preserved.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Building2, Home, Castle, Landmark, Mountain, Store, Building,
  ChevronRight, ChevronLeft, Check, Upload, X, Loader2,
  Image as ImageIcon, MapPin, Eye, Sparkles, FileText, BedDouble,
  Bath, Ruler, DollarSign, Armchair,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  uploadMarketplaceImage,
  EMIRATES, PROPERTY_TYPES, FURNISHING_OPTIONS, LISTING_TYPES,
  PROPERTY_IMAGE_LIMIT,
} from '@/lib/marketplace';
import { useLanguage } from '@/contexts/LanguageContext';
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
  { labelKey: 'type', icon: DollarSign },
  { labelKey: 'property', icon: Building2 },
  { labelKey: 'details', icon: BedDouble },
  { labelKey: 'description', icon: FileText },
  { labelKey: 'photos', icon: ImageIcon },
  { labelKey: 'location', icon: MapPin },
  { labelKey: 'review', icon: Eye },
];

const LISTING_TYPE_CARDS = [
  { value: 'Sale', labelKey: 'forSale', descKey: 'descSellProperty', icon: DollarSign },
  { value: 'Rent', labelKey: 'forRent', descKey: 'descRentProperty', icon: DollarSign },
];

const PROPERTY_TYPE_CARDS = [
  { value: 'Apartment', icon: Building2, labelKey: 'apartmentCategory', descKey: 'apartmentDesc' },
  { value: 'Villa', icon: Home, labelKey: 'villaCategory', descKey: 'villaDesc' },
  { value: 'Townhouse', icon: Castle, labelKey: 'townhouseCategory', descKey: 'townhouseDesc' },
  { value: 'Penthouse', icon: Landmark, labelKey: 'penthouseCategory', descKey: 'penthouseDesc' },
  { value: 'Land', icon: Mountain, labelKey: 'landCategory', descKey: 'landDesc' },
  { value: 'Commercial', icon: Store, labelKey: 'commercialCategory', descKey: 'commercialDesc' },
  { value: 'Full Building', icon: Building, labelKey: 'fullBuildingCategory', descKey: 'fullBuildingDesc' },
];

const COMMON_AMENITIES = [
  'Swimming Pool', 'Gym', 'Parking', 'Balcony', 'Security',
  'Central A/C', 'Built-in Wardrobes', 'Concierge', 'Maid Room',
  'Pet Friendly', 'Shared Pool', 'Children Play Area', 'BBQ Area',
];

const inputCls = 'w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all';
const selectCls = inputCls;
const labelCls = 'block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide';

// ─── In-memory cache (survives tab switch, cleared on page refresh) ───
let _propertyCache: { form: Record<string, any>; images: string[]; step: number; editId: string | null } | null = null;

export default function PropertyListingWizard({ initialForm, initialImages, editId, onSave, onCancel, saving }: WizardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Restore from cache if same context (both new or same editId)
  const cached = _propertyCache && _propertyCache.editId === editId ? _propertyCache : null;

  const [step, setStep] = useState(cached?.step ?? 0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<Record<string, any>>(cached?.form ?? { ...initialForm, amenities: initialForm.amenities || [] });
  const [images, setImages] = useState<string[]>(cached?.images ?? initialImages);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Persist to in-memory cache on every change
  useEffect(() => {
    _propertyCache = { form, images, step, editId };
  }, [form, images, step, editId]);

  const clearCache = () => { _propertyCache = null; };

  const set = useCallback((key: string, val: any) => setForm(f => ({ ...f, [key]: val })), []);
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  const goNext = () => {
    if (step === 2 && !form.title?.trim()) { toast.error('Title is required'); return; }
    if (step === 5 && !form.contact_number?.trim()) { toast.error('Contact number is required'); return; }
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
    const remaining = PROPERTY_IMAGE_LIMIT - images.length;
    if (remaining <= 0) { toast.error(`Maximum ${PROPERTY_IMAGE_LIMIT} images`); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      let count = 0;
      for (const file of toUpload) {
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} too large (max 10 MB)`); continue; }
        const url = await uploadMarketplaceImage(user.id, file, 'properties');
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
      case 0: return <StepListingType form={form} set={set} />;
      case 1: return <StepPropertyType form={form} set={set} />;
      case 2: return <StepDetails form={form} set={set} />;
      case 3: return <StepDescription form={form} set={set} />;
      case 4: return (
        <StepPhotos images={images} uploading={uploading} dragOver={dragOver}
          setDragOver={setDragOver} handleDrop={handleDrop}
          handleFiles={handleFiles} removeImage={removeImage} fileRef={fileRef} />
      );
      case 5: return <StepLocation form={form} set={set} />;
      case 6: return <StepReview form={form} images={images} />;
      default: return null;
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold text-foreground">
            {editId ? t('editListing' as any) : t('addListing' as any)}
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
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${active ? 'bg-primary text-primary-foreground shadow-lg' : done ? 'bg-primary/15 text-primary' : 'bg-surface border border-border'}`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className="text-[10px] font-bold hidden sm:block">{t(s.labelKey as any)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 min-h-[340px] relative overflow-y-auto">
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          {renderStep()}
        </div>
      </div>

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
      <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}

// ═══ Step 1: Listing Type ═══
function StepListingType({ form, set }: { form: Record<string, any>; set: (k: string, v: any) => void }) {
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('whatYouWantToDo' as any)}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('chooseSellOrRent' as any)}</p>
      <div className="grid grid-cols-2 gap-4">
        {LISTING_TYPE_CARDS.map(c => {
          const active = form.listing_type === c.value;
          return (
            <button key={c.value}
              onClick={() => set('listing_type', c.value)}
              className={`relative flex flex-col items-center gap-3 p-8 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-95 text-center ${active ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-surface hover:border-primary/30 hover:bg-surface-accent'}`}>
              {active && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-200">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <DollarSign className={`h-8 w-8 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-bold text-foreground">{t(c.labelKey as any)}</span>
              <span className="text-xs text-muted-foreground">{c.value === 'Sale' ? t('descSellProperty' as any) : t('descRentProperty' as any)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══ Step 2: Property Type ═══
function StepPropertyType({ form, set }: { form: Record<string, any>; set: (k: string, v: any) => void }) {
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('propertyType' as any)}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('selectPropertyType' as any)}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {PROPERTY_TYPE_CARDS.map(c => {
          const Icon = c.icon;
          const active = form.property_type === c.value;
          return (
            <button key={c.value}
              onClick={() => set('property_type', c.value)}
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

// ═══ Step 3: Property Details ═══
function StepDetails({ form, set }: { form: Record<string, any>; set: (k: string, v: any) => void }) {
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('propertyDetails' as any)}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('keyPropertyDetails' as any)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>{t('listingTitle' as any)} *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Spacious 2BR Apartment in Marina" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('priceAed' as any)}</label>
          <input value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 1500000" type="number" inputMode="numeric" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('bedrooms')}</label>
          <input value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} placeholder="e.g. 2" type="number" inputMode="numeric" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('bathrooms')}</label>
          <input value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} placeholder="e.g. 2" type="number" inputMode="numeric" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('sizeSqft' as any)}</label>
          <input value={form.size_sqft} onChange={e => set('size_sqft', e.target.value)} placeholder="e.g. 1200" type="number" inputMode="numeric" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>{t('furnishing')}</label>
          <div className="grid grid-cols-3 gap-2">
            {FURNISHING_OPTIONS.map(f => (
              <button key={f} type="button" onClick={() => set('furnishing', f)}
                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.furnishing === f ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface text-muted-foreground hover:border-primary/30'}`}>
                {f === 'Furnished' ? t('furnished' as any) : (f === 'Unfurnished' ? t('unfurnished' as any) : t('partlyFurnished' as any))}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ Step 4: Description & Amenities ═══
function StepDescription({ form, set }: { form: Record<string, any>; set: (k: string, v: any) => void }) {
  const { t } = useLanguage();
  const amenities: string[] = form.amenities || [];
  const toggleAmenity = (a: string) => {
    set('amenities', amenities.includes(a) ? amenities.filter(x => x !== a) : [...amenities, a]);
  };

  const getAmenityTranslation = (a: string) => {
    const map: Record<string, string> = {
      'Swimming Pool': 'swimmingPool',
      'Gym': 'gym',
      'Parking': 'parking',
      'Balcony': 'balcony',
      'Security': 'security',
      'Central A/C': 'centralAC',
      'Built-in Wardrobes': 'builtInWardrobes',
      'Concierge': 'concierge',
      'Maid Room': 'maidRoom',
      'Pet Friendly': 'petFriendly',
      'Shared Pool': 'sharedPool',
      'Children Play Area': 'childrenPlayArea',
      'BBQ Area': 'bbqArea',
    };
    return map[a] ? t(map[a] as any) : a;
  };

  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('descriptionAndAmenities' as any)}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('describePropertyAmenities' as any)}</p>
      <label className={labelCls}>{t('description')}</label>
      <textarea value={form.description} onChange={e => set('description', e.target.value)}
        placeholder={t('propertyDescriptionPlaceholder' as any)}
        rows={5} className={`${inputCls} resize-none mb-5`} />
      <label className={labelCls}>{t('amenities')}</label>
      <div className="flex flex-wrap gap-2">
        {COMMON_AMENITIES.map(a => (
          <button key={a} type="button" onClick={() => toggleAmenity(a)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${amenities.includes(a) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-muted-foreground hover:border-primary/30'}`}>
            {amenities.includes(a) && <Check className="h-3 w-3 inline mr-1" />}{getAmenityTranslation(a)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══ Step 5: Photos ═══
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
      <p className="text-sm text-muted-foreground mb-5">{t('propertiesWithGreatPhotos' as any)}</p>
      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40 hover:bg-surface-accent'}`}>
        <div className="flex flex-col items-center gap-3">
          {uploading ? <Loader2 className="h-10 w-10 animate-spin text-primary" /> : (
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Upload className="h-7 w-7 text-primary" /></div>
          )}
          <div>
            <p className="font-bold text-foreground text-sm">{uploading ? t('uploading' as any) : t('dragDropPhotos' as any)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('orClickBrowse' as any)} {PROPERTY_IMAGE_LIMIT} {t('photosMaxLimit' as any)}</p>
          </div>
        </div>
      </div>
      {images.length > 0 && (
        <div className="mt-5">
          <span className="text-xs font-bold text-muted-foreground">{images.length} / {PROPERTY_IMAGE_LIMIT} photos</span>
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

// ═══ Step 6: Location & Contact ═══
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
          <input value={form.area} onChange={e => set('area', e.target.value)} placeholder="e.g. Marina, Downtown" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('community' as any)}</label>
          <input value={form.community} onChange={e => set('community', e.target.value)} placeholder="e.g. Emaar Beachfront" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('contactNumber' as any)} *</label>
          <PhoneInput value={form.contact_number} onChange={v => set('contact_number', v)} required />
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-border bg-surface-accent h-36 flex items-center justify-center">
        <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
          <MapPin className="h-8 w-8" /><span className="text-xs font-bold">{t('mapPreview' as any)}</span>
        </div>
      </div>
    </div>
  );
}

// ═══ Step 7: Review ═══
function StepReview({ form, images }: { form: Record<string, any>; images: string[] }) {
  const { t } = useLanguage();
  const getFurnishingTranslation = (f: string) => {
    return f === 'Furnished' ? t('furnished' as any) : (f === 'Unfurnished' ? t('unfurnished' as any) : (f === 'Partly Furnished' ? t('partlyFurnished' as any) : f));
  };

  const getAmenityTranslation = (a: string) => {
    const map: Record<string, string> = {
      'Swimming Pool': 'swimmingPool',
      'Gym': 'gym',
      'Parking': 'parking',
      'Balcony': 'balcony',
      'Security': 'security',
      'Central A/C': 'centralAC',
      'Built-in Wardrobes': 'builtInWardrobes',
      'Concierge': 'concierge',
      'Maid Room': 'maidRoom',
      'Pet Friendly': 'petFriendly',
      'Shared Pool': 'sharedPool',
      'Children Play Area': 'childrenPlayArea',
      'BBQ Area': 'bbqArea',
    };
    return map[a] ? t(map[a] as any) : a;
  };

  const specs = [
    form.property_type ? t(PROPERTY_TYPE_CARDS.find(c => c.value === form.property_type)?.labelKey as any) : '',
    form.listing_type ? (form.listing_type === 'Sale' ? t('forSale' as any) : t('forRent' as any)) : '',
    form.bedrooms && `${form.bedrooms} ${t('bedrooms')}`,
    form.bathrooms && `${form.bathrooms} ${t('bathrooms')}`,
    form.size_sqft && `${Number(form.size_sqft).toLocaleString()} sqft`,
    form.furnishing && getFurnishingTranslation(form.furnishing),
  ].filter(Boolean);

  const amenities: string[] = form.amenities || [];

  return (
    <div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{t('reviewPublish' as any)}</h3>
      <p className="text-sm text-muted-foreground mb-5">{t('reviewPublishProperty' as any)}</p>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {images.length > 0 ? (
          <div className="relative h-48 sm:h-56">
            <img src={images[0]} alt="" className="w-full h-full object-cover" />
            {images.length > 1 && <span className="absolute bottom-2 right-2 bg-foreground/60 text-primary-foreground text-xs font-bold px-2 py-1 rounded-lg">+{images.length - 1} {t('photos')}</span>}
          </div>
        ) : (
          <div className="h-48 bg-surface-accent flex items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground/30" /></div>
        )}
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-display font-bold text-foreground text-lg leading-tight">{form.title || t('untitledListing' as any)}</h4>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /><span>{form.emirate}{form.area ? `, ${form.area}` : ''}{form.community ? ` — ${form.community}` : ''}</span>
              </div>
            </div>
            {form.price && (
              <span className="text-lg font-bold text-primary whitespace-nowrap">
                AED {Number(form.price).toLocaleString()}{form.listing_type === 'Rent' ? '/yr' : ''}
              </span>
            )}
          </div>
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {specs.map((s, i) => (
                <span key={i} className="text-[11px] font-bold bg-surface-accent text-muted-foreground px-2 py-1 rounded-lg">{s}</span>
              ))}
            </div>
          )}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {amenities.map(a => (
                <span key={a} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{getAmenityTranslation(a)}</span>
              ))}
            </div>
          )}
          {form.description && <p className="text-xs text-muted-foreground line-clamp-3">{form.description}</p>}
        </div>
      </div>
    </div>
  );
}
