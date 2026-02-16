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

                {/* ─── Premium Mobile Numbers Banner ─── */}
                <div className="relative rounded-3xl overflow-hidden mb-10 border border-gray-200/60 shadow-sm" style={{ background: 'linear-gradient(135deg, #fafaf9 0%, #ffffff 30%, #f5f3ef 60%, #faf8f5 100%)' }}>
                    {/* Skyline silhouette overlay (right) */}
                    <div className="absolute inset-0 opacity-[0.06]"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,200 L0,180 L30,180 L30,120 L35,120 L35,100 L40,100 L40,120 L45,120 L45,180 L80,180 L80,140 L85,140 L85,60 L87,55 L89,60 L89,140 L95,140 L95,180 L130,180 L130,150 L140,150 L140,130 L150,130 L150,150 L160,150 L160,180 L200,180 L200,160 L210,160 L210,40 L213,10 L216,40 L216,160 L220,160 L220,180 L260,180 L260,150 L280,150 L280,130 L290,130 L290,170 L310,170 L310,140 L325,140 L325,170 L340,170 L340,180 L380,180 L380,160 L400,160 L400,120 L405,120 L405,80 L410,75 L415,80 L415,120 L420,120 L420,160 L440,160 L440,180 L500,180 L500,140 L520,140 L520,110 L540,110 L540,140 L560,140 L560,180 L600,180 L600,155 L620,155 L620,130 L630,130 L630,155 L650,155 L650,180 L700,180 L700,160 L730,160 L730,140 L750,140 L750,160 L780,160 L780,180 L800,180 L800,200 Z' fill='%23000' opacity='0.5'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom', backgroundSize: '70% auto' }} />

                    {/* Warm golden glow effects */}
                    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-amber-100/40 to-orange-50/20 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-amber-50/30 to-yellow-50/10 blur-3xl" />

                    {/* Floating phone numbers (decorative) */}
                    <div className="absolute top-3 right-[12%] text-amber-300/[0.08] text-2xl font-mono font-black tracking-widest select-none hidden md:block" style={{ transform: 'rotate(-5deg)' }}>050 777 7777</div>
                    <div className="absolute top-14 right-[3%] text-amber-300/[0.08] text-xl font-mono font-black tracking-widest select-none hidden md:block" style={{ transform: 'rotate(4deg)' }}>052 999 0000</div>
                    <div className="absolute bottom-6 right-[10%] text-amber-300/[0.08] text-lg font-mono font-black tracking-widest select-none hidden md:block" style={{ transform: 'rotate(-3deg)' }}>053 777 777777</div>
                    <div className="absolute bottom-16 left-[50%] text-amber-300/[0.06] text-base font-mono font-black tracking-widest select-none hidden md:block" style={{ transform: 'rotate(6deg)' }}>055 111 1111</div>

                    {/* Fine dot pattern */}
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />

                    {/* UAE flag stripe accent (top) */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-white to-red-500 opacity-30" />

                    <div className="relative px-8 md:px-14 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
                        {/* Left: Text content */}
                        <div className="flex-1 text-center md:text-start z-10">
                            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white">
                                <Star className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">VIP Numbers</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-display font-black text-gray-900 tracking-tight mb-3 leading-tight">
                                Premium Mobile<br />Numbers
                            </h1>
                            <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-md">
                                Browse exclusive Du and Etisalat VIP numbers.<br className="hidden md:block" /> Find the perfect number that stands out.
                            </p>
                            <Link
                                to="/marketplace"
                                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors border border-gray-200 rounded-full px-5 py-2.5 bg-white hover:bg-gray-50 shadow-sm"
                            >
                                Browse Plate Numbers <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        {/* Right: Carrier Logos */}
                        <div className="flex gap-5 z-10">
                            <div className="h-24 w-24 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow hover:-translate-y-1 transform duration-300">
                                <img src="/du-logo.png" alt="Du" className="h-12 w-12 object-contain" />
                            </div>
                            <div className="h-24 w-24 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow hover:-translate-y-1 transform duration-300">
                                <img src="/Eand_Logo.svg" alt="Etisalat" className="h-12 w-12 object-contain" />
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
