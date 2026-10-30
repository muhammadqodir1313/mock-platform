import React, { useEffect, useRef } from 'react';
import { X, Sun, Moon, ArrowRight, BookOpen, Monitor, ShieldCheck, HelpCircle, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  currentRoute,
  onNavigate,
  onOpenAuth,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);

  const isStaff = Boolean(
    user && (
      profile?.role === 'admin' ||
      profile?.role === 'examiner'
    )
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLinkClick = (hash: string) => {
    onClose();
    if (currentRoute !== '/') {
      onNavigate('/');
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex justify-end" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-xs bg-white dark:bg-[#1E0F36] h-full shadow-2xl flex flex-col z-10 border-l border-[#E5E1EB] dark:border-[#361F5B] transform transition-transform ease-out duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#35145A] dark:bg-[#8E54DC] flex items-center justify-center text-white font-bold text-xs">
              IZ
            </div>
            <span className="font-bold text-base text-[#211A2B] dark:text-[#F7F5FA]">
              IELTS <span className="text-[#35145A] dark:text-[#8E54DC]">ZONE</span>
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#716A7B] dark:text-[#ABA1BC] px-3 py-1">
            Navigation
          </div>
          <button
            onClick={() => handleLinkClick('#hero')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors text-left cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
            Home
          </button>
          <button
            onClick={() => handleLinkClick('#online-mock')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors text-left cursor-pointer"
          >
            <Monitor className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
            Online Mock (CD IELTS)
          </button>
          <button
            onClick={() => handleLinkClick('#offline-mock')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors text-left cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
            Offline Mock (Test Center)
          </button>
          <button
            onClick={() => handleLinkClick('#features')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors text-left cursor-pointer"
          >
            <span className="w-4 h-4 flex items-center justify-center font-bold text-xs text-[#35145A] dark:text-[#8E54DC]">★</span>
            Features & Highlights
          </button>
          <button
            onClick={() => handleLinkClick('#faq')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors text-left cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
            Frequently Asked Questions
          </button>

          <div className="pt-4 border-t border-[#E5E1EB] dark:border-[#361F5B]">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#716A7B] dark:text-[#ABA1BC] px-3 py-1 mb-2">
              Future Modules
            </div>
            <div className="grid grid-cols-2 gap-2 px-1">
              <button
                onClick={() => {
                  onClose();
                  onNavigate('/dashboard');
                }}
                className="text-xs text-left px-2.5 py-1.5 rounded bg-[#F7F7FB] dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA] hover:text-[#35145A] transition-colors"
              >
                Dashboard →
              </button>
              <button
                onClick={() => {
                  onClose();
                  onNavigate('/exam');
                }}
                className="text-xs text-left px-2.5 py-1.5 rounded bg-[#F7F7FB] dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA] hover:text-[#35145A] transition-colors"
              >
                Exam UI →
              </button>
              <button
                onClick={() => {
                  onClose();
                  onNavigate('/results');
                }}
                className="text-xs text-left px-2.5 py-1.5 rounded bg-[#F7F7FB] dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA] hover:text-[#35145A] transition-colors"
              >
                Results TRF →
              </button>
              {isStaff && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('/admin');
                  }}
                  className="text-xs text-left px-2.5 py-1.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors"
                >
                  Examiner Admin →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-5 border-t border-[#E5E1EB] dark:border-[#361F5B] space-y-3 bg-[#F7F7FB]/50 dark:bg-[#130922]/50">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-[#716A7B] dark:text-[#ABA1BC]">Theme Mode</span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-white dark:bg-[#26133E] border border-[#E5E1EB] dark:border-[#361F5B] text-[#211A2B] dark:text-[#F7F5FA]"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#35145A]" /> Dark
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Light
                </>
              )}
            </button>
          </div>

          {user ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#26133E] border border-[#E5E1EB] dark:border-[#361F5B] text-xs">
                <div className="font-semibold text-[#211A2B] dark:text-[#F7F5FA] truncate">
                  {profile?.displayName || user.displayName || 'Candidate'}
                </div>
                <div className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC] truncate">{user.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('/dashboard');
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] text-white transition-colors cursor-pointer text-center"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    onClose();
                    signOut();
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#26133E] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('login');
                }}
                className="w-full py-2.5 px-3 text-sm font-semibold rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#F0EAF8] dark:hover:bg-[#35145A] transition-colors cursor-pointer text-center"
              >
                Login
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('signup');
                }}
                className="w-full py-2.5 px-3 text-sm font-semibold rounded-lg bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] text-white transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
              >
                Sign Up <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
