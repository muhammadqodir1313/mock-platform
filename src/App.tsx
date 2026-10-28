import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { MobileMenu } from './components/layout/MobileMenu';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/home/HeroSection';
import { ComparisonSection } from './components/home/ComparisonSection';
import { FeatureGrid } from './components/home/FeatureGrid';
import { FeatureHighlight } from './components/home/FeatureHighlight';
import { TestimonialCarousel } from './components/home/TestimonialCarousel';
import { FAQAccordion } from './components/home/FAQAccordion';
import { AuthModal } from './components/modals/AuthModal';
import { BookingModal } from './components/modals/BookingModal';
import { OnlineTrialModal } from './components/modals/OnlineTrialModal';
import { LegalModal } from './components/modals/LegalModal';
import { PlaceholderRouteView } from './components/placeholders/PlaceholderRouteView';
import { AppRoute } from './types';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const validRoutes: AppRoute[] = [
        '/',
        '/login',
        '/signup',
        '/dashboard',
        '/exam',
        '/results',
        '/bookings',
        '/admin',
      ];
      if (validRoutes.includes(path as AppRoute)) {
        return path as AppRoute;
      }
    }
    return '/';
  });

  // Modal states
  const [examModule, setExamModule] = useState<'listening' | 'reading' | 'writing'>('listening');
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'login' | 'signup';
  }>({
    isOpen: false,
    mode: 'login',
  });
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [onlineTrialModalOpen, setOnlineTrialModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{
    isOpen: boolean;
    type: 'privacy' | 'terms' | null;
  }>({
    isOpen: false,
    type: null,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync route changes with browser history
  const navigateTo = (route: AppRoute) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname as AppRoute;
      setCurrentRoute(path || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle direct login/signup routes
  useEffect(() => {
    if (currentRoute === '/login') {
      setAuthModal({ isOpen: true, mode: 'login' });
      setCurrentRoute('/');
    } else if (currentRoute === '/signup') {
      setAuthModal({ isOpen: true, mode: 'signup' });
      setCurrentRoute('/');
    }
  }, [currentRoute]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModal({ isOpen: true, mode });
  };

  const handleOpenBooking = () => {
    setBookingModalOpen(true);
  };

  const handleOpenOnlineTrial = () => {
    setOnlineTrialModalOpen(true);
  };

  const handleOpenLegal = (type: 'privacy' | 'terms') => {
    setLegalModal({ isOpen: true, type });
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#F7F7FB] dark:bg-[#130922] text-[#211A2B] dark:text-[#F7F5FA] transition-colors selection:bg-[#F0EAF8] selection:text-[#35145A] dark:selection:bg-[#35145A] dark:selection:text-white">
        {/* Main Navigation Bar */}
        {currentRoute !== '/exam' && (
          <Navbar
            currentRoute={currentRoute}
            onNavigate={navigateTo}
            onOpenAuth={handleOpenAuth}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
        )}

        {/* Mobile Navigation Drawer */}
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          onOpenAuth={handleOpenAuth}
        />

        {/* Main Content Router */}
        {currentRoute === '/' ? (
          <main className="flex-1">
            {/* 1. Hero Section */}
            <HeroSection
              onBookOffline={handleOpenBooking}
              onTryOnline={handleOpenOnlineTrial}
            />

            {/* 2. Format Comparison */}
            <ComparisonSection
              onBookOffline={handleOpenBooking}
              onTryOnline={handleOpenOnlineTrial}
            />

            {/* 3. Why Choose Us (6 Pillars) */}
            <FeatureGrid />

            {/* 4. Interactive Feature Highlights */}
            <FeatureHighlight onLaunchSimulator={() => navigateTo('/exam')} />

            {/* 5. Demonstration Testimonials */}
            <TestimonialCarousel />

            {/* 6. FAQ Accordion */}
            <FAQAccordion />
          </main>
        ) : (
          <main className="flex-1">
            <PlaceholderRouteView
              route={currentRoute}
              onNavigate={navigateTo}
              onOpenBookingModal={handleOpenBooking}
              onOpenAuth={handleOpenAuth}
              examModule={examModule}
              onSelectExamModule={(mod) => setExamModule(mod)}
            />
          </main>
        )}

        {/* Footer */}
        {currentRoute !== '/exam' && (
          <Footer
            onNavigate={navigateTo}
            onOpenPrivacy={() => handleOpenLegal('privacy')}
            onOpenTerms={() => handleOpenLegal('terms')}
          />
        )}

        {/* Interactive Modals */}
        <AuthModal
          isOpen={authModal.isOpen}
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
          onNavigateToPlaceholder={navigateTo}
        />

        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
        />

        <OnlineTrialModal
          isOpen={onlineTrialModalOpen}
          onClose={() => setOnlineTrialModalOpen(false)}
          onNavigate={navigateTo}
          onSelectModule={(mod) => setExamModule(mod)}
        />

        <LegalModal
          isOpen={legalModal.isOpen}
          type={legalModal.type}
          onClose={() => setLegalModal({ isOpen: false, type: null })}
        />
      </div>
    </AuthProvider>
  </ThemeProvider>
);
}
