import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: form.fullName },
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      // Update phone number in profile after signup
      toast.success(t('signupSuccess'));
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-black text-3xl text-foreground">
            AL <span className="text-primary">NUAMI</span>
          </Link>
          <p className="text-muted-foreground mt-2">{t('signup')}</p>
        </div>
        <form onSubmit={handleSignup} className="bg-card border border-border rounded-2xl p-8 space-y-4 shadow-card">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('fullName')}</label>
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" required value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('email')}</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
                className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('phoneNumber')}</label>
            <div className="relative">
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('password')}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={(e) => update('password', e.target.value)}
                className="w-full bg-surface border border-border rounded-xl ps-10 pe-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('confirmPassword')}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type={showPw ? 'text' : 'password'} required value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)}
                className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary-hover py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('signup')}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">{t('login')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
