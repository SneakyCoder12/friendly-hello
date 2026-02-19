import { Menu, X, Globe, ChevronDown, ChevronRight, Phone, LayoutDashboard, PlusCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

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
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleLang = () => setLocale(locale === 'en' ? 'ar' : 'en');

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setMarketplaceOpen(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const navLinkClass =
    'relative text-base font-semibold text-gray-500 hover:text-[hsl(40,86%,44%)] transition-colors duration-300 after:content-[""] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-[hsl(40,86%,44%)] after:rounded-full after:transition-all after:duration-300 hover:after:w-full';

  return (
    <>
      <nav className="fixed w-full top-0 z-50 border-b border-border bg-white/90 backdrop-blur-lg transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">

            {/* Logo + Name */}
            <Link to="/" className="flex-shrink-0 flex items-center group -ml-2" onClick={closeMenu}>
              <img
                src="/Logo.png"
                alt="Alnuami Groups"
                className="h-16 sm:h-20 lg:h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-105 self-center"
              />
              <div className="-ml-3 leading-none">
                <h1 className="font-display font-black text-xl sm:text-2xl lg:text-3xl tracking-tighter text-gray-900 transition-colors duration-300 group-hover:text-gray-700">
                  ALNUAMI
                </h1>
                <p className="text-[7px] sm:text-[8px] lg:text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 -mt-0.5" style={{ paddingLeft: '64.5%' }}>Groups</p>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-8">
              <Link className={navLinkClass} to="/">{t('home')}</Link>

              {/* Marketplace Dropdown */}
              <div className="relative group/market">
                <Link
                  to="/marketplace"
                  className="flex items-center gap-1 text-base font-semibold text-gray-500 hover:text-[hsl(40,86%,44%)] transition-colors duration-300"
                >
                  {t('marketplace')}
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover/market:rotate-180" />
                </Link>

                {/* Hover bridge */}
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
                              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group/item hover:shadow-sm"
                            >
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="h-12 w-24 object-contain rounded transition-transform duration-200 group-hover/item:scale-110"
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

                      {/* Right Column */}
                      <div className="w-[230px]">
                        {/* Prestigious Numbers */}
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Prestigious Numbers</h3>
                        <div className="space-y-3">
                          <Link
                            to="/mobile-numbers?carrier=etisalat"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                          >
                            <div className="h-10 w-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                              <img src="/Eand_Logo.svg" alt="Etisalat" className="h-7 w-7 object-contain" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">Etisalat</p>
                              <p className="text-[10px] text-gray-400">VIP Numbers</p>
                            </div>
                          </Link>
                          <Link
                            to="/mobile-numbers?carrier=du"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                          >
                            <div className="h-10 w-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                              <img src="/du-logo.png" alt="Du" className="h-7 w-7 object-contain" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">Du</p>
                              <p className="text-[10px] text-gray-400">VIP Numbers</p>
                            </div>
                          </Link>
                        </div>

                        {/* Request a Plate */}
                        <div className="mt-5 pt-5 border-t border-gray-100">
                          <Link
                            to="/request"
                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 group/req"
                          >
                            <div className="h-10 w-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                              <img src="/dubai-plate.png" alt="Plate" className="h-6 w-12 object-contain" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 group-hover/req:text-gray-900">Request a Plate</p>
                              <p className="text-[10px] text-gray-400">Can't find it? We'll help</p>
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

              <Link className={navLinkClass} to="/contact">{t('contactUs')}</Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Dashboard Icon (logged in, desktop only) */}
              {user && (
                <Link
                  to="/dashboard"
                  className="hidden lg:flex h-10 w-10 rounded-full bg-gray-100 border border-gray-200 items-center justify-center text-gray-500 hover:text-foreground hover:bg-gray-200 transition-all duration-300"
                  title="Dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              )}

              {/* Language toggle — shown on all screen sizes */}
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
                  className="hidden lg:block text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors duration-300"
                >
                  {t('logout')}
                </button>
              ) : (
                <>
                  <Link to="/login" className="hidden lg:block text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors duration-300">
                    {t('login')}
                  </Link>
                  <Link to="/signup" className="hidden lg:block text-sm font-semibold text-gray-900 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all duration-300">
                    {t('signup')}
                  </Link>
                </>
              )}

              {/* Hamburger Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-foreground hover:bg-gray-200 transition-all duration-300 relative z-[60]"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ FULL-SCREEN MOBILE SLIDE-IN MENU ═══ */}

      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[51] lg:hidden transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={closeMenu}
      />

      {/* Slide-in Panel (from right) */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[55] lg:hidden shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Panel Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <Link to="/" className="flex items-center group" onClick={closeMenu}>
            <img src="/Logo.png" alt="Alnuami Groups" className="h-16 w-auto object-contain" />
            <div className="-ml-3 leading-none">
              <span className="font-display font-black text-xl tracking-tighter text-gray-900">ALNUAMI</span>
              <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-gray-400 -mt-0.5" style={{ paddingLeft: '64.5%' }}>Groups</p>
            </div>
          </Link>
          <button
            onClick={closeMenu}
            className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Links — scrollable area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 -webkit-overflow-scrolling-touch">
          <div className="space-y-1">
            {/* Home */}
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Home
            </Link>

            {/* ── Marketplace Accordion ── */}
            <div>
              <button
                onClick={() => setMarketplaceOpen(!marketplaceOpen)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                <span>{t('marketplace')}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${marketplaceOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Accordion content */}
              <div
                className={`overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${marketplaceOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <div className="pl-4 pr-2 pt-2 pb-3 space-y-1">
                  {/* Section: Plate Numbers */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pt-2 pb-2">Plate Numbers</p>
                  {PLATE_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.plates}
                      to={`/marketplace?emirate=${encodeURIComponent(cat.plates)}`}
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <img src={cat.image} alt={cat.name} className="h-8 w-16 object-contain rounded" />
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto" />
                    </Link>
                  ))}

                  {/* Divider */}
                  <div className="h-px bg-gray-100 my-2" />

                  {/* Section: VIP Numbers */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pt-2 pb-2">VIP Numbers</p>
                  <Link
                    to="/mobile-numbers?carrier=etisalat"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                      <img src="/Eand_Logo.svg" alt="e&" className="h-5 w-5 object-contain" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Etisalat (e&)</span>
                      <p className="text-[10px] text-gray-400">VIP Numbers</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto" />
                  </Link>
                  <Link
                    to="/mobile-numbers?carrier=du"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                      <img src="/du-logo.png" alt="Du" className="h-5 w-5 object-contain" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Du</span>
                      <p className="text-[10px] text-gray-400">VIP Numbers</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto" />
                  </Link>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 my-2" />

                  {/* View All + Request */}
                  <Link
                    to="/marketplace"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all"
                  >
                    <span className="text-sm font-bold text-gray-800">View All Plates →</span>
                  </Link>
                  <Link
                    to="/request"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="h-8 w-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <img src="/dubai-plate.png" alt="Plate" className="h-5 w-10 object-contain" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Request a Plate</span>
                      <p className="text-[10px] text-gray-400">Can't find it? We'll help</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Other Links */}
            <Link
              to="/contact"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              {t('contactUs')}
            </Link>

            {user && (
              <Link
                to="/dashboard"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                {t('dashboard')}
              </Link>
            )}

            {/* List Your Number CTA */}
            <Link
              to={user ? '/dashboard' : '/login'}
              onClick={closeMenu}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all shadow-sm my-2"
            >
              <PlusCircle className="h-5 w-5" />
              List Your Number
            </Link>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
            {user ? (
              <button
                onClick={() => { handleSignOut(); closeMenu(); }}
                className="w-full py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                {t('logout')}
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block w-full text-center py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/signup"
                  onClick={closeMenu}
                  className="block w-full text-center py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all"
                >
                  {t('signup')}
                </Link>
              </>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => { toggleLang(); closeMenu(); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
            >
              <Globe className="h-4 w-4" />
              {locale === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
