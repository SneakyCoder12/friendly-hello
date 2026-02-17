import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, CheckCircle, Search, X, Shield, Smartphone, Heart } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput';

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

interface Listing {
  id: string;
  plate_number: string;
  emirate: string;
  plate_style: string | null;
  price: number | null;
  description: string | null;
  status: string;
  created_at: string;
}

interface BulkRow {
  plate_number: string;
  emirate: string;
  plate_style: string;
  price: string;
  description: string;
  contact_email: string;
  contact_phone: string;
}

const emptyRow = (prev?: BulkRow, email?: string, phone?: string): BulkRow => ({
  plate_number: '',
  emirate: prev?.emirate || 'Dubai',
  plate_style: '',
  price: '',
  description: '',
  contact_email: email || prev?.contact_email || '',
  contact_phone: phone || prev?.contact_phone || '',
});

export default function DashboardPage() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bulk rows
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Listing filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [listPage, setListPage] = useState(0);
  const PAGE_SIZE = 20;

  // Edit single
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ plate_code: '', plate_number: '', emirate: 'Dubai', price: '', description: '' });

  // Profile edit
  const [profileForm, setProfileForm] = useState({ full_name: '', phone_number: '' });
  const [editingProfile, setEditingProfile] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Mobile Numbers
  interface MobileNumber {
    id: string;
    phone_number: string;
    carrier: string;
    price: number | null;
    description: string | null;
    status: string;
    contact_phone: string | null;
    created_at: string;
  }
  const [mobileNumbers, setMobileNumbers] = useState<MobileNumber[]>([]);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [mobileForm, setMobileForm] = useState({
    phone_number: '',
    carrier: 'du' as 'du' | 'etisalat',
    price: '',
    description: '',
    contact_phone: '',
  });
  const [mobileDeleteId, setMobileDeleteId] = useState<string | null>(null);
  const [mobileEditId, setMobileEditId] = useState<string | null>(null);
  const [mobileEditForm, setMobileEditForm] = useState({
    phone_number: '',
    carrier: 'du' as 'du' | 'etisalat',
    price: '',
    description: '',
    contact_phone: '',
  });

  // Favorites
  interface FavoriteItem {
    id: string;
    listing_type: string;
    listing_id: string;
    phone_number?: string;
    plate_number?: string;
    emirate?: string;
    carrier?: string;
    price?: number | null;
  }
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    if (profile) setProfileForm({ full_name: profile.full_name || '', phone_number: profile.phone_number || '' });
  }, [profile]);

  const fetchListings = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('listings').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setListings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [user]);

  // Bulk form
  const initBulkForm = () => {
    setRows([emptyRow(undefined, user?.email || '', profile?.phone_number || '')]);
    setShowForm(true);
  };

  const addRow = () => {
    if (rows.length >= 20) { toast.error('Maximum 20 rows at once'); return; }
    setRows(prev => [...prev, emptyRow(prev[prev.length - 1], user?.email || '', profile?.phone_number || '')]);
  };

  const updateRow = (idx: number, field: keyof BulkRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBulkSave = async () => {
    if (!user) return;
    const valid = rows.filter(r => r.plate_number.trim());
    if (!valid.length) { toast.error('Add at least one plate number'); return; }

    setSaving(true);
    const payload = valid.map(r => {
      const fullPlateNumber = r.plate_style.trim()
        ? `${r.plate_style.trim()} ${r.plate_number.trim()}`
        : r.plate_number.trim();
      return {
        plate_number: fullPlateNumber,
        emirate: r.emirate,
        plate_style: r.plate_style || null,
        price: r.price ? Number(r.price) : null,
        description: r.description || null,
        contact_email: r.contact_email || null,
        contact_phone: r.contact_phone || null,
        user_id: user.id,
        status: 'active' as const,
      };
    });

    const { error } = await supabase.from('listings').insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success(`${payload.length} listings created successfully!`);
      setShowForm(false);
      setRows([]);
      fetchListings();
    }
    setSaving(false);
  };

  // Edit single listing
  const startEdit = (listing: Listing) => {
    const pParts = listing.plate_number?.split(' ') || [];
    const pCode = pParts.length > 1 ? pParts[0] : '';
    const pNum = pParts.length > 1 ? pParts.slice(1).join(' ') : pParts[0] || '';
    setEditForm({
      plate_code: pCode,
      plate_number: pNum,
      emirate: listing.emirate,
      price: listing.price?.toString() || '',
      description: listing.description || '',
    });
    setEditId(listing.id);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editId) return;
    if (!editForm.plate_number.trim()) { toast.error('Number is required'); return; }
    setSaving(true);
    const fullPlateNumber = editForm.plate_code.trim()
      ? `${editForm.plate_code.trim()} ${editForm.plate_number.trim()}`
      : editForm.plate_number.trim();
    const { error } = await supabase.from('listings').update({
      plate_number: fullPlateNumber,
      emirate: editForm.emirate,
      plate_style: editForm.plate_code.trim() || null,
      price: editForm.price ? Number(editForm.price) : null,
      description: editForm.description || null,
    }).eq('id', editId);
    if (error) toast.error(error.message);
    else { toast.success('Listing updated'); setEditId(null); fetchListings(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('listings').delete().eq('id', deleteId);
    if (error) toast.error(error.message);
    else { toast.success('Listing deleted'); fetchListings(); }
    setDeleteId(null);
  };

  const toggleStatus = async (listing: Listing) => {
    const nextStatus = listing.status === 'active' ? 'sold' : 'active';
    const { error } = await supabase.from('listings').update({ status: nextStatus }).eq('id', listing.id);
    if (error) toast.error(error.message);
    else fetchListings();
  };

  const toggleHidden = async (listing: Listing) => {
    const nextStatus = listing.status === 'hidden' ? 'active' : 'hidden';
    const { error } = await supabase.from('listings').update({ status: nextStatus }).eq('id', listing.id);
    if (error) toast.error(error.message);
    else { toast.success(nextStatus === 'hidden' ? 'Listing hidden' : 'Listing visible'); fetchListings(); }
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      full_name: profileForm.full_name,
      phone_number: profileForm.phone_number,
    }).eq('id', user.id);
    if (error) toast.error(error.message);
    else { toast.success('Profile updated'); setEditingProfile(false); refreshProfile(); }
  };

  // ── Mobile Numbers ──
  const fetchMobileNumbers = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('mobile_numbers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setMobileNumbers((data || []) as unknown as MobileNumber[]);
  };

  useEffect(() => { fetchMobileNumbers(); }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    const { data: favs } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!favs) return;

    const items: FavoriteItem[] = [];
    for (const fav of favs) {
      if (fav.listing_type === 'mobile_number') {
        const { data } = await supabase.from('mobile_numbers').select('phone_number, carrier, price').eq('id', fav.listing_id).single();
        if (data) items.push({ id: fav.id, listing_type: fav.listing_type, listing_id: fav.listing_id, phone_number: (data as any).phone_number, carrier: (data as any).carrier, price: (data as any).price });
      } else if (fav.listing_type === 'plate') {
        const { data } = await supabase.from('listings').select('plate_number, emirate, price').eq('id', fav.listing_id).single();
        if (data) items.push({ id: fav.id, listing_type: fav.listing_type, listing_id: fav.listing_id, plate_number: (data as any).plate_number, emirate: (data as any).emirate, price: (data as any).price });
      }
    }
    setFavorites(items);
  };
  useEffect(() => { fetchFavorites(); }, [user]);

  const removeFavorite = async (favId: string) => {
    await supabase.from('favorites').delete().eq('id', favId);
    setFavorites(prev => prev.filter(f => f.id !== favId));
    toast.success('Removed from favorites');
  };

  const initMobileForm = () => {
    setMobileForm({
      phone_number: '',
      carrier: 'du',
      price: '',
      description: '',
      contact_phone: profile?.phone_number || '',
    });
    setShowMobileForm(true);
  };

  const validateUAEMobile = (num: string): boolean => {
    const digits = num.replace(/\D/g, '');
    // Accept: 971XXXXXXXXX (12 digits) or 05XXXXXXXX (10 digits)
    if (/^971\d{9}$/.test(digits)) return true;
    if (/^05\d{8}$/.test(digits)) return true;
    return false;
  };

  const saveMobileNumber = async () => {
    if (!user) return;
    if (!mobileForm.phone_number.trim()) { toast.error('Phone number is required'); return; }
    if (!validateUAEMobile(mobileForm.phone_number)) {
      toast.error('Enter a valid UAE number (e.g. 971 50 123 4567 or 050 123 4567)');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('mobile_numbers').insert({
      phone_number: mobileForm.phone_number.trim(),
      carrier: mobileForm.carrier,
      price: mobileForm.price ? Number(mobileForm.price) : null,
      description: mobileForm.description || null,
      contact_phone: mobileForm.contact_phone || null,
      user_id: user.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Mobile number listed!');
      setShowMobileForm(false);
      fetchMobileNumbers();
    }
    setSaving(false);
  };

  const handleMobileDelete = async () => {
    if (!mobileDeleteId) return;
    const { error } = await supabase.from('mobile_numbers').delete().eq('id', mobileDeleteId);
    if (error) toast.error(error.message);
    else { toast.success('Number deleted'); fetchMobileNumbers(); }
    setMobileDeleteId(null);
  };

  const toggleMobileStatus = async (mn: MobileNumber) => {
    const nextStatus = mn.status === 'active' ? 'sold' : 'active';
    const { error } = await supabase.from('mobile_numbers').update({ status: nextStatus }).eq('id', mn.id);
    if (error) toast.error(error.message);
    else fetchMobileNumbers();
  };

  const startMobileEdit = (mn: MobileNumber) => {
    setMobileEditForm({
      phone_number: mn.phone_number,
      carrier: mn.carrier as 'du' | 'etisalat',
      price: mn.price?.toString() || '',
      description: mn.description || '',
      contact_phone: mn.contact_phone || '',
    });
    setMobileEditId(mn.id);
  };

  const handleMobileEditSave = async () => {
    if (!user || !mobileEditId) return;
    if (!mobileEditForm.phone_number.trim()) { toast.error('Phone number is required'); return; }
    if (!validateUAEMobile(mobileEditForm.phone_number)) {
      toast.error('Enter a valid UAE number (e.g. 971 50 123 4567 or 050 123 4567)');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('mobile_numbers').update({
      phone_number: mobileEditForm.phone_number.trim(),
      carrier: mobileEditForm.carrier,
      price: mobileEditForm.price ? Number(mobileEditForm.price) : null,
      description: mobileEditForm.description || null,
      contact_phone: mobileEditForm.contact_phone || null,
    }).eq('id', mobileEditId);
    if (error) toast.error(error.message);
    else { toast.success('Number updated'); setMobileEditId(null); fetchMobileNumbers(); }
    setSaving(false);
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s === 'sold') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  // Filtered listings
  const filtered = listings.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchQuery && !l.plate_number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const pagedListings = filtered.slice(listPage * PAGE_SIZE, (listPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="bg-background min-h-screen">
      {/* ── Gradient Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/3 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8 sm:pb-10 relative">
          <div className="dash-animate">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-primary/70 mb-1">Dashboard</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-foreground">
              Welcome back, <span className="text-primary">{profile?.full_name?.split(' ')[0] || 'there'}</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1.5">Manage your listings, numbers & favorites</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
        {/* ── Profile Card ── */}
        <div className="glass-card border border-border/60 rounded-2xl p-4 sm:p-6 mb-8 dash-animate dash-animate-delay-1 hover-lift -mt-4 sm:-mt-6 relative z-10 shadow-sm">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-sm shadow-md">
                {(profile?.full_name?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-display font-bold text-foreground leading-tight">{t('profile')}</h2>
                <p className="text-[11px] text-muted-foreground">{user?.email}</p>
              </div>
              {isAdmin && (
                <span className="shimmer-badge flex items-center gap-1 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/20">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAdmin && (
                <Link to="/dashboard/admin" className="text-[11px] sm:text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                  {t('adminPanel')} →
                </Link>
              )}
            </div>
          </div>
          {editingProfile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              <input value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                className="bg-surface/80 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                placeholder={t('fullName')} />
              <PhoneInput value={profileForm.phone_number} onChange={v => setProfileForm(p => ({ ...p, phone_number: v }))} showValidation={false} />
              <div className="flex gap-2 col-span-full">
                <button onClick={saveProfile} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover active:scale-[0.97] transition-all">{t('save')}</button>
                <button onClick={() => setEditingProfile(false)} className="bg-surface border border-border px-5 py-2.5 rounded-xl text-sm font-bold text-foreground hover:bg-surface-accent active:scale-[0.97] transition-all">{t('cancel')}</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="min-w-0 space-y-0.5">
                <p className="text-foreground font-semibold text-sm sm:text-base">{profile?.full_name || 'No name set'}</p>
                <p className="text-muted-foreground text-xs">{profile?.phone_number || 'No phone set'}</p>
              </div>
              <button onClick={() => setEditingProfile(true)}
                className="flex items-center gap-1.5 text-primary text-xs sm:text-sm font-bold bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all active:scale-95">
                <Pencil className="h-3 w-3" /> Edit
              </button>
            </div>
          )}
        </div>

        {/* ── Listings Header ── */}
        <div className="flex items-center justify-between mb-5 dash-animate dash-animate-delay-2">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">{t('myListings')}</h2>
          <button onClick={initBulkForm}
            className="btn-glow bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all">
            <Plus className="h-4 w-4" /> Add Listings
          </button>
        </div>

        {/* Bulk Form */}
        {showForm && (
          <div className="glass-card border border-border/60 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm dash-animate">
            <h3 className="font-display font-bold text-foreground mb-4 text-sm sm:text-base flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
                <Plus className="h-3.5 w-3.5 text-white" />
              </div>
              Add New Listings
            </h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {rows.map((row, idx) => (
                <div key={idx} className="bg-surface rounded-xl p-3 sm:p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2 sm:hidden">
                    <span className="text-xs font-bold text-muted-foreground">Listing #{idx + 1}</span>
                    <button onClick={() => removeRow(idx)} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-300 rounded-lg hover:bg-red-50 transition-colors"
                      disabled={rows.length <= 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* Mobile: stacked layout */}
                  <div className="grid grid-cols-2 sm:hidden gap-2">
                    <div>
                      <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Number</label>
                      <input value={row.plate_number} onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                        updateRow(idx, 'plate_number', v);
                      }} placeholder="12345" maxLength={5}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Code</label>
                      <input value={row.plate_style} onChange={e => {
                        const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2);
                        updateRow(idx, 'plate_style', v.toUpperCase());
                      }} placeholder="A" maxLength={2}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Emirate</label>
                      <select value={row.emirate} onChange={e => updateRow(idx, 'emirate', e.target.value)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                        {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Price</label>
                      <input type="number" value={row.price} onChange={e => updateRow(idx, 'price', e.target.value)} placeholder="Price"
                        className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Description</label>
                      <input value={row.description} onChange={e => updateRow(idx, 'description', e.target.value)} placeholder="Optional"
                        className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  {/* Desktop: inline layout */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-2">
                      {idx === 0 && <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Number</label>}
                      <input value={row.plate_number} onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                        updateRow(idx, 'plate_number', v);
                      }} placeholder="12345" maxLength={5}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Emirate</label>}
                      <select value={row.emirate} onChange={e => updateRow(idx, 'emirate', e.target.value)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                        {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      {idx === 0 && <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Code</label>}
                      <input value={row.plate_style} onChange={e => {
                        const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2);
                        updateRow(idx, 'plate_style', v.toUpperCase());
                      }} placeholder="A" maxLength={2}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Price</label>}
                      <input type="number" value={row.price} onChange={e => updateRow(idx, 'price', e.target.value)} placeholder="Price"
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="col-span-4">
                      {idx === 0 && <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Description</label>}
                      <input value={row.description} onChange={e => updateRow(idx, 'description', e.target.value)} placeholder="Description"
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <button onClick={() => removeRow(idx)} className="col-span-1 h-9 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                      disabled={rows.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
              <button onClick={addRow} className="bg-surface border border-border px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-foreground hover:bg-surface-accent active:scale-[0.97] transition-all flex items-center gap-1">
                <Plus className="h-4 w-4" /> Add Another
              </button>
              <div className="flex-1" />
              <button onClick={() => setShowForm(false)} className="bg-surface border border-border px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-foreground hover:bg-surface-accent active:scale-[0.97] transition-all">{t('cancel')}</button>
              <button onClick={handleBulkSave} disabled={saving}
                className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save ({rows.filter(r => r.plate_number.trim()).length})
              </button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {editId && (
          <form onSubmit={handleEditSave} className="glass-card border border-border/60 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm dash-animate">
            <h3 className="font-display font-bold text-foreground text-base sm:text-lg mb-4 sm:mb-5 flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
                <Pencil className="h-3 w-3 text-white" />
              </div>
              {t('editListing')}
            </h3>

            {/* Live plate preview */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-3 sm:p-4 mb-5 sm:mb-6 flex items-center justify-center border border-border/50">
              <div className="bg-white dark:bg-card border-2 border-gray-300 dark:border-border rounded-xl px-5 sm:px-6 py-2.5 sm:py-3">
                <p className="font-mono font-black text-xl sm:text-2xl text-foreground tracking-wider text-center">
                  {editForm.plate_code && <span>{editForm.plate_code}</span>}
                  {editForm.plate_code && editForm.plate_number && <span className="mx-2"> </span>}
                  <span>{editForm.plate_number || '—'}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-12 gap-3 sm:gap-4 mb-4">
              {/* Code */}
              <div className="col-span-1 sm:col-span-3">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Code</label>
                <input
                  value={editForm.plate_code}
                  onChange={e => {
                    const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2);
                    setEditForm(p => ({ ...p, plate_code: v.toUpperCase() }));
                  }}
                  maxLength={2}
                  className="w-full bg-surface border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="A"
                />
              </div>
              {/* Number */}
              <div className="col-span-1 sm:col-span-5">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Number</label>
                <input
                  required
                  value={editForm.plate_number}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setEditForm(p => ({ ...p, plate_number: v }));
                  }}
                  maxLength={5}
                  className="w-full bg-surface border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="12345"
                />
              </div>
              {/* Emirate */}
              <div className="col-span-1 sm:col-span-4">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Emirate</label>
                <select value={editForm.emirate} onChange={e => setEditForm(p => ({ ...p, emirate: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Price (AED)</label>
                <input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 sm:py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="22,000" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Description</label>
                <input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 sm:py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Optional description" />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button type="submit" disabled={saving}
                className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('save')}
              </button>
              <button type="button" onClick={() => setEditId(null)}
                className="bg-surface border border-border px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-foreground hover:bg-surface-accent active:scale-[0.97] transition-all">{t('cancel')}</button>
            </div>
          </form>
        )}

        {/* ── Listing Filters ── */}
        <div className="space-y-3 mb-5 dash-animate dash-animate-delay-3">
          <div className="relative group">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setListPage(0); }}
              className="w-full bg-surface/80 border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              placeholder="Search plate numbers..." />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'sold', 'hidden'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setListPage(0); }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${statusFilter === s ? 'bg-gradient-to-r from-primary to-primary-hover text-primary-foreground shadow-md shadow-primary/15' : 'bg-surface border border-border text-foreground hover:bg-surface-accent hover:border-primary/20'}`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Listing Cards ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading listings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card border border-border/60 rounded-2xl p-12 text-center">
            <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No listings found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or add a new listing</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {pagedListings.map((listing, i) => (
                <div key={listing.id} className="glass-card border border-border/60 rounded-xl p-3.5 sm:p-4 hover-lift group" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="flex items-center justify-between gap-3">
                    {/* Info */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <span className="inline-flex items-center bg-gradient-to-br from-surface to-surface-accent border border-border rounded-lg px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-mono font-black text-foreground text-xs sm:text-sm tracking-wide shadow-sm">
                        {listing.plate_number}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(listing.status)}`}>{listing.status.toUpperCase()}</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{listing.emirate} {listing.price ? `• AED ${listing.price.toLocaleString()}` : ''}</p>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleHidden(listing)}
                        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${listing.status === 'hidden' ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-surface border border-border text-muted-foreground hover:text-primary hover:border-primary/30'}`}
                        title={listing.status === 'hidden' ? 'Show listing' : 'Hide listing'}>
                        {listing.status === 'hidden' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => toggleStatus(listing)} className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all active:scale-90"
                        title={listing.status === 'active' ? 'Mark as sold' : 'Mark as active'}>
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => startEdit(listing)} className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all active:scale-90">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(listing.id)} className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-200 transition-all active:scale-90">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => setListPage(p => Math.max(0, p - 1))} disabled={listPage === 0}
                  className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-bold text-foreground disabled:opacity-30 hover:bg-surface-accent active:scale-95 transition-all">Prev</button>
                <span className="text-xs text-muted-foreground font-mono bg-surface px-3 py-1.5 rounded-lg border border-border">{listPage + 1} / {totalPages}</span>
                <button onClick={() => setListPage(p => Math.min(totalPages - 1, p + 1))} disabled={listPage >= totalPages - 1}
                  className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-bold text-foreground disabled:opacity-30 hover:bg-surface-accent active:scale-95 transition-all">Next</button>
              </div>
            )}
          </>
        )}

        {/* ─── VIP Mobile Numbers Section ─── */}
        <div className="mt-10 sm:mt-12 pt-8 border-t border-border/50 dash-animate dash-animate-delay-4">
          <div className="flex items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-2xl font-display font-bold text-foreground truncate">My Mobile Numbers</h2>
            </div>
            <button onClick={initMobileForm}
              className="btn-glow bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.97] transition-all flex-shrink-0">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add</span> Number
            </button>
          </div>

          {/* Mobile Edit Form */}
          {mobileEditId && (
            <div className="glass-card border border-border/60 rounded-2xl p-6 mb-8 shadow-sm dash-animate">
              <h3 className="text-sm font-bold text-foreground mb-5">Edit Mobile Number</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Carrier</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setMobileEditForm(f => ({ ...f, carrier: 'du' }))}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${mobileEditForm.carrier === 'du'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-200 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                        : 'bg-surface border-border text-muted-foreground hover:border-gray-400'}`}>
                      <img src="/du-logo.png" alt="Du" className="h-5 w-5 object-contain" /> Du
                    </button>
                    <button type="button" onClick={() => setMobileEditForm(f => ({ ...f, carrier: 'etisalat' }))}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${mobileEditForm.carrier === 'etisalat'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-500 dark:text-emerald-300'
                        : 'bg-surface border-border text-muted-foreground hover:border-gray-400'}`}>
                      <img src="/Eand_Logo.svg" alt="e&" className="h-5 w-5 object-contain" /> e&
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Phone Number</label>
                  <input value={mobileEditForm.phone_number}
                    onChange={e => setMobileEditForm(f => ({ ...f, phone_number: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="050 123 4567" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Price (AED)</label>
                  <input type="number" value={mobileEditForm.price}
                    onChange={e => setMobileEditForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="99,399" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Description</label>
                  <input value={mobileEditForm.description}
                    onChange={e => setMobileEditForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Optional description" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Your Contact Phone</label>
                  <input value={mobileEditForm.contact_phone}
                    onChange={e => setMobileEditForm(f => ({ ...f, contact_phone: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Auto-filled from profile" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleMobileEditSave} disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.97] transition-all">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
                </button>
                <button onClick={() => setMobileEditId(null)}
                  className="bg-surface border border-border px-6 py-2.5 rounded-xl text-sm font-bold text-foreground hover:bg-surface-accent active:scale-[0.97] transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Mobile Add Form */}
          {showMobileForm && (
            <div className="glass-card border border-border/60 rounded-2xl p-6 mb-8 shadow-sm dash-animate">
              <h3 className="text-sm font-bold text-foreground mb-5">List a VIP Mobile Number</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Carrier */}
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Carrier</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileForm(f => ({ ...f, carrier: 'du' }))}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${mobileForm.carrier === 'du'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-200 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                        : 'bg-surface border-border text-muted-foreground hover:border-gray-400'
                        }`}
                    >
                      <img src="/du-logo.png" alt="Du" className="h-5 w-5 object-contain" />
                      Du
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileForm(f => ({ ...f, carrier: 'etisalat' }))}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${mobileForm.carrier === 'etisalat'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-500 dark:text-emerald-300'
                        : 'bg-surface border-border text-muted-foreground hover:border-gray-400'
                        }`}
                    >
                      <img src="/Eand_Logo.svg" alt="Etisalat" className="h-5 w-5 object-contain" />
                      Etisalat
                    </button>
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">VIP Number</label>
                  <input
                    value={mobileForm.phone_number}
                    onChange={e => setMobileForm(f => ({ ...f, phone_number: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="e.g. 050 123 4567 or 971501234567"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Format: 971XXXXXXXXX or 05XXXXXXXX</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Price */}
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Price (AED)</label>
                  <input
                    type="number"
                    value={mobileForm.price}
                    onChange={e => setMobileForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="32,000"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Description</label>
                  <input
                    value={mobileForm.description}
                    onChange={e => setMobileForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Optional description"
                  />
                </div>

                {/* Contact Phone (auto-filled) */}
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Your Contact Phone</label>
                  <input
                    value={mobileForm.contact_phone}
                    onChange={e => setMobileForm(f => ({ ...f, contact_phone: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Auto-filled from profile"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={saveMobileNumber} disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.97] transition-all">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} List Number
                </button>
                <button onClick={() => setShowMobileForm(false)}
                  className="bg-surface border border-border px-6 py-2.5 rounded-xl text-sm font-bold text-foreground hover:bg-surface-accent active:scale-[0.97] transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Mobile Numbers List */}
          {mobileNumbers.length === 0 ? (
            <div className="glass-card border border-border/60 rounded-2xl p-10 text-center">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-600/10 flex items-center justify-center mb-3">
                <Smartphone className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground text-sm">No mobile numbers listed yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mobileNumbers.map(mn => (
                <div key={mn.id} className="glass-card border border-border/60 rounded-2xl p-4 sm:p-5 hover-lift">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center overflow-hidden border flex-shrink-0 ${mn.carrier === 'etisalat' ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}`}>
                        <img
                          src={mn.carrier === 'etisalat' ? '/Eand_Logo.svg' : '/du-logo.png'}
                          alt={mn.carrier}
                          className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground font-bold font-mono tracking-wider text-sm sm:text-base truncate">{mn.phone_number}</p>
                        <p className="text-muted-foreground text-[11px] sm:text-xs capitalize">{mn.carrier} • {mn.price ? `AED ${mn.price.toLocaleString()}` : 'No price'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleMobileStatus(mn)}
                        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center transition-colors ${mn.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}
                        title={mn.status === 'active' ? 'Mark as sold' : 'Mark as active'}
                      >
                        {mn.status === 'active' ? <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      </button>
                      <button onClick={() => startMobileEdit(mn)} className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <button onClick={() => setMobileDeleteId(mn.id)}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── My Favorites Section ─── */}
        <div className="mt-10 sm:mt-12 pt-8 border-t border-border/50 dash-animate dash-animate-delay-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-2xl font-display font-bold text-foreground flex items-center gap-2.5">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              My Favorites
            </h2>
          </div>
        </div>
        <div className="glass-card border border-border/60 rounded-2xl p-6 mb-8 shadow-sm">
          {favorites.length === 0 ? (
            <div className="text-center py-6">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-600/10 flex items-center justify-center mb-3">
                <Heart className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">No favorites saved yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Browse listings and tap the ❤️ to save</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map(fav => (
                <div key={fav.id} className="bg-surface/60 border border-border/60 rounded-xl p-4 flex items-center gap-4 group hover-lift">
                  <Link
                    to={fav.listing_type === 'mobile_number' ? `/mobile-number/${fav.listing_id}` : `/plate/${fav.listing_id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">
                      {fav.listing_type === 'mobile_number' ? (fav.carrier === 'etisalat' ? 'e& Number' : 'Du Number') : (fav.emirate || 'Plate')}
                    </p>
                    <p className="text-lg font-black font-mono text-foreground truncate group-hover:text-primary transition-colors">
                      {fav.listing_type === 'mobile_number' ? fav.phone_number : fav.plate_number}
                    </p>
                    <p className="text-sm font-mono text-muted-foreground">
                      {fav.price ? `AED ${fav.price.toLocaleString()}` : 'Call for price'}
                    </p>
                  </Link>
                  <button
                    onClick={() => removeFavorite(fav.id)}
                    className="h-8 w-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
                    title="Remove from favorites"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Delete Modal */}
        {mobileDeleteId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card border border-border/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl modal-enter">
              <p className="text-foreground font-semibold mb-4">Delete this mobile number listing?</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setMobileDeleteId(null)} className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-foreground hover:bg-surface-accent active:scale-95 transition-all">{t('cancel')}</button>
                <button onClick={handleMobileDelete} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all">{t('yes')}, Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card border border-border/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl modal-enter">
              <p className="text-foreground font-semibold mb-4">{t('deleteConfirm')}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-foreground hover:bg-surface-accent active:scale-95 transition-all">{t('cancel')}</button>
                <button onClick={handleDelete} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all">{t('yes')}, Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
