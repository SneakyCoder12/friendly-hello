import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, CheckCircle } from 'lucide-react';

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];
const STATUSES = ['active', 'sold', 'hidden'] as const;

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

export default function DashboardPage() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    plate_number: '', emirate: 'Dubai', plate_style: '', price: '', description: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Profile edit
  const [profileForm, setProfileForm] = useState({ full_name: '', phone_number: '' });
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({ full_name: profile.full_name || '', phone_number: profile.phone_number || '' });
    }
  }, [profile]);

  const fetchListings = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setListings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [user]);

  const updateField = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const resetForm = () => {
    setForm({ plate_number: '', emirate: 'Dubai', plate_style: '', price: '', description: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.plate_number.trim()) { toast.error('Plate number is required'); return; }

    setSaving(true);
    const payload = {
      plate_number: form.plate_number.trim(),
      emirate: form.emirate,
      plate_style: form.plate_style || null,
      price: form.price ? Number(form.price) : null,
      description: form.description || null,
      user_id: user.id,
    };

    if (editId) {
      const { error } = await supabase.from('listings').update(payload).eq('id', editId);
      if (error) toast.error(error.message);
      else { toast.success('Listing updated'); resetForm(); fetchListings(); }
    } else {
      const { error } = await supabase.from('listings').insert(payload);
      if (error) {
        if (error.message.includes('idx_unique_plate_per_emirate')) toast.error('This plate number already exists in this emirate');
        else toast.error(error.message);
      } else { toast.success('Listing created'); resetForm(); fetchListings(); }
    }
    setSaving(false);
  };

  const startEdit = (listing: Listing) => {
    setForm({
      plate_number: listing.plate_number,
      emirate: listing.emirate,
      plate_style: listing.plate_style || '',
      price: listing.price?.toString() || '',
      description: listing.description || '',
    });
    setEditId(listing.id);
    setShowForm(true);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        {/* Profile Section */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-foreground">{t('profile')}</h2>
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
              <input value={profileForm.phone_number} onChange={e => setProfileForm(p => ({ ...p, phone_number: e.target.value }))}
                className="bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder={t('phoneNumber')} />
              <div className="flex gap-2 col-span-full">
                <button onClick={saveProfile} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold">{t('save')}</button>
                <button onClick={() => setEditingProfile(false)} className="bg-surface border border-border px-6 py-2 rounded-xl text-sm font-bold text-foreground">{t('cancel')}</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">{profile?.full_name || 'No name set'}</p>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                <p className="text-muted-foreground text-sm">{profile?.phone_number || 'No phone set'}</p>
              </div>
              <button onClick={() => setEditingProfile(true)} className="text-primary text-sm font-bold hover:underline">Edit</button>
            </div>
          )}
        </div>

        {/* Listings */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-foreground">{t('myListings')}</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-all">
            <Plus className="h-4 w-4" /> {t('addListing')}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-6 mb-8 space-y-4">
            <h3 className="font-display font-bold text-foreground">{editId ? t('editListing') : t('addListing')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('plateNumber')}</label>
                <input required value={form.plate_number} onChange={e => updateField('plate_number', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('emirate')}</label>
                <select value={form.emirate} onChange={e => updateField('emirate', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('plateStyle')}</label>
                <input value={form.plate_style} onChange={e => updateField('plate_style', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('price')} (AED)</label>
                <input type="number" value={form.price} onChange={e => updateField('price', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('description')}</label>
              <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('save')}
              </button>
              <button type="button" onClick={resetForm}
                className="bg-surface border border-border px-6 py-2.5 rounded-xl text-sm font-bold text-foreground">{t('cancel')}</button>
            </div>
          </form>
        )}

        {/* Listing table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No listings yet. Create your first one!</div>
        ) : (
          <div className="space-y-3">
            {listings.map(listing => (
              <div key={listing.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-bold text-foreground text-lg">{listing.plate_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(listing.status)}`}>
                      {listing.status.toUpperCase()}
                    </span>
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
        )}

        {/* Delete Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
              <p className="text-foreground font-medium mb-4">{t('deleteConfirm')}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-bold text-foreground">{t('cancel')}</button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold">
                  {t('yes')}, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
