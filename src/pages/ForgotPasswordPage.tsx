import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, UserCircle } from 'lucide-react';
import { isPhoneNumber, formatPhoneAsEmail } from '@/utils/phoneAuth';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isPhone = isPhoneNumber(email);
    const resetIdentifier = isPhone ? formatPhoneAsEmail(email) : email;

    const { error } = await supabase.auth.resetPasswordForEmail(resetIdentifier, {
      redirectTo: 'https://alnuamigrp.com/reset-password',
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success(t('resetLinkSent'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-black text-3xl text-foreground">
            AL <span className="text-primary">NUAMI</span>
          </Link>
          <p className="text-muted-foreground mt-2">{t('forgotPassword')}</p>
        </div>
        {sent ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-card">
            <p className="text-foreground mb-4">{t('checkEmailReset')}</p>
            <Link to="/login" className="text-primary font-bold hover:underline">{t('backToLogin')}</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="bg-card border border-border rounded-2xl p-8 space-y-5 shadow-card">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left rtl:text-right">{t('emailOrPhone')}</label>
              <div className="relative">
                <UserCircle className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('loginPlaceholder')}
                  className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-left rtl:text-right" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary-hover py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('sendResetLink')}
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
