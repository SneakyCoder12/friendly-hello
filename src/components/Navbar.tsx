import { LayoutGrid, Menu, X, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleLang = () => setLocale(locale === 'en' ? 'ar' : 'en');

  return (
    <nav className="fixed w-full top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
            <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all">
              <LayoutGrid className="h-4 w-4 text-primary" />
            </div>
            <h1 className="font-display font-black text-xl tracking-tighter text-foreground">
              AL <span className="text-primary">NUAMI</span>
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link className="text-sm font-medium text-foreground hover:text-primary transition-colors" to="/">{t('home')}</Link>
            <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" to="/marketplace">{t('marketplace')}</Link>
            <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="/#generator">{t('generator')}</a>
            {user && <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" to="/dashboard">{t('dashboard')}</Link>}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Toggle language">
              <Globe className="h-4 w-4" />
            </button>
            {user ? (
              <button onClick={handleSignOut} className="hidden sm:block text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                {t('logout')}
              </button>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t('login')}</Link>
                <Link to="/signup" className="bg-primary text-primary-foreground hover:bg-primary-hover px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all">
                  {t('signup')}
                </Link>
              </>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground">
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-3">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-foreground py-2">{t('home')}</Link>
            <Link to="/marketplace" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground py-2">{t('marketplace')}</Link>
            {user && <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground py-2">{t('dashboard')}</Link>}
            {user ? (
              <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="block text-sm font-medium text-muted-foreground py-2">{t('logout')}</button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground py-2">{t('login')}</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
