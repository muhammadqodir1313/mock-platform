import React, { useEffect } from 'react';
import { X, Play, BookOpen, Headphones, PenTool, ArrowRight, Clock, Award } from 'lucide-react';
import { AppRoute } from '../../types';

interface OnlineTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
  onSelectModule?: (mod: 'listening' | 'reading' | 'writing') => void;
}

export const OnlineTrialModal: React.FC<OnlineTrialModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectModule,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
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

  const handleLaunchSimulator = (mod: 'listening' | 'reading' | 'writing' = 'listening') => {
    onSelectModule?.(mod);
    onClose();
    onNavigate('/exam');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="online-trial-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] shadow-2xl overflow-hidden z-10 transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#35145A] dark:bg-[#8E54DC] flex items-center justify-center text-white font-bold text-xs">
              IZ
            </div>
            <div>
              <h3 id="online-trial-modal-title" className="text-base font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                CD ONLINE Mock Simulator
              </h3>
              <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                Computer-Delivered IELTS Practice Environment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-xs sm:text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
            Test your readiness with our live interactive computer-delivered IELTS simulator. Familiarize yourself with the split passage viewer, question response palette, and timer.
          </p>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
              Available Modules
            </div>

            {/* Reading Trial */}
            <div
              onClick={() => handleLaunchSimulator('reading')}
              className="p-4 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] hover:border-[#35145A] dark:hover:border-[#8E54DC] bg-[#F7F7FB] dark:bg-[#130922] transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-[#211A2B] dark:text-[#F7F5FA] group-hover:text-[#35145A] dark:group-hover:text-[#8E54DC] transition-colors">
                    Reading Passage 1 Simulator
                  </div>
                  <div className="text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
                    13 Questions · True/False/Not Given & Summary Completion
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#716A7B] group-hover:text-[#35145A] dark:group-hover:text-[#8E54DC] transition-transform group-hover:translate-x-1" />
            </div>

            {/* Listening Trial */}
            <div
              onClick={() => handleLaunchSimulator('listening')}
              className="p-4 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] hover:border-[#35145A] dark:hover:border-[#8E54DC] bg-[#F7F7FB] dark:bg-[#130922] transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-[#211A2B] dark:text-[#F7F5FA] group-hover:text-[#35145A] dark:group-hover:text-[#8E54DC] transition-colors">
                    Listening Section 1 Simulation
                  </div>
                  <div className="text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
                    10 Questions · Hotel Booking Form Filling & Audio Controller
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#716A7B] group-hover:text-[#35145A] dark:group-hover:text-[#8E54DC] transition-transform group-hover:translate-x-1" />
            </div>

            {/* Writing Trial */}
            <div
              onClick={() => handleLaunchSimulator('writing')}
              className="p-4 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] hover:border-[#35145A] dark:hover:border-[#8E54DC] bg-[#F7F7FB] dark:bg-[#130922] transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0">
                  <PenTool className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-[#211A2B] dark:text-[#F7F5FA] group-hover:text-[#35145A] dark:group-hover:text-[#8E54DC] transition-colors">
                    Writing Task 2 Editor
                  </div>
                  <div className="text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
                    Timed 40m Essay Box with Live Word Counter
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#716A7B] group-hover:text-[#35145A] dark:group-hover:text-[#8E54DC] transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleLaunchSimulator('listening')}
              className="w-full py-3 px-4 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] dark:hover:bg-[#7C42C4] rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Full CD Exam Simulator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
