import { useState, useEffect } from 'react';
import PlateCard from './PlateCard';
import { supabase } from '@/integrations/supabase/client';
import { generatePlateSlug } from '@/utils/plateUrl';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeaturedListing {
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

/**
 * Mobile-only horizontal strip of featured plate cards shown right under the hero.
 * Uses the same PlateCard component as the home page for visual consistency.
 */
export default function FeaturedNumbersStrip() {
    const { t } = useLanguage();
    const [listings, setListings] = useState<FeaturedListing[]>([]);

    useEffect(() => {
        (async () => {
            const { data } = await supabase
                .from('listings')
                .select('id, plate_number, emirate, plate_style, plate_image_url, price, contact_phone, status')
                .eq('status', 'active')
                .order('price', { ascending: false })
                .limit(6);
            if (data) setListings(data as FeaturedListing[]);
        })();
    }, []);

    if (listings.length === 0) return null;

    return (
        <div className="sm:hidden bg-surface border-b border-border">
            <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    {t('featuredNumbersStart')}
                </p>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-3 pb-3 mobile-scroll-row">
                {listings.map((listing) => {
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
                                plateStyle={listing.plate_style === 'bike' ? 'bike' : 'private'}
                                plateImageUrl={listing.plate_image_url}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
