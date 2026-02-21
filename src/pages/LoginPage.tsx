import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, UserCircle } from 'lucide-react';
import { isPhoneNumber, normalizePhone } from '@/utils/phoneAuth';

export default function LoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isPhone = isPhoneNumber(email);

      if (isPhone) {
        // Run it through the fallback custom API to handle both phone-registered AND email-registered users
        // typing their profile phone number to log in securely.
        const normalizedPhone = email.replace(/\D/g, ''); // Extract digits to send to backend for normalization sync

        const response = await fetch('/api/login-fallback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: email, normalizedPhone, password })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Invalid login credentials');
        }

        // Successfully found and authenticated! Establish the session on the client side.
        const { session } = result;
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });

        if (sessionErr) throw new Error(sessionErr.message);

      } else {
        // Standard Email Login Flow
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password
        });
        if (error) throw new Error(error.message);
      }

      toast.success(t('success'));
      navigate('/dashboard');

    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-black text-3xl text-foreground">
            AL <span className="text-primary">NUAMI</span>
          </Link>
          <p className="text-muted-foreground mt-2">{t('loginSubtitle')}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 space-y-5 shadow-card">
          {/* Email Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('email')} or Phone Number</label>
              <div className="relative">
                <UserCircle className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="you@example.com or +971501234567"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('password')}</label>
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
              {t('login')}
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
