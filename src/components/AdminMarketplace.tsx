import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trash2, Eye, EyeOff, CheckCircle, Car, Tag, Building2, Search } from 'lucide-react';
import { deleteMarketplaceImages, updateListingStatus, type MotorListing, type ClassifiedListing, type PropertyListing } from '@/lib/marketplace';

interface UserProfile {
    id: string;
    full_name: string | null;
    phone_number: string | null;
    email: string | null;
}

const statusColor = (s: string) => {
    if (s === 'active') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (s === 'sold') return 'bg-red-500/10 text-red-600 border-red-500/20';
    if (s === 'hidden') return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
};

// ═══════════════════════════════════════════════════════════════
//  Admin Motors
// ═══════════════════════════════════════════════════════════════
export function AdminMotors({ users }: { users: UserProfile[] }) {
    const [items, setItems] = useState<MotorListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('motors_listings').select('*').order('created_at', { ascending: false });
        if (error) toast.error(error.message);
        else setItems((data || []) as MotorListing[]);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const toggleStatus = async (item: MotorListing, status: 'active' | 'sold' | 'hidden') => {
        try { await updateListingStatus('motors_listings', item.id, status); load(); }
        catch (err: any) { toast.error(err.message); }
    };

    const handleDelete = async (item: MotorListing) => {
        if (!window.confirm('Delete this motor listing permanently?')) return;
        try {
            if (item.images?.length) await deleteMarketplaceImages(item.images);
            const { error } = await supabase.from('motors_listings').delete().eq('id', item.id);
            if (error) throw error;
            toast.success('Listing deleted'); load();
        } catch (err: any) { toast.error(err.message); }
    };

    const filtered = items.filter(i => {
        if (!search) return true;
        const lower = search.toLowerCase();
        const owner = users.find(u => u.id === i.user_id);
        return i.title.toLowerCase().includes(lower) ||
            (owner?.email || '').toLowerCase().includes(lower) ||
            (owner?.full_name || '').toLowerCase().includes(lower);
    });

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, user email, or name..." className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                <div className="bg-card glass-card border flex flex-col border-border/50 rounded-2xl overflow-hidden p-0 relative">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-accent border-b border-border/50 text-xs uppercase text-muted-foreground/80">
                                <tr>
                                    <th className="px-5 py-3.5 font-bold tracking-wider rounded-tl-xl whitespace-nowrap">Listing</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider whitespace-nowrap">User</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider whitespace-nowrap">Price</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider text-right rounded-tr-xl whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filtered.map(item => {
                                    const owner = users.find(u => u.id === item.user_id);
                                    return (
                                        <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                                            <td className="px-5 py-4 min-w-[200px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-14 rounded bg-surface flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" alt="" /> : <Car className="h-4 w-4 text-muted-foreground" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm line-clamp-1">{item.title}</p>
                                                        <p className="text-xs text-muted-foreground">{item.category} • {item.emirate}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 min-w-[150px]">
                                                <p className="text-sm font-medium text-foreground">{owner?.full_name || 'Unknown'}</p>
                                                <p className="text-[10px] text-muted-foreground break-all">{owner?.email}</p>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap font-mono text-sm">AED {item.price?.toLocaleString()}</td>
                                            <td className="px-5 py-4 whitespace-nowrap"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>{item.status}</span></td>
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => toggleStatus(item, item.status === 'hidden' ? 'active' : 'hidden')} className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={item.status === 'hidden' ? 'Unhide' : 'Hide'}>
                                                        {item.status === 'hidden' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    </button>
                                                    <button onClick={() => toggleStatus(item, item.status === 'sold' ? 'active' : 'sold')} className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={item.status === 'sold' ? 'Mark Active' : 'Mark Sold'}>
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item)} className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-500 transition-colors" title="Delete">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No motors listings found</div>}
                    </div>
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
//  Admin Classifieds
// ═══════════════════════════════════════════════════════════════
export function AdminClassifieds({ users }: { users: UserProfile[] }) {
    const [items, setItems] = useState<ClassifiedListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('classified_listings').select('*').order('created_at', { ascending: false });
        if (error) toast.error(error.message);
        else setItems((data || []) as ClassifiedListing[]);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const toggleStatus = async (item: ClassifiedListing, status: 'active' | 'sold' | 'hidden') => {
        try { await updateListingStatus('classified_listings', item.id, status); load(); }
        catch (err: any) { toast.error(err.message); }
    };

    const handleDelete = async (item: ClassifiedListing) => {
        if (!window.confirm('Delete this classified listing permanently?')) return;
        try {
            if (item.images?.length) await deleteMarketplaceImages(item.images);
            const { error } = await supabase.from('classified_listings').delete().eq('id', item.id);
            if (error) throw error;
            toast.success('Listing deleted'); load();
        } catch (err: any) { toast.error(err.message); }
    };

    const filtered = items.filter(i => {
        if (!search) return true;
        const lower = search.toLowerCase();
        const owner = users.find(u => u.id === i.user_id);
        return i.title.toLowerCase().includes(lower) ||
            (owner?.email || '').toLowerCase().includes(lower) ||
            (owner?.full_name || '').toLowerCase().includes(lower);
    });

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, user email, or name..." className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                <div className="bg-card glass-card border flex flex-col border-border/50 rounded-2xl overflow-hidden p-0 relative">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-accent border-b border-border/50 text-xs uppercase text-muted-foreground/80">
                                <tr>
                                    <th className="px-5 py-3.5 font-bold tracking-wider rounded-tl-xl whitespace-nowrap">Listing</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider whitespace-nowrap">User</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider whitespace-nowrap">Price</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider text-right rounded-tr-xl whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filtered.map(item => {
                                    const owner = users.find(u => u.id === item.user_id);
                                    return (
                                        <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                                            <td className="px-5 py-4 min-w-[200px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-14 rounded bg-surface flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" alt="" /> : <Tag className="h-4 w-4 text-muted-foreground" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm line-clamp-1">{item.title}</p>
                                                        <p className="text-xs text-muted-foreground">{item.category} • {item.emirate}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 min-w-[150px]">
                                                <p className="text-sm font-medium text-foreground">{owner?.full_name || 'Unknown'}</p>
                                                <p className="text-[10px] text-muted-foreground break-all">{owner?.email}</p>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap font-mono text-sm">AED {item.price?.toLocaleString()}</td>
                                            <td className="px-5 py-4 whitespace-nowrap"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>{item.status}</span></td>
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => toggleStatus(item, item.status === 'hidden' ? 'active' : 'hidden')} className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={item.status === 'hidden' ? 'Unhide' : 'Hide'}>
                                                        {item.status === 'hidden' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    </button>
                                                    <button onClick={() => toggleStatus(item, item.status === 'sold' ? 'active' : 'sold')} className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={item.status === 'sold' ? 'Mark Active' : 'Mark Sold'}>
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item)} className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-500 transition-colors" title="Delete">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No classified listings found</div>}
                    </div>
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
//  Admin Properties
// ═══════════════════════════════════════════════════════════════
export function AdminProperties({ users }: { users: UserProfile[] }) {
    const [items, setItems] = useState<PropertyListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('property_listings').select('*').order('created_at', { ascending: false });
        if (error) toast.error(error.message);
        else setItems((data || []) as PropertyListing[]);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const toggleStatus = async (item: PropertyListing, status: 'active' | 'sold' | 'hidden') => {
        try { await updateListingStatus('property_listings', item.id, status); load(); }
        catch (err: any) { toast.error(err.message); }
    };

    const handleDelete = async (item: PropertyListing) => {
        if (!window.confirm('Delete this property listing permanently?')) return;
        try {
            if (item.images?.length) await deleteMarketplaceImages(item.images);
            const { error } = await supabase.from('property_listings').delete().eq('id', item.id);
            if (error) throw error;
            toast.success('Listing deleted'); load();
        } catch (err: any) { toast.error(err.message); }
    };

    const filtered = items.filter(i => {
        if (!search) return true;
        const lower = search.toLowerCase();
        const owner = users.find(u => u.id === i.user_id);
        return i.title.toLowerCase().includes(lower) ||
            (owner?.email || '').toLowerCase().includes(lower) ||
            (owner?.full_name || '').toLowerCase().includes(lower);
    });

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, user email, or name..." className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                <div className="bg-card glass-card border flex flex-col border-border/50 rounded-2xl overflow-hidden p-0 relative">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-accent border-b border-border/50 text-xs uppercase text-muted-foreground/80">
                                <tr>
                                    <th className="px-5 py-3.5 font-bold tracking-wider rounded-tl-xl whitespace-nowrap">Listing</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider whitespace-nowrap">User</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider whitespace-nowrap">Price</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold tracking-wider text-right rounded-tr-xl whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filtered.map(item => {
                                    const owner = users.find(u => u.id === item.user_id);
                                    return (
                                        <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                                            <td className="px-5 py-4 min-w-[200px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-14 rounded bg-surface flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" alt="" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm line-clamp-1">{item.title}</p>
                                                        <p className="text-xs text-muted-foreground">{item.property_type} • For {item.listing_type} • {item.emirate}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 min-w-[150px]">
                                                <p className="text-sm font-medium text-foreground">{owner?.full_name || 'Unknown'}</p>
                                                <p className="text-[10px] text-muted-foreground break-all">{owner?.email}</p>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap font-mono text-sm">AED {item.price?.toLocaleString()}</td>
                                            <td className="px-5 py-4 whitespace-nowrap"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>{item.status}</span></td>
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => toggleStatus(item, item.status === 'hidden' ? 'active' : 'hidden')} className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={item.status === 'hidden' ? 'Unhide' : 'Hide'}>
                                                        {item.status === 'hidden' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    </button>
                                                    <button onClick={() => toggleStatus(item, item.status === 'sold' ? 'active' : 'sold')} className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={item.status === 'sold' ? 'Mark Active' : 'Mark Sold'}>
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item)} className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-500 transition-colors" title="Delete">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No property listings found</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
