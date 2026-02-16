import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, ArrowLeft, CheckCircle } from 'lucide-react';

export default function RequestPage() {
    const [submitted, setSubmitted] = useState(false);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Connect to Supabase database / send email
        console.log('Form submitted:', form);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-white pt-24 pb-16 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-3">Request Submitted!</h2>
                    <p className="text-gray-500 mb-8">
                        We've received your request. Our team will get back to you shortly with available plates matching your criteria.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-24 pb-16">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Home
                </Link>

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                        Your Exclusive Number, Made Simple.
                    </h1>
                    <p className="text-gray-500 text-lg">
                        Request your favourite number plate, a VIP phone number, or a #Tag that mirrors who you are. Submit your request and we'll notify you once it's available.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    {/* Phone & Emirate */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                                placeholder="+971 50 xxx xxxx"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Category *</label>
                            <select
                                name="emirate"
                                value={form.emirate}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                            >
                                <option value="">Select category</option>
                                <optgroup label="Number Plates">
                                    <option value="abudhabi">Abu Dhabi</option>
                                    <option value="dubai">Dubai</option>
                                    <option value="sharjah">Sharjah</option>
                                    <option value="ajman">Ajman</option>
                                    <option value="rak">Ras Al Khaimah</option>
                                    <option value="fujairah">Fujairah</option>
                                    <option value="umm_al_quwain">Umm Al Quwain</option>
                                </optgroup>
                                <optgroup label="Prestigious Numbers">
                                    <option value="etisalat">Etisalat</option>
                                    <option value="du">Du</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    {/* Plate Details */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Plate / Number Details *</label>
                        <input
                            type="text"
                            name="plateDetails"
                            value={form.plateDetails}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                            placeholder="e.g. Dubai A 333, or Etisalat 050-XXX-XXXX"
                        />
                    </div>

                    {/* Budget */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Budget Range</label>
                        <input
                            type="text"
                            name="budget"
                            value={form.budget}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                            placeholder="e.g. AED 50,000 - 100,000"
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Additional Message</label>
                        <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none"
                            placeholder="Any additional details or preferences..."
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Send className="h-5 w-5" /> Submit Request
                    </button>

                    {/* Disclaimer */}
                    <p className="text-xs text-center text-gray-400 leading-relaxed">
                        By submitting, you agree to be contacted regarding your request. We facilitate connections but are not liable for private transactions between buyers and sellers.
                    </p>
                </form>
            </div>
        </div>
    );
}
