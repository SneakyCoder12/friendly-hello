import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, MapPin, ArrowLeft, Phone, ChevronLeft, ChevronRight, BedDouble, Bath, Maximize, Building2 } from 'lucide-react';
import SEO from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchPropertyListing, type PropertyListing, getPropertyCategoryTranslation } from '@/lib/marketplace';

export default function PropertyDetailPage() {
    const { t } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<PropertyListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchPropertyListing(id)
            .then(setListing)
            .catch(() => setError('Property not found'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (error || !listing) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-20">
            <p className="text-muted-foreground font-medium">{error || t('listingNotFound' as any)}</p>
            <Link to="/properties" className="text-primary font-bold text-sm hover:underline">← {t('backToProperties' as any)}</Link>
        </div>
    );

    const imgs = listing.images || [];
    const amenities = Array.isArray(listing.amenities) ? listing.amenities as string[] : [];

    const details: { label: string; value: string }[] = [
        { label: t('propertyType' as any), value: t(getPropertyCategoryTranslation(listing.property_type || '') as any) || listing.property_type },
        { label: t('listingType' as any), value: listing.listing_type === 'Rent' ? t('forRent' as any) : t('forSale' as any) },
        listing.bedrooms != null ? { label: t('bedrooms' as any), value: listing.bedrooms === 0 ? t('studio' as any) : String(listing.bedrooms) } : null,
        listing.bathrooms != null ? { label: t('bathrooms' as any), value: String(listing.bathrooms) } : null,
        listing.size_sqft ? { label: t('sizeSqft' as any) || 'Size', value: `${listing.size_sqft.toLocaleString()} ${t('sqft' as any)}` } : null,
        listing.furnishing ? { label: t('furnishing' as any), value: listing.furnishing } : null,
    ].filter(Boolean) as { label: string; value: string }[];

    return (
        <div className="min-h-screen pt-28 sm:pt-32 pb-24 sm:pb-12">
            <SEO
                title={`${listing.title} | Properties`}
                description={listing.description || `${listing.property_type} for ${listing.listing_type.toLowerCase()} in ${listing.emirate}`}
                url={`/properties/${listing.id}`}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'RealEstateListing',
                    name: listing.title,
                    description: listing.description || '',
                    offers: listing.price ? {
                        '@type': 'Offer',
                        price: listing.price,
                        priceCurrency: 'AED',
                    } : undefined,
                    image: imgs[0] || undefined,
                }}
            />
            <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
                <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-bold hover:text-foreground mb-4">
                    <ArrowLeft className="h-4 w-4" /> {t('backToProperties' as any)}
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <div className="aspect-[16/10] bg-surface rounded-2xl overflow-hidden relative">
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
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><Building2 className="h-16 w-16" /></div>
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

                    <div className="lg:col-span-2 space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{listing.listing_type === 'Rent' ? t('forRent' as any) : t('forSale' as any)}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-surface px-2 py-0.5 rounded-lg border border-border">{t(getPropertyCategoryTranslation(listing.property_type || '') as any)}</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-display font-black text-foreground">{listing.title}</h1>
                            {listing.price ? (
                                <p className="text-2xl font-mono font-bold text-primary mt-1">
                                    AED {listing.price.toLocaleString()}{listing.listing_type === 'Rent' ? t('yr' as any) : ''}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-1">{t('contactForPrice' as any)}</p>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {listing.bedrooms != null && (
                                <span className="flex items-center gap-1 bg-surface rounded-lg px-2.5 py-1.5 border border-border">
                                    <BedDouble className="h-3.5 w-3.5" />{listing.bedrooms === 0 ? t('studio' as any) : `${listing.bedrooms} ${t('br' as any)}`}
                                </span>
                            )}
                            {listing.bathrooms != null && (
                                <span className="flex items-center gap-1 bg-surface rounded-lg px-2.5 py-1.5 border border-border">
                                    <Bath className="h-3.5 w-3.5" />{listing.bathrooms} {t('ba' as any)}
                                </span>
                            )}
                            {listing.size_sqft && (
                                <span className="flex items-center gap-1 bg-surface rounded-lg px-2.5 py-1.5 border border-border">
                                    <Maximize className="h-3.5 w-3.5" />{listing.size_sqft.toLocaleString()} {t('sqft' as any)}
                                </span>
                            )}
                            <span className="flex items-center gap-1 bg-surface rounded-lg px-2.5 py-1.5 border border-border">
                                <MapPin className="h-3.5 w-3.5" />{listing.emirate}{listing.area ? `, ${listing.area}` : ''}
                            </span>
                        </div>

                        <a href={`tel:${listing.contact_number}`}
                            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                            <Phone className="h-4 w-4" /> {listing.contact_number}
                        </a>

                        {/* Details */}
                        <div className="bg-card border border-border rounded-2xl p-4">
                            <h3 className="font-bold text-foreground text-sm mb-3">{t('propertyDetails' as any) || 'Property Details'}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {details.map(d => (
                                    <div key={d.label} className="text-xs">
                                        <span className="text-muted-foreground">{d.label}</span>
                                        <p className="font-medium text-foreground">{d.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {amenities.length > 0 && (
                            <div className="bg-card border border-border rounded-2xl p-4">
                                <h3 className="font-bold text-foreground text-sm mb-3">{t('amenities' as any)}</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {amenities.map((a, i) => (
                                        <span key={i} className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-muted-foreground">{a}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {listing.description && (
                            <div className="bg-card border border-border rounded-2xl p-4">
                                <h3 className="font-bold text-foreground text-sm mb-2">{t('description' as any)}</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{listing.description}</p>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                            {t('posted' as any)} {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
