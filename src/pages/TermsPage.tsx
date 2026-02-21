import { FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TermsPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                        <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="space-y-8 text-foreground prose prose-gray max-w-none">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 font-display">1. Acceptance of Terms</h2>
                        <p className="mb-4 text-muted-foreground leading-relaxed">
                            By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 font-display">2. Service Provision & Disclaimers</h2>
                        <p className="mb-4 text-muted-foreground leading-relaxed">
                            This website acts solely as an advertising and listing platform. We do not own, control, or guarantee the exact condition or availability of any number plates or mobile numbers listed by third parties. The service and its components are offered for informational purposes only. We shall not be responsible or liable for the accuracy, usefulness or availability of any information transmitted or made available via the site, and shall not be responsible or liable for any error or omissions in that information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 font-display">3. Limitation of Liability</h2>
                        <p className="mb-4 text-muted-foreground leading-relaxed">
                            In no event shall the website operators, owners, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with the use of this website or with the delay or inability to use this website, or for any information, products, and services obtained through this website, whether based on contract, tort, strict liability, or otherwise.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 font-display">4. User Content and Conduct</h2>
                        <p className="mb-4 text-muted-foreground leading-relaxed">
                            Users are solely responsible for all content they post or transmit through the website. We reserve the right, but not the obligation, to monitor, edit, or remove any listings or content we deem inappropriate, inaccurate, or in violation of these terms at our sole discretion without prior notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 font-display">5. Modifications</h2>
                        <p className="mb-4 text-muted-foreground leading-relaxed">
                            We reserve the right to change these conditions from time to time as we see fit and your continued use of the site will signify your acceptance of any adjustment to these terms. You are therefore advised to re-read this statement on a regular basis.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
