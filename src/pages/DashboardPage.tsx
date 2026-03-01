import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, CheckCircle, Search, X, Shield, Smartphone, Heart, BarChart3, TrendingUp, Hash, Car, Bike, ChevronRight, LayoutDashboard, ListFilter, Phone as PhoneIcon, Tag, Building2 } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput';
import MiniPlatePreview from '@/components/MiniPlatePreview';
import { generateAndUploadPlateImage, deletePlateImage } from '@/lib/plateImageService';
import { MotorsSection, ClassifiedsSection, PropertiesSection } from '@/components/DashboardMarketplace';

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

interface Listing {
  id: string;
  plate_number: string;
  emirate: string;
  plate_style: string | null;
  plate_image_url: string | null;
  plate_image_path: string | null;
  price: number | null;
  description: string | null;
  status: string;
  created_at: string;
  vehicle_type: string;
}

/** Map display emirate names → internal keys for plate template lookup */
const EMIRATE_TO_KEY: Record<string, string> = {
  'Abu Dhabi': 'abudhabi',
  'Dubai': 'dubai',
  'Sharjah': 'sharjah',
  'Ajman': 'ajman',
  'Umm Al Quwain': 'umm_al_quwain',
  'Ras Al Khaimah': 'rak',
  'Fujairah': 'fujairah',
};

interface BulkRow {
  plate_number: string;
  emirate: string;
  plate_style: string;
  price: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  vehicle_type: 'car' | 'bike' | 'classic';
}

const emptyRow = (prev?: BulkRow, email?: string, phone?: string): BulkRow => ({
  plate_number: '',
  emirate: prev?.emirate || 'Dubai',
  plate_style: '',
  price: '',
  description: '',
  contact_email: email || prev?.contact_email || '',
  contact_phone: phone || prev?.contact_phone || '',
  vehicle_type: prev?.vehicle_type || 'car',
});

