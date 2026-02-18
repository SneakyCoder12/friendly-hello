import { useState, useEffect } from 'react';
import EmirateSection from './EmirateSection';
import { SECTIONS } from '@/data/listings';
import { supabase } from '@/integrations/supabase/client';

interface SupabaseListing {
  id: string;
  plate_number: string;
  emirate: string;
  plate_style: string | null;
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

export default function PlateListings() {
  const [listingsByEmirate, setListingsByEmirate] = useState<Record<string, SupabaseListing[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    console.log('[PlateListings] Fetching active & sold listings...');
    const { data, error } = await supabase
      .from('listings')
      .select('id, plate_number, emirate, plate_style, price, contact_phone, status')
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false })
      .limit(28);

    if (error) {
      console.error('[PlateListings] Query error:', error);
    } else {
      console.log('[PlateListings] Raw data:', data);
      const grouped: Record<string, SupabaseListing[]> = {};
      ((data || []) as unknown as SupabaseListing[]).forEach((l) => {
        const key = EMIRATE_KEY_MAP[l.emirate] || l.emirate;
        if (!grouped[key]) grouped[key] = [];
        if (grouped[key].length < 4) grouped[key].push(l);
      });
      console.log('[PlateListings] Grouped:', grouped);
      setListingsByEmirate(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();

    // Real-time subscription: re-fetch when listings change
    const channel = supabase
      .channel('realtime-listings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        () => {
          console.log('[PlateListings] Real-time update received, re-fetching...');
          fetchListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-32">
      {SECTIONS.map((section) => {
        const listings = listingsByEmirate[section.emirateKey] || [];
        return (
          <EmirateSection
            key={section.emirateKey}
            section={section}
            listings={listings}
            loading={loading}
          />
        );
      })}
    </div>
  );
}
