import React from 'react';
import { Mail, Phone, MapPin, Send, ExternalLink } from 'lucide-react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const { user, profile } = useAuth();
  const isStaff = Boolean(
    user && (
      profile?.role === 'admin' ||
      profile?.role === 'examiner'
    )
  );
  return (
    <footer className="border-t border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#35145A] dark:bg-[#8E54DC] flex items-center justify-center text-white font-extrabold text-sm tracking-wider">
                IZ
              </div>
              <span className="text-xl font-bold tracking-tight text-[#211A2B] dark:text-[#F7F5FA]">
                IELTS <span className="text-[#35145A] dark:text-[#8E54DC]">ZONE</span>
              </span>
            </div>
            <p className="text-sm text-[#716A7B] dark:text-[#ABA1BC] max-w-sm leading-relaxed">
              Professional computer-delivered and supervised in-person IELTS mock testing platform.
              Realistic exam atmosphere, rigorous examiner evaluation, and comprehensive score diagnostics.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#F7F5FA]">
                <span>Phase 1 UI Foundation</span>
                <span aria-hidden="true">·</span>
                <span>Active Preview</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-[#716A7B] dark:text-[#ABA1BC]">
              <li>
                <a href="#hero" className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#online-mock" className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors">
                  Online Mock (CD IELTS)
                </a>
              </li>
              <li>
                <a href="#offline-mock" className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors">
                  Offline Mock (Test Center)
                </a>
              </li>
              <li>
                <a href="#comparison" className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors">
                  Format Comparison
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors">
                  Key Advantages
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors">
                  Exam FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Planned Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
              Candidate Portal
            </h4>
            <ul className="space-y-2 text-sm text-[#716A7B] dark:text-[#ABA1BC]">
              <li>
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  Candidate Dashboard <ExternalLink className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/exam')}
                  className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  CD Exam Simulator <ExternalLink className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/results')}
                  className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  Diagnostic TRF Report <ExternalLink className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/bookings')}
                  className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  Offline Session Schedule <ExternalLink className="w-3 h-3 opacity-60" />
                </button>
              </li>
              {isStaff && (
                <li>
                  <button
                    onClick={() => onNavigate('/admin')}
                    className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors text-left flex items-center gap-1 cursor-pointer text-amber-700 dark:text-amber-400 font-medium"
                  >
                    Examiner Portal <ExternalLink className="w-3 h-3 opacity-60" />
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Contact Placeholders */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
              Contact & Center
            </h4>
            <div className="space-y-2.5 text-xs text-[#716A7B] dark:text-[#ABA1BC]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC] shrink-0 mt-0.5" />
                <span>
                  <strong className="block text-[#211A2B] dark:text-[#F7F5FA] font-medium">Head Examination Center</strong>
                  Chilanzar District, Bunyodkor Ave, 100084 (Placeholder Address)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC] shrink-0" />
                <span>+998 (71) 200-XX-XX (Placeholder)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC] shrink-0" />
                <span>info@ieltszone.mock (Placeholder)</span>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs">
                <Send className="w-3.5 h-3.5 text-[#35145A] dark:text-[#8E54DC]" />
                <span>Telegram: @ieltszone_mock_bot</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal and Disclaimer bottom strip */}
        <div className="mt-12 pt-8 border-t border-[#E5E1EB] dark:border-[#361F5B] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#716A7B] dark:text-[#ABA1BC]">
          <div>
            © {new Date().getFullYear()} IELTS ZONE Mock Testing Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={onOpenTerms}
              className="hover:text-[#35145A] dark:hover:text-[#F7F5FA] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span aria-hidden="true">·</span>
            <span>IELTS Academic & General Training Preparatory System</span>
          </div>
        </div>

        {/* Trademark Disclaimer */}
        <div className="mt-4 text-[11px] text-[#716A7B]/80 dark:text-[#ABA1BC]/70 leading-relaxed text-center md:text-left">
          Notice: IELTS is a registered trademark of University of Cambridge ESOL, the British Council, and IDP Education Australia.
          IELTS ZONE is an independent mock preparation center and is not formally affiliated with or endorsed by Cambridge Assessment English, the British Council, or IDP.
        </div>
      </div>
    </footer>
  );
};
