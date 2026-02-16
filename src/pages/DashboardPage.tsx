import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, CheckCircle, Search, X, Shield } from 'lucide-react';
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

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      full_name: profileForm.full_name,
      phone_number: profileForm.phone_number,
    }).eq('id', user.id);
    if (error) toast.error(error.message);
    else { toast.success('Profile updated'); setEditingProfile(false); refreshProfile(); }
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        {/* Profile Section */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-display font-bold text-foreground">{t('profile')}</h2>
              {isAdmin && (
                <span className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
            {isAdmin && (
              <Link to="/dashboard/admin" className="text-sm font-bold text-primary hover:underline">
                {t('adminPanel')} →
              </Link>
            )}
          </div>
          {editingProfile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                className="bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder={t('fullName')} />
              <PhoneInput value={profileForm.phone_number} onChange={v => setProfileForm(p => ({ ...p, phone_number: v }))} showValidation={false} />
              <div className="flex gap-2 col-span-full">
                <button onClick={saveProfile} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold">{t('save')}</button>
                <button onClick={() => setEditingProfile(false)} className="bg-surface border border-border px-6 py-2 rounded-xl text-sm font-bold text-foreground">{t('cancel')}</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">{profile?.full_name || 'No name set'}</p>
                <p className="text-muted-foreground text-sm font-medium">{user?.email}</p>
                <p className="text-muted-foreground text-sm">{profile?.phone_number || 'No phone set'}</p>
              </div>
              <button onClick={() => setEditingProfile(true)} className="text-primary text-sm font-bold hover:underline">Edit</button>
            </div>
          )}
        </div>

        {/* Listings Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">{t('myListings')}</h2>
          <button onClick={initBulkForm}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-all">
            <Plus className="h-4 w-4" /> Add Listings
          </button>
        </div>

        {/* Bulk Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <h3 className="font-display font-bold text-foreground mb-4">Add New Listings</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-surface rounded-xl p-3 border border-border/50">
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
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={addRow} className="bg-surface border border-border px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:bg-surface-accent transition-colors flex items-center gap-1">
                <Plus className="h-4 w-4" /> Add Another
              </button>
              <div className="flex-1" />
              <button onClick={() => setShowForm(false)} className="bg-surface border border-border px-6 py-2.5 rounded-xl text-sm font-bold text-foreground">{t('cancel')}</button>
              <button onClick={handleBulkSave} disabled={saving}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save All ({rows.filter(r => r.plate_number.trim()).length})
              </button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {editId && (
          <form onSubmit={handleEditSave} className="bg-card border border-border rounded-2xl p-6 mb-8">
            <h3 className="font-display font-bold text-foreground text-lg mb-5">{t('editListing')}</h3>

            {/* Live plate preview */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 mb-6 flex items-center justify-center border border-border/50">
              <div className="bg-white dark:bg-card border-2 border-gray-300 dark:border-border rounded-xl px-6 py-3">
                <p className="font-mono font-black text-2xl text-foreground tracking-wider text-center">
                  {editForm.plate_code && <span>{editForm.plate_code}</span>}
                  {editForm.plate_code && editForm.plate_number && <span className="mx-2"> </span>}
                  <span>{editForm.plate_number || '—'}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mb-4">
              {/* Code */}
              <div className="col-span-3">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Code</label>
                <input
                  value={editForm.plate_code}
                  onChange={e => {
                    const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2);
                    setEditForm(p => ({ ...p, plate_code: v.toUpperCase() }));
                  }}
                  maxLength={2}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="A"
                />
              </div>
              {/* Number */}
              <div className="col-span-5">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Number</label>
                <input
                  required
                  value={editForm.plate_number}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setEditForm(p => ({ ...p, plate_number: v }));
                  }}
                  maxLength={5}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="12345"
                />
              </div>
              {/* Emirate */}
              <div className="col-span-4">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Emirate</label>
                <select value={editForm.emirate} onChange={e => setEditForm(p => ({ ...p, emirate: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Price (AED)</label>
                <input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="22,000" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Description</label>
                <input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Optional description" />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:bg-primary-hover transition-all">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('save')}
              </button>
              <button type="button" onClick={() => setEditId(null)}
                className="bg-surface border border-border px-6 py-2.5 rounded-xl text-sm font-bold text-foreground hover:bg-surface-accent transition-colors">{t('cancel')}</button>
            </div>
          </form>
        )}

        {/* Listing Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setListPage(0); }}
              className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Search plate numbers..." />
          </div>
          {['all', 'active', 'sold', 'hidden'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setListPage(0); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border text-foreground hover:bg-surface-accent'}`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        {/* Listing Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No listings found.</div>
        ) : (
          <>
            <div className="space-y-3">
              {pagedListings.map(listing => (
                <div key={listing.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="inline-flex items-center bg-surface border border-border rounded-lg px-3 py-1 font-mono font-bold text-foreground text-sm">{listing.plate_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(listing.status)}`}>{listing.status.toUpperCase()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{listing.emirate} {listing.price ? `• AED ${listing.price.toLocaleString()}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleStatus(listing)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      title={listing.status === 'active' ? 'Mark as sold' : 'Mark as active'}>
                      {listing.status === 'active' ? <CheckCircle className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => startEdit(listing)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(listing.id)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button onClick={() => setListPage(p => Math.max(0, p - 1))} disabled={listPage === 0}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-border text-sm font-bold text-foreground disabled:opacity-30">Prev</button>
                <span className="text-sm text-muted-foreground font-mono">Page {listPage + 1} of {totalPages}</span>
                <button onClick={() => setListPage(p => Math.min(totalPages - 1, p + 1))} disabled={listPage >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-border text-sm font-bold text-foreground disabled:opacity-30">Next</button>
              </div>
            )}
          </>
        )}

        {/* Delete Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
              <p className="text-foreground font-medium mb-4">{t('deleteConfirm')}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-bold text-foreground">{t('cancel')}</button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold">{t('yes')}, Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
