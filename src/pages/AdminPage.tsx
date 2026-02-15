import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Users, FileText, BarChart3, Upload, Trash2, Eye, EyeOff } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  created_at: string;
}

interface AdminListing {
  id: string;
  plate_number: string;
  emirate: string;
  price: number | null;
  status: string;
  user_id: string;
  created_at: string;
}

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

export default function AdminPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'analytics' | 'users' | 'listings' | 'bulk'>('analytics');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalListings: 0, activeListings: 0 });

  // Bulk upload
  const [bulkMode, setBulkMode] = useState<'text' | 'csv'>('text');
  const [bulkText, setBulkText] = useState('');
  const [bulkEmirate, setBulkEmirate] = useState('Dubai');
  const [bulkPrice, setBulkPrice] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [usersRes, listingsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('listings').select('*').order('created_at', { ascending: false }),
    ]);
    if (usersRes.data) setUsers(usersRes.data);
    if (listingsRes.data) {
      setListings(listingsRes.data);
      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalListings: listingsRes.data.length,
        activeListings: listingsRes.data.filter(l => l.status === 'active').length,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const deleteListing = async (id: string) => {
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Listing deleted'); fetchAll(); }
  };

  const toggleListingStatus = async (listing: AdminListing) => {
    const next = listing.status === 'active' ? 'hidden' : 'active';
    const { error } = await supabase.from('listings').update({ status: next }).eq('id', listing.id);
    if (error) toast.error(error.message);
    else fetchAll();
  };

  const handleBulkText = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error('No plate numbers entered'); return; }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); setUploading(false); return; }

    const rows = lines.map(plate => ({
      plate_number: plate,
      emirate: bulkEmirate,
      price: bulkPrice ? Number(bulkPrice) : null,
      user_id: user.id,
    }));

    const { error } = await supabase.from('listings').insert(rows);
    if (error) toast.error(error.message);
    else { toast.success(`${rows.length} listings created`); setBulkText(''); fetchAll(); }
    setUploading(false);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const text = await file.text();
    const lines = text.split('\n').slice(1).map(l => l.trim()).filter(Boolean);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); setUploading(false); return; }

    const rows = lines.map(line => {
      const [plate_number, emirate, price] = line.split(',').map(s => s.trim());
      return {
        plate_number: plate_number || '',
        emirate: emirate || 'Dubai',
        price: price ? Number(price) : null,
        user_id: user.id,
      };
    }).filter(r => r.plate_number);

    if (!rows.length) { toast.error('No valid rows found'); setUploading(false); return; }

    const { error } = await supabase.from('listings').insert(rows);
    if (error) toast.error(error.message);
    else { toast.success(`${rows.length} listings imported`); fetchAll(); }
    setUploading(false);
  };

  const tabBtn = (key: typeof tab, icon: React.ReactNode, label: string) => (
    <button key={key} onClick={() => setTab(key)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === key ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border text-foreground hover:bg-surface-accent'}`}>
      {icon} {label}
    </button>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-display font-bold text-foreground mb-6">{t('adminPanel')}</h1>
        
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabBtn('analytics', <BarChart3 className="h-4 w-4" />, t('analytics'))}
          {tabBtn('users', <Users className="h-4 w-4" />, t('allUsers'))}
          {tabBtn('listings', <FileText className="h-4 w-4" />, t('allListingsAdmin'))}
          {tabBtn('bulk', <Upload className="h-4 w-4" />, t('bulkUpload'))}
        </div>

        {/* Analytics */}
        {tab === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: t('totalUsers'), value: stats.totalUsers, color: 'text-blue-400' },
              { label: t('totalListings'), value: stats.totalListings, color: 'text-emerald-400' },
              { label: t('activeListingsCount'), value: stats.activeListings, color: 'text-amber-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-2xl p-6">
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                <p className={`text-4xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">{u.full_name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{u.phone_number || 'No phone'}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Listings */}
        {tab === 'listings' && (
          <div className="space-y-2">
            {listings.map(l => (
              <div key={l.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className="font-mono font-bold text-foreground">{l.plate_number}</span>
                  <span className="text-muted-foreground text-sm ms-3">{l.emirate}</span>
                  <span className={`ms-3 text-[10px] font-bold px-2 py-0.5 rounded-full border ${l.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                    {l.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleListingStatus(l)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                    {l.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => deleteListing(l.id)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Upload */}
        {tab === 'bulk' && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex gap-2 mb-6">
              <button onClick={() => setBulkMode('text')}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${bulkMode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border text-foreground'}`}>
                {t('textInput')}
              </button>
              <button onClick={() => setBulkMode('csv')}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${bulkMode === 'csv' ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border text-foreground'}`}>
                {t('csvUpload')}
              </button>
            </div>

            {bulkMode === 'text' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select value={bulkEmirate} onChange={e => setBulkEmirate(e.target.value)}
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
                  </select>
                  <input type="number" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} placeholder="Default price (optional)"
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8} placeholder={t('pasteNumbers')}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                <button onClick={handleBulkText} disabled={uploading}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />} {t('import')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('csvFormat')}</p>
                <input type="file" accept=".csv" onChange={handleCsvUpload}
                  className="text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-primary-foreground file:font-bold file:text-sm file:cursor-pointer" />
                {uploading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
