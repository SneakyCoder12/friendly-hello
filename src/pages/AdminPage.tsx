import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Users, FileText, BarChart3, Upload, Trash2, Eye, EyeOff, Search, X, ChevronDown, ChevronUp, Smartphone, Wrench, RefreshCw, CheckCircle, AlertCircle, Car, Tag, Building2 } from 'lucide-react';
import PlateGeneratorSection from '@/components/PlateGenerator';
import { regenerateAllPlateImages } from '@/lib/plateImageMigration';
import { deletePlateImage } from '@/lib/plateImageService';
import { AdminMotors, AdminClassifieds, AdminProperties } from '@/components/AdminMarketplace';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  email: string | null;
  created_at: string;
}

interface AdminListing {
  id: string;
  plate_number: string;
  emirate: string;
  plate_style: string | null;
  price: number | null;
  status: string;
  user_id: string;
  created_at: string;
}

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

interface AdminMobileNumber {
  id: string;
  phone_number: string;
  carrier: string;
  price: number | null;
  status: string;
  user_id: string;
  created_at: string;
  description: string | null;
  contact_phone: string | null;
}

export default function AdminPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'analytics' | 'users' | 'listings' | 'bulk' | 'visualizer' | 'motors' | 'classifieds' | 'properties'>('analytics');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [mobileNumbers, setMobileNumbers] = useState<AdminMobileNumber[]>([]);
  const [loading, setLoading] = useState(true);

  // Listings filters
  const [listSearch, setListSearch] = useState('');
  const [listEmirateFilter, setListEmirateFilter] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState('');
  const [listSort, setListSort] = useState<'date' | 'price'>('date');

  // Users filter
  const [userSearch, setUserSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [filterByUserId, setFilterByUserId] = useState<string | null>(null);

  // Bulk upload
  const [bulkMode, setBulkMode] = useState<'text' | 'csv'>('text');
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<{ plate_number: string; emirate: string; price: string; plate_style: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [usersRes, listingsRes, mobileRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('listings').select('*').order('created_at', { ascending: false }),
      supabase.from('mobile_numbers').select('*').order('created_at', { ascending: false }),
    ]);
    if (usersRes.data) setUsers(usersRes.data as UserProfile[]);
    if (listingsRes.data) setListings(listingsRes.data as unknown as AdminListing[]);
    if (mobileRes.data) setMobileNumbers(mobileRes.data as unknown as AdminMobileNumber[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete user "${userName}"? This will delete all their listings, favorites, and profile. This action cannot be undone.`)) {
      return;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) { toast.error('Not authenticated'); return; }

      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
      if (error) throw error;

      toast.success('User and all associated data deleted successfully.');
      setExpandedUser(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const deleteListing = async (id: string) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) { toast.error('Not authenticated'); return; }

      // 1. Fetch the listing to get the image path
      const { data: listing } = await supabase
        .from('listings')
        .select('plate_image_path')
        .eq('id', id)
        .single();

      // 2. Delete the image from Storage if it exists
      if (listing?.plate_image_path) {
        await deletePlateImage(listing.plate_image_path);
      }

      // 3. Delete associated favorites
      await supabase
        .from('favorites')
        .delete()
        .eq('listing_id', id)
        .eq('listing_type', 'plate');

      // 4. Delete the listing record
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (deleteError) {
        toast.error(`Failed to delete listing: ${deleteError.message}`);
      } else {
        toast.success('Listing deleted');
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete listing');
    }
  };

  const toggleListingStatus = async (listing: AdminListing) => {
    const next = listing.status === 'active' ? 'hidden' : 'active';
    const { error } = await supabase.from('listings').update({ status: next }).eq('id', listing.id);
    if (error) toast.error(error.message);
    else fetchAll();
  };

  const deleteMobileNumber = async (id: string) => {
    const { error } = await supabase.from('mobile_numbers').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Mobile number deleted'); fetchAll(); }
  };

  const toggleMobileStatus = async (mn: AdminMobileNumber) => {
    const next = mn.status === 'active' ? 'hidden' : 'active';
    const { error } = await supabase.from('mobile_numbers').update({ status: next }).eq('id', mn.id);
    if (error) toast.error(error.message);
    else fetchAll();
  };

  // Parse bulk text into preview
  const parseBulkText = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = lines.map(line => {
      const parts = line.split(',').map(s => s.trim());
      return {
        plate_number: parts[0] || '',
        emirate: parts[1] || 'Dubai',
        price: parts[2] || '',
        plate_style: parts[3] || '',
      };
    }).filter(r => r.plate_number);
    setBulkPreview(parsed);
  };

  const handleBulkUpload = async () => {
    if (!bulkPreview.length) { toast.error('No valid rows'); return; }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); setUploading(false); return; }

    const rows = bulkPreview.map(r => ({
      plate_number: r.plate_number,
      emirate: r.emirate,
      price: r.price ? Number(r.price) : null,
      plate_style: r.plate_style || null,
      user_id: user.id,
    }));

    const { error } = await supabase.from('listings').insert(rows);
    if (error) toast.error(error.message);
    else { toast.success(`${rows.length} listings created`); setBulkText(''); setBulkPreview([]); fetchAll(); }
    setUploading(false);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').slice(1).map(l => l.trim()).filter(Boolean);
    const parsed = lines.map(line => {
      const [plate_number, emirate, price, plate_style] = line.split(',').map(s => s.trim());
      return { plate_number: plate_number || '', emirate: emirate || 'Dubai', price: price || '', plate_style: plate_style || '' };
    }).filter(r => r.plate_number);
    setBulkPreview(parsed);
  };

  // Stats
  const stats = useMemo(() => {
    const byEmirate: Record<string, number> = {};
    const byUser: Record<string, { name: string; count: number }> = {};
    listings.forEach(l => {
      byEmirate[l.emirate] = (byEmirate[l.emirate] || 0) + 1;
      const owner = users.find(u => u.id === l.user_id);
      const uName = owner?.full_name || owner?.email || 'Unknown';
      if (!byUser[l.user_id]) byUser[l.user_id] = { name: uName, count: 0 };
      byUser[l.user_id].count++;
    });
    const topUsers = Object.entries(byUser).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
    const recentActivity = listings.slice(0, 10);
    return {
      totalUsers: users.length,
      totalListings: listings.length,
      activeListings: listings.filter(l => l.status === 'active').length,
      totalMobile: mobileNumbers.length,
      activeMobile: mobileNumbers.filter(m => m.status === 'active').length,
      byEmirate,
      topUsers,
      recentActivity,
    };
  }, [listings, mobileNumbers, users]);

  // Filtered listings
  const filteredListings = useMemo(() => {
    let result = [...listings];
    if (filterByUserId) result = result.filter(l => l.user_id === filterByUserId);
    if (listSearch) result = result.filter(l => {
      const owner = users.find(u => u.id === l.user_id);
      return (
        l.plate_number.toLowerCase().includes(listSearch.toLowerCase()) ||
        (owner?.email || '').toLowerCase().includes(listSearch.toLowerCase()) ||
        (owner?.full_name || '').toLowerCase().includes(listSearch.toLowerCase())
      );
    });
    if (listEmirateFilter) result = result.filter(l => l.emirate === listEmirateFilter);
    if (listStatusFilter) result = result.filter(l => l.status === listStatusFilter);
    if (listSort === 'price') result.sort((a, b) => (b.price || 0) - (a.price || 0));
    return result;
  }, [listings, users, listSearch, listEmirateFilter, listStatusFilter, listSort, filterByUserId]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    return users.filter(u =>
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone_number?.includes(userSearch)
    );
  }, [users, userSearch]);

  const userListingCount = (uid: string) => listings.filter(l => l.user_id === uid).length;

  const tabBtn = (key: typeof tab, icon: React.ReactNode, label: string) => (
    <button key={key} onClick={() => { setTab(key); setFilterByUserId(null); }}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === key ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border text-foreground hover:bg-surface-accent'}`}>
      {icon} {label}
    </button>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24 relative z-10 bg-background/95 backdrop-blur-sm rounded-xl mt-4 mb-4">
        <h1 className="text-3xl font-display font-bold text-foreground mb-6">{t('adminPanel')}</h1>

        <div className="flex gap-2 mb-8 flex-wrap">
          {tabBtn('analytics', <BarChart3 className="h-4 w-4" />, t('analytics'))}
          {tabBtn('users', <Users className="h-4 w-4" />, t('allUsers'))}
          {tabBtn('listings', <FileText className="h-4 w-4" />, t('allListingsAdmin'))}
          {tabBtn('motors', <Car className="h-4 w-4" />, 'Motors')}
          {tabBtn('classifieds', <Tag className="h-4 w-4" />, 'Classifieds')}
          {tabBtn('properties', <Building2 className="h-4 w-4" />, 'Properties')}
          {tabBtn('bulk', <Upload className="h-4 w-4" />, t('bulkUpload'))}
          {tabBtn('visualizer', <Wrench className="h-4 w-4" />, 'Plate Visualizer')}
        </div>

        {/* Analytics */}
        {tab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: t('totalUsers'), value: stats.totalUsers, color: 'text-blue-400' },
                { label: t('totalListings'), value: stats.totalListings, color: 'text-emerald-400' },
                { label: t('activeListingsCount'), value: stats.activeListings, color: 'text-amber-400' },
                { label: 'Mobile Numbers', value: stats.totalMobile, color: 'text-purple-400' },
                { label: 'Active Numbers', value: stats.activeMobile, color: 'text-pink-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className={`text-4xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Listings by Emirate */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display font-bold text-foreground mb-4">Listings by Emirate</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EMIRATES.map(em => (
                  <div key={em} className="bg-surface border border-border rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground font-bold mb-1">{em}</p>
                    <p className="text-2xl font-mono font-bold text-foreground">{stats.byEmirate[em] || 0}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display font-bold text-foreground mb-4">Most Active Users</h3>
              <div className="space-y-2">
                {stats.topUsers.map(([uid, info]) => (
                  <div key={uid} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border/50">
                    <span className="text-sm text-foreground font-medium">{info.name}</span>
                    <span className="font-mono text-sm font-bold text-primary">{info.count} listings</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display font-bold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {stats.recentActivity.map(l => (
                  <div key={l.id} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{(() => { const o = users.find(u => u.id === l.user_id); return o?.full_name || o?.email || 'User'; })()}</span> added <span className="font-mono text-foreground">{l.plate_number}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Search users by name, email, or phone..." />
            </div>
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <div key={u.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{u.full_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{u.email || 'No email'} • {u.phone_number || 'No phone'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-bold text-primary">{userListingCount(u.id)} listings</span>
                      <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {expandedUser === u.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedUser === u.id && (
                    <div className="border-t border-border bg-surface px-4 py-3 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Full Name:</span> <span className="text-foreground font-medium">{u.full_name || '—'}</span></div>
                        <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground font-medium">{u.email || '—'}</span></div>
                        <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground font-medium">{u.phone_number || '—'}</span></div>
                        <div><span className="text-muted-foreground">Joined:</span> <span className="text-foreground font-medium">{new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => { setTab('listings'); setFilterByUserId(u.id); }}
                          className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors"
                        >
                          View Listings →
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.full_name || u.email || 'Unknown')}
                          className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listings */}
        {tab === 'listings' && (
          <div>
            {filterByUserId && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtered by user</span>
                <button onClick={() => setFilterByUserId(null)} className="text-xs text-primary font-bold hover:underline flex items-center gap-1"><X className="h-3 w-3" /> Clear</button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={listSearch} onChange={e => setListSearch(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Search by plate, email, or name..." />
              </div>
              <select value={listEmirateFilter} onChange={e => setListEmirateFilter(e.target.value)}
                className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground">
                <option value="">All Emirates</option>
                {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
              <select value={listStatusFilter} onChange={e => setListStatusFilter(e.target.value)}
                className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="hidden">Hidden</option>
              </select>
              <select value={listSort} onChange={e => setListSort(e.target.value as 'date' | 'price')}
                className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground">
                <option value="date">Newest First</option>
                <option value="price">Price: High → Low</option>
              </select>
            </div>
            <div className="space-y-2">
              {/* Plate Listings */}
              {filteredListings.length > 0 && <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-4 mb-2">Plate Listings</h3>}
              {filteredListings.map(l => (
                <div key={l.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="inline-flex items-center bg-surface border border-border rounded-lg px-3 py-1 font-mono font-bold text-foreground text-sm">{l.plate_number}</span>
                      <span className="text-muted-foreground text-sm">{l.emirate}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${l.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : l.status === 'sold' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                        {l.status}
                      </span>
                      {l.price && <span className="font-mono text-sm text-foreground">AED {l.price.toLocaleString()}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Added by <span className="text-foreground font-medium">{(() => { const o = users.find(u => u.id === l.user_id); return o?.full_name || o?.email || 'Unknown'; })()}</span>
                      {' • '}{new Date(l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
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

              {/* Mobile Number Listings */}
              {mobileNumbers.length > 0 && <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 flex items-center gap-2"><Smartphone className="h-4 w-4" /> Mobile Numbers</h3>}
              {mobileNumbers
                .filter(mn => {
                  if (filterByUserId && mn.user_id !== filterByUserId) return false;
                  if (listSearch) {
                    const owner = users.find(u => u.id === mn.user_id);
                    return (
                      mn.phone_number.toLowerCase().includes(listSearch.toLowerCase()) ||
                      (owner?.email || '').toLowerCase().includes(listSearch.toLowerCase()) ||
                      (owner?.full_name || '').toLowerCase().includes(listSearch.toLowerCase())
                    );
                  }
                  if (listStatusFilter && mn.status !== listStatusFilter) return false;
                  return true;
                })
                .map(mn => (
                  <div key={mn.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center overflow-hidden border ${mn.carrier === 'etisalat' ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}`}>
                        <img src={mn.carrier === 'etisalat' ? '/Eand_Logo.svg' : '/du-logo.webp'} alt={mn.carrier} className="h-5 w-5 object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-mono font-bold text-foreground text-sm">{mn.phone_number}</span>
                          <span className="text-muted-foreground text-xs capitalize">{mn.carrier}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${mn.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                            {mn.status}
                          </span>
                          {mn.price && <span className="font-mono text-sm text-foreground">AED {mn.price.toLocaleString()}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Added by <span className="text-foreground font-medium">{(() => { const o = users.find(u => u.id === mn.user_id); return o?.full_name || o?.email || 'Unknown'; })()}</span>
                          {' • '}{new Date(mn.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleMobileStatus(mn)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                        {mn.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => deleteMobileNumber(mn.id)} className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Bulk Upload */}
        {tab === 'bulk' && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setBulkMode('text')}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${bulkMode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border text-foreground'}`}>
                {t('textInput')}
              </button>
              <button onClick={() => setBulkMode('csv')}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${bulkMode === 'csv' ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border text-foreground'}`}>
                {t('csvUpload')}
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Format: <code className="bg-surface px-1.5 py-0.5 rounded">plate_number,emirate,price,plate_style</code> (one per line)
            </p>

            {bulkMode === 'text' ? (
              <div className="space-y-4">
                <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8}
                  placeholder={`A 12345,Dubai,50000,A\nB 6789,Abu Dhabi,30000,B`}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                <button onClick={parseBulkText} className="bg-surface border border-border px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:bg-surface-accent">
                  Preview Import
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">CSV header: plate_number,emirate,price,plate_style</p>
                <input type="file" accept=".csv" onChange={handleCsvUpload}
                  className="text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-primary-foreground file:font-bold file:text-sm file:cursor-pointer" />
              </div>
            )}

            {/* Preview Table */}
            {bulkPreview.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold text-foreground text-sm mb-3">Preview ({bulkPreview.length} rows)</h4>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface">
                      <tr>
                        <th className="text-start px-4 py-2 text-xs text-muted-foreground font-bold">Plate</th>
                        <th className="text-start px-4 py-2 text-xs text-muted-foreground font-bold">Emirate</th>
                        <th className="text-start px-4 py-2 text-xs text-muted-foreground font-bold">Price</th>
                        <th className="text-start px-4 py-2 text-xs text-muted-foreground font-bold">Style</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.map((r, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="px-4 py-2 font-mono text-foreground">{r.plate_number}</td>
                          <td className="px-4 py-2 text-foreground">{r.emirate}</td>
                          <td className="px-4 py-2 text-foreground">{r.price || '—'}</td>
                          <td className="px-4 py-2 text-foreground">{r.plate_style || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={handleBulkUpload} disabled={uploading}
                  className="mt-4 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />} Import {bulkPreview.length} Listings
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'motors' && <div className="bg-card border border-border rounded-2xl p-6 shadow-sm"><h2 className="text-xl font-bold font-display mb-4 text-foreground flex items-center gap-2"><Car className="h-5 w-5 text-primary" /> All Motors Listings</h2><AdminMotors users={users} /></div>}
        {tab === 'classifieds' && <div className="bg-card border border-border rounded-2xl p-6 shadow-sm"><h2 className="text-xl font-bold font-display mb-4 text-foreground flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> All Classifieds Listings</h2><AdminClassifieds users={users} /></div>}
        {tab === 'properties' && <div className="bg-card border border-border rounded-2xl p-6 shadow-sm"><h2 className="text-xl font-bold font-display mb-4 text-foreground flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> All Property Listings</h2><AdminProperties users={users} /></div>}

        {/* ── Plate Visualizer ── */}
        {tab === 'visualizer' && (
          <div className="space-y-6">
            {/* Plate Image Migration Tool */}
            <MigrationPanel />
            <div className="bg-card border border-border rounded-2xl p-6">
              <PlateGeneratorSection />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Standalone panel so it has its own state cleanly */
function MigrationPanel() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [result, setResult] = useState<{ succeeded: number; failed: number; errors: { id: string; plate_number: string; error: string }[] } | null>(null);

  const run = useCallback(async () => {
    if (!confirm('This will regenerate ALL plate images and update the database. Proceed?')) return;
    setRunning(true);
    setResult(null);
    setProgress({ done: 0, total: 0, current: 'Starting…' });
    try {
      const res = await regenerateAllPlateImages((done, total, current) => {
        setProgress({ done, total, current });
      });
      setResult(res);
      if (res.failed === 0) {
        toast.success(`Migration complete — ${res.succeeded}/${res.total} plates regenerated.`);
      } else {
        toast.error(`Migration done with errors — ${res.failed} failed. See details below.`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('Migration failed: ' + msg);
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-foreground text-lg">Regenerate All Plate Images</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Re-renders every listing's plate image using the correct custom fonts and uploads
            versioned WebP files to Supabase Storage. Run this after any font fix.
          </p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50 transition"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {running ? 'Running…' : 'Run Migration'}
        </button>
      </div>

      {/* Progress */}
      {running && progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress.current}</span>
            <span>{progress.done} / {progress.total}</span>
          </div>
          {progress.total > 0 && (
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && !running && (
        <div className="space-y-3">
          <div className="flex gap-4 text-sm font-bold">
            <span className="flex items-center gap-1 text-primary">
              <CheckCircle className="h-4 w-4" /> {result.succeeded} succeeded
            </span>
            {result.failed > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-4 w-4" /> {result.failed} failed
              </span>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
              {result.errors.map((e) => (
                <div key={e.id} className="text-xs text-destructive font-mono">
                  [{e.plate_number}] {e.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

