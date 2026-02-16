import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

const PLATE_CATEGORIES = [
  { name: 'Abu Dhabi', plates: 'Abu Dhabi', image: '/abudhabi-plate.png' },
  { name: 'Dubai', plates: 'Dubai', image: '/dubai-plate.png' },
  { name: 'Sharjah', plates: 'Sharjah', image: '/sharjah-plate.png' },
  { name: 'Ajman', plates: 'Ajman', image: '/ajman-plate.png' },
  { name: 'RAK', plates: 'Ras Al Khaimah', image: '/rak-plate.png' },
  { name: 'Fujairah', plates: 'Fujairah', image: '/fujariah-plate.png' },
  { name: 'UAQ', plates: 'Umm Al Quwain', image: '/umm-al-q-plate.png' },
];

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

  const navLinkClass =
    'relative text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors duration-300 after:content-[""] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-gray-800 after:rounded-full after:transition-all after:duration-300 hover:after:w-full';

  return (
    <nav className="fixed w-full top-0 z-50 border-b border-border bg-white/90 backdrop-blur-lg transition-all duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* Logo + Name */}
          <Link to="/" className="flex-shrink-0 flex items-center group">
            <img
              src="/Logo.png"
              alt="Alnuami Groups"
              className="h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <h1 className="-ml-3 font-display font-black text-3xl tracking-tighter text-gray-900 leading-none transition-colors duration-300 group-hover:text-gray-700">
              AL <span className="text-gray-800">NUAMI</span>
            </h1>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link className={navLinkClass} to="/">{t('home')}</Link>

            {/* Marketplace Dropdown */}
            <div className="relative group/market">
              <button className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors duration-300">
                {t('marketplace')}
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover/market:rotate-180" />
              </button>

              {/* Hover bridge — invisible padding to prevent dropdown closing */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full h-6 w-[750px] opacity-0 group-hover/market:opacity-100 pointer-events-none group-hover/market:pointer-events-auto" />

              {/* Dropdown Panel */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-6 opacity-0 invisible group-hover/market:opacity-100 group-hover/market:visible transition-all duration-300">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 min-w-[750px]">
                  {/* Arrow */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 -translate-y-full w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />

                  <div className="flex gap-10">
                    {/* Plate Numbers */}
                    <div className="flex-1">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Plate Numbers</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {PLATE_CATEGORIES.map((cat) => (
                          <Link
                            key={cat.plates}
                            to={`/marketplace?emirate=${encodeURIComponent(cat.plates)}`}
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 group/item"
                          >
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="h-10 w-20 object-contain rounded"
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-800 group-hover/item:text-gray-900">{cat.name}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-gray-100" />

                    {/* Prestigious Numbers */}
                    <div className="w-[220px]">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Prestigious Numbers</h3>
                      <div className="space-y-3">
                        <Link
                          to="/marketplace?category=etisalat"
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">e&</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Etisalat</p>
                            <p className="text-[10px] text-gray-400">Premium Numbers</p>
                          </div>
                        </Link>
                        <Link
                          to="/marketplace?category=du"
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">du</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Du</p>
                            <p className="text-[10px] text-gray-400">Premium Numbers</p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bar */}
                  <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-xs text-gray-400">Browse all categories</p>
                    <Link to="/marketplace" className="text-xs font-bold text-gray-800 hover:text-gray-600 transition-colors">
                      View All →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Link className={navLinkClass} to="/visualizer">{t('generator')}</Link>
            <Link className={navLinkClass} to="/contact">{t('contactUs')}</Link>
            {user && <Link className={navLinkClass} to="/dashboard">{t('dashboard')}</Link>}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-foreground hover:bg-gray-200 transition-all duration-300"
              title="Toggle language"
            >
              <Globe className="h-4 w-4" />
            </button>

            {user ? (
              <button
                onClick={handleSignOut}
                className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors duration-300"
              >
                {t('logout')}
              </button>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors duration-300">
                  {t('login')}
                </Link>
                <Link to="/signup" className="hidden sm:block text-sm font-semibold text-gray-900 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all duration-300">
                  {t('signup')}
                </Link>
              </>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-foreground hover:bg-gray-200 transition-all duration-300"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-foreground py-2 hover:text-gray-600 transition-colors">{t('home')}</Link>
            <Link to="/marketplace" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-gray-600 py-2 hover:text-gray-900 transition-colors">{t('marketplace')}</Link>
            <Link to="/visualizer" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-gray-600 py-2 hover:text-gray-900 transition-colors">{t('generator')}</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-gray-600 py-2 hover:text-gray-900 transition-colors">{t('contactUs')}</Link>
            {user && <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-gray-600 py-2 hover:text-gray-900 transition-colors">{t('dashboard')}</Link>}
            {user && (
              <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="block text-sm font-semibold text-gray-600 py-2 hover:text-gray-900 transition-colors">{t('logout')}</button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
