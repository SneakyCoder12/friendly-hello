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

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, plate_number, emirate, plate_style, price')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(28); // 4 per emirate max

      if (error) {
        console.error(error);
      } else {
        const grouped: Record<string, SupabaseListing[]> = {};
        (data || []).forEach((l) => {
          const key = EMIRATE_KEY_MAP[l.emirate] || l.emirate;
          if (!grouped[key]) grouped[key] = [];
          if (grouped[key].length < 4) grouped[key].push(l);
        });
        setListingsByEmirate(grouped);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-32">
        {SECTIONS.map((section) => (
          <div key={section.emirateKey} className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-12" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-[260px] bg-muted rounded-2xl" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-32">
      {SECTIONS.map((section) => {
        const listings = listingsByEmirate[section.emirateKey] || [];
        return (
          <EmirateSection
            key={section.emirateKey}
            section={section}
            listings={listings}
          />
        );
      })}
    </div>
  );
}
