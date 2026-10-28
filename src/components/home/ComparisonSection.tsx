import React from 'react';
import { Check, X, MapPin, Laptop, Calendar, UserCheck, BarChart3, Clock, AlertCircle } from 'lucide-react';

interface ComparisonSectionProps {
  onBookOffline: () => void;
  onTryOnline: () => void;
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({
  onBookOffline,
  onTryOnline,
}) => {
  return (
    <section id="comparison" className="py-16 lg:py-24 bg-white dark:bg-[#1E0F36] border-y border-[#E5E1EB] dark:border-[#361F5B] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 lg:mb-16">
          <div className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
            Side-by-Side Comparison
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#211A2B] dark:text-[#F7F5FA] tracking-tight">
            Choose the Format that Fits Your IELTS Target
          </h2>
          <p className="text-sm sm:text-base text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
            Compare our in-center supervised mock exams with our flexible browser-based simulator. Both follow official computer-delivered IELTS specifications.
          </p>
        </div>

        {/* 2 Comparison Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Card 1: Offline Mock */}
          <div className="rounded-2xl border-2 border-[#35145A] dark:border-[#8E54DC] bg-[#F7F7FB] dark:bg-[#130922] p-8 flex flex-col justify-between relative shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#35145A] text-white dark:bg-[#8E54DC]">
                    Supervised Test Hall
                  </span>
                  <h3 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA] mt-2">
                    Offline Mock Exam
                  </h3>
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC]">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              <p className="text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                Ideal for candidates seeking genuine test-day acclimation. Candidates sit at dedicated testing stations under official test-center regulations and take their speaking test live.
              </p>

              {/* Status Note */}
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Currently active: Registration open for upcoming weekend session</span>
              </div>

              {/* Feature List */}
              <ul className="space-y-3.5 text-xs sm:text-sm text-[#211A2B] dark:text-[#F7F5FA] pt-2">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="block font-semibold">Scheduled in-person sessions</strong>
                    <span className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Fixed Saturday/Sunday morning slots with strict check-in protocol</span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="block font-semibold">Supervised invigilation</strong>
                    <span className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Certified invigilators maintain noise isolation and timed conditions</span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="block font-semibold">Live examiner Speaking interview</strong>
                    <span className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">11-14 minute one-on-one interview with recorded audio and written feedback</span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0 mt-0.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="block font-semibold">Paper diagnostic TRF certificate</strong>
                    <span className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Official-styled mock certificate with criteria breakdowns</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={onBookOffline}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] dark:hover:bg-[#7C42C4] rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Book Offline Seat
              </button>
            </div>
          </div>

          {/* Card 2: Online Mock */}
          <div className="rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] bg-[#F7F7FB] dark:bg-[#130922] p-8 flex flex-col justify-between relative shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC]">
                    Cloud Browser Practice
                  </span>
                  <h3 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA] mt-2">
                    Online Mock Exam
                  </h3>
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC]">
                  <Laptop className="w-5 h-5" />
                </div>
              </div>

              <p className="text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                Practice wherever and whenever you want. Perfect for targeted section drills, timed full mocks, and familiarizing yourself with the computer-delivered screen layout.
              </p>

              {/* Status Note - Honest Planned Capability */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Phase 1 UI active: Interactive simulator ready. Persistent account tracking coming in Phase 2.</span>
              </div>

              {/* Feature List */}
              <ul className="space-y-3.5 text-xs sm:text-sm text-[#211A2B] dark:text-[#F7F5FA] pt-2">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0 mt-0.5">
                    <Laptop className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="block font-semibold">24/7 on-demand web access</strong>
                    <span className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Launch computer tests on any modern laptop or desktop browser</span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="block font-semibold">Computer-delivered interface practice</strong>
                    <span className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Highlight text, take notes, and navigate with IELTS bottom question bar</span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0 mt-0.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="block font-semibold">Automated Listening & Reading grading</strong>
                    <span className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Instant score conversion with detailed question-by-question review</span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] shrink-0 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="block font-semibold">Progress and result history (Planned capability)</strong>
                    <span className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Cloud profile sync, historical trend charts, and exportable reports in next release</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={onTryOnline}
                className="w-full py-3 px-4 text-sm font-semibold text-[#35145A] dark:text-[#F7F5FA] bg-[#F0EAF8] hover:bg-[#E5DAF3] dark:bg-[#26133E] dark:hover:bg-[#351B5A] border border-[#E5E1EB] dark:border-[#361F5B] rounded-xl transition-colors cursor-pointer"
              >
                Explore Online Mock
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