export default function DashboardPage() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sidebar navigation
  const [activeSection, setActiveSection] = useState<'plates' | 'mobile' | 'favorites' | 'profile' | 'motors' | 'classifieds' | 'properties'>('plates');

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
  const [editForm, setEditForm] = useState({ plate_code: '', plate_number: '', emirate: 'Dubai', price: '', description: '', vehicle_type: 'car' });

  // Profile edit
  const [profileForm, setProfileForm] = useState({ full_name: '', phone_number: '', whatsapp_number: '' });
  const [editingProfile, setEditingProfile] = useState(false);

  // Delete single
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bulk Delete
  const [selectedPlates, setSelectedPlates] = useState<Set<string>>(new Set());
  const [selectedMobiles, setSelectedMobiles] = useState<Set<string>>(new Set());
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Soft Deleting Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

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
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        whatsapp_number: profile.whatsapp_number || profile.phone_number || ''
      });
    }
  }, [profile]);

  const fetchListings = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('listings').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else {
      const typedData = (data || []).map(d => {
        const ps = (d as any).plate_style;
        return {
          ...d,
          vehicle_type: ps === 'classic' ? 'classic' : ps === 'bike' ? 'bike' : 'car'
        };
      }) as Listing[];
      setListings(typedData);
    }
    setLoading(false);
  };

  const handleAccountDelete = async () => {
    if (!user) return;
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeletingAccount(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error('Please log in again');

      const response = await fetch('/api/soft-delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete account');

      toast.success('Your account and all listings have been permanently hidden and suspended.');
      await supabase.auth.signOut();
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  useEffect(() => { fetchListings(); }, [user]);

  // Bulk form
  const initBulkForm = () => {
    if (!profile?.phone_number || !profile?.whatsapp_number) {
      toast.error('You must add your Phone Number and WhatsApp Number in your Profile before listing plates.');
      setActiveSection('profile');
      setEditingProfile(true);
      return;
    }
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
    try {
      // Build payload rows first (without image URLs)
      const payloadRows = valid.map(r => {
        const isClassic = r.vehicle_type === 'classic';
        const isBike = r.vehicle_type === 'bike';
        const fullPlateNumber = isClassic
          ? r.plate_number.trim()
          : (r.plate_style.trim() ? `${r.plate_style.trim()} ${r.plate_number.trim()}` : r.plate_number.trim());
        return {
          plate_number: fullPlateNumber,
          emirate: r.emirate,
          plate_style: isBike ? 'bike' : isClassic ? 'classic' : (r.plate_style || null),
          price: r.price ? Number(r.price) : null,
          description: r.description || null,
          contact_email: r.contact_email || null,
          contact_phone: r.contact_phone || null,
          user_id: user.id,
          status: 'active' as const,
        };
      });

      // Insert listings first to get IDs
      const { data: inserted, error } = await supabase.from('listings').insert(payloadRows).select('id, plate_number, emirate, plate_style');
      if (error) { toast.error(error.message); setSaving(false); return; }

      // Generate and upload plate images for each new listing
      if (inserted && inserted.length > 0) {
        const imageResults = await Promise.allSettled(
          inserted.map(async (listing) => {
            const parts = listing.plate_number.split(' ');
            const isClassic = listing.plate_style === 'classic';
            const isBike = listing.plate_style === 'bike';
            const plateCode = isClassic ? '' : (parts.length > 1 ? parts[0] : '');
            const plateNumber = isClassic ? listing.plate_number : (parts.length > 1 ? parts.slice(1).join(' ') : parts[0]);
            const emirateKey = EMIRATE_TO_KEY[listing.emirate] || listing.emirate.toLowerCase().replace(/\s+/g, '_');
            const plateStyle: 'private' | 'bike' | 'classic' = isBike ? 'bike' : isClassic ? 'classic' : 'private';

            const result = await generateAndUploadPlateImage({
              listingId: listing.id,
              emirate: emirateKey,
              plateCode,
              plateNumber,
              plateStyle,
            });

            // Update the listing with the image URL and path
            await supabase.from('listings').update({
              plate_image_url: result.url,
              plate_image_path: result.path,
            }).eq('id', listing.id);

            return result;
          })
        );

        const failed = imageResults.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          console.warn(`${failed.length} plate image(s) failed to generate`);
        }
      }

      toast.success(`${payloadRows.length} listings created successfully!`);
      setShowForm(false);
      setRows([]);
      fetchListings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create listings');
    }
    setSaving(false);
  };

  // Edit single listing
  const startEdit = (listing: Listing) => {
    const isClassic = listing.plate_style === 'classic';
    const pParts = listing.plate_number?.split(' ') || [];
    // Classic plates have no code — plate_number is just the number
    const pCode = isClassic ? '' : (pParts.length > 1 ? pParts[0] : '');
    const pNum = isClassic ? (listing.plate_number || '') : (pParts.length > 1 ? pParts.slice(1).join(' ') : pParts[0] || '');
    setEditForm({
      plate_code: pCode,
      plate_number: pNum,
      emirate: listing.emirate,
      price: listing.price?.toString() || '',
      description: listing.description || '',
      vehicle_type: listing.vehicle_type || 'car',
    });
    setEditId(listing.id);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editId) return;
    if (!editForm.plate_number.trim()) { toast.error('Number is required'); return; }
    setSaving(true);
    try {
      const isClassic = editForm.vehicle_type === 'classic';
      const isBike = editForm.vehicle_type === 'bike';
      const fullPlateNumber = isClassic
        ? editForm.plate_number.trim()
        : (editForm.plate_code.trim() ? `${editForm.plate_code.trim()} ${editForm.plate_number.trim()}` : editForm.plate_number.trim());

      const plateCode = isClassic ? '' : editForm.plate_code.trim();
      const plateNumber = editForm.plate_number.trim();
      const emirateKey = EMIRATE_TO_KEY[editForm.emirate] || editForm.emirate.toLowerCase().replace(/\s+/g, '_');
      const plateStyle: 'private' | 'bike' | 'classic' = isBike ? 'bike' : isClassic ? 'classic' : 'private';

      // Delete old image if it exists
      const oldListing = listings.find(l => l.id === editId);
      if (oldListing?.plate_image_path) {
        await deletePlateImage(oldListing.plate_image_path);
      }

      // Generate new plate image
      const imgResult = await generateAndUploadPlateImage({
        listingId: editId,
        emirate: emirateKey,
        plateCode,
        plateNumber,
        plateStyle,
      });

      const { error } = await supabase.from('listings').update({
        plate_number: fullPlateNumber,
        emirate: editForm.emirate,
        plate_style: isBike ? 'bike' : isClassic ? 'classic' : (editForm.plate_code.trim() || null),
        price: editForm.price ? Number(editForm.price) : null,
        description: editForm.description || null,
        plate_image_url: imgResult.url,
        plate_image_path: imgResult.path,
      }).eq('id', editId);
      if (error) toast.error(error.message);
      else { toast.success('Listing updated'); setEditId(null); fetchListings(); }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update listing');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) { toast.error('Please log in again'); return; }

      // 1. Fetch the listing to get the image path
      const { data: listing } = await supabase
        .from('listings')
        .select('plate_image_path')
        .eq('id', deleteId)
        .single();

      // 2. Delete the image from Storage if it exists
      if (listing?.plate_image_path) {
        await deletePlateImage(listing.plate_image_path);
      }

      // 3. Delete associated favorites
      await supabase
        .from('favorites')
        .delete()
        .eq('listing_id', deleteId)
        .eq('listing_type', 'plate');

      // 4. Delete the listing record
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', deleteId);

      if (deleteError) {
        toast.error(`Failed to delete listing: ${deleteError.message}`);
      } else {
        toast.success('Listing deleted');
        fetchListings();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete listing');
    }
    setDeleteId(null);
  };

  const handleBulkDeleteMobiles = async () => {
    if (selectedMobiles.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedMobiles.size} selected mobile numbers?`)) return;

    setDeletingBulk(true);
    try {
      const idsToDelete = Array.from(selectedMobiles);

      // 1. Delete associated favorites
      await supabase
        .from('favorites')
        .delete()
        .in('listing_id', idsToDelete)
        .eq('listing_type', 'mobile_number');

      // 2. Delete mobile number records
      const { error: deleteError } = await supabase
        .from('mobile_numbers')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      toast.success(`${idsToDelete.length} mobile numbers deleted successfully`);
      setSelectedMobiles(new Set());
      fetchMobileNumbers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete mobile numbers');
    }
    setDeletingBulk(false);
  };

  const handleBulkDeletePlates = async () => {
    if (selectedPlates.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedPlates.size} selected listings?`)) return;

    setDeletingBulk(true);
    try {
      const idsToDelete = Array.from(selectedPlates);

      // 1. Fetch all listings to get image paths
      const { data: listingsToDelete } = await supabase
        .from('listings')
        .select('id, plate_image_path')
        .in('id', idsToDelete);

      // 2. Delete images from Storage
      if (listingsToDelete && listingsToDelete.length > 0) {
        for (const l of listingsToDelete) {
          if (l.plate_image_path) await deletePlateImage(l.plate_image_path);
        }
      }

      // 3. Delete associated favorites
      await supabase
        .from('favorites')
        .delete()
        .in('listing_id', idsToDelete)
        .eq('listing_type', 'plate');

      // 4. Delete listing records
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      toast.success(`${idsToDelete.length} listings deleted successfully`);
      setSelectedPlates(new Set());
      fetchListings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete listings');
    }
    setDeletingBulk(false);
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
    setSaving(true);
    try {
      // 1. Update Profile
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: profileForm.full_name,
        phone_number: profileForm.phone_number,
        whatsapp_number: profileForm.whatsapp_number,
      }).eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Cascade updated numbers to all Plate Listings
      await supabase.from('listings').update({
        contact_phone: profileForm.phone_number
      }).eq('user_id', user.id);

      // 3. Cascade updated numbers to all Mobile Number Listings
      await supabase.from('mobile_numbers').update({
        contact_phone: profileForm.phone_number
      }).eq('user_id', user.id);

      toast.success('Profile updated globally');
      setEditingProfile(false);
      refreshProfile();
      fetchListings();
      fetchMobileNumbers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    }
    setSaving(false);
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
    if (!profile?.phone_number || !profile?.whatsapp_number) {
      toast.error('You must add your Phone Number and WhatsApp Number in your Profile before listing mobile numbers.');
      setActiveSection('profile');
      setEditingProfile(true);
      return;
    }
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
    if (s === 'active') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (s === 'sold') return 'bg-red-500/10 text-red-600 border-red-500/20';
    return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
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
    <div className="min-h-screen pt-20">
      <div className="flex min-h-[calc(100vh-5rem)] flex-col lg:flex-row relative z-10">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-border/60 bg-card/50 flex-shrink-0 sticky top-20 self-start h-[calc(100vh-5rem)] overflow-y-auto">
          {/* User Profile Block */}
          <div className="p-6 border-b border-border/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20 flex-shrink-0">
                {(profile?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-foreground text-sm leading-tight truncate">{profile?.full_name || 'My Account'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            {isAdmin && (
              <Link to="/dashboard/admin" className="flex items-center justify-between w-full mt-3 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/10 transition-colors group">
                <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Admin Panel</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {/* Stats Quick View */}
          <div className="px-6 py-4 border-b border-border/60">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-3">{t('overview' as any)}</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{t('plateListings' as any)}</span>
                <span className="text-xs font-black text-foreground font-mono bg-surface rounded-lg px-2 py-0.5 border border-border/50">{listings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{t('active')}</span>
                <span className="text-xs font-black text-emerald-600 font-mono bg-emerald-500/5 rounded-lg px-2 py-0.5 border border-emerald-500/20">{listings.filter(l => l.status === 'active').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{t('myMobileNumbers' as any)}</span>
                <span className="text-xs font-black text-foreground font-mono bg-surface rounded-lg px-2 py-0.5 border border-border/50">{mobileNumbers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{t('favorites')}</span>
                <span className="text-xs font-black text-foreground font-mono bg-surface rounded-lg px-2 py-0.5 border border-border/50">{favorites.length}</span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {[
              { id: 'plates', icon: Car, label: t('numberPlates'), count: listings.length },
              { id: 'motors', icon: Car, label: t('motors'), count: null },
              { id: 'classifieds', icon: Tag, label: t('classifieds'), count: null },
              { id: 'properties', icon: Building2, label: t('properties'), count: null },
              { id: 'mobile', icon: PhoneIcon, label: t('myMobileNumbers' as any), count: mobileNumbers.length },
              { id: 'favorites', icon: Heart, label: t('favorites'), count: favorites.length },
              { id: 'profile', icon: Pencil, label: t('myProfile' as any), count: null },
            ].map(({ id, icon: Icon, label, count }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveSection(id as typeof activeSection)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all group ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                    }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </span>
                  {count !== null && count > 0 && (
                    <span className={`text-[10px] font-black rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${isActive ? 'bg-white/20 text-white' : 'bg-surface-accent text-muted-foreground'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom: Quick Links */}
          <div className="px-4 py-4 border-t border-border/60">
            <Link to="/marketplace" className="flex items-center gap-2 text-xs text-muted-foreground font-semibold hover:text-foreground transition-colors py-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" /> Marketplace
            </Link>
            <Link to="/request" className="flex items-center gap-2 text-xs text-muted-foreground font-semibold hover:text-foreground transition-colors py-1.5">
              <ListFilter className="h-3.5 w-3.5" /> Request a Plate
            </Link>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0">
          {/* Mobile tab bar */}
          <div className="lg:hidden sticky top-20 z-30 bg-card/95 backdrop-blur border-b border-border/60 px-4 overflow-x-auto">
            <div className="flex gap-1 py-2">
              {[
                { id: 'plates', label: t('plates') },
                { id: 'motors', label: t('motors') },
                { id: 'classifieds', label: t('classifieds') },
                { id: 'properties', label: t('properties') },
                { id: 'mobile', label: t('mobiles') },
                { id: 'favorites', label: t('favorites') },
                { id: 'profile', label: t('profile') },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => setActiveSection(id as typeof activeSection)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSection === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Page title bar */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-border/40 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mb-0.5">
                  <span>{t('myAccount' as any)}</span><ChevronRight className="h-3 w-3" />
                  <span className="text-foreground/70">
                    {activeSection === 'plates' ? t('numberPlates') :
                      activeSection === 'motors' ? t('motors') :
                        activeSection === 'classifieds' ? t('classifieds') :
                          activeSection === 'properties' ? t('properties') :
                            activeSection === 'mobile' ? t('myMobileNumbers' as any) :
                              activeSection === 'favorites' ? t('favorites') : t('profile')}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-display font-black text-foreground leading-tight">
                  {activeSection === 'plates' ? t('myPlateListings' as any) :
                    activeSection === 'motors' ? t('myMotorListings' as any) :
                      activeSection === 'classifieds' ? t('myClassifiedListings' as any) :
                        activeSection === 'properties' ? t('myPropertyListings' as any) :
                          activeSection === 'mobile' ? t('myMobileNumbers' as any) :
                            activeSection === 'favorites' ? t('savedFavorites' as any) : t('myProfile' as any)}
                </h1>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-6 pb-16">

            {/* ── Profile Card ── */}
            {/* ── PROFILE SECTION ── */}
            {activeSection === 'profile' && (
              <div className="glass-card border border-border/60 rounded-2xl p-4 sm:p-6 mb-8 dash-animate dash-animate-delay-1 hover-lift relative z-10 shadow-sm">
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
                    <div className="space-y-1">
                      <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1">{t('fullName')}</label>
                      <input value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                        className="w-full bg-surface/80 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                        placeholder={t('fullName')} />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1">{t('accountPhone' as any)}</label>
                      <PhoneInput value={profileForm.phone_number} onChange={v => setProfileForm(p => ({ ...p, phone_number: v }))} showValidation={false} />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1">{t('phoneNumber')}</label>
                      <PhoneInput value={profileForm.phone_number} onChange={v => setProfileForm(p => ({ ...p, phone_number: v }))} showValidation={false} />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1">{t('publicDisplayNumber' as any)}</label>
                      <PhoneInput value={profileForm.whatsapp_number} onChange={v => setProfileForm(p => ({ ...p, whatsapp_number: v }))} showValidation={false} />
                    </div>
                    <div className="flex gap-2 col-span-full mt-2">
                      <button onClick={saveProfile} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover active:scale-[0.97] transition-all">{t('save')}</button>
                      <button onClick={() => setEditingProfile(false)} className="bg-surface border border-border px-5 py-2.5 rounded-xl text-sm font-bold text-foreground hover:bg-surface-accent active:scale-[0.97] transition-all">{t('cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="min-w-0 space-y-3">
                      <div>
                        <p className="text-foreground font-semibold text-sm sm:text-base">{profile?.full_name || t('noNameSet' as any)}</p>
                        <p className="text-muted-foreground text-xs">{profile?.phone_number || t('noPhoneSet' as any)}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">{t('phoneNumber')}</p>
                          <p className="text-foreground text-sm font-mono">{profile?.phone_number || t('notSet' as any)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">{t('whatsappNumber' as any)}</p>
                          <p className="text-foreground text-sm font-mono">{profile?.whatsapp_number || profile?.phone_number || t('notSet' as any)}</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setEditingProfile(true)}
                      className="flex items-center gap-1.5 text-primary text-xs sm:text-sm font-bold bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all active:scale-95 flex-shrink-0">
                      <Pencil className="h-3 w-3" /> {t('edit' as any)}
                    </button>
                  </div>
                )}

                {/* Account Deletion Section */}
                <div className="mt-8 pt-6 border-t border-red-500/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-red-600 mb-1">{t('deleteAccount' as any)}</h4>
                      <p className="text-xs text-muted-foreground">{t('deleteAccountDesc' as any)}</p>
                    </div>
                    <button onClick={() => setShowDeleteModal(true)} disabled={deletingAccount}
                      className="flex-shrink-0 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-red-100 disabled:opacity-50">
                      {t('deleteAccount' as any)}
                    </button>
                  </div>
                </div>

                {/* Account Deletion Modal */}
                {showDeleteModal && createPortal(
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-card glass-card border flex flex-col items-center justify-center border-border/60 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center">
                      <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-5 border-4 border-white shadow-sm mx-auto">
                        <Trash2 className="h-7 w-7 text-red-600" />
                      </div>
                      <h3 className="text-xl font-display font-black text-foreground mb-2">{t('deleteAccountConfirmTitle' as any)}</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {t('deleteAccountConfirmDesc' as any)}
                      </p>

                      <div className="w-full text-left mb-6">
                        <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2 text-center" dangerouslySetInnerHTML={{ __html: t('typeDeleteToConfirm' as any) }}>
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                          placeholder="DELETE"
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-center font-black focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        <button onClick={handleAccountDelete} disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                          className="w-full bg-red-600 text-white hover:bg-red-700 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                          {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : t('yesDeleteMyAccount' as any)}
                        </button>
                        <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} disabled={deletingAccount}
                          className="w-full bg-surface hover:bg-surface-accent py-3 rounded-xl text-sm font-bold border border-border transition-all text-foreground mt-2 disabled:opacity-50">
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            )} {/* end profile section */}

            {/* ── Plates + Mobile sections visible per activeSection ── */}
            {(activeSection === 'plates') && (
              <div>
                {/* ── Stats Strip ── */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8 dash-animate dash-animate-delay-2">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/15 rounded-xl p-3 sm:p-4 text-center group hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Hash className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('total' as any)}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-foreground font-mono">{listings.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02] border border-emerald-500/15 rounded-xl p-3 sm:p-4 text-center group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('active')}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">{listings.filter(l => l.status === 'active').length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/5 to-red-500/[0.02] border border-red-500/15 rounded-xl p-3 sm:p-4 text-center group hover:border-red-500/30 transition-all">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <CheckCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('sold')}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-red-600 font-mono">{listings.filter(l => l.status === 'sold').length}</p>
                  </div>
                  <div className="hidden sm:block bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/15 rounded-xl p-3 sm:p-4 text-center group hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Smartphone className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('mobiles')}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-foreground font-mono">{mobileNumbers.length}</p>
                  </div>
                </div>

                {/* ── Listings Header ── */}
                <div className="flex items-center justify-between mb-5 dash-animate dash-animate-delay-2 flex-wrap gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
                      <Car className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">{t('myListings')}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPlates.size > 0 && (
                      <button onClick={handleBulkDeletePlates} disabled={deletingBulk}
                        className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-red-100 hover:text-red-700 active:scale-[0.97] transition-all disabled:opacity-50">
                        {deletingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete Selected ({selectedPlates.size})
                      </button>
                    )}
                    <button onClick={initBulkForm}
                      className="btn-glow bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all">
                      <Plus className="h-4 w-4" /> Add Listings
                    </button>
                  </div>
                </div>

                {/* Bulk Form — Premium */}
                {showForm && (
                  <div className="glass-card border border-primary/20 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-primary/5 dash-animate">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
                          <Plus className="h-3.5 w-3.5 text-white" />
                        </div>
                        Add New Listings
                      </h3>
                      <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/15">{rows.filter(r => r.plate_number.trim()).length} plate{rows.filter(r => r.plate_number.trim()).length !== 1 ? 's' : ''} ready</span>
                    </div>

                    <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
                      {rows.map((row, idx) => (
                        <div key={idx} className="bg-white border border-border/60 rounded-2xl overflow-hidden hover:border-primary/20 transition-all group">
                          {/* Top bar: listing number + remove */}
                          <div className="flex items-center justify-between px-4 pt-3 pb-0">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Listing #{idx + 1}</span>
                            <button onClick={() => removeRow(idx)} className="h-7 w-7 flex items-center justify-center text-red-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all active:scale-90"
                              disabled={rows.length <= 1}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="p-4 pt-2">
                            {/* Row 1: Live preview + Code & Number inputs */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                              {/* Live Plate Preview */}
                              <div className="flex-shrink-0 sm:w-48 h-24 sm:h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-border/50 flex items-center justify-center overflow-hidden">
                                <MiniPlatePreview
                                  emirate={row.emirate}
                                  code={row.vehicle_type === 'classic' ? '' : row.plate_style}
                                  number={row.plate_number}
                                  vehicleType={row.vehicle_type || 'car'}
                                  className="w-full h-full p-1"
                                />
                              </div>

                              {/* Code + Number */}
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                  {row.vehicle_type !== 'classic' && (
                                    <div className="col-span-1">
                                      <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Code</label>
                                      <input value={row.plate_style} onChange={e => {
                                        const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2);
                                        updateRow(idx, 'plate_style', v.toUpperCase());
                                      }} placeholder="A" maxLength={2}
                                        className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-base text-foreground font-mono font-black text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all" />
                                    </div>
                                  )}
                                  <div className={row.vehicle_type === 'classic' ? 'col-span-3' : 'col-span-2'}>
                                    <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Number</label>
                                    <input value={row.plate_number} onChange={e => {
                                      const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                                      updateRow(idx, 'plate_number', v);
                                    }} placeholder="12345" maxLength={5}
                                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-base text-foreground font-mono font-black text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all" />
                                  </div>
                                </div>

                                {/* Price + Description */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">{t('priceAed')}</label>
                                    <input type="number" value={row.price} onChange={e => updateRow(idx, 'price', e.target.value)} placeholder="22,000"
                                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">{t('description')}</label>
                                    <input value={row.description} onChange={e => updateRow(idx, 'description', e.target.value)} placeholder={t('optionalNote') as any}
                                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Row 2: Emirate pills + Type toggle */}
                            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                              {/* Emirate selection pills */}
                              <div className="flex-1">
                                <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{t('emirate')}</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {EMIRATES.map(em => {
                                    const isSelected = row.emirate === em;
                                    const isClassicUnsupported = row.vehicle_type === 'classic' && ['Umm Al Quwain', 'Fujairah'].includes(em);
                                    const short = em === 'Ras Al Khaimah' ? 'RAK' : em === 'Umm Al Quwain' ? 'UAQ' : em;
                                    return (
                                      <button
                                        key={em}
                                        type="button"
                                        disabled={isClassicUnsupported}
                                        onClick={() => !isClassicUnsupported && updateRow(idx, 'emirate', em)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 ${isSelected
                                          ? 'bg-gradient-to-r from-primary to-primary-hover text-primary-foreground shadow-md shadow-primary/20'
                                          : 'bg-surface border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                                          } ${isClassicUnsupported ? 'opacity-40 cursor-not-allowed bg-muted/30 grayscale' : ''}`}
                                        title={isClassicUnsupported ? t('classicNotAvailable') as any : ""}
                                      >
                                        {short}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Vehicle type toggle */}
                              <div className="flex-shrink-0">
                                <label className="block text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{t('type')}</label>
                                <div className="flex rounded-xl border border-border overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => updateRow(idx, 'vehicle_type', 'car')}
                                    className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${row.vehicle_type === 'car' || !row.vehicle_type
                                      ? 'bg-gradient-to-r from-primary to-primary-hover text-primary-foreground'
                                      : 'bg-surface text-muted-foreground hover:text-foreground'
                                      }`}
                                  >
                                    <Car className="h-3.5 w-3.5" /> {t('privatePlate') as any}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateRow(idx, 'vehicle_type', 'bike')}
                                    className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${row.vehicle_type === 'bike'
                                      ? 'bg-gradient-to-r from-primary to-primary-hover text-primary-foreground'
                                      : 'bg-surface text-muted-foreground hover:text-foreground'
                                      }`}
                                  >
                                    <Bike className="h-3.5 w-3.5" /> {t('bikePlate') as any}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah'].includes(row.emirate)}
                                    onClick={() => updateRow(idx, 'vehicle_type', 'classic')}
                                    className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${row.vehicle_type === 'classic'
                                      ? 'bg-gradient-to-r from-primary to-primary-hover text-primary-foreground'
                                      : 'bg-surface text-muted-foreground hover:text-foreground'
                                      } ${!['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah'].includes(row.emirate) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={!['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah'].includes(row.emirate) ? t('classicNotAvailable') as any : ""}
                                  >
                                    <span className="h-3.5 w-3.5 flex items-center justify-center border border-current rounded text-[8px] font-serif">C</span> {t('classic')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom actions */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-5 pt-4 border-t border-border/50">
                      <button onClick={addRow} className="bg-surface border border-dashed border-primary/30 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-primary hover:bg-primary/5 active:scale-[0.97] transition-all flex items-center gap-1.5">
                        <Plus className="h-4 w-4" /> {t('addAnother')}
                      </button>
                      <div className="flex-1" />
                      <button onClick={() => setShowForm(false)} className="bg-surface border border-border px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-foreground hover:bg-surface-accent active:scale-[0.97] transition-all">{t('cancel')}</button>
                      <button onClick={handleBulkSave} disabled={saving}
                        className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all">
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('save')} ({rows.filter(r => r.plate_number.trim()).length})
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

                    {/* Type selector for Edit Form */}
                    {/* Type selector for Edit Form */}
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="editVehicleType"
                          checked={editForm.vehicle_type === 'car'}
                          onChange={() => setEditForm(prev => ({ ...prev, vehicle_type: 'car' }))}
                          className="accent-primary"
                        />
                        <Car className="h-4 w-4 text-foreground" />
                        <span className="text-sm font-bold text-foreground">{t('privatePlate') as any}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="editVehicleType"
                          checked={editForm.vehicle_type === 'bike'}
                          onChange={() => setEditForm(prev => ({ ...prev, vehicle_type: 'bike' }))}
                          className="accent-primary"
                        />
                        <Bike className="h-4 w-4 text-foreground" />
                        <span className="text-sm font-bold text-foreground">{t('bikePlate') as any}</span>
                      </label>
                      <label className={`flex items-center gap-2 cursor-pointer ${!['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah'].includes(editForm.emirate) ? 'opacity-50 pointer-events-none' : ''}`}>
                        <input
                          type="radio"
                          name="editVehicleType"
                          checked={editForm.vehicle_type === 'classic'}
                          onChange={() => setEditForm(prev => ({ ...prev, vehicle_type: 'classic' }))}
                          disabled={!['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah'].includes(editForm.emirate)}
                          className="accent-primary"
                        />
                        <span className="h-4 w-4 flex items-center justify-center border border-current rounded text-[10px] font-serif font-bold">C</span>
                        <span className="text-sm font-bold text-foreground">{t('classicPlate')}</span>
                      </label>
                    </div>

                    {/* Live plate preview */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-3 sm:p-4 mb-5 sm:mb-6 flex items-center justify-center border border-border/50">
                      <div className="w-48 h-24 sm:w-64 sm:h-32">
                        <MiniPlatePreview
                          emirate={editForm.emirate}
                          code={editForm.vehicle_type === 'classic' ? '' : editForm.plate_code}
                          number={editForm.plate_number}
                          vehicleType={editForm.vehicle_type as 'car' | 'bike' | 'classic'}
                          className="w-full h-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-12 gap-3 sm:gap-4 mb-4">
                      {/* Code — hidden for classic plates */}
                      {editForm.vehicle_type !== 'classic' && (
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
                      )}
                      {/* Number */}
                      <div className={editForm.vehicle_type === 'classic' ? 'col-span-2 sm:col-span-8' : 'col-span-1 sm:col-span-5'}>
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
                        <select value={editForm.emirate} onChange={e => {
                          const newEmirate = e.target.value;
                          const classicSupported = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah'].includes(newEmirate);
                          setEditForm(p => ({
                            ...p,
                            emirate: newEmirate,
                            vehicle_type: (p.vehicle_type === 'classic' && !classicSupported) ? 'car' : p.vehicle_type,
                          }));
                        }}
                          className="w-full bg-surface border border-border rounded-xl px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                          {EMIRATES.map(em => {
                            const isClassicUnsupported = editForm.vehicle_type === 'classic' && ['Umm Al Quwain', 'Fujairah'].includes(em);
                            return <option key={em} value={em} disabled={isClassicUnsupported}>{em}{isClassicUnsupported ? ` (${t('notSet')})` : ''}</option>
                          })}
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
                        {s === 'all' ? t('all') : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Listing Cards ── */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                    <p className="text-sm text-muted-foreground">{t('loadingListings')}</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="glass-card border border-border/60 rounded-2xl p-12 text-center">
                    <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">{t('noListingsFound')}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{t('noListingsDesc')}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {pagedListings.map((listing, i) => {
                        const pParts = listing.plate_number?.split(' ') || [];
                        const pCode = pParts.length > 1 ? pParts[0] : '';
                        const pNum = pParts.length > 1 ? pParts.slice(1).join(' ') : pParts[0] || '';
                        return (
                          <div key={listing.id} className={`border rounded-xl p-3 sm:p-4 group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/25 bg-white ${listing.status === 'sold' ? 'border-l-4 border-l-red-400 border-t-border/60 border-r-border/60 border-b-border/60' : listing.status === 'hidden' ? 'border-l-4 border-l-zinc-300 border-t-border/60 border-r-border/60 border-b-border/60 opacity-60' : 'border-l-4 border-l-primary border-t-border/60 border-r-border/60 border-b-border/60'}`} style={{ animationDelay: `${i * 0.04}s` }}>
                            <div className="flex items-center justify-between gap-3">
                              {/* Plate Thumbnail */}
                              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                <label className="flex items-center cursor-pointer ml-1">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded-md border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
                                    checked={selectedPlates.has(listing.id)}
                                    onChange={(e) => {
                                      const newSet = new Set(selectedPlates);
                                      if (e.target.checked) newSet.add(listing.id);
                                      else newSet.delete(listing.id);
                                      setSelectedPlates(newSet);
                                    }}
                                  />
                                </label>
                                <div className={`flex-shrink-0 w-20 h-10 sm:w-28 sm:h-14 rounded-lg overflow-hidden bg-gray-50 border border-border/40 group-hover:scale-[1.03] transition-transform ${listing.status === 'sold' ? 'opacity-50 grayscale' : ''}`}>
                                  <MiniPlatePreview
                                    emirate={listing.emirate}
                                    code={pCode}
                                    number={pNum}
                                    vehicleType={(listing.vehicle_type as 'car' | 'bike' | 'classic') || 'car'}
                                    className="w-full h-full"
                                    plateImageUrl={listing.plate_image_url}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm sm:text-base font-black font-mono text-foreground tracking-wide mb-0.5 truncate">{listing.plate_number}</p>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md border ${listing.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : listing.status === 'sold' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                                      {listing.status}
                                    </span>
                                    {listing.vehicle_type === 'bike' && (
                                      <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 border border-sky-500/20">Bike</span>
                                    )}
                                    {listing.vehicle_type === 'classic' && (
                                      <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20">Classic</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate font-medium">
                                    <span className="text-foreground/70">{listing.emirate}</span>
                                    {listing.price && <span className="text-primary mx-1">•</span>}
                                    {listing.price && <span className="font-bold text-foreground">AED {listing.price.toLocaleString()}</span>}
                                  </p>
                                </div>
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => toggleHidden(listing)}
                                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${listing.status === 'hidden' ? 'bg-amber-100 text-amber-600' : 'hover:bg-primary/5 text-muted-foreground hover:text-primary'}`}
                                  title={listing.status === 'hidden' ? 'Show listing' : 'Hide listing'}>
                                  {listing.status === 'hidden' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <button onClick={() => toggleStatus(listing)} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${listing.status === 'sold' ? 'bg-red-100 text-red-600' : 'hover:bg-primary/5 text-muted-foreground hover:text-green-600'}`}
                                  title={listing.status === 'active' ? 'Mark as sold' : 'Mark as active'}>
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button onClick={() => startEdit(listing)} className="h-8 w-8 rounded-lg hover:bg-primary/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-90">
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => setDeleteId(listing.id)} className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-all active:scale-90">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
              </div>
            )}

            {/* ─── VIP Mobile Numbers Section ─── */}
            {activeSection === 'mobile' && (
              <div className="dash-animate dash-animate-delay-4">
                <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
                      <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-display font-bold text-foreground truncate">My Mobile Numbers</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMobiles.size > 0 && (
                      <button onClick={handleBulkDeleteMobiles} disabled={deletingBulk}
                        className="bg-red-50 text-red-600 border border-red-200 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-red-100 hover:text-red-700 active:scale-[0.97] transition-all disabled:opacity-50">
                        {deletingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} <span className="hidden sm:inline">Delete Selected</span> ({selectedMobiles.size})
                      </button>
                    )}
                    <button onClick={initMobileForm}
                      className="btn-glow bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all flex-shrink-0">
                      <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add</span> Number
                    </button>
                  </div>
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
                            <img src="/du-logo.webp" alt="Du" className="h-5 w-5 object-contain" /> Du
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
                        className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all">
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
                            <img src="/du-logo.webp" alt="Du" className="h-5 w-5 object-contain" />
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
                        className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all">
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
                    <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3">
                      <Smartphone className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground text-sm">No mobile numbers listed yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mobileNumbers.map(mn => (
                      <div key={mn.id} className={`border rounded-xl p-4 sm:p-5 group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/25 bg-white ${mn.status === 'sold' ? 'border-l-4 border-l-red-400 border-t-border/60 border-r-border/60 border-b-border/60' : 'border-l-4 border-l-primary border-t-border/60 border-r-border/60 border-b-border/60'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <label className="flex items-center cursor-pointer ml-1">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded-md border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
                                checked={selectedMobiles.has(mn.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedMobiles);
                                  if (e.target.checked) newSet.add(mn.id);
                                  else newSet.delete(mn.id);
                                  setSelectedMobiles(newSet);
                                }}
                              />
                            </label>
                            <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center overflow-hidden border-2 flex-shrink-0 transition-transform group-hover:scale-105 ${mn.carrier === 'etisalat' ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}`}>
                              <img
                                src={mn.carrier === 'etisalat' ? '/Eand_Logo.svg' : '/du-logo.webp'}
                                alt={mn.carrier}
                                className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-foreground font-black font-mono tracking-wider text-sm sm:text-base truncate mb-0.5">{mn.phone_number}</p>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md border ${mn.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : mn.status === 'sold' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                                  {mn.status}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-[11px] sm:text-xs capitalize flex items-center gap-1.5">
                                {mn.carrier}
                                {mn.price && <span className="text-primary">•</span>}
                                {mn.price ? <span className="font-bold text-foreground">AED {mn.price.toLocaleString()}</span> : 'No price'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleMobileStatus(mn)}
                              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${mn.status === 'sold' ? 'bg-red-100 text-red-600' : 'hover:bg-primary/5 text-muted-foreground hover:text-green-600'}`}
                              title={mn.status === 'active' ? 'Mark as sold' : 'Mark as active'}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button onClick={() => startMobileEdit(mn)} className="h-8 w-8 rounded-lg hover:bg-primary/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-90">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setMobileDeleteId(mn.id)}
                              className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-500 transition-all active:scale-90">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )} {/* end mobile section */}

            {/* ─── My Favorites Section ─── */}
            {activeSection === 'favorites' && (
              <div>
                <div className="dash-animate dash-animate-delay-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg sm:text-2xl font-display font-bold text-foreground flex items-center gap-2.5">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
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
              </div>
            )} {/* end favorites section */}

            {activeSection === 'motors' && <MotorsSection />}
            {activeSection === 'classifieds' && <ClassifiedsSection />}
            {activeSection === 'properties' && <PropertiesSection />}

            {/* Modals — always rendered regardless of section */}
            {/* Mobile Delete Modal */}
            {mobileDeleteId && createPortal(
              <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="glass-card border border-border/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl modal-enter">
                  <p className="text-foreground font-semibold mb-4">Delete this mobile number listing?</p>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setMobileDeleteId(null)} className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-foreground hover:bg-surface-accent active:scale-95 transition-all">{t('cancel')}</button>
                    <button onClick={handleMobileDelete} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all">{t('yes')}, Delete</button>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* Delete Modal */}
            {deleteId && createPortal(
              <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="glass-card border border-border/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl modal-enter">
                  <p className="text-foreground font-semibold mb-4">{t('deleteConfirm')}</p>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-foreground hover:bg-surface-accent active:scale-95 transition-all">{t('cancel')}</button>
                    <button onClick={handleDelete} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all">{t('yes')}, Delete</button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </main>
      </div >
    </div >
  );
}
