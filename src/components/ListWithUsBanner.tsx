import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, PlusCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ListWithUsBanner() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleListClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            toast.info('Please login to list your number');
            navigate('/login');
        }
    };

    return (
        <section className="relative w-full rounded-3xl overflow-hidden border border-gray-100 shadow-sm mt-8 bg-white">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-50 to-white" />

            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative px-8 md:px-12 py-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">

                    {/* Left side — text */}
                    <div className="text-center md:text-start max-w-xl">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Sell With Us</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-display font-black text-gray-900 tracking-tight mb-2">
                            Want to list your number?
                        </h2>
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                            Join the marketplace and sell your unique plate or mobile number to thousands of buyers.
                        </p>
                    </div>

                    {/* Right side — CTA */}
                    <div className="flex shrink-0">
                        <Link
                            to={user ? '/dashboard' : '/login'}
                            onClick={handleListClick}
                            className="relative inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-xl font-bold text-base hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden"
                        >
                            <span className="relative flex items-center gap-2">
                                <PlusCircle className="h-5 w-5" />
                                List Your Number
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                    </div>

                </div>
            </div>
        </section>
    );
}
