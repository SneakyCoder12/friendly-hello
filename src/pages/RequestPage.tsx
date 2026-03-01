import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

export default function RequestPage() {
    const { t } = useLanguage();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        emirate: '',
        plateDetails: '',
        budget: '',
        message: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                access_key: '97c1db95-559a-4011-b96d-20fe68a2cf51',
                subject: `${t('plateRequest')}: ${form.plateDetails}`,
                from_name: 'Alnuami Groups Website',
                name: form.name,
                email: form.email,
                'Phone Number': form.phone,
                'Preferred Emirate': form.emirate,
                'Plate / Number Details': form.plateDetails,
                Budget: form.budget || 'Not specified',
                'Additional Notes': form.message || t('none' as any),
            };

            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (data.success) {
                setSubmitted(true);
            } else {
                toast.error(data.message || t('requestFailed'));
            }
        } catch (err) {
            console.error('Web3Forms error:', err);
            toast.error(t('networkError'));
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-3">{t('requestSuccess')}</h2>
                    <p className="text-gray-500 mb-8">
                        {t('requestDesc')}
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
                    >
                        {t('home')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16">
            <SEO
                title="Request a Number Plate"
                description="Submit a request for a specific UAE number plate or VIP mobile number. Tell us what you're looking for and we'll help you find it."
                url="/request"
            />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" /> {t('back')}
                </Link>

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                        {t('requestTitle')}
                    </h1>
                    <p className="text-gray-500 text-lg">
                        {t('requestSubtitle')}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('fullName')} *</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                                placeholder={t('yourName')}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('email')} *</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                                placeholder={t('emailPlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Phone & Emirate */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('phoneNumber')} *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                                placeholder={t('phonePlaceholder')}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('preferredEmirate')} *</label>
                            <select
                                name="emirate"
                                value={form.emirate}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                            >
                                <option value="">{t('selectEmirate')}</option>
                                <optgroup label={t('plateNumbers')}>
                                    <option value="abudhabi">Abu Dhabi</option>
                                    <option value="dubai">Dubai</option>
                                    <option value="sharjah">Sharjah</option>
                                    <option value="ajman">Ajman</option>
                                    <option value="rak">Ras Al Khaimah</option>
                                    <option value="fujairah">Fujairah</option>
                                    <option value="umm_al_quwain">Umm Al Quwain</option>
                                </optgroup>
                                <optgroup label={t('mobileNumbers')}>
                                    <option value="etisalat">Etisalat</option>
                                    <option value="du">Du</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    {/* Plate Details */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('preferredNumber')} *</label>
                        <input
                            type="text"
                            name="plateDetails"
                            value={form.plateDetails}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                            placeholder={t('requestPlaceholder')}
                        />
                    </div>

                    {/* Budget */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('budget')}</label>
                        <input
                            type="text"
                            name="budget"
                            value={form.budget}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                            placeholder={t('budgetPlaceholder')}
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('additionalNotes')}</label>
                        <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none"
                            placeholder={t('additionalNotes')}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} {loading ? t('submitting') : t('submitRequestBtn')}
                    </button>

                    {/* Disclaimer */}
                    <p className="text-xs text-center text-gray-300 leading-relaxed">
                        {t('noticeText')}
                    </p>
                </form>
            </div>
        </div>
    );
}
