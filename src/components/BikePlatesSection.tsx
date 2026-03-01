import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import PlateCard from './PlateCard';
import { generatePlateSlug } from '@/utils/plateUrl';
import { ArrowRight } from 'lucide-react';

interface BikeListing {
    id: string;
    plate_number: string;
    emirate: string;
    plate_style: string | null;
    plate_image_url: string | null;
    price: number | null;
    contact_phone: string | null;
    status: string;
}

const EMIRATE_KEY_MAP: Record<string, string> = {
    'Abu Dhabi': 'abudhabi',
    'Dubai': 'dubai',
    'Sharjah': 'sharjah',
    'Ajman': 'ajman',
    'Umm Al Quwain': 'umm_al_quwain',
    'Ras Al Khaimah': 'rak',
    'Fujairah': 'fujairah',
};

export default function BikePlatesSection() {
    const { t } = useLanguage();
    const [listings, setListings] = useState<BikeListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBikePlates = async () => {
            const { data, error } = await supabase
                .from('listings')
                .select('id, plate_number, emirate, plate_style, plate_image_url, price, contact_phone, status')
                .eq('plate_style', 'bike')
                .in('status', ['active', 'sold'])
                .order('created_at', { ascending: false })
                .limit(4);

            if (error) {
                console.error('[BikePlates] Query error:', error);
            } else {
                setListings((data || []) as unknown as BikeListing[]);
            }
            setLoading(false);
        };

        fetchBikePlates();

        // Real-time subscription
        const channel = supabase
            .channel('realtime-bike-listings')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'listings' },
                () => { fetchBikePlates(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    if (loading) {
        return (
            <section>
                <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-48 mb-12" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-[260px] bg-muted rounded-2xl" />)}
                    </div>
                </div>
            </section>
        );
    }

    const hasListings = listings.length > 0;

    return (
        <section>
            <div className="flex items-end justify-between mb-6 sm:mb-12 border-b border-border pb-4 sm:pb-6">
                <div className="flex items-center gap-3 sm:gap-5">
                    <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden p-1.5 sm:p-2">
                        <img src="/bike-icon.svg" alt="Bike" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-4xl font-display font-bold text-foreground tracking-tight">{t('bikePlates')}</h2>
                    </div>
                </div>
                <a className="-m-2 p-2 group flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors whitespace-nowrap" href="/marketplace?vehicleType=bike">
                    {t('viewAll')}
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transform group-hover:translate-x-1 transition-transform" />
                </a>
            </div>

            {/* ── Mobile: horizontal scroll carousel ── */}
            <div className="sm:hidden">
                <div className="mobile-scroll-row flex gap-3 scrollbar-hide pb-2 -mx-3 px-3">
                    {hasListings ? (
                        listings.slice(0, 4).map((listing) => {
                            const parts = listing.plate_number.split(' ');
                            const code = parts.length > 1 ? parts[0] : '';
                            const number = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
                            const emirateKey = EMIRATE_KEY_MAP[listing.emirate] || listing.emirate;
                            return (
                                <div key={listing.id} className="mobile-plate-card flex-shrink-0 snap-start">
                                    <PlateCard
                                        emirate={emirateKey}
                                        code={code}
                                        number={number}
                                        price={listing.price ? `AED ${listing.price.toLocaleString()}` : undefined}
                                        plateUrl={`/plate/${generatePlateSlug(listing)}`}
                                        sellerPhone={listing.contact_phone}
                                        plateNumber={listing.plate_number}
                                        listingId={listing.id}
                                        status={listing.status}
                                        plateStyle="bike"
                                        plateImageUrl={listing.plate_image_url}
                                    />
                                </div>
                            );
                        })
                    ) : (
                        <div className="mobile-plate-card flex-shrink-0">
                            <PlateCard emirate="dubai" code="A" number="1234" plateUrl="#" comingSoon plateStyle="bike" />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Desktop/Tablet: original grid (unchanged) ── */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                {hasListings ? (
                    listings.slice(0, 4).map((listing) => {
                        const parts = listing.plate_number.split(' ');
                        const code = parts.length > 1 ? parts[0] : '';
                        const number = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
                        const emirateKey = EMIRATE_KEY_MAP[listing.emirate] || listing.emirate;
                        return (
                            <div key={listing.id}>
                                <PlateCard
                                    emirate={emirateKey}
                                    code={code}
                                    number={number}
                                    price={listing.price ? `AED ${listing.price.toLocaleString()}` : undefined}
                                    plateUrl={`/plate/${generatePlateSlug(listing)}`}
                                    sellerPhone={listing.contact_phone}
                                    plateNumber={listing.plate_number}
                                    listingId={listing.id}
                                    status={listing.status}
                                    plateStyle="bike"
                                    plateImageUrl={listing.plate_image_url}
                                />
                            </div>
                        );
                    })
                ) : (
                    <div>
                        <PlateCard emirate="dubai" code="A" number="1234" plateUrl="#" comingSoon plateStyle="bike" />
                    </div>
                )}
            </div>
        </section>
    );
}

