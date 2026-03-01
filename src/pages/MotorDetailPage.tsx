import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, MapPin, Calendar, Gauge, Fuel, ArrowLeft, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
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

    return (
        <div className="min-h-screen pt-28 sm:pt-32 pb-24 sm:pb-12">
            <SEO
                title={`${listing.title} | Motors`}
                description={listing.description || `${listing.title} for sale in ${listing.emirate}`}
                url={`/motors/${listing.id}`}
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
            <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
                <Link to="/motors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-bold hover:text-foreground mb-4">
                    <ArrowLeft className="h-4 w-4" /> {t('backToMotors' as any)}
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Image Gallery */}
                    <div className="lg:col-span-3">
                        <div className="aspect-[4/3] bg-surface rounded-2xl overflow-hidden relative">
                            {imgs.length > 0 ? (
                                <>
                                    <img src={imgs[activeImg]} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
                                    {imgs.length > 1 && (
                                        <>
                                            <button onClick={() => setActiveImg(i => (i - 1 + imgs.length) % imgs.length)}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => setActiveImg(i => (i + 1) % imgs.length)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                    {listing.status === 'sold' && (
                                        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold">{t('statusSold' as any) || 'SOLD'}</div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                    <Gauge className="h-16 w-16" />
                                </div>
                            )}
                        </div>
                        {imgs.length > 1 && (
                            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                {imgs.map((img, i) => (
                                    <button key={i} onClick={() => setActiveImg(i)}
                                        className={`flex-shrink-0 h-16 w-20 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                                        <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="lg:col-span-2 space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{listing.listing_type === 'Rent' ? t('forRent' as any) : t('forSale' as any)}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-surface px-2 py-0.5 rounded-lg border border-border">{t(getMotorCategoryTranslation(listing.category || '') as any)}</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-display font-black text-foreground">{listing.title}</h1>
                            {listing.price ? (
                                <p className="text-2xl font-mono font-bold text-primary mt-1">AED {listing.price.toLocaleString()}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-1">{t('contactForPrice' as any)}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 bg-surface rounded-lg px-2 py-1 border border-border"><MapPin className="h-3 w-3" />{listing.emirate}{listing.area ? `, ${listing.area}` : ''}</span>
                            <span className="bg-surface rounded-lg px-2 py-1 border border-border">
                                {t('posted' as any)} {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>

                        {/* Contact */}
                        <a href={`tel:${listing.contact_number}`}
                            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                            <Phone className="h-4 w-4" /> {listing.contact_number}
                        </a>

                        {/* Specs */}
                        {specs.length > 0 && (
                            <div className="bg-card border border-border rounded-2xl p-4">
                                <h3 className="font-bold text-foreground text-sm mb-3">{t('specifications' as any)}</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {specs.map(s => (
                                        <div key={s.label} className="text-xs">
                                            <span className="text-muted-foreground">{s.label}</span>
                                            <p className="font-medium text-foreground">{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {listing.description && (
                            <div className="bg-card border border-border rounded-2xl p-4">
                                <h3 className="font-bold text-foreground text-sm mb-2">{t('description' as any)}</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{listing.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
