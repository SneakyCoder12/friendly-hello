import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnimatedPage from '@/components/AnimatedPage';
import ScrollToTop from '@/components/ScrollToTop';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Loader2 } from 'lucide-react';

const HomePage = lazy(() => import('@/pages/HomePage'));
const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'));
const PlateDetailPage = lazy(() => import('@/pages/PlateDetailPage'));
const RequestPage = lazy(() => import('@/pages/RequestPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const VisualizerPage = lazy(() => import('@/pages/VisualizerPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const MobileNumbersPage = lazy(() => import('@/pages/MobileNumbersPage'));
const MobileNumberDetailPage = lazy(() => import('@/pages/MobileNumberDetailPage'));
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage'));

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen overflow-x-hidden w-full max-w-full">
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
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/dashboard/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
                  <Route path="/features" element={<FeaturesPage />} />
                </Routes>
              </AnimatedPage>
            </Suspense>
            <Footer />
            {/* Mobile bottom spacer to prevent content hiding behind fixed nav */}
            <div className="sm:hidden h-16" />
          </div>
          <MobileBottomNav />
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
