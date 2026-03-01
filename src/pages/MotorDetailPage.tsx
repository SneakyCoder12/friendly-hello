import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, MapPin, Calendar, Gauge, Fuel, ArrowLeft, Phone, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import SEO from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchMotorListing, type MotorListing, getMotorCategoryTranslation } from '@/lib/marketplace';

export default function MotorDetailPage() {
    const { t } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<MotorListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImg, setActiveImg] = useState(0);
    const [showAllSpecs, setShowAllSpecs] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchMotorListing(id)
            .then(setListing)
            .catch(() => setError('Listing not found'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (error || !listing) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-20">
            <p className="text-muted-foreground font-medium">{error || t('listingNotFound' as any)}</p>
            <Link to="/motors" className="text-primary font-bold text-sm hover:underline">← {t('backToMotors' as any)}</Link>
        </div>
    );

    const imgs = listing.images || [];
    const specs: { label: string; value: string }[] = [
        listing.make && { label: t('make' as any), value: listing.make },
        listing.model && { label: t('model' as any), value: listing.model },
        listing.year && { label: t('year' as any), value: String(listing.year) },
        listing.mileage != null && { label: t('mileageKm' as any), value: `${listing.mileage.toLocaleString()}` },
        listing.transmission && { label: t('transmission' as any), value: t(listing.transmission.toLowerCase() as any) || listing.transmission },
        listing.fuel_type && { label: t('fuelType' as any), value: t(`fuel${listing.fuel_type.replace(/\s+/g, '')}` as any) || listing.fuel_type },
        listing.body_type && { label: t('bodyType' as any), value: listing.body_type },
        listing.exterior_color && { label: t('exteriorColor' as any), value: listing.exterior_color },
        listing.interior_color && { label: t('interiorColor' as any), value: listing.interior_color },
        listing.horsepower && { label: t('horsepower' as any), value: `${listing.horsepower}` },
        listing.engine_size && { label: t('engineSize' as any), value: listing.engine_size },
        listing.doors && { label: t('doors' as any), value: String(listing.doors) },
        listing.steering_side && { label: t('steeringSide' as any), value: listing.steering_side },
        listing.warranty && { label: t('warranty' as any), value: listing.warranty },
        listing.regional_specs && { label: t('regionalSpecs' as any), value: listing.regional_specs },
        listing.condition && { label: t('anyCondition' as any)?.split(' ')[1] || 'Condition', value: listing.condition === 'New' ? t('conditionNew' as any) : t('conditionUsed' as any) },
        listing.trim && { label: t('trim' as any), value: listing.trim },
    ].filter(Boolean) as { label: string; value: string }[];

    const previewSpecKeys = [
        t('year' as any),
        t('mileageKm' as any),
        t('transmission' as any),
        t('fuelType' as any),
        t('anyCondition' as any)?.split(' ')[1] || 'Condition',
        t('regionalSpecs' as any)
    ];
    const keySpecs = specs.filter(s => previewSpecKeys.includes(s.label)).slice(0, 6);
    const displaySpecs = showAllSpecs ? specs : (keySpecs.length >= 4 ? keySpecs : specs.slice(0, 6));

    return (
        <div className="min-h-screen pt-28 sm:pt-32 pb-32 sm:pb-12 bg-surface/30">
            <SEO
                title={`${listing.title} | Motors`}
                description={listing.description || `${listing.title} for sale in ${listing.emirate}`}
                url={`/motors/${listing.slug || listing.id}`}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    name: listing.title,
                    description: listing.description || '',
                    offers: listing.price ? {
                        '@type': 'Offer',
                        price: listing.price,
                        priceCurrency: 'AED',
                        availability: listing.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
                    } : undefined,
                    image: imgs[0] || undefined,
                }}
            />
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                <Link to="/motors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-bold hover:text-foreground mb-6">
                    <ArrowLeft className="h-4 w-4" /> {t('backToMotors' as any)}
                </Link>

                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 items-start">
                    {/* ── Left Column Context (Gallery + Specs + Description) ── */}
                    <div className="contents lg:block lg:col-span-8 lg:space-y-8">

                        {/* Image Gallery */}
                        <div className="order-1 lg:order-none bg-white border border-gray-200 shadow-sm rounded-xl p-3 sm:p-5">
                            <div className="aspect-video bg-surface rounded-lg overflow-hidden relative group">
                                {imgs.length > 0 ? (
                                    <>
                                        <img
                                            src={imgs[activeImg]}
                                            alt={listing.title}
                                            className="w-full h-full object-cover animate-in fade-in zoom-in duration-300"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        {imgs.length > 1 && (
                                            <>
                                                <button onClick={() => setActiveImg(i => (i - 1 + imgs.length) % imgs.length)}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md text-foreground flex items-center justify-center hover:bg-white hover:scale-105 transition-all opacity-0 group-hover:opacity-100">
                                                    <ChevronLeft className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => setActiveImg(i => (i + 1) % imgs.length)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md text-foreground flex items-center justify-center hover:bg-white hover:scale-105 transition-all opacity-0 group-hover:opacity-100">
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                        {listing.status === 'sold' && (
                                            <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                                                {t('statusSold' as any) || 'SOLD'}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-surface">
                                        <Gauge className="h-16 w-16" />
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {imgs.length > 1 && (
                                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                                    {imgs.map((img, i) => (
                                        <button key={i} onClick={() => setActiveImg(i)}
                                            className={`flex-shrink-0 h-20 w-28 rounded-lg overflow-hidden border-2 transition-all duration-200 ${i === activeImg ? 'border-primary ring-2 ring-primary/20 ring-offset-1' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'}`}>
                                            <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Specs Section */}
                        {specs.length > 0 && (
                            <div className="order-3 lg:order-none bg-white border border-gray-200 shadow-sm rounded-xl p-5 lg:p-6 transition-all">
                                <h3 className="font-display font-bold text-base lg:text-lg text-foreground mb-4 lg:mb-6 pb-3 lg:pb-4 border-b border-border flex items-center gap-2">
                                    <Gauge className="h-5 w-5 text-primary" /> {t('specifications' as any)}
                                </h3>
                                <div className="grid grid-cols-2 gap-x-4 lg:gap-x-8 gap-y-4 lg:gap-y-5">
                                    {displaySpecs.map(s => (
                                        <div key={s.label} className="flex flex-col gap-1 pb-3 lg:pb-3 border-b border-gray-100 last:border-0 [&:nth-last-child(-n+2)]:border-0">
                                            <span className="text-xs lg:text-sm font-medium text-muted-foreground">{s.label}</span>
                                            <span className="text-sm lg:text-base font-bold text-foreground">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                                {specs.length > displaySpecs.length || showAllSpecs ? (
                                    <button
                                        onClick={() => setShowAllSpecs(!showAllSpecs)}
                                        className="mt-5 w-full py-3 bg-surface/50 hover:bg-surface text-primary font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-200/60"
                                    >
                                        {showAllSpecs ? (
                                            <>{t('viewLess' as any) || 'View Less'} <ChevronUp className="h-4 w-4" /></>
                                        ) : (
                                            <>{t('viewFullSpecs' as any) || 'View Full Specifications'} <ChevronDown className="h-4 w-4" /></>
                                        )}
                                    </button>
                                ) : null}
                            </div>
                        )}

                        {/* Description Section */}
                        {listing.description && (
                            <div className="order-4 lg:order-none bg-white border border-gray-200 shadow-sm rounded-xl p-5 lg:p-6">
                                <h3 className="font-display font-bold text-base lg:text-lg text-foreground mb-3 lg:mb-4 pb-3 lg:pb-4 border-b border-border flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" /> {t('description' as any)}
                                </h3>
                                <p className="text-[14.5px] lg:text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line font-medium">
                                    {listing.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Right Column (Sticky Info Panel) ── */}
                    <div className="order-2 lg:order-none lg:col-span-4 self-start lg:sticky lg:top-32 w-full">
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 lg:p-6 flex flex-col gap-4 lg:gap-6">

                            {/* Tags */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                                    {listing.listing_type === 'Rent' ? t('forRent' as any) : t('forSale' as any)}
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-surface px-2.5 py-1 rounded-md border border-gray-200">
                                    {t(getMotorCategoryTranslation(listing.category || '') as any)}
                                </span>
                            </div>

                            {/* Title & Price */}
                            <div className="space-y-2 lg:space-y-3">
                                <h1 className="text-xl lg:text-3xl font-bold lg:font-display lg:font-black text-gray-900 lg:text-foreground leading-snug">
                                    {listing.title}
                                </h1>
                                {listing.price ? (
                                    <div className="flex items-baseline gap-1 lg:gap-1.5 mt-1 lg:mt-2">
                                        <span className="text-xs lg:text-sm font-bold text-primary mb-1">AED</span>
                                        <span className="text-3xl lg:text-4xl font-black lg:font-display text-primary tracking-tight">
                                            {listing.price.toLocaleString()}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-lg lg:text-xl font-bold text-muted-foreground mt-2">{t('contactForPrice' as any)}</p>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100 w-full" />

                            {/* Location & Time */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-surface text-muted-foreground p-2 rounded-md border border-gray-200">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Location</span>
                                        <span className="text-sm font-bold text-foreground">
                                            {listing.emirate}{listing.area ? `, ${listing.area}` : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-surface text-muted-foreground p-2 rounded-md border border-gray-200">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Date Posted</span>
                                        <span className="text-sm font-bold text-foreground">
                                            {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact CTA */}
                            <div className="hidden lg:block mt-2 pt-2 border-t border-gray-100">
                                <a href={`tel:${listing.contact_number}`}
                                    className="flex items-center justify-center gap-2.5 w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
                                    <Phone className="h-5 w-5" /> {t('callNow' as any) || 'Call Now'}
                                </a>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Bottom CTA */}
            <div className="lg:hidden fixed bottom-16 sm:bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-200 p-3 pb-safe shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.05)]">
                <a href={`tel:${listing.contact_number}`}
                    className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-lg shadow-md active:scale-[0.98] transition-transform">
                    <Phone className="h-5 w-5" /> {t('callNow' as any) || 'Call Now'}
                </a>
            </div>
        </div>
    );
}
