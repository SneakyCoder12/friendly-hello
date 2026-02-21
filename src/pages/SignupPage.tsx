import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Eye, EyeOff, Smartphone } from 'lucide-react';
import { COUNTRY_CODES, isPhoneNumber, formatPhoneAsEmail, normalizePhone } from '@/utils/phoneAuth';

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
  const [usePhone, setUsePhone] = useState(true);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(t('passwordsNoMatch'));
      return;
    }
    if (form.password.length < 6) {
      toast.error(t('passwordMinLength'));
      return;
    }
    setLoading(true);

    let signupEmail = form.email;
    let signupPhonePlain = '';

    if (usePhone) {
      if (!isPhoneNumber(form.phoneNumber)) {
        toast.error('Please enter a valid phone number');
        setLoading(false);
        return;
      }
      const rawPhone = `${form.phoneCode}${form.phoneNumber}`;
      const normalized = normalizePhone(rawPhone);
      signupPhonePlain = `+${normalized}`; // Keep standard international prefix
      signupEmail = formatPhoneAsEmail(normalized);
    } else if (!form.email.includes('@')) {
      toast.error('Please enter a valid email address');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: form.password,
      options: {
        emailRedirectTo: 'https://friendly-hello-ten.vercel.app',
        data: {
          full_name: form.fullName,
          phone_number: usePhone ? signupPhonePlain : null // Save the real number in userdata
        },
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
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
          <p className="text-muted-foreground mt-2">{t('signupSubtitle')}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 space-y-5 shadow-card">
          <div className="flex bg-surface rounded-xl p-1 mb-6 border border-border">
            <button
              onClick={() => setUsePhone(true)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${usePhone ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Phone
            </button>
            <button
              onClick={() => setUsePhone(false)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${!usePhone ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Email
            </button>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('fullName')}</label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" required value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            {usePhone ? (
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Phone Number</label>
                <div className="flex gap-2 relative">
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
                      className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="50 123 4567" />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
            )}

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
              <p className="text-xs text-muted-foreground mt-1.5">{t('passwordMinLength')}</p>
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
