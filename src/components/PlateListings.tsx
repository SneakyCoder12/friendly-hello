import { useState, useEffect, useMemo } from 'react';
import EmirateSection from './EmirateSection';
import { SECTIONS } from '@/data/listings';
import { supabase } from '@/integrations/supabase/client';

interface SupabaseListing {
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

/** Mobile-first ordering: Dubai → Abu Dhabi → Sharjah → rest */
const MOBILE_ORDER: string[] = ['dubai', 'abudhabi', 'sharjah', 'ajman', 'umm_al_quwain', 'rak', 'fujairah'];

export default function PlateListings() {
  const [listingsByEmirate, setListingsByEmirate] = useState<Record<string, SupabaseListing[]>>({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mql);
    mql.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
  }, []);

  const orderedSections = useMemo(() => {
    if (!isMobile) return SECTIONS;
    // Reorder for mobile: Dubai first, then Abu Dhabi, Sharjah, rest
    return [...SECTIONS].sort((a, b) => {
      const ai = MOBILE_ORDER.indexOf(a.emirateKey);
      const bi = MOBILE_ORDER.indexOf(b.emirateKey);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [isMobile]);

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('id, plate_number, emirate, plate_style, plate_image_url, price, contact_phone, status')
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false })
      .limit(28);

    if (error) {
      console.error('[PlateListings] Query error:', error);
    } else {
      const grouped: Record<string, SupabaseListing[]> = {};
      ((data || []) as unknown as SupabaseListing[]).forEach((l) => {
        // Skip classic & bike plates — they have their own dedicated sections
        if (l.plate_style === 'classic' || l.plate_style === 'bike') return;
        const key = EMIRATE_KEY_MAP[l.emirate] || l.emirate;
        if (!grouped[key]) grouped[key] = [];
        if (grouped[key].length < 4) grouped[key].push(l);
      });
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
        () => { fetchListings(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-10 sm:space-y-32">
      {orderedSections.map((section) => {
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
