import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Eye, EyeOff, Smartphone } from 'lucide-react';
import { COUNTRY_CODES, normalizePhone } from '@/utils/phoneAuth';

export default function SignupPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneCode: '+971',
    phoneNumber: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const validatePhone = (code: string, number: string): string | null => {
    const digits = number.replace(/\D/g, '');
    if (!digits || digits.length < 7) return t('phoneTooShort');
    if (code === '+971' && digits.length !== 9) return t('uaePhoneNote');
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // prevent double submit

    if (form.password !== form.confirmPassword) {
      toast.error(t('passwordsNoMatch'));
      return;
    }
    if (form.password.length < 6) {
      toast.error(t('passwordMinLength'));
      return;
    }

    // Validate email
    if (!form.email.includes('@') || !form.email.includes('.')) {
      toast.error(t('invalidEmailFormat'));
      return;
    }

    // Validate phone
    const phoneErr = validatePhone(form.phoneCode, form.phoneNumber);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }

    setLoading(true);

    const rawPhone = `${form.phoneCode}${form.phoneNumber.replace(/\D/g, '')}`;
    const normalizedPhone = normalizePhone(rawPhone);
    const phoneE164 = `+${normalizedPhone}`;

    try {
      // 1. Sign up with email + password
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: form.fullName,
            phone_number: phoneE164
          },
        },
      });

      if (signupError) {
        toast.error(signupError.message);
        setLoading(false);
        return;
      }

      // 2. Attach phone to auth.users.phone so signInWithPassword({ phone }) works
      if (signupData.session) {
        const { error: phoneErr } = await supabase.auth.updateUser({
          phone: phoneE164
        });
        if (phoneErr) {
          console.warn('Failed to attach phone to auth user:', phoneErr.message);
        }
      }

      // 3. Upsert profile row
      if (signupData.user) {
        await supabase.from('profiles').upsert({
          id: signupData.user.id,
          email: form.email,
          full_name: form.fullName,
          phone_number: phoneE164,
        }, { onConflict: 'id' });
      }

      toast.success(t('signupSuccess'));
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || t('signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-black text-3xl text-foreground">
            AL <span className="text-primary">NUAMI</span>
          </Link>
          <p className="text-muted-foreground mt-2">{t('signupSubtitle')}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 space-y-5 shadow-card">
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left rtl:text-right">{t('fullName')}</label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" required value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left rtl:text-right">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="you@example.com" />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left rtl:text-right">{t('phoneNumber')}</label>
              <div className="flex gap-2">
                <select
                  value={form.phoneCode}
                  onChange={(e) => update('phoneCode', e.target.value)}
                  className="w-[100px] bg-surface border border-border rounded-xl px-2 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.suffix} {country.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Smartphone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="tel" required value={form.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-left rtl:text-right"
                    placeholder={t('phonePlaceholderSignup')} />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left rtl:text-right">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={(e) => update('password', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{t('passwordMinLength')}</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left rtl:text-right">{t('confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type={showPw ? 'text' : 'password'} required value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary-hover py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t('signingUp') : t('signup')}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
