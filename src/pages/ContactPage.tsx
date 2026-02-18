import { useState } from 'react';
import { Send, CheckCircle, MapPin, Phone, Mail, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export default function ContactPage() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
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
        subject: `Contact Form: ${form.subject}`,
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
        toast.error(data.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Web3Forms error:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-16 flex items-center justify-center">
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
      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">{t('contactUs')}</h1>
            <p className="text-gray-500 text-lg">{t('contactSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t('yourName')} *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                    placeholder={t('yourName')} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t('yourEmail')} *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                    placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t('subject')} *</label>
                <input type="text" name="subject" value={form.subject} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                  placeholder="What's this about?" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t('message')} *</label>
                <textarea name="message" value={form.message} onChange={handleChange} required rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none"
                  placeholder="Tell us more..." />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} {loading ? 'Sending...' : t('sendMessage')}
              </button>
            </form>

            {/* Company Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{t('contactTitle')}</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t('phoneNumber')}</p>
                      <a href="tel:+971501234567" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">+971 50 123 4567</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t('email')}</p>
                      <a href="mailto:info@alnuami.ae" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">info@alnuami.ae</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t('emirate')}</p>
                      <p className="text-sm text-gray-500">United Arab Emirates</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
