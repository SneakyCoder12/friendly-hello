import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Sparkles, User } from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Marketplace', icon: Store, path: '/marketplace' },
    { label: 'Features', icon: Sparkles, path: '/features' },
    { label: 'Account', icon: User, path: '/dashboard' },
];

export default function MobileBottomNav() {
    const { pathname } = useLocation();

    return (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-around h-16 px-2">
                {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
                    const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));
                    return (
                        <Link
                            key={path}
                            to={path}
                            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-xl transition-colors duration-200 ${isActive
                                ? 'text-primary'
                                : 'text-muted-foreground'
                                }`}
                        >
                            <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
            {/* Safe area for iOS home indicator */}
            <div className="h-[env(safe-area-inset-bottom,0px)] bg-white/95" />
        </nav>
    );
}
