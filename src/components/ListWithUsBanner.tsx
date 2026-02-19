import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, PlusCircle, Sparkles, TrendingUp, Shield, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export default function ListWithUsBanner() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleListClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            toast.info(t('loginToList'));
            navigate('/login');
        }
    };

    return (
        <div className="w-full overflow-hidden">
            <section className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-primary/5 shadow-xl shadow-primary/5 mt-4 sm:mt-8">
                {/* Rich gold gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-primary/[0.08]" />
                {/* Decorative corner accents */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/8 to-transparent rounded-tr-full" />
                {/* Animated shimmer line */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                {/* Floating dots pattern */}
                <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#b8860b_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

                <div className="relative px-4 sm:px-8 md:px-14 py-8 md:py-14">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">

                        {/* Left side — text */}
                        <div className="text-center md:text-start max-w-xl w-full min-w-0">
                            <div className="inline-flex items-center gap-2 mb-4 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 max-w-full overflow-hidden">
                                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-primary truncate">{t('sellWithUs')}</span>
                            </div>
                            <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-black text-foreground tracking-tight mb-3 leading-tight">
                                {t('wantToListNumber')}
                            </h2>
                            <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-md">
                                {t('wantToListNumberDesc')}
                            </p>

                            {/* Trust stats */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-5 justify-center md:justify-start">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Users className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('thousandsBuyers')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <TrendingUp className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('freeListing')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Shield className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('secureDeals')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right side — CTA */}
                        <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-end">
                            <Link
                                to={user ? '/dashboard' : '/login'}
                                onClick={handleListClick}
                                className="relative w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-base hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-300 group overflow-hidden"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <span className="relative flex items-center gap-2">
                                    <PlusCircle className="h-5 w-5" />
                                    {t('listYourNumber')}
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
