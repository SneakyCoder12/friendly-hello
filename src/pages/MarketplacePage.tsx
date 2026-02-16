import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
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
  profiles: { full_name: string | null; phone_number: string | null } | null;
}

export default function MarketplacePage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emirateFilter, setEmirateFilter] = useState('');
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
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(full_name, phone_number)', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) query = query.ilike('plate_number', `%${search.trim()}%`);
    if (emirateFilter) query = query.eq('emirate', emirateFilter);
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));

    const { data, count, error } = await query;
    if (error) console.error(error);
    else {
      setListings((data || []) as unknown as ListingWithSeller[]);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [search, emirateFilter, minPrice, maxPrice, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const resetFilters = () => { setSearch(''); setEmirateFilter(''); setMinPrice(''); setMaxPrice(''); setPage(0); };
  const hasFilters = search || emirateFilter || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">{t('activeListings')}</h1>
          <span className="text-sm text-muted-foreground font-mono">{total} plates</span>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                  sellerPhone={listing.profiles?.phone_number}
                  plateNumber={listing.plate_number}
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
