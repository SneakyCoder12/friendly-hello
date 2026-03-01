import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, UserCircle } from 'lucide-react';
import { normalizePhone } from '@/utils/phoneAuth';

function detectInputType(input: string): 'email' | 'phone' | 'invalid' {
  const trimmed = input.trim();
  if (trimmed.includes('@')) return 'email';
  // Contains only digits, spaces, dashes, plus sign → phone
  const stripped = trimmed.replace(/[\s\-\+\(\)]/g, '');
  if (/^\d+$/.test(stripped) && stripped.length >= 7) return 'phone';
  return 'invalid';
}

function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // prevent double submit

    const inputType = detectInputType(identifier);

    // Pre-validate before calling Supabase
    if (inputType === 'invalid') {
      toast.error(t('invalidEmailOrPhone'));
      return;
    }
    if (inputType === 'email' && !validateEmailFormat(identifier)) {
      toast.error(t('invalidEmailFormat'));
      return;
    }

    setLoading(true);

    try {
      if (inputType === 'email') {
        const { error } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password
        });
        if (error) throw new Error(error.message);
      } else {
        // Phone login: normalize → find the user's auth email → login with that
        const normalizedPhone = normalizePhone(identifier);
        const phoneE164 = `+${normalizedPhone}`;

        // 1. Check profiles table for a user with this phone
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('phone_number', phoneE164)
          .limit(1)
          .maybeSingle();

        // 2. Determine which email to use for auth
        let authEmail: string | null = profileData?.email ?? null;

        // 3. If no profile match, try the legacy pseudo-email format
        if (!authEmail) {
          const pseudoEmail = `${normalizedPhone}@phone-user.alnuami.com`;
          authEmail = pseudoEmail;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password
        });
        if (error) throw new Error(error.message);
      }

      toast.success(t('success'));
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-black text-3xl text-foreground">
            AL <span className="text-primary">NUAMI</span>
          </Link>
          <p className="text-muted-foreground mt-2">{t('loginSubtitle')}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 space-y-5 shadow-card">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left rtl:text-right">{t('emailOrPhone')}</label>
              <div className="relative">
                <UserCircle className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-left rtl:text-right"
                  placeholder={t('loginPlaceholder')}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left rtl:text-right">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary" />
                <span className="text-xs text-muted-foreground font-medium">{t('rememberMe')}</span>
              </label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">{t('forgotPassword')}</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary-hover py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t('signingIn') : t('login')}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">{t('signup')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
