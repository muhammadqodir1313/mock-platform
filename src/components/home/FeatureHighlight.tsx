import React, { useState } from 'react';
import { 
  Monitor, 
  Headphones, 
  Bell, 
  Zap, 
  CheckCircle, 
  Highlighter, 
  Volume2, 
  Smartphone, 
  FileCheck 
} from 'lucide-react';

type TabKey = 'exam-ui' | 'equipment' | 'notifications' | 'fast-results';

export const FeatureHighlight: React.FC<{ onLaunchSimulator?: () => void }> = ({ onLaunchSimulator }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('exam-ui');
  const [highlightedText, setHighlightedText] = useState(true);
  const [audioVolume, setAudioVolume] = useState(80);

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-[#1E0F36] border-y border-[#E5E1EB] dark:border-[#361F5B] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
            Platform Infrastructure
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#211A2B] dark:text-[#F7F5FA] tracking-tight">
            Engineered for Exam-Day Precision
          </h2>
          <p className="text-sm sm:text-base text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
            Experience our purpose-built testing environment designed to mirror the computer-delivered IELTS testing interface and workflows.
          </p>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('exam-ui')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'exam-ui'
                ? 'bg-[#35145A] text-white shadow-sm dark:bg-[#8E54DC]'
                : 'bg-[#F0EAF8] dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#E5DAF3] dark:hover:bg-[#351B5A]'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>CD Exam Environment</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'equipment'
                ? 'bg-[#35145A] text-white shadow-sm dark:bg-[#8E54DC]'
                : 'bg-[#F0EAF8] dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#E5DAF3] dark:hover:bg-[#351B5A]'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Modern Equipment</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[#35145A] text-white shadow-sm dark:bg-[#8E54DC]'
                : 'bg-[#F0EAF8] dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#E5DAF3] dark:hover:bg-[#351B5A]'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Smart Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fast-results')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'fast-results'
                ? 'bg-[#35145A] text-white shadow-sm dark:bg-[#8E54DC]'
                : 'bg-[#F0EAF8] dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#E5DAF3] dark:hover:bg-[#351B5A]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Faster Results</span>
          </button>
        </div>

        {/* Tab Content Display Area */}
        <div className="bg-[#F7F7FB] dark:bg-[#130922] rounded-3xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 sm:p-10 transition-colors">
          {/* TAB 1: Computer-Delivered Exam Environment */}
          {activeTab === 'exam-ui' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                  Official Screen Simulation
                </span>
                <h3 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                  Identical Computer-Delivered Exam Layout
                </h3>
                <p className="text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                  Avoid exam-day cognitive shock. Our testing interface includes the exact top navigation bar with remaining time clock, split reading passage view, highlight tools, and bottom question navigator palette.
                </p>

                <div className="space-y-2 pt-2 text-xs text-[#211A2B] dark:text-[#F7F5FA]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>Real-time word counter on Writing Task 1 & 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>Clickable question numbers with answered & review flags</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>Resizable text size options (Standard / Large / Extra Large)</span>
                  </div>
                </div>

                {onLaunchSimulator && (
                  <div className="pt-2">
                    <button
                      onClick={onLaunchSimulator}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#35145A] text-white hover:bg-[#481B7A] dark:bg-[#8E54DC] transition-colors cursor-pointer"
                    >
                      Open Live Exam Shell Simulator →
                    </button>
                  </div>
                )}
              </div>

              {/* Interactive Exam Mockup Visual */}
              <div className="lg:col-span-7 bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] overflow-hidden shadow-sm">
                {/* Mockup Top Bar */}
                <div className="bg-[#24113F] text-white px-4 py-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-300">IELTS CD SIMULATOR</span>
                    <span className="text-white/60">Candidate: DEMO-8041</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="bg-black/40 px-2 py-0.5 rounded text-amber-300">58:42 Remaining</span>
                    <button
                      type="button"
                      onClick={() => setHighlightedText(!highlightedText)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                        highlightedText ? 'bg-amber-400 text-black font-bold' : 'bg-white/20 text-white'
                      }`}
                      title="Toggle Highlight Mode"
                    >
                      <Highlighter className="w-3 h-3" />
                      {highlightedText ? 'Highlight On' : 'Highlight Off'}
                    </button>
                  </div>
                </div>

                {/* Split passage & questions */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs h-64 overflow-y-auto bg-[#FAFAFC] dark:bg-[#130922]/50">
                  {/* Left passage */}
                  <div className="p-3 bg-white dark:bg-[#1E0F36] rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] space-y-2">
                    <div className="font-bold text-[#35145A] dark:text-[#8E54DC] uppercase text-[11px]">
                      Reading Passage 1
                    </div>
                    <p className="text-[#211A2B] dark:text-[#F7F5FA] leading-relaxed">
                      The transition to renewable energy storage has highlighted the role of solid-state electrolyte batteries.{' '}
                      <span className={highlightedText ? 'bg-amber-200 dark:bg-amber-400/40 px-1 rounded' : ''}>
                        Unlike traditional lithium-ion configurations, non-flammable ceramic separators eliminate thermal runaway hazards
                      </span>{' '}
                      while increasing volumetric density by approximately 35 percent.
                    </p>
                  </div>

                  {/* Right questions */}
                  <div className="p-3 bg-white dark:bg-[#1E0F36] rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] space-y-3">
                    <div className="font-bold text-[#211A2B] dark:text-[#F7F5FA] text-[11px]">
                      Questions 1–3: Multiple Choice
                    </div>
                    <p className="text-[#716A7B] dark:text-[#ABA1BC]">
                      1. What is the primary safety advantage of ceramic separators?
                    </p>
                    <div className="space-y-1.5 pl-1">
                      <label className="flex items-center gap-2 cursor-pointer text-[#211A2B] dark:text-[#F7F5FA]">
                        <input type="radio" name="mock_q1" defaultChecked className="accent-[#35145A]" />
                        <span>Elimination of thermal runaway</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-[#716A7B] dark:text-[#ABA1BC]">
                        <input type="radio" name="mock_q1" className="accent-[#35145A]" />
                        <span>Lower manufacturing costs</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-[#716A7B] dark:text-[#ABA1BC]">
                        <input type="radio" name="mock_q1" className="accent-[#35145A]" />
                        <span>Smaller physical battery dimensions</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bottom Navigator Mock */}
                <div className="bg-[#E5E1EB]/60 dark:bg-[#26133E] px-4 py-2 border-t border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <span
                        key={num}
                        className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-mono ${
                          num === 1
                            ? 'bg-[#35145A] text-white font-bold'
                            : num <= 3
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-white dark:bg-[#1E0F36] text-[#716A7B] dark:text-[#ABA1BC]'
                        }`}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC] shrink-0 font-mono">
                    Part 1 of 3
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Modern Devices & Equipment */}
          {activeTab === 'equipment' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                  Test Center Standards
                </span>
                <h3 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                  Industrial-Grade Hardware for Zero Distractions
                </h3>
                <p className="text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                  Poor headphones or sticky keyboards can cost you valuable band points. Our test center stations are calibrated with certified hardware.
                </p>

                <div className="space-y-2 pt-2 text-xs text-[#211A2B] dark:text-[#F7F5FA]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>24-inch FHD displays with eye-saver anti-glare filters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>Closed-back monitoring headphones with independent volume controls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>Dampened silent keyboards minimizing typing noise during Writing</span>
                  </div>
                </div>
              </div>

              {/* Equipment Control Visual */}
              <div className="lg:col-span-7 bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E1EB] dark:border-[#361F5B]">
                  <div className="flex items-center gap-3">
                    <Headphones className="w-6 h-6 text-[#35145A] dark:text-[#8E54DC]" />
                    <div>
                      <h4 className="font-bold text-sm text-[#211A2B] dark:text-[#F7F5FA]">
                        Audio Hardware Calibration Test
                      </h4>
                      <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                        Audio Check Simulation for Section 1 Listening
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    CALIBRATED
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                    <span className="flex items-center gap-1.5 font-medium text-[#211A2B] dark:text-[#F7F5FA]">
                      <Volume2 className="w-4 h-4" /> Volume Level
                    </span>
                    <span className="font-mono font-bold">{audioVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(Number(e.target.value))}
                    className="w-full accent-[#35145A] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B]">
                    <div className="font-bold text-[#211A2B] dark:text-[#F7F5FA]">Left Channel</div>
                    <div className="text-[#716A7B] dark:text-[#ABA1BC] mt-1">Status: OK · 0.0dB loss</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B]">
                    <div className="font-bold text-[#211A2B] dark:text-[#F7F5FA]">Right Channel</div>
                    <div className="text-[#716A7B] dark:text-[#ABA1BC] mt-1">Status: OK · 0.0dB loss</div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const a = new Audio('/audio/sound_check.wav');
                        a.volume = audioVolume / 100;
                        a.play().catch(() => {});
                      } catch {
                        // ignore
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-[#35145A] dark:border-[#8E54DC] text-[#35145A] dark:text-[#8E54DC] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Play Calibrated Test Tone</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === 'notifications' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                  Automated Candidate Comms
                </span>
                <h3 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                  Never Miss Your Speaking Slot or Results
                </h3>
                <p className="text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                  Timely SMS and Telegram notifications keep you updated through every stage: booking verification, exact Speaking interview schedule, and instantaneous result notifications.
                </p>

                <div className="space-y-2 pt-2 text-xs text-[#211A2B] dark:text-[#F7F5FA]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>Booking confirmation with room and workstation number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>1-hour reminder with candidate identification checklist</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>Instant Telegram dispatch when examiner marks are filed</span>
                  </div>
                </div>
              </div>

              {/* Notification Simulator Visual */}
              <div className="lg:col-span-7 space-y-3">
                <div className="bg-white dark:bg-[#1E0F36] rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] p-4 flex items-start gap-3 shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#211A2B] dark:text-[#F7F5FA]">IELTS ZONE SMS Gateway</span>
                      <span className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">Just now</span>
                    </div>
                    <p className="text-[#716A7B] dark:text-[#ABA1BC] mt-1">
                      Dear Candidate, your offline CD IELTS Mock is confirmed for Sunday, 09:00 AM. Workstation #14. Speaking interview scheduled for 13:40.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E0F36] rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] p-4 flex items-start gap-3 shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#211A2B] dark:text-[#F7F5FA]">Telegram Bot Update</span>
                      <span className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">Yesterday</span>
                    </div>
                    <p className="text-[#716A7B] dark:text-[#ABA1BC] mt-1">
                      🎉 Your Mock TRF results are published! Overall Band: 7.5. Click here to download your complete 4-criterion diagnostic breakdown report.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Faster Results Delivery */}
          {activeTab === 'fast-results' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                  Diagnostic Turnaround
                </span>
                <h3 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                  Results & Band Feedback Delivered within 48 Hours
                </h3>
                <p className="text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                  Real IELTS takes 3 to 5 days. We deliver your full diagnostic score report within 48 hours so you can pinpoint weaknesses and adjust your revision plan immediately.
                </p>

                <div className="space-y-2 pt-2 text-xs text-[#211A2B] dark:text-[#F7F5FA]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>Instant automated scores for Listening and Reading</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>Double-blind examiner review for Writing Task 1 & 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
                    <span>Comprehensive PDF download with examiner commentary</span>
                  </div>
                </div>
              </div>

              {/* Turnaround Timeline Visual */}
              <div className="lg:col-span-7 bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 shadow-sm space-y-4">
                <div className="text-xs font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                  Turnaround Pipeline
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F7FB] dark:bg-[#130922]">
                    <div className="w-8 h-8 rounded-full bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-xs font-bold text-[#35145A] dark:text-[#8E54DC] shrink-0">
                      0h
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-[#211A2B] dark:text-[#F7F5FA]">Exam Completion</div>
                      <div className="text-[#716A7B] dark:text-[#ABA1BC]">L & R raw answers calculated instantaneously</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F7FB] dark:bg-[#130922]">
                    <div className="w-8 h-8 rounded-full bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-xs font-bold text-[#35145A] dark:text-[#8E54DC] shrink-0">
                      24h
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-[#211A2B] dark:text-[#F7F5FA]">Writing & Speaking Moderation</div>
                      <div className="text-[#716A7B] dark:text-[#ABA1BC]">Submissions audited according to Cambridge band criteria</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-emerald-900 dark:text-emerald-300">TRF Diagnostic Released</div>
                      <div className="text-emerald-700 dark:text-emerald-400">Digital certificate and personalized roadmap accessible in dashboard</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
