import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, ChevronLeft, ChevronRight, Loader2, X, Sparkles } from 'lucide-react';
import PlateCard from '@/components/PlateCard';

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];
const EMIRATE_KEY_MAP: Record<string, string> = {
  'Abu Dhabi': 'abudhabi', 'Dubai': 'dubai', 'Sharjah': 'sharjah', 'Ajman': 'ajman',
  'Umm Al Quwain': 'umm_al_quwain', 'Ras Al Khaimah': 'rak', 'Fujairah': 'fujairah',
};
const PAGE_SIZE = 12;

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
  vehicle_type?: string;
}

export default function MarketplacePage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emirateFilter, setEmirateFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const paramEmirate = searchParams.get('emirate');
    if (paramEmirate) {
      const match = EMIRATES.find(e => e.toLowerCase() === paramEmirate.toLowerCase());
      if (match) setEmirateFilter(match);
      else setEmirateFilter(paramEmirate);
    }
    const paramVehicleType = searchParams.get('vehicleType');
    if (paramVehicleType === 'bike' || paramVehicleType === 'car') {
      setVehicleTypeFilter(paramVehicleType);
    }
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' }) // vehicle_type is included in * if column exists
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) query = query.ilike('plate_number', `%${search.trim()}%`);
    if (emirateFilter) query = query.eq('emirate', emirateFilter);
    if (vehicleTypeFilter === 'bike') query = query.eq('plate_style', 'bike');
    else if (vehicleTypeFilter === 'car') query = query.neq('plate_style', 'bike');
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));

    const { data, count, error } = await query;
    if (error) console.error(error);
    else {
      setListings((data || []) as unknown as ListingWithSeller[]);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [search, emirateFilter, vehicleTypeFilter, minPrice, maxPrice, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const resetFilters = () => { setSearch(''); setEmirateFilter(''); setVehicleTypeFilter(''); setMinPrice(''); setMaxPrice(''); setPage(0); };
  const hasFilters = search || emirateFilter || vehicleTypeFilter || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">

        {/* ─── Premium Plate Banner ─── */}
        <div className="relative rounded-3xl overflow-hidden mb-10 border border-gray-200/60 shadow-sm" style={{ background: 'linear-gradient(135deg, #fafaf9 0%, #ffffff 30%, #f5f3ef 60%, #faf8f5 100%)' }}>
          {/* Skyline silhouette overlay (right) */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,200 L0,180 L30,180 L30,120 L35,120 L35,100 L40,100 L40,120 L45,120 L45,180 L80,180 L80,140 L85,140 L85,60 L87,55 L89,60 L89,140 L95,140 L95,180 L130,180 L130,150 L140,150 L140,130 L150,130 L150,150 L160,150 L160,180 L200,180 L200,160 L210,160 L210,40 L213,10 L216,40 L216,160 L220,160 L220,180 L260,180 L260,150 L280,150 L280,130 L290,130 L290,170 L310,170 L310,140 L325,140 L325,170 L340,170 L340,180 L380,180 L380,160 L400,160 L400,120 L405,120 L405,80 L410,75 L415,80 L415,120 L420,120 L420,160 L440,160 L440,180 L500,180 L500,140 L520,140 L520,110 L540,110 L540,140 L560,140 L560,180 L600,180 L600,155 L620,155 L620,130 L630,130 L630,155 L650,155 L650,180 L700,180 L700,160 L730,160 L730,140 L750,140 L750,160 L780,160 L780,180 L800,180 L800,200 Z' fill='%23000' opacity='0.5'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom', backgroundSize: '70% auto' }} />

          {/* Warm golden glow effects */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-amber-100/40 to-orange-50/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-amber-50/30 to-yellow-50/10 blur-3xl" />

          {/* Floating plate numbers (decorative) */}
          <div className="absolute top-4 right-[15%] text-amber-300/[0.08] text-2xl font-mono font-black tracking-widest select-none hidden md:block" style={{ transform: 'rotate(-8deg)' }}>780 700,000</div>
          <div className="absolute top-12 right-[5%] text-amber-300/[0.08] text-xl font-mono font-black tracking-widest select-none hidden md:block" style={{ transform: 'rotate(5deg)' }}>050007 7777</div>
          <div className="absolute bottom-8 right-[8%] text-amber-300/[0.08] text-lg font-mono font-black tracking-widest select-none hidden md:block" style={{ transform: 'rotate(-3deg)' }}>055 777 7777</div>
          <div className="absolute bottom-20 left-[55%] text-amber-300/[0.06] text-base font-mono font-black tracking-widest select-none hidden md:block" style={{ transform: 'rotate(6deg)' }}>051 95,000</div>

          {/* Fine dot pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />

          {/* UAE flag stripe accent (top) */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-white to-red-500 opacity-30" />

          <div className="relative px-8 md:px-14 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
            {/* Left: Text content */}
            <div className="flex-1 text-center md:text-start z-10">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Premium Collection</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-black text-gray-900 tracking-tight mb-3 leading-tight">
                Number Plate<br />Marketplace
              </h1>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-md">
                Explore exclusive UAE number plates across all Emirates.<br className="hidden md:block" /> Find your dream plate today.
              </p>
              <Link to="/mobile-numbers" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors border border-gray-200 rounded-full px-5 py-2.5 bg-white hover:bg-gray-50 shadow-sm">
                Browse VIP Phone Numbers →
              </Link>
            </div>

            {/* Right: Floating plate images collage */}
            <div className="flex-shrink-0 relative w-64 h-48 hidden md:block">
              {/* Main plate */}
              <div className="absolute top-4 left-6 bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-2.5 transform -rotate-3 hover:rotate-0 transition-transform duration-300 z-20">
                <img src="/dubai-plate.png" alt="Dubai Plate" className="h-11 w-auto object-contain" />
                <p className="text-[9px] font-mono text-gray-400 text-center mt-1">AED 1,250,000</p>
              </div>
              {/* Secondary plates */}
              <div className="absolute top-0 right-0 bg-white rounded-lg border border-gray-200 shadow-md px-3 py-2 transform rotate-3 hover:rotate-0 transition-transform duration-300 z-10">
                <img src="/abudhabi-plate.png" alt="Abu Dhabi Plate" className="h-8 w-auto object-contain" />
              </div>
              <div className="absolute bottom-4 left-0 bg-white rounded-lg border border-gray-200 shadow-md px-3 py-2 transform rotate-2 hover:rotate-0 transition-transform duration-300 z-10">
                <img src="/sharjah-plate.png" alt="Sharjah Plate" className="h-8 w-auto object-contain" />
              </div>
              <div className="absolute bottom-0 right-4 bg-white rounded-lg border border-gray-200 shadow-md px-3 py-2 transform -rotate-2 hover:rotate-0 transition-transform duration-300 z-10">
                <img src="/rak-plate.png" alt="RAK Plate" className="h-8 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">{t('activeListings')}</h2>
          <span className="text-sm text-muted-foreground font-mono">{total} plates</span>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder={t('searchPlaceholder')} />
            </div>
            <select value={emirateFilter} onChange={e => { setEmirateFilter(e.target.value); setPage(0); }}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">{t('allEmirates')}</option>
              {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
            </select>
            <select value={vehicleTypeFilter} onChange={e => { setVehicleTypeFilter(e.target.value); setPage(0); }}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">{t('allTypes')}</option>
              <option value="car">{t('car')}</option>
              <option value="bike">{t('bike')}</option>
            </select>
            <input type="number" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(0); }}
              placeholder={t('minPrice')}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(0); }}
              placeholder={t('maxPrice')}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className="mt-3 text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              <X className="h-3 w-3" /> {t('resetFilters')}
            </button>
          )}
        </div>

        {/* Listings Grid — now using PlateCard with flip */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">{t('noResults')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {listings.map(listing => {
              const parts = listing.plate_number.split(' ');
              const code = parts.length > 1 ? parts[0] : '';
              const number = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
              const emirateKey = EMIRATE_KEY_MAP[listing.emirate] || listing.emirate.toLowerCase().replace(/\s+/g, '_');

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
                  plateStyle={listing.plate_style === 'bike' ? 'bike' : 'private'}
                />
              );
            })}
          </div>
        )}

        {/* Pagination */}
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
