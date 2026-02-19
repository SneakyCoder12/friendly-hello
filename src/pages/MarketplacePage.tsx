import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, ChevronLeft, ChevronRight, Loader2, X, Sparkles, Settings } from 'lucide-react';
import PlateCard from '@/components/PlateCard';

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
  price: number | null;
  description: string | null;
  status: string;
  created_at: string;
  user_id: string;
  contact_phone: string | null;
}

export default function MarketplacePage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emirateFilter, setEmirateFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [digitCountFilter, setDigitCountFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  useEffect(() => {
    const paramEmirate = searchParams.get('emirate');
    if (paramEmirate) {
      const match = EMIRATES.find(e => e.toLowerCase() === paramEmirate.toLowerCase());
      setEmirateFilter(match || paramEmirate);
    }
    const paramVehicleType = searchParams.get('vehicleType');
    if (paramVehicleType === 'bike' || paramVehicleType === 'car' || paramVehicleType === 'classic') {
      setVehicleTypeFilter(paramVehicleType);
    }
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) query = query.ilike('plate_number', `%${search.trim()}%`);
    if (emirateFilter) query = query.eq('emirate', emirateFilter);
    if (vehicleTypeFilter === 'bike') query = query.eq('plate_style', 'bike');
    else if (vehicleTypeFilter === 'classic') query = query.eq('plate_style', 'classic');
    else if (vehicleTypeFilter === 'car') query = query.not('plate_style', 'in', '("bike","classic")');
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));

    const { data, count, error } = await query;
    if (error) { console.error(error); setLoading(false); return; }

    let result = (data || []) as unknown as ListingWithSeller[];
    // Client-side digit count filter
    if (digitCountFilter) {
      result = result.filter(l => {
        const numPart = l.plate_number.split(' ').pop() || l.plate_number;
        return numPart.replace(/\D/g, '').length === Number(digitCountFilter);
      });
    }
    setListings(result);
    setTotal(digitCountFilter ? result.length : (count || 0));
    setLoading(false);
  }, [search, emirateFilter, vehicleTypeFilter, digitCountFilter, minPrice, maxPrice, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const resetFilters = () => {
    setSearch(''); setEmirateFilter(''); setVehicleTypeFilter('');
    setDigitCountFilter(''); setMinPrice(''); setMaxPrice(''); setPage(0);
  };
  const hasFilters = search || emirateFilter || vehicleTypeFilter || digitCountFilter || minPrice || maxPrice;
  const activeFilterCount = [emirateFilter, vehicleTypeFilter, digitCountFilter, minPrice || maxPrice].filter(Boolean).length;

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-surface'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-24">

        {/* ─── Premium Plate Banner ─── */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-8 sm:mb-10 border border-border/60 shadow-sm bg-gradient-to-br from-surface via-card to-surface">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,200 L0,180 L30,180 L30,120 L35,120 L35,100 L40,100 L40,120 L45,120 L45,180 L80,180 L80,140 L85,140 L85,60 L87,55 L89,60 L89,140 L95,140 L95,180 L130,180 L130,150 L140,150 L140,130 L150,130 L150,150 L160,150 L160,180 L200,180 L200,160 L210,160 L210,40 L213,10 L216,40 L216,160 L220,160 L220,180 L260,180 L260,150 L280,150 L280,130 L290,130 L290,170 L310,170 L310,140 L325,140 L325,170 L340,170 L340,180 L380,180 L380,160 L400,160 L400,120 L405,120 L405,80 L410,75 L415,80 L415,120 L420,120 L420,160 L440,160 L440,180 L500,180 L500,140 L520,140 L520,110 L540,110 L540,140 L560,140 L560,180 L600,180 L600,155 L620,155 L620,130 L630,130 L630,155 L650,155 L650,180 L700,180 L700,160 L730,160 L730,140 L750,140 L750,160 L780,160 L780,180 L800,180 L800,200 Z' fill='%23000' opacity='0.5'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom', backgroundSize: '70% auto' }} />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-white to-red-500 opacity-30" />

          <div className="relative px-5 sm:px-8 md:px-14 py-8 sm:py-12 md:py-16 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            <div className="flex-1 text-center md:text-start z-10">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Premium Collection</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-display font-black text-foreground tracking-tight mb-3 leading-tight">
                Number Plate<br />Marketplace
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-md">
                Explore exclusive UAE number plates across all Emirates. Find your dream plate today.
              </p>
              <Link to="/mobile-numbers" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors border border-border rounded-full px-5 py-2.5 bg-card hover:bg-surface shadow-sm">
                Browse VIP Phone Numbers →
              </Link>
            </div>

            <div className="flex-shrink-0 relative w-64 h-48 hidden md:block">
              <div className="absolute top-4 left-6 bg-card rounded-xl border border-border shadow-lg px-4 py-2.5 transform -rotate-3 hover:rotate-0 transition-transform duration-300 z-20">
                <img src="/dubai-plate.png" alt="Dubai Plate" className="h-11 w-auto object-contain" />
              </div>
              <div className="absolute top-0 right-0 bg-card rounded-lg border border-border shadow-md px-3 py-2 transform rotate-3 hover:rotate-0 transition-transform duration-300 z-10">
                <img src="/abudhabi-plate.png" alt="Abu Dhabi Plate" className="h-8 w-auto object-contain" />
              </div>
              <div className="absolute bottom-4 left-0 bg-card rounded-lg border border-border shadow-md px-3 py-2 transform rotate-2 hover:rotate-0 transition-transform duration-300 z-10">
                <img src="/sharjah-plate.png" alt="Sharjah Plate" className="h-8 w-auto object-contain" />
              </div>
              <div className="absolute bottom-0 right-4 bg-card rounded-lg border border-border shadow-md px-3 py-2 transform -rotate-2 hover:rotate-0 transition-transform duration-300 z-10">
                <img src="/rak-plate.png" alt="RAK Plate" className="h-8 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* ── HEADER ROW ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-display font-bold text-foreground">{t('activeListings')}</h2>
            <span className="text-sm text-muted-foreground font-mono">{total} plates</span>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button onClick={resetFilters} className="hidden sm:flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
            {/* Mobile gear */}
            <button
              onClick={() => setFilterPanelOpen(true)}
              className="sm:hidden relative flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border shadow-sm"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
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

        {/* ── MOBILE SLIDE-UP FILTER PANEL ── */}
        {filterPanelOpen && (
          <>
            <div className="sm:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setFilterPanelOpen(false)} />
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
              <div className="sticky top-0 bg-card p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">Filters</h3>
                <button onClick={() => setFilterPanelOpen(false)} className="p-2">
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>
              <div className="p-4 space-y-5">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                    className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground"
                    placeholder="Search plate number..." />
                </div>

                {/* Emirate */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Emirate</label>
                  <div className="flex flex-wrap gap-2">
                    <Chip label="All" active={emirateFilter === ''} onClick={() => { setEmirateFilter(''); setPage(0); }} />
                    {EMIRATES.map(em => (
                      <Chip key={em} label={em} active={emirateFilter === em} onClick={() => { setEmirateFilter(emirateFilter === em ? '' : em); setPage(0); }} />
                    ))}
                  </div>
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Vehicle Type</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATE_TYPE_CHIPS.map(c => (
                      <Chip key={c.value} label={c.label} active={vehicleTypeFilter === c.value}
                        onClick={() => { setVehicleTypeFilter(c.value); setPage(0); }} />
                    ))}
                  </div>
                </div>

                {/* Digit Count */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Number of Digits</label>
                  <div className="flex flex-wrap gap-2">
                    {DIGIT_COUNT_CHIPS.map(c => (
                      <Chip key={c.value} label={c.label || 'Any'} active={digitCountFilter === c.value}
                        onClick={() => { setDigitCountFilter(c.value); setPage(0); }} />
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Price Range (AED)</label>
                  <div className="flex gap-2">
                    <input type="number" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(0); }}
                      placeholder="Min" className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
                    <input type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(0); }}
                      placeholder="Max" className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button onClick={resetFilters} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground">
                    Clear All
                  </button>
                  <button onClick={() => setFilterPanelOpen(false)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                    Show {total} Results
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── LISTINGS GRID ── */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">{t('noResults')}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 mb-8">
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
                  plateUrl={`/plate/${listing.id}`}
                  sellerPhone={listing.contact_phone}
                  plateNumber={listing.plate_number}
                  listingId={listing.id}
                  status={listing.status}
                  plateStyle={resolvedPlateStyle}
                  vehicleType={rawStyle === 'bike' ? 'bike' : rawStyle === 'classic' ? 'classic' : 'car'}
                />
              );
            })}
          </div>
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
      </div>
    </div>
  );
}
