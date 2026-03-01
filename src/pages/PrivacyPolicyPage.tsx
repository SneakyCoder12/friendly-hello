import { Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPolicyPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mb-12">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-4 text-left rtl:text-right">
                        {t('privacy' as any)}
                    </h1>
                    <p className="text-muted-foreground text-left rtl:text-right">
                        {t('language' as any) === 'English' ? 'آخر تحديث:' : 'Last Updated:'} {new Date().toLocaleDateString(t('language' as any) === 'English' ? 'ar-AE' : 'en-US')}
                    </p>
                </div>

                <div className="space-y-8 text-foreground prose prose-gray max-w-none text-left rtl:text-right">
                    {t('language' as any) === 'English' ? (
                        <>
                            <section>
                                <h2 className="text-2xl font-bold mb-4 font-display">١. جمع المعلومات</h2>
                                <p className="mb-4 text-muted-foreground leading-relaxed">
                                    نحن نجمع المعلومات اللي تعطينا إياها مباشرة يوم تستخدم موقعنا وخدماتنا، مثل اسمك، بريدك الإلكتروني، رقم تليفونك، وأي تفاصيل ثانية تختار تقدمها. نحن ما نحتفظ ببيانات شخصية حساسة مب ضرورية أكثر من اللي نحتاجه عشان نقدم خدماتنا في السوق.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 font-display">٢. استخدام المعلومات</h2>
                                <p className="mb-4 text-muted-foreground leading-relaxed">
                                    المعلومات اللي نجمعها تُستخدم بس لأغراض داخلية عشان نحافظ على خدماتنا ونطورها. تفاصيلك تساعدنا في التواصل وياك، ومعالجة الطلبات، وتقديم الدعم بخصوص لوحات الأرقام. نحن ما نبيع ولا نأجر بياناتك الشخصية لأي طرف ثالث.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 font-display">٣. الأمان</h2>
                                <p className="mb-4 text-muted-foreground leading-relaxed">
                                    نحن نستخدم طرق أمان معقولة عشان نحمي أي معلومات تشاركها معانا. لكن، حط في بالك إنه ما في طريقة إرسال عبر الإنترنت أو طريقة تخزين إلكتروني آمنة ١٠٠٪. عشان جي، ما نقدر نضمن أمانها المطلق وما نتحمل مسؤولية أي اختراقات خارجة عن إرادتنا.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 font-display">٤. روابط الأطراف الثالثة</h2>
                                <p className="mb-4 text-muted-foreground leading-relaxed">
                                    موقعنا ممكن يحتوي على روابط لمواقع ثانية. إذا ضغطت على رابط طرف ثالث، بيتم توجيهك لهالموقع. لاحظ إن هالمواقع الخارجية إحنا ما نشغلها، فننصحك وبقوة إنك تقرأ سياسة الخصوصية الخاصة فيهم. إحنا ما نتحكم ولا نتحمل أي مسؤولية عن المحتوى أو سياسات الخصوصية لهالمواقع.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 font-display">٥. التغييرات في سياسة الخصوصية</h2>
                                <p className="mb-4 text-muted-foreground leading-relaxed">
                                    نحتفظ بحقنا في تحديث سياسة الخصوصية من وقت لثاني. عشان جي، ننصحك تراجع هالصفحة بشكل دوري. أي تغييرات بنسويها بتدخل حيز التنفيذ بمجرد نشرها على هالصفحة.
                                </p>
                            </section>
                        </>
                    ) : (
                        <>
                            <section>
                                <h2 className="text-2xl font-bold mb-4 font-display">1. Information Collection</h2>
                                <p className="mb-4 text-muted-foreground leading-relaxed">
                                    We collect information that you afford us directly when using our website and services, such as your name, email address, phone number, and any other details you choose to provide. We do not unnecessarily hoard or retain sensitive personal data beyond what is required to facilitate our marketplace services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 font-display">2. Use of Information</h2>
                                <p className="mb-4 text-muted-foreground leading-relaxed">
                                    The information we collect is used strictly for internal purposes to maintain, improve, and provide our services. Your details facilitate communication, processing of requests, and general customer support regarding custom number plates. We do not sell or rent your personal data to third parties.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 font-display">3. Security</h2>
                                <p className="mb-4 text-muted-foreground leading-relaxed">
                                    We employ commercially reasonable security methods to safeguard any information you share with us. However, please be aware that no method of transmission over the internet, or method of electronic storage, is 100% secure. Therefore, we cannot guarantee its absolute security and assume no liability for potential breaches beyond our direct control.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 font-display">4. Third-Party Links</h2>
                                <p className="mb-4 text-muted-foreground leading-relaxed">
                                    Our website may contain links to third-party sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by us. Therefore, we strongly advise you to review the Privacy Policy of these websites. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4 font-display">5. Changes to This Privacy Policy</h2>
                                <p className="mb-4 text-muted-foreground leading-relaxed">
                                    We reserve the right to update our Privacy Policy from time to time at our sole discretion. Thus, we advise you to review this page periodically for any changes. Any changes made will be effective immediately upon posting to this page.
                                </p>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
