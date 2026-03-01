import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnimatedPage from '@/components/AnimatedPage';
import ScrollToTop from '@/components/ScrollToTop';
import MobileBottomNav from '@/components/MobileBottomNav';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { GlobalSEO } from '@/components/SEO';
import { Loader2 } from 'lucide-react';

const HomePage = lazy(() => import('@/pages/HomePage'));
const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'));
const PlateDetailPage = lazy(() => import('@/pages/PlateDetailPage'));
const RequestPage = lazy(() => import('@/pages/RequestPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const VisualizerPage = lazy(() => import('@/pages/VisualizerPage'));
const DrawMyPlatePage = lazy(() => import('@/pages/DrawMyPlatePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const MobileNumbersPage = lazy(() => import('@/pages/MobileNumbersPage'));
const MobileNumberDetailPage = lazy(() => import('@/pages/MobileNumberDetailPage'));
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const MotorsPage = lazy(() => import('@/pages/MotorsPage'));
const MotorDetailPage = lazy(() => import('@/pages/MotorDetailPage'));
const ClassifiedsPage = lazy(() => import('@/pages/ClassifiedsPage'));
const ClassifiedDetailPage = lazy(() => import('@/pages/ClassifiedDetailPage'));
const PropertiesPage = lazy(() => import('@/pages/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('@/pages/PropertyDetailPage'));

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  // Preload luxury font used heavily in canvas overlays early
  useEffect(() => {
    document.fonts.ready.then(() => {
      document.fonts.load('700 240px "Cinzel Decorative"').catch(() => { });
      document.fonts.load('600 200px "Cinzel Decorative"').catch(() => { });
    });
  }, []);

  return (
    <HelmetProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <GlobalSEO />
            <ScrollToTop />
            <div className="flex flex-col min-h-[100dvh] overflow-x-hidden w-full max-w-full relative">
              {/* Global Watermark - Stays fixed on screen across all pages */}
              <img
                src="/Logo.webp"
                alt=""
                loading="lazy"
                decoding="async"
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[800px] opacity-10 pointer-events-none z-0 object-contain drop-shadow-sm"
              />
              <Navbar />
              <Suspense fallback={<Loading />}>
                <AnimatedPage>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/mobile-numbers" element={<MobileNumbersPage />} />
                    <Route path="/mobile-number/:numberId" element={<MobileNumberDetailPage />} />
                    <Route path="/plate/:plateId" element={<PlateDetailPage />} />
                    <Route path="/request" element={<RequestPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/visualizer" element={<ProtectedRoute adminOnly><VisualizerPage /></ProtectedRoute>} />
                    <Route path="/draw-my-plate" element={<DrawMyPlatePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/dashboard/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
                    <Route path="/features" element={<FeaturesPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/motors" element={<MotorsPage />} />
                    <Route path="/motors/:id" element={<MotorDetailPage />} />
                    <Route path="/classifieds" element={<ClassifiedsPage />} />
                    <Route path="/classifieds/:id" element={<ClassifiedDetailPage />} />
                    <Route path="/properties" element={<PropertiesPage />} />
                    <Route path="/properties/:id" element={<PropertyDetailPage />} />
                  </Routes>
                </AnimatedPage>
              </Suspense>
              <Footer />
            </div>
            <MobileBottomNav />
            <ScrollToTopButton />
            <Toaster position="top-center" richColors />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}
