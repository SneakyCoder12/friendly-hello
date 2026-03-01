import { ShieldCheck, Link2, Crown, Globe, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const FEATURES = [
    {
        icon: ShieldCheck,
        title: 'Verified Sellers',
        description: 'Every seller is verified to ensure safe and trusted transactions.',
    },
    {
        icon: Link2,
        title: 'Secure Connections',
        description: 'We connect buyers and sellers directly with secure communication.',
    },
    {
        icon: Crown,
        title: 'Premium & Rare Plates',
        description: 'Access exclusive and rare number plates across all emirates.',
    },
    {
        icon: Globe,
        title: 'All UAE Emirates',
        description: 'Browse plates from Dubai, Abu Dhabi, Sharjah, and all 7 emirates.',
    },
    {
        icon: Zap,
        title: 'Fast & Easy Listing',
        description: 'List your plate in under 2 minutes. Simple, fast, and free.',
    },
];
export default function FeaturesPage() {
    const { t } = useLanguage();
    const isArabic = t('language' as any) === 'English';

    const features = isArabic ? [
        {
            icon: ShieldCheck,
            title: 'بائعين موثوقين',
            description: 'كل بائع يتم التحقق منه لضمان صفقات آمنة ومضمونة.',
        },
        {
            icon: Link2,
            title: 'تواصل مباشر',
            description: 'نربط البائع والمشتري مباشرة وبكل سهولة.',
        },
        {
            icon: Crown,
            title: 'لوحات ملكية ونادرة',
            description: 'حصّل لوحات أرقام حصرية ونادرة في كل الإمارات.',
        },
        {
            icon: Globe,
            title: 'كل إمارات الدولة',
            description: 'تصفح لوحات من دبي، أبوظبي، الشارقة، وكل الإمارات السبع.',
        },
        {
            icon: Zap,
            title: 'إعلان سريع وسهل',
            description: 'أعلِن عن رقمك في أقل من دقيقتين. سهل، سريع، ومجاني.',
        },
    ] : FEATURES;

    return (
        <div className="min-h-screen pt-20 pb-24 sm:pb-12">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-10 sm:mb-16">
                    <h1 className="text-2xl sm:text-4xl font-display font-black text-foreground tracking-tight mb-3">
                        {isArabic ? 'ليش تختارنا؟' : 'Why Choose Us'}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-md mx-auto">
                        {isArabic ? 'المنصة الأولى والأكثر ثقة في الإمارات لبيع وشراء أرقام اللوحات المميّزة.' : "The UAE's most trusted platform for premium number plates."}
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="space-y-4 sm:space-y-6">
                    {features.map(({ icon: Icon, title, description }) => (
                        <div
                            key={title}
                            className="flex items-start gap-4 p-4 sm:p-6 bg-card rounded-2xl border border-border hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md text-left rtl:text-right"
                        >
                            <div className="flex-shrink-0 h-11 w-11 sm:h-14 sm:w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-display font-bold text-foreground mb-1">
                                    {title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trust badge */}
                <div className="mt-10 sm:mt-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-primary tracking-wide uppercase">
                            {isArabic ? 'موثوقين من آلاف المستخدمين في كل الإمارات' : 'Trusted by thousands across the UAE'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
