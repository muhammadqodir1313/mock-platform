import React from 'react';
import { Sun, Moon, Menu, UserCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  onOpenAuth,
  onOpenMobileMenu,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (currentRoute !== '/') {
      onNavigate('/');
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E1EB] dark:border-[#361F5B] bg-white/95 dark:bg-[#1E0F36]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element / mark) */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35145A] dark:focus-visible:ring-[#8E54DC] rounded-lg text-left cursor-pointer shrink-0"
          aria-label="IELTS ZONE Mock Testing Platform Home"
        >
          <div className="w-10 h-10 rounded-xl bg-[#35145A] dark:bg-[#8E54DC] flex items-center justify-center text-white shadow-sm font-extrabold text-sm tracking-wider">
            IZ
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#211A2B] dark:text-[#F7F5FA] leading-tight">
              IELTS <span className="text-[#35145A] dark:text-[#8E54DC]">ZONE</span>
            </span>
          </div>
        </button>

        {/* Zone 2: 4-5 Concise Single-Line Nav Links */}
        <nav
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#716A7B] dark:text-[#ABA1BC]"
          aria-label="Main Navigation"
        >
          <a
            href="#hero"
            onClick={(e) => handleNavClick('#hero', e)}
            className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Home
          </a>
          <a
            href="#online-mock"
            onClick={(e) => handleNavClick('#online-mock', e)}
            className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Online Mock
          </a>
          <a
            href="#offline-mock"
            onClick={(e) => handleNavClick('#offline-mock', e)}
            className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Offline Mock
          </a>
          <a
            href="#features"
            onClick={(e) => handleNavClick('#features', e)}
            className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Features
          </a>
          <a
            href="#faq"
            onClick={(e) => handleNavClick('#faq', e)}
            className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            FAQ
          </a>
        </nav>

        {/* Zone 3: Actions & Auth Entry Points */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Light/Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] dark:hover:text-white hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] border border-transparent hover:border-[#E5E1EB] dark:hover:border-[#361F5B] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35145A] cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="w-4.5 h-4.5 text-[#35145A]" />
            ) : (
              <Sun className="w-4.5 h-4.5 text-[#F7F5FA]" />
            )}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-[#F7F7FB] dark:bg-[#26133E] text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA] hover:border-[#35145A] transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="max-w-[120px] truncate">{profile?.displayName || user.displayName || 'Candidate'}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#35145A] dark:bg-[#8E54DC] text-white">
                  B{profile?.targetBand || '7.5'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-2.5 py-1.5 text-xs text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#35145A] dark:hover:text-[#8E54DC] transition-colors cursor-pointer"
              >
                Profile
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Auth Buttons */}
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-[#35145A] dark:text-[#F7F5FA] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] rounded-lg transition-colors whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35145A]"
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="hidden sm:inline-flex px-4.5 py-2 text-sm font-semibold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] dark:hover:bg-[#7C42C4] rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#35145A]"
              >
                Sign Up
              </button>
            </>
          )}

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open mobile navigation menu"
            className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35145A] cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};
