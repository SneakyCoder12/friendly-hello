import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, ChevronLeft, ChevronRight, Loader2, X, Smartphone, Star, Phone, MessageCircle, Heart, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

interface MobileListing {
    id: string;
    phone_number: string;
    carrier: string;
    price: number | null;
    description: string | null;
    contact_phone: string | null;
    status: string;
    created_at: string;
}

export default function MobileNumbersPage() {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [listings, setListings] = useState<MobileListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [carrierFilter, setCarrierFilter] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    // Read carrier from URL param
    useEffect(() => {
        const paramCarrier = searchParams.get('carrier');
        if (paramCarrier && ['du', 'etisalat'].includes(paramCarrier.toLowerCase())) {
            setCarrierFilter(paramCarrier.toLowerCase());
        }
    }, [searchParams]);

    // Fetch user favorites
    useEffect(() => {
        if (!user) return;
        (async () => {
            const { data } = await supabase
                .from('favorites')
                .select('listing_id')
                .eq('user_id', user.id)
                .eq('listing_type', 'mobile_number');
            if (data) setFavoriteIds(new Set(data.map(f => f.listing_id)));
        })();
    }, [user]);

    const toggleFavorite = async (e: React.MouseEvent, listingId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) { toast.error('Please log in to save favorites'); return; }
        const isFav = favoriteIds.has(listingId);
        if (isFav) {
            await supabase.from('favorites').delete()
                .eq('user_id', user.id)
                .eq('listing_type', 'mobile_number')
                .eq('listing_id', listingId);
            setFavoriteIds(prev => { const s = new Set(prev); s.delete(listingId); return s; });
        } else {
            await supabase.from('favorites').insert({
                user_id: user.id,
                listing_type: 'mobile_number',
                listing_id: listingId,
            });
            setFavoriteIds(prev => new Set(prev).add(listingId));
        }
    };

    const fetchListings = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('mobile_numbers')
            .select('*', { count: 'exact' })
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (search.trim()) query = query.ilike('phone_number', `%${search.trim()}%`);
        if (carrierFilter) query = query.eq('carrier', carrierFilter);
        if (minPrice) query = query.gte('price', Number(minPrice));
        if (maxPrice) query = query.lte('price', Number(maxPrice));

        const { data, count, error } = await query;
        if (error) console.error(error);
        else {
            setListings((data || []) as unknown as MobileListing[]);
            setTotal(count || 0);
        }
        setLoading(false);
    }, [search, carrierFilter, minPrice, maxPrice, page]);

    useEffect(() => { fetchListings(); }, [fetchListings]);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const resetFilters = () => { setSearch(''); setCarrierFilter(''); setMinPrice(''); setMaxPrice(''); setPage(0); };
    const hasFilters = search || carrierFilter || minPrice || maxPrice;

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-8 pt-24">

                {/* ─── Elegant White Banner ─── */}
                <div className="relative rounded-3xl overflow-hidden mb-10 bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 shadow-sm">
                    {/* Decorative circles */}
                    <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-blue-100/60 to-emerald-100/40 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-gradient-to-tr from-emerald-100/50 to-blue-100/30 blur-3xl" />
                    {/* Fine dot pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)', backgroundSize: '18px 18px' }} />

                    <div className="relative px-8 md:px-14 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 text-center md:text-start">
                            <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                                <Smartphone className="h-4 w-4 text-gray-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">VIP Collection</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-display font-black text-gray-900 tracking-tight mb-3">
                                Premium Mobile Numbers
                            </h1>
                            <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-lg">
                                Browse exclusive Du and Etisalat VIP numbers. Find the perfect number that stands out.
                            </p>
                            <Link
                                to="/marketplace"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors border border-gray-200 rounded-full px-5 py-2.5 bg-white hover:bg-gray-50 shadow-sm"
                            >
                                Browse Plate Numbers <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        {/* Carrier Logos */}
                        <div className="flex gap-4">
                            <div className="h-20 w-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                                <img src="/du-logo.png" alt="Du" className="h-10 w-10 object-contain" />
                            </div>
                            <div className="h-20 w-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                                <img src="/Eand_Logo.svg" alt="Etisalat" className="h-10 w-10 object-contain" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-display font-bold text-gray-900">Active Listings</h2>
                    <span className="text-sm text-gray-400 font-mono">{total} numbers</span>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                                className="w-full bg-white border border-gray-200 rounded-xl ps-10 pe-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                placeholder="Search numbers..." />
                        </div>
                        <select value={carrierFilter} onChange={e => { setCarrierFilter(e.target.value); setPage(0); }}
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300">
                            <option value="">All Carriers</option>
                            <option value="du">Du</option>
                            <option value="etisalat">Etisalat</option>
                        </select>
                        <input type="number" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(0); }}
                            placeholder="Min Price (AED)"
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300" />
                        <input type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(0); }}
                            placeholder="Max Price (AED)"
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300" />
                    </div>
                    {hasFilters && (
                        <button onClick={resetFilters} className="mt-3 text-xs text-gray-700 font-bold flex items-center gap-1 hover:underline">
                            <X className="h-3 w-3" /> Reset Filters
                        </button>
                    )}
                </div>

                {/* Listings Grid */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-20">
                        <Smartphone className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No numbers found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {listings.map(item => {
                            const isFav = favoriteIds.has(item.id);
                            const phoneDigits = item.contact_phone?.replace(/\D/g, '') || '';
                            const whatsappUrl = phoneDigits
                                ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hi, I'm interested in the number ${item.phone_number}.`)}`
                                : null;
                            const telUrl = phoneDigits ? `tel:+${phoneDigits}` : null;

                            return (
                                <Link
                                    key={item.id}
                                    to={`/mobile-number/${item.id}`}
                                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group block"
                                >
                                    {/* Top row: carrier badge + fav */}
                                    <div className="flex justify-between items-center mb-5">
                                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider border ${item.carrier === 'etisalat'
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-blue-50 border-blue-200 text-blue-700'
                                            }`}>
                                            <img
                                                src={item.carrier === 'etisalat' ? '/Eand_Logo.svg' : '/du-logo.png'}
                                                alt={item.carrier}
                                                className="h-4 w-4 object-contain"
                                            />
                                            {item.carrier === 'etisalat' ? 'e&' : 'du'}
                                        </span>
                                        <button
                                            onClick={(e) => toggleFavorite(e, item.id)}
                                            className="h-8 w-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all"
                                        >
                                            <Heart className={`h-3.5 w-3.5 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                        </button>
                                    </div>

                                    {/* Number */}
                                    <p className="text-2xl font-black tracking-widest text-gray-900 mb-2 font-mono group-hover:text-gray-700 transition-colors">
                                        {item.phone_number}
                                    </p>

                                    {/* Description */}
                                    {item.description && (
                                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                                    )}

                                    <div className="h-px w-full bg-gray-100 my-4" />

                                    {/* Price */}
                                    <p className="text-gray-900 font-mono font-bold text-xl mb-4">
                                        {item.price ? `AED ${item.price.toLocaleString()}` : 'Call for Price'}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {telUrl && (
                                            <span
                                                onClick={(e) => { e.preventDefault(); window.location.href = telUrl; }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer">
                                                <Phone className="h-3.5 w-3.5" /> Call
                                            </span>
                                        )}
                                        {whatsappUrl && (
                                            <span
                                                onClick={(e) => { e.preventDefault(); window.open(whatsappUrl, '_blank'); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer">
                                                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                            className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30 hover:bg-gray-50 transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-gray-500 font-mono">Page {page + 1} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                            className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30 hover:bg-gray-50 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
