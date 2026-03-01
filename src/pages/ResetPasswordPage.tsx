import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Supabase can put token in hash (#) or search params (?)
    const hash = window.location.hash;
    const search = window.location.search;

    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      setIsRecovery(true);
      setChecking(false);
      return;
    }

    // Listen for PASSWORD_RECOVERY auth event (fired when Supabase processes the token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session) {
        // User was auto signed-in via recovery link
        setIsRecovery(true);
        setChecking(false);
      }
    });

    // Fallback: if no event fired in 2 seconds, check current session
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If there's an active session when landing on this page, allow password change
        setIsRecovery(true);
      }
      setChecking(false);
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('passwordsNoMatch' as any));
      return;
    }
    if (password.length < 6) {
      toast.error(t('passwordMinLength' as any));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('passwordUpdated' as any));
      navigate('/dashboard');
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-black text-3xl text-foreground">
            AL <span className="text-primary">NUAMI</span>
          </Link>
          <p className="text-muted-foreground mt-2">{t('setNewPassword' as any)}</p>
        </div>

        {!isRecovery ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-card">
            <p className="text-foreground mb-4">{t('linkExpired' as any)}</p>
            <Link to="/forgot-password" className="text-primary font-bold hover:underline">
              {t('requestNewLink' as any)}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="bg-card border border-border rounded-2xl p-8 space-y-5 shadow-card">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left rtl:text-right">
                {t('newPassword' as any)}
              </label>
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
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left rtl:text-right">
                {t('confirmPassword' as any)}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary-hover py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('updatePassword' as any)}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary font-bold hover:underline">{t('backToLogin')}</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
