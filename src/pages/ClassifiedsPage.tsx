import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Loader2, MapPin, Tag, Plus } from 'lucide-react';
import SEO from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    fetchClassifiedListings, EMIRATES, CLASSIFIED_CATEGORIES, CLASSIFIED_CONDITIONS,
    type ClassifiedListing,
    getClassifiedCategoryTranslation
} from '@/lib/marketplace';

export default function ClassifiedsPage() {
    const { t, locale } = useLanguage();
    const [searchParams] = useSearchParams();
    const [listings, setListings] = useState<ClassifiedListing[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [emirate, setEmirate] = useState(searchParams.get('emirate') || '');
    const [condition, setCondition] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const totalPages = Math.ceil(total / 20);

    const load = async (p = 0) => {
        setLoading(true);
        try {
            const filters: Record<string, any> = {};
            if (search) filters.search = search;
            if (category) filters.category = category;
            if (emirate) filters.emirate = emirate;
            if (condition) filters.condition = condition;
            if (minPrice) filters.minPrice = Number(minPrice);
            if (maxPrice) filters.maxPrice = Number(maxPrice);
            const { data, count } = await fetchClassifiedListings(filters, p);
            setListings(data);
            setTotal(count);
            setPage(p);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { load(0); }, []);

    const applyFilters = () => { load(0); setShowFilters(false); };
    const clearFilters = () => {
        setSearch(''); setCategory(''); setEmirate(''); setCondition('');
        setMinPrice(''); setMaxPrice('');
        setTimeout(() => load(0), 0);
    };

    const selectCls = 'bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full';
    const inputCls = 'bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full';

    return (
        <div className="min-h-screen pt-28 sm:pt-32 pb-24 sm:pb-12">
            <SEO
                title={locale === 'ar' ? "سوق الإعلانات المبوبة | بيع وشراء في الإمارات" : "Classifieds Marketplace | Buy & Sell in UAE"}
                description={locale === 'ar' ? "بيع واشتري الإلكترونيات والأثاث والأزياء والمزيد في جميع أنحاء الإمارات." : "Buy and sell electronics, furniture, fashion, pets and more across all UAE Emirates."}
                url="/classifieds"
            />
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
                <div className="flex justify-between items-start mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight">{t('classifiedsCategory' as any)}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t('classifiedsDesc' as any)}</p>
                    </div>
                    <Link to="/dashboard?tab=classifieds" className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all">
                        <Plus className="h-4 w-4" /> {t('addListing' as any)}
                    </Link>
                    <Link to="/dashboard?tab=classifieds" className="sm:hidden flex items-center justify-center bg-primary text-primary-foreground w-10 h-10 rounded-xl shadow-lg hover:shadow-primary/25 transition-all">
                        <Plus className="h-5 w-5" />
                    </Link>
                </div>

                <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                            placeholder={t('searchClassifieds' as any)}
                            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface border-border text-foreground hover:bg-surface-accent'}`}>
                        <SlidersHorizontal className="h-4 w-4" /> {t('filters' as any)}
                    </button>
                </div>

                {showFilters && (
                    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-6 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <select value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>
                                <option value="">{t('allCategories' as any)}</option>
                                {CLASSIFIED_CATEGORIES.map(c => <option key={c} value={c}>{t(getClassifiedCategoryTranslation(c) as any)}</option>)}
                            </select>
                            <select value={emirate} onChange={e => setEmirate(e.target.value)} className={selectCls}>
                                <option value="">{t('allEmirates' as any)}</option>
                                {EMIRATES.map(e => {
                                    const key = e.replace(/\s+/g, '').replace(/^./, str => str.toLowerCase()) + 'Name';
                                    return <option key={e} value={e}>{t(key as any)}</option>
                                })}
                            </select>
                            <select value={condition} onChange={e => setCondition(e.target.value)} className={selectCls}>
                                <option value="">{t('anyCondition' as any)}</option>
                                {CLASSIFIED_CONDITIONS.map(c => {
                                    const key = c === 'New' ? 'conditionNew' : c === 'Used' ? 'conditionUsed' : c === 'Like New' ? 'conditionLikeNew' : 'conditionRefurbished';
                                    return <option key={c} value={c}>{t(key as any) || c}</option>
                                })}
                            </select>
                            <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder={t('minPrice' as any)} type="number" className={inputCls} />
                            <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder={t('maxPrice' as any)} type="number" className={inputCls} />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={clearFilters} className="text-sm text-muted-foreground font-bold hover:text-foreground flex items-center gap-1"><X className="h-3.5 w-3.5" /> {t('clearAll' as any)}</button>
                            <button onClick={applyFilters} className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90">{t('applyFilters' as any)}</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground font-medium">{t('noListingsFound' as any)}</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">{t('tryAdjustingFilters' as any)}</p>
                    </div>
                ) : (
                    <>
                        <p className="text-xs text-muted-foreground mb-4">{total} {total !== 1 ? t('listingsFound' as any) : t('listingFound' as any)}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {listings.map(l => (
                                <Link key={l.id} to={`/classifieds/${l.id}`}
                                    className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all group">
                                    <div className="aspect-square bg-surface relative overflow-hidden">
                                        {l.images && l.images.length > 0 ? (
                                            <img src={l.images[0]} alt={l.title} loading="lazy" decoding="async"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><Tag className="h-12 w-12" /></div>
                                        )}
                                        {l.status === 'sold' && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold">{t('statusSold' as any) || 'SOLD'}</span>
                                            </div>
                                        )}
                                        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-lg font-bold">{t(getClassifiedCategoryTranslation(l.category || '') as any)}</span>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-bold text-foreground text-sm truncate">{l.title}</h3>
                                        <div className="flex items-center justify-between mt-1.5">
                                            {l.price ? (
                                                <span className="font-mono font-bold text-foreground text-sm">AED {l.price.toLocaleString()}</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">{t('contactForPrice' as any)}</span>
                                            )}
                                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3" />{t(l.emirate.replace(/\s+/g, '').replace(/^./, str => str.toLowerCase()) + 'Name' as any) || l.emirate}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button onClick={() => load(page - 1)} disabled={page === 0} className="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                                <span className="text-sm text-muted-foreground font-medium px-3">{t('page')} {page + 1} {t('of')} {totalPages}</span>
                                <button onClick={() => load(page + 1)} disabled={page >= totalPages - 1} className="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
