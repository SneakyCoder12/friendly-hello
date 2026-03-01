import { useState } from 'react';
import { Send, CheckCircle, MapPin, Phone, Mail, Loader2, Instagram } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

export default function ContactPage() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const contactSEOSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Al Nuami Group',
    url: 'https://alnuamigroup.ae/contact',
    description: 'Contact Al Nuami Group for UAE number plates and VIP mobile numbers.',
  };

  const TiktokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.95v5.25c-.01 3.9-3.15 7.15-7.05 7.15-3.9 0-7.05-3.26-7.05-7.15 0-3.9 3.15-7.15 7.05-7.15.54 0 1.08.06 1.6.18v4.06c-.53-.19-1.06-.29-1.6-.29-1.69 0-3.04 1.34-3.04 3.01 0 1.68 1.35 3.01 3.04 3.01 1.69 0 3.04-1.34 3.04-3.01V.02z" />
    </svg>
  );

  const SnapchatIcon = ({ className }: { className?: string }) => (
    <img src="/snapchat-logo.png" alt="Snapchat" className={`${className} object-contain drop-shadow-[0_0_2px_rgba(0,0,0,0.4)]`} />
  );
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        access_key: '97c1db95-559a-4011-b96d-20fe68a2cf51',
        subject: `${t('contactTitle')}: ${form.subject}`,
        from_name: 'Alnuami Groups Website',
        name: form.name,
        email: form.email,
        message: form.message,
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
          <h2 className="text-3xl font-black text-gray-900 mb-3">{t('messageSent')}</h2>
          <p className="text-gray-500 mb-8">{t('messageSent')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Contact Us"
        description="Contact Al Nuami Group for inquiries about UAE number plates and VIP mobile numbers. Reach us by phone at +971 50 991 2129 or email."
        url="/contact"
        schema={contactSEOSchema}
      />
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-12">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">{t('contactUs')}</h1>
            <p className="text-gray-500 text-lg">{t('contactSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('yourName')} *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                    placeholder={t('yourName')} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('yourEmail')} *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                    placeholder={t('emailPlaceholder')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('subject')} *</label>
                <input type="text" name="subject" value={form.subject} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                  placeholder={t('subjectPlaceholder')} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">{t('message')} *</label>
                <textarea name="message" value={form.message} onChange={handleChange} required rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none"
                  placeholder={t('messagePlaceholder')} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} {loading ? t('sending') : t('sendMessage')}
              </button>
            </form>

            {/* Company Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">{t('contactTitle')}</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t('phoneNumber')}</p>
                      <a href="tel:+971509912129" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">+971 50 991 2129</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t('email')}</p>
                      <a href="mailto:alnuamigroups@gmail.com" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">alnuamigroups@gmail.com</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t('emirate')}</p>
                      <p className="text-sm text-gray-500">United Arab Emirates</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="pt-8 border-t border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">{t('ourSocialMedia')}</h3>
                <div className="flex gap-4">
                  {[
                    { Icon: SnapchatIcon, label: "Snapchat Profile", href: "https://snapchat.com/t/rJdooLC5" },
                    { Icon: TiktokIcon, label: "TikTok Profile", href: "https://www.tiktok.com/@bu.mohmmad242?_r=1&_t=ZS-94FkPg1cu5I" },
                    { Icon: Instagram, label: "Instagram Profile", href: "https://www.instagram.com/bomohammad242?igsh=N2Y3cDJobHNiZWpk&utm_source=qr" }
                  ].map(({ Icon, label, href }, i) => (
                    <a key={i} aria-label={label} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-gray-100 border border-transparent flex items-center justify-center text-gray-600 hover:bg-[#F6D972] hover:text-gray-900 transition-all duration-300" href={href}>
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
