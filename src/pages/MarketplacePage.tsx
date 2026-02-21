import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, ChevronLeft, ChevronRight, Loader2, X, Sparkles, SlidersHorizontal, ChevronDown, Settings, ArrowRight } from 'lucide-react';
import PlateCard from '@/components/PlateCard';
import ListWithUsBanner from '@/components/ListWithUsBanner';
import { generatePlateSlug } from '@/utils/plateUrl';

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];
const EMIRATE_KEY_MAP: Record<string, string> = {
  'Abu Dhabi': 'abudhabi', 'Dubai': 'dubai', 'Sharjah': 'sharjah', 'Ajman': 'ajman',
  'Umm Al Quwain': 'umm_al_quwain', 'Ras Al Khaimah': 'rak', 'Fujairah': 'fujairah',
};
const PAGE_SIZE = 12;

const PLATE_TYPE_CHIPS = [
  { label: 'All', value: '' },
  { label: 'Car', value: 'car' },
  { label: 'Motorbike', value: 'bike' },
  { label: 'Classic', value: 'classic' },
];
const DIGIT_COUNT_CHIPS = [
  { label: 'Any', value: '' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
];

interface ListingWithSeller {
  id: string;
  plate_number: string;
  emirate: string;
  plate_style: string | null;
  plate_image_url: string | null;
  price: number | null;
  description: string | null;
  status: string;
  created_at: string;
  user_id: string;
  contact_phone: string | null;
}

/** Searchable combobox for plate codes */
function CodeCombobox({
  codes, value, onChange, className = '',
}: { codes: string[]; value: string; onChange: (v: string) => void; className?: string }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? codes.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : codes;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (code: string) => { onChange(code); setQuery(''); setOpen(false); };
  const clear = () => { onChange(''); setQuery(''); setOpen(false); };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        className={`flex items-center gap-1.5 bg-surface border rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all focus-within:ring-2 focus-within:ring-primary/30 ${open ? 'border-primary/50' : 'border-border'}`}
        onClick={() => setOpen(o => !o)}
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <input
          value={open ? query : (value || '')}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onClick={e => { e.stopPropagation(); setOpen(true); }}
          placeholder={value || 'All Codes'}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0 w-20"
        />
        {value ? (
          <button onClick={e => { e.stopPropagation(); clear(); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:bg-surface transition-colors"
              onClick={() => clear()}
            >
              All Codes
            </button>
            {filtered.map(code => (
              <button
                key={code}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface ${value === code ? 'bg-primary/10 text-primary font-bold' : 'text-foreground'}`}
                onClick={() => select(code)}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emirateFilter, setEmirateFilter] = useState(() => {
    const param = searchParams.get('emirate');
    if (param) {
      const match = EMIRATES.find(e => e.toLowerCase() === param.toLowerCase());
      return match || param;
    }
    return '';
  });
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState(() => {
    const param = searchParams.get('vehicleType');
    return (param === 'bike' || param === 'car' || param === 'classic') ? param : '';
  });
  const [digitCountFilter, setDigitCountFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [availableCodes, setAvailableCodes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Lock body scroll when mobile filter panel is open
  useEffect(() => {
    if (filterPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [filterPanelOpen]);
  // Removed param extraction effect since it's now handled entirely in the initial state

  // Fetch available plate codes for filter dropdown
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('listings')
        .select('plate_style')
        .in('status', ['active', 'sold']);
      if (data) {
        const codes = [...new Set(
          data.map(d => d.plate_style).filter((s): s is string => !!s && s !== 'bike' && s !== 'classic')
        )].sort();
        setAvailableCodes(codes);
      }
    })();
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) query = query.ilike('plate_number', `%${search.trim()}%`);
    if (emirateFilter) {
      const dbKey = EMIRATE_KEY_MAP[emirateFilter] || emirateFilter;
      query = query.in('emirate', [emirateFilter, dbKey, emirateFilter.toLowerCase(), emirateFilter.toUpperCase()]);
    }
    if (vehicleTypeFilter === 'bike') query = query.eq('plate_style', 'bike');
    else if (vehicleTypeFilter === 'classic') query = query.eq('plate_style', 'classic');
    else if (vehicleTypeFilter === 'car') query = query.not('plate_style', 'in', '("bike","classic")');
    if (codeFilter) query = query.eq('plate_style', codeFilter);
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));

    const { data, count, error } = await query;
    if (error) { console.error(error); setLoading(false); return; }

    let result = (data || []) as unknown as ListingWithSeller[];
    if (digitCountFilter) {
      result = result.filter(l => {
        const numPart = l.plate_number.split(' ').pop() || l.plate_number;
        return numPart.replace(/\D/g, '').length === Number(digitCountFilter);
      });
    }
    setListings(result);
    setTotal(digitCountFilter ? result.length : (count || 0));
    setLoading(false);
  }, [search, emirateFilter, vehicleTypeFilter, digitCountFilter, codeFilter, minPrice, maxPrice, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const resetFilters = () => {
    setSearch(''); setEmirateFilter(''); setVehicleTypeFilter('');
    setDigitCountFilter(''); setCodeFilter(''); setMinPrice(''); setMaxPrice(''); setPage(0);
  };
  const hasFilters = search || emirateFilter || vehicleTypeFilter || digitCountFilter || codeFilter || minPrice || maxPrice;
  const activeFilterCount = [emirateFilter, vehicleTypeFilter, digitCountFilter, codeFilter, minPrice || maxPrice].filter(Boolean).length;

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${active
        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
        : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-surface'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-background overflow-x-hidden md:min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-28">

        {/* ── HEADER ROW ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">{t('activeListings')}</h2>
            <span className="hidden sm:inline-block text-sm text-muted-foreground font-mono">{total} plates</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 h-10 bg-primary text-primary-foreground font-bold text-[10px] sm:text-sm rounded-xl shadow-sm hover:bg-primary/90 transition-all whitespace-nowrap"
            >
              List <span className="hidden sm:inline">Your </span>Number
            </Link>
            {hasFilters && (
              <button onClick={resetFilters} className="hidden sm:flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
            {/* Mobile filter button */}
            <button
              onClick={() => setFilterPanelOpen(true)}
              className="sm:hidden relative flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-card border border-border shadow-sm hover:bg-surface transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow-md">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── DESKTOP FILTERS ── */}
        <div className="hidden sm:block bg-card border border-border rounded-2xl p-4 mb-6">
          {/* Row 1: Search + Emirate */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder={t('searchPlaceholder')} />
            </div>
            <select value={emirateFilter} onChange={e => { setEmirateFilter(e.target.value); setPage(0); }}
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[150px]">
              <option value="">{t('allEmirates')}</option>
              {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
            </select>
            {availableCodes.length > 0 && (
              <CodeCombobox
                codes={availableCodes}
                value={codeFilter}
                onChange={v => { setCodeFilter(v); setPage(0); }}
                className="min-w-[150px]"
              />
            )}
            <div className="flex gap-2 items-center">
              <input type="number" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(0); }}
                placeholder="Min AED"
                className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-28" />
              <span className="text-muted-foreground text-sm">–</span>
              <input type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(0); }}
                placeholder="Max AED"
                className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-28" />
            </div>
          </div>

          {/* Row 2: Chip filters */}
          <div className="flex flex-wrap gap-4">
            {/* Vehicle type chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Type:</span>
              {PLATE_TYPE_CHIPS.map(c => (
                <Chip key={c.value} label={c.label} active={vehicleTypeFilter === c.value}
                  onClick={() => { setVehicleTypeFilter(c.value); setPage(0); }} />
              ))}
            </div>
            {/* Divider */}
            <div className="w-px bg-border self-stretch" />
            {/* Digit count chips */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Digits:</span>
              {DIGIT_COUNT_CHIPS.map(c => (
                <Chip key={c.value} label={c.label} active={digitCountFilter === c.value}
                  onClick={() => { setDigitCountFilter(c.value); setPage(0); }} />
              ))}
            </div>
          </div>

          {hasFilters && (
            <button onClick={resetFilters} className="mt-3 text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              <X className="h-3 w-3" /> {t('resetFilters')}
            </button>
          )}
        </div>

        {/* ── MOBILE FULL-SCREEN FILTER OVERLAY ── */}
        {/* Backdrop */}
        <div
          className={`sm:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${filterPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setFilterPanelOpen(false)}
        />
        <div
          className={`sm:hidden fixed inset-0 z-[101] bg-background transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col pt-20 sm:pt-0 ${filterPanelOpen ? 'translate-y-0 opacity-100 visible' : 'translate-y-full opacity-0 invisible'}`}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-border bg-card">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">Filters</h3>
              <p className="text-xs text-muted-foreground">{total} plates found</p>
            </div>
            <button
              onClick={() => setFilterPanelOpen(false)}
              className="h-11 w-11 rounded-full bg-surface border-2 border-border flex items-center justify-center text-foreground hover:bg-gray-200 transition-all active:scale-95"
              aria-label="Close filters"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-5 mt-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Search plate number..." />
            </div>

            {/* Emirate */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 block">Emirate</label>
              <div className="flex flex-wrap gap-2">
                <Chip label="All" active={emirateFilter === ''} onClick={() => { setEmirateFilter(''); setPage(0); }} />
                {EMIRATES.map(em => (
                  <Chip key={em} label={em} active={emirateFilter === em} onClick={() => { setEmirateFilter(emirateFilter === em ? '' : em); setPage(0); }} />
                ))}
              </div>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 block">Vehicle Type</label>
              <div className="flex flex-wrap gap-2">
                {PLATE_TYPE_CHIPS.map(c => (
                  <Chip key={c.value} label={c.label} active={vehicleTypeFilter === c.value}
                    onClick={() => { setVehicleTypeFilter(c.value); setPage(0); }} />
                ))}
              </div>
            </div>

            {/* Digit Count */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 block">Number of Digits</label>
              <div className="flex flex-wrap gap-2">
                {DIGIT_COUNT_CHIPS.map(c => (
                  <Chip key={c.value} label={c.label || 'Any'} active={digitCountFilter === c.value}
                    onClick={() => { setDigitCountFilter(c.value); setPage(0); }} />
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 block">Price Range (AED)</label>
              <div className="flex gap-2">
                <input type="number" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(0); }}
                  placeholder="Min" className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(0); }}
                  placeholder="Max" className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            {/* Plate Code */}
            {availableCodes.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 block">Plate Code</label>
                <CodeCombobox
                  codes={availableCodes}
                  value={codeFilter}
                  onChange={v => { setCodeFilter(v); setPage(0); }}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Sticky footer buttons */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-card flex gap-2">
            <button onClick={resetFilters} className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-surface transition-colors">
              Clear All
            </button>
            <button onClick={() => setFilterPanelOpen(false)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm">
              Show {total} Results
            </button>
          </div>
        </div>

        {/* ── LISTINGS GRID ── */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">{t('noResults')}</div>
        ) : (
          <>
            <div className="sm:hidden mb-4 text-center">
              <p className="text-[10px] text-muted-foreground/80 max-w-sm mx-auto px-4 leading-tight">
                <span className="font-bold">Notice:</span> We facilitate connections but are not liable for private transactions between buyers and sellers.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6 mb-8">
              {listings.map(listing => {
                const parts = listing.plate_number.split(' ');
                const code = parts.length > 1 ? parts[0] : '';
                const number = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
                const emirateKey = EMIRATE_KEY_MAP[listing.emirate] || listing.emirate.toLowerCase().replace(/\s+/g, '_');
                const rawStyle = listing.plate_style;
                const resolvedPlateStyle: 'private' | 'bike' | 'classic' =
                  rawStyle === 'bike' ? 'bike' : rawStyle === 'classic' ? 'classic' : 'private';

                return (
                  <PlateCard
                    key={listing.id}
                    emirate={emirateKey}
                    code={code}
                    number={number}
                    price={listing.price ? `AED ${listing.price.toLocaleString()}` : undefined}
                    plateUrl={`/plate/${generatePlateSlug(listing)}`}
                    sellerPhone={listing.contact_phone}
                    plateNumber={listing.plate_number}
                    listingId={listing.id}
                    status={listing.status}
                    plateStyle={resolvedPlateStyle}
                    vehicleType={rawStyle === 'bike' ? 'bike' : rawStyle === 'classic' ? 'classic' : 'car'}
                    plateImageUrl={listing.plate_image_url}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-surface transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-muted-foreground font-mono">{t('page')} {page + 1} {t('of')} {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-surface transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-8 sm:mt-12 flex flex-col items-center justify-center text-center">
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base hover:bg-primary/90 transition-all shadow-md">
            List Your Number
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
