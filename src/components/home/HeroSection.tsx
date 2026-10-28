import React from 'react';
import { ArrowRight, MapPin, Laptop, Headphones, Clock, CheckCircle2, Award } from 'lucide-react';

interface HeroSectionProps {
  onBookOffline: () => void;
  onTryOnline: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onBookOffline,
  onTryOnline,
}) => {
  return (
    <section id="hero" className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-60 dark:opacity-20 blur-3xl -z-10"
        aria-hidden="true"
      >
        <div className="w-[600px] h-[300px] rounded-full bg-[#F0EAF8] dark:bg-[#35145A] mx-auto" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Headline & Subtitle */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-[#35145A] dark:text-[#8E54DC]">
            <span>Official Test Simulation</span>
            <span aria-hidden="true">·</span>
            <span>Computer-Delivered Standard</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#211A2B] dark:text-[#F7F5FA] leading-tight text-balance">
            Participate in the <span className="text-[#35145A] dark:text-[#8E54DC]">MOCK IELTS EXAM</span>
          </h1>

          <p className="text-base sm:text-lg text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed max-w-2xl mx-auto text-balance">
            Prepare for IELTS with computer-delivered mock tests, realistic exam experiences, detailed feedback, and progress tracking.
          </p>
        </div>

        {/* Two Prominent Action Cards: CD OFFLINE vs CD ONLINE */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* CARD 1: CD OFFLINE */}
          <div
            id="offline-mock"
            className="group relative bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-7 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-6">
              {/* Header with Icon and Label */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                    In-Person Test Center
                  </div>
                  <h2 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA] mt-1">
                    CD OFFLINE
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                Experience full exam pressure inside our specialized computer lab. Live speaking examiner interview, official-spec acoustic headphones, and strict proctoring recreate the real exam day.
              </p>

              {/* Feature Points */}
              <ul className="space-y-2.5 text-xs text-[#211A2B] dark:text-[#F7F5FA] pt-2 border-t border-[#E5E1EB]/60 dark:border-[#361F5B]/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC] shrink-0" />
                  <span>Scheduled weekly weekend test sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC] shrink-0" />
                  <span>Individual workstation with noise-canceling headphones</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC] shrink-0" />
                  <span>Face-to-face speaking test with qualified examiner</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={onBookOffline}
                className="w-full py-3 px-5 text-sm font-semibold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] dark:hover:bg-[#7C42C4] rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#35145A]"
              >
                <span>Book Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CARD 2: CD ONLINE */}
          <div
            id="online-mock"
            className="group relative bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-7 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-6">
              {/* Header with Icon and Label */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                    Browser Simulator
                  </div>
                  <h2 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA] mt-1">
                    CD ONLINE
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0">
                  <Laptop className="w-6 h-6" />
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                Take authentic computer-delivered IELTS practice anytime from your desktop. Authentic interface layout, real-time question navigation palette, and automated timer simulation.
              </p>

              {/* Feature Points */}
              <ul className="space-y-2.5 text-xs text-[#211A2B] dark:text-[#F7F5FA] pt-2 border-t border-[#E5E1EB]/60 dark:border-[#361F5B]/60">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC] shrink-0" />
                  <span>Immediate access anytime without travel</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC] shrink-0" />
                  <span>Official split-screen Reading & Listening layout</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC] shrink-0" />
                  <span>Automated raw score calculation and band estimation</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={onTryOnline}
                className="w-full py-3 px-5 text-sm font-semibold text-[#35145A] dark:text-[#F7F5FA] bg-[#F0EAF8] hover:bg-[#E5DAF3] dark:bg-[#26133E] dark:hover:bg-[#351B5A] border border-[#E5E1EB] dark:border-[#361F5B] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#35145A]"
              >
                <span>Try Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Proof / Trust Markers Strip */}
        <div className="mt-12 pt-8 border-t border-[#E5E1EB] dark:border-[#361F5B] max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-extrabold text-[#35145A] dark:text-[#8E54DC] font-mono tabular-nums">
              4 Modules
            </div>
            <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
              Listening, Reading, Writing, Speaking
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#35145A] dark:text-[#8E54DC] font-mono tabular-nums">
              40 Qs / 60m
            </div>
            <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
              Exact official timing & format
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#35145A] dark:text-[#8E54DC] font-mono tabular-nums">
              4 Criteria
            </div>
            <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
              Writing & Speaking Rubric evaluation
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#35145A] dark:text-[#8E54DC] font-mono tabular-nums">
              TRF Form
            </div>
            <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
              Band 0.0 - 9.0 diagnostic breakdown
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
