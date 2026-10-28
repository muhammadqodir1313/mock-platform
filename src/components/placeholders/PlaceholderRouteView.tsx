import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Highlighter, 
  Award, 
  Calendar, 
  User, 
  CheckCircle2, 
  FileText, 
  Layers, 
  ShieldAlert, 
  Send,
  HelpCircle,
  ExternalLink,
  Lock,
  Headphones,
  BookOpen,
  PenTool,
  AlertCircle,
  FolderOpen,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getCandidateBookings, saveTestAttempt, BookingRecord } from '../../lib/firestoreService';
import { ListeningModule, ListeningQuestionAnswer } from '../exam/ListeningModule';
import { ResourceManager } from '../admin/ResourceManager';

export type ExamModuleType = 'listening' | 'reading' | 'writing';

interface PlaceholderRouteViewProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenBookingModal: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  examModule?: ExamModuleType;
  onSelectExamModule?: (mod: ExamModuleType) => void;
}

export const PlaceholderRouteView: React.FC<PlaceholderRouteViewProps> = ({
  route,
  onNavigate,
  onOpenBookingModal,
  onOpenAuth,
  examModule: propExamModule = 'listening',
  onSelectExamModule,
}) => {
  const { user, profile, updateTargetBand } = useAuth();

  // Active exam module (listening / reading / writing)
  const [activeModule, setActiveModule] = useState<ExamModuleType>(propExamModule);
  // Reading module prerequisite lock: Listening audio must complete first
  const [isListeningAudioComplete, setIsListeningAudioComplete] = useState<boolean>(false);
  const [lockedModuleNotice, setLockedModuleNotice] = useState<string | null>(null);

  useEffect(() => {
    if (propExamModule) {
      if (propExamModule === 'reading' && !isListeningAudioComplete) {
        setLockedModuleNotice('Reading module is locked. Under official IELTS CD examination protocol, the Reading section only unlocks once the Listening audio recording has completed playing.');
        setActiveModule('listening');
      } else {
        setActiveModule(propExamModule);
      }
    }
  }, [propExamModule, isListeningAudioComplete]);

  const handleSwitchModule = (mod: ExamModuleType) => {
    if (mod === 'reading' && !isListeningAudioComplete) {
      setLockedModuleNotice('Reading module is locked. Under official IELTS CD examination protocol, the Reading section only unlocks once the Listening audio recording has completed playing.');
      return;
    }
    setLockedModuleNotice(null);
    setActiveModule(mod);
    onSelectExamModule?.(mod);
  };

  // Listening state
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});

  // Writing state
  const [writingEssay, setWritingEssay] = useState('');
  const [writingSubmitted, setWritingSubmitted] = useState(false);

  // Reading simulator local interactive state
  const [examQ1, setExamQ1] = useState('TRUE');
  const [examQ2, setExamQ2] = useState('');
  const [examHighlighted, setExamHighlighted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [userBookings, setUserBookings] = useState<BookingRecord[]>([]);
  const [adminTab, setAdminTab] = useState<'resources' | 'grading'>('resources');

  // Exam session resolution state (Phase 2C-2)
  const [examSessionDate, setExamSessionDate] = useState<string>('2026-10-17');
  const [isDevSampleMode, setIsDevSampleMode] = useState<boolean>(false);
  const [listeningTimerSeconds, setListeningTimerSeconds] = useState<number>(30 * 60);

  // Active exam countdown timer for Listening
  useEffect(() => {
    if (route !== '/exam' || activeModule !== 'listening') return;
    const interval = window.setInterval(() => {
      setListeningTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [route, activeModule]);

  // Load candidate bookings from Firestore & initialize active session
  React.useEffect(() => {
    if (user && (route === '/dashboard' || route === '/bookings' || route === '/exam')) {
      getCandidateBookings()
        .then((items) => {
          setUserBookings(items);
          if (items.length > 0 && items[0].preferredDate) {
            setExamSessionDate(items[0].preferredDate);
          }
        })
        .catch((err) => console.error('Failed to load candidate bookings:', err));
    }
  }, [user, route]);

  const handleExamSubmit = async () => {
    setExamSubmitted(true);
    if (user) {
      try {
        await saveTestAttempt({
          module: 'Academic',
          testType: 'online',
          status: 'completed',
          answers: { q1: examQ1, q2: examQ2 },
          rawReadingScore: examQ1 === 'TRUE' ? 1 : 0,
          overallBand: examQ1 === 'TRUE' ? 7.5 : 6.5,
          completedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error recording attempt to Firestore:', err);
      }
    }
  };

  // Return to landing page
  const handleBack = () => {
    onNavigate('/');
  };

  // 1. CD EXAM SIMULATOR (/exam)
  if (route === '/exam') {
    const listeningAnsweredCount = Object.values(listeningAnswers).filter((v) => typeof v === 'string' && v.trim().length > 0).length;

    const handleWritingSubmit = async () => {
      setWritingSubmitted(true);
      if (user) {
        try {
          const wordCount = writingEssay.trim() ? writingEssay.trim().split(/\s+/).length : 0;
          await saveTestAttempt({
            module: 'Academic',
            testType: 'online',
            status: 'completed',
            answers: { writingTask2: writingEssay },
            overallBand: wordCount >= 250 ? 7.0 : 6.0,
            completedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error saving writing attempt:', err);
        }
      }
    };

    return (
      <div className="min-h-screen bg-[#F0EAF8]/40 dark:bg-[#130922] flex flex-col">
        {/* Top IELTS Exam Navigation Header */}
        <header className="bg-[#24113F] text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#35145A]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-white/70 hover:text-white flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Landing Page
            </button>
            <span className="hidden sm:inline-block text-xs font-mono text-white/50">|</span>
            <span className="text-xs font-bold text-amber-300 font-mono tracking-wide hidden md:inline">
              IELTS CD SIMULATOR · OFFICIAL ENVIRONMENT
            </span>
          </div>

          {/* Module Selector Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => handleSwitchModule('listening')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeModule === 'listening'
                  ? 'bg-[#8E54DC] text-white shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Listening (Sec 1)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchModule('reading')}
              title={
                !isListeningAudioComplete
                  ? 'Reading locked: Listening audio playback must complete first'
                  : 'Switch to Reading Passage 1'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeModule === 'reading'
                  ? 'bg-[#8E54DC] text-white shadow-sm'
                  : !isListeningAudioComplete
                  ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {!isListeningAudioComplete ? (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <BookOpen className="w-3.5 h-3.5" />
              )}
              <span>Reading (Passage 1)</span>
              {!isListeningAudioComplete && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-normal">
                  Locked
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchModule('writing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeModule === 'writing'
                  ? 'bg-[#8E54DC] text-white shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Writing (Task 2)</span>
            </button>
          </div>

          {/* Timer & Tool Bar */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-md text-amber-300 border border-amber-300/30">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {activeModule === 'listening'
                  ? `${Math.floor(listeningTimerSeconds / 60).toString().padStart(2, '0')}:${(listeningTimerSeconds % 60).toString().padStart(2, '0')} Remaining`
                  : activeModule === 'writing'
                  ? '40:00 Remaining'
                  : '58:14 Remaining'}
              </span>
            </div>
            {activeModule === 'reading' && (
              <button
                type="button"
                onClick={() => setExamHighlighted(!examHighlighted)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md cursor-pointer text-xs font-medium transition-colors ${
                  examHighlighted ? 'bg-amber-400 text-black font-bold' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>{examHighlighted ? 'Highlight Active' : 'Highlight Tool'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Candidate Active Session & Audio Resolution Mode Controller */}
        <div className="bg-[#1A0B2E] border-b border-[#35145A] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#ABA1BC] font-mono text-[11px] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Exam Session:</span>
            </span>
            <select
              value={examSessionDate}
              onChange={(e) => {
                setExamSessionDate(e.target.value);
                setIsListeningAudioComplete(false);
              }}
              aria-label="Select active examination session date"
              className="bg-[#26133E] text-amber-300 border border-[#481B7A] rounded-lg px-2.5 py-1 text-xs font-mono focus:ring-1 focus:ring-purple-400 cursor-pointer"
            >
              {userBookings
                .filter((b) => b.preferredDate && !['2026-10-17', '2026-10-18', '2026-10-24', '2026-11-15'].includes(b.preferredDate))
                .map((b) => (
                  <option key={b.id || b.preferredDate} value={b.preferredDate}>
                    {b.preferredDate} · {b.module} ({b.referenceCode || 'Your Booking'})
                  </option>
                ))}
              <option value="2026-10-17">2026-10-17 · Official Academic Session (Assigned Pack 1)</option>
              <option value="2026-10-18">2026-10-18 · Official Academic Session (Assigned Pack 1)</option>
              <option value="2026-10-24">2026-10-24 · Official Academic Session (Assigned Pack 1)</option>
              <option value="2026-11-15">2026-11-15 · Unassigned Session (Error State Verification)</option>
              <option value="custom_unassigned">Custom Unassigned Date (Missing Audio Test)</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[#ABA1BC] text-[11px] hidden sm:inline">Audio Resolution Mode:</span>
            <button
              type="button"
              onClick={() => {
                setIsDevSampleMode(!isDevSampleMode);
                setIsListeningAudioComplete(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isDevSampleMode
                  ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200'
                  : 'bg-purple-950/60 border-purple-500/40 text-purple-200'
              }`}
              title="Switch between Official Exam Strict Resolution and Explicit Dev/Test Sample Mode"
            >
              {isDevSampleMode ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dev / Test Sample Mode (Local Asset Enabled)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Official Exam Mode (Strict Assigned Audio Only)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reading Unlocked Confirmation Notice */}
        {isListeningAudioComplete && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-4 py-2 text-xs text-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Listening Audio Completed:</strong> Reading Section is now officially unlocked under Computer-Delivered protocol.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSwitchModule('reading')}
              className="text-emerald-300 hover:text-white font-bold underline cursor-pointer"
            >
              Proceed to Reading Passage 1 →
            </button>
          </div>
        )}

        {/* Locked Module Alert Notification */}
        {lockedModuleNotice && (
          <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{lockedModuleNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setLockedModuleNotice(null)}
              className="text-amber-300 hover:text-white text-xs underline font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Phase Protocol Banner */}
        <div className="bg-[#F0EAF8] dark:bg-[#26133E] border-b border-[#E5E1EB] dark:border-[#361F5B] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-[#35145A] dark:text-[#F7F5FA]">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC]" />
            <strong>Official Computer-Delivered Standard:</strong>
            {activeModule === 'listening'
              ? ' Listening section audio plays once only with strict single-play protection.'
              : activeModule === 'writing'
              ? ' Writing Task 2 essay editor with real-time word counter.'
              : ' Reading Passage 1 split view with passage on left and questions on right.'}
          </span>
          <span className="text-[11px] font-mono text-[#716A7B] dark:text-[#ABA1BC]">
            Module: {activeModule.toUpperCase()} · Live Candidate Session
          </span>
        </div>

        {/* Workspace Container */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 overflow-y-auto">
          {/* MODULE A: LISTENING (Phase 2C Implementation) */}
          <div className={activeModule === 'listening' ? 'block' : 'hidden'}>
            <ListeningModule
              initialAnswers={listeningAnswers as unknown as Partial<ListeningQuestionAnswer>}
              sessionDateOrId={examSessionDate}
              allowDevSampleFallback={isDevSampleMode}
              onNavigateToResults={() => onNavigate('/results')}
              onAnswerChange={(ans) => setListeningAnswers(ans as unknown as Record<string, string>)}
              onAudioComplete={(completed) => {
                setIsListeningAudioComplete(completed);
                if (completed) {
                  setLockedModuleNotice(null);
                }
              }}
            />
          </div>

          {/* MODULE B: READING (Existing Passage 1) */}
          <div className={activeModule === 'reading' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left Column: Passage */}
              <div className="bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 shadow-sm overflow-y-auto max-h-[calc(100vh-230px)] space-y-4">
                <div className="border-b border-[#E5E1EB] dark:border-[#361F5B] pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                    Reading Passage 1
                  </span>
                  <h2 className="text-lg font-bold text-[#211A2B] dark:text-[#F7F5FA] mt-1">
                    The Origins of Agricultural Irrigation in Ancient Mesopotamia
                  </h2>
                </div>

                <div className="text-xs sm:text-sm text-[#211A2B] dark:text-[#F7F5FA] leading-relaxed space-y-3">
                  <p>
                    <strong>Paragraph A.</strong> The alluvial plains between the Tigris and Euphrates rivers offered extraordinary soil fertility but erratic seasonal rainfall. Spring floods arrived abruptly between April and May, often inundating crops immediately prior to harvesting, followed by months of parching summer heat.
                  </p>
                  <p className={examHighlighted ? 'bg-amber-100 dark:bg-amber-500/20 p-1.5 rounded border border-amber-300 dark:border-amber-600' : ''}>
                    <strong>Paragraph B.</strong> To survive these volatile conditions, early Ubaid settlers developed gravity-fed canal systems around 5500 BCE. By cutting feeder channels perpendicular to river courses and constructing earthen levees, farmers could direct trapped floodwaters onto adjacent fields throughout the critical seed germinating period.
                  </p>
                  <p>
                    <strong>Paragraph C.</strong> Over multiple centuries, this coordinated hydrological infrastructure necessitated complex civic administration. Scribes recorded water allocation rosters on cuneiform clay tablets, marking one of the earliest documented connections between large-scale engineering and bureaucratic governance.
                  </p>
                </div>
              </div>

              {/* Right Column: Questions */}
              <div className="bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 shadow-sm overflow-y-auto max-h-[calc(100vh-230px)] space-y-5">
                <div className="border-b border-[#E5E1EB] dark:border-[#361F5B] pb-3">
                  <h3 className="text-sm font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                    Questions 1–3: True / False / Not Given
                  </h3>
                  <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
                    Do the following statements agree with the information given in Reading Passage 1?
                  </p>
                </div>

                {/* Q1 */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B]">
                  <div className="text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                    1. Spring floods between the Tigris and Euphrates frequently destroyed crops right before harvest time.
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs pt-1">
                    {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="q1"
                          value={opt}
                          checked={examQ1 === opt}
                          onChange={() => setExamQ1(opt)}
                          className="accent-[#35145A]"
                        />
                        <span className="font-mono text-xs">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Q2 */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B]">
                  <div className="text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                    2. Summary Completion: Earthen levees were engineered to store floodwaters for the ________ period.
                  </div>
                  <input
                    type="text"
                    value={examQ2}
                    onChange={(e) => setExamQ2(e.target.value)}
                    placeholder="Type 1 or 2 words from text (e.g. seed germinating)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-2 focus:ring-[#35145A]"
                  />
                </div>

                {examSubmitted ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Answers Submitted!
                    </div>
                    <p>
                      Q1 Result: <strong>{examQ1 === 'TRUE' ? 'Correct (TRUE)' : 'Incorrect'}</strong> · Q2: Recorded as &quot;{examQ2 || '(blank)'}&quot;.
                    </p>
                    <button
                      onClick={() => onNavigate('/results')}
                      className="font-bold underline text-[#35145A] dark:text-[#8E54DC] block mt-1"
                    >
                      View Sample TRF Diagnostic Report →
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleExamSubmit}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    Submit Section 1 for Diagnostic Scoring
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MODULE C: WRITING (Timed Task 2 Simulator) */}
          <div className={activeModule === 'writing' ? 'block' : 'hidden'}>
            <div className="bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 shadow-sm space-y-6">
              <div className="border-b border-[#E5E1EB] dark:border-[#361F5B] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                    IELTS Academic & General Writing · Task 2
                  </div>
                  <h2 className="text-lg font-bold text-[#211A2B] dark:text-[#F7F5FA] mt-1">
                    Essay Prompt: Youth Community Service
                  </h2>
                </div>
                <div className="text-xs font-mono text-[#716A7B] dark:text-[#ABA1BC]">
                  Suggested time: 40 minutes · Minimum 250 words
                </div>
              </div>

              {/* Prompt box */}
              <div className="p-4 rounded-xl bg-[#F0EAF8] dark:bg-[#26133E] text-xs text-[#211A2B] dark:text-[#F7F5FA] leading-relaxed border border-[#E5E1EB] dark:border-[#361F5B]">
                <p className="font-semibold mb-2">You should spend about 40 minutes on this task:</p>
                <p className="italic">
                  &quot;Some people believe that unpaid community service should be a compulsory part of high school programmes (for example, working for a charity, improving the neighborhood, or teaching sports to younger children). To what extent do you agree or disagree?&quot;
                </p>
                <p className="mt-2 text-[#716A7B] dark:text-[#ABA1BC]">
                  Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.
                </p>
              </div>

              {/* Live Word Count & Essay Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                    Candidate Essay Response:
                  </span>
                  <div className="font-mono flex items-center gap-2">
                    <span className="text-[#716A7B] dark:text-[#ABA1BC]">Word Count:</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      writingEssay.trim().split(/\s+/).filter(Boolean).length >= 250
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {writingEssay.trim() ? writingEssay.trim().split(/\s+/).filter(Boolean).length : 0} / 250 words
                    </span>
                  </div>
                </div>

                <textarea
                  rows={14}
                  value={writingEssay}
                  onChange={(e) => setWritingEssay(e.target.value)}
                  disabled={writingSubmitted}
                  placeholder="Type your essay response here... (Spellcheck and auto-correct are intentionally disabled as per official test rules)"
                  spellCheck={false}
                  className="w-full p-4 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-[#F7F7FB] dark:bg-[#130922] text-[#211A2B] dark:text-[#F7F5FA] text-xs leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-[#35145A] disabled:opacity-75"
                />
              </div>

              {writingSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Writing Task 2 Submitted!
                  </div>
                  <p>
                    Essay saved to Firebase candidate attempts history. Word count: {writingEssay.trim().split(/\s+/).filter(Boolean).length} words.
                  </p>
                  <button
                    onClick={() => onNavigate('/results')}
                    className="font-bold underline text-[#35145A] dark:text-[#8E54DC] block mt-1"
                  >
                    View Diagnostic Feedback & Examiner Rubrics →
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleWritingSubmit}
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Submit Writing Task 2 for Examiner Grading
                </button>
              )}
            </div>
          </div>
        </div>

        {/* IELTS Bottom Question Navigator */}
        <footer className="bg-white dark:bg-[#1E0F36] border-t border-[#E5E1EB] dark:border-[#361F5B] px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-xl">
            <span className="font-bold text-[#716A7B] dark:text-[#ABA1BC] mr-2">
              {activeModule === 'listening' ? 'Listening Questions:' : activeModule === 'writing' ? 'Writing Tasks:' : 'Reading Questions:'}
            </span>

            {activeModule === 'listening' && (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isAnswered = !!listeningAnswers[`q${num}`];
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`listening-q-${num}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.focus();
                      }
                    }}
                    title={`Jump to Question ${num}`}
                    className={`w-7 h-7 rounded text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-colors ${
                      isAnswered
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-[#F0EAF8] dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#E5DAF3]'
                    }`}
                  >
                    {num}
                  </button>
                );
              })
            )}

            {activeModule === 'reading' && (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`reading-q-${num}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.focus();
                    }
                  }}
                  title={`Jump to Reading Question ${num}`}
                  className={`w-7 h-7 rounded text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-colors ${
                    num === 1
                      ? 'bg-[#35145A] text-white dark:bg-[#8E54DC]'
                      : num === 2 && examQ2
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-[#F0EAF8] dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#E5DAF3]'
                  }`}
                >
                  {num}
                </button>
              ))
            )}

            {activeModule === 'writing' && (
              ['Task 1 (Report)', 'Task 2 (Essay)'].map((task, idx) => (
                <button
                  key={task}
                  type="button"
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                    idx === 1
                      ? 'bg-[#35145A] text-white dark:bg-[#8E54DC]'
                      : 'bg-[#F0EAF8] dark:bg-[#26133E] text-[#211A2B] dark:text-[#F7F5FA]'
                  }`}
                >
                  {task}
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#716A7B] dark:text-[#ABA1BC] font-mono text-[11px] hidden sm:inline">
              {activeModule === 'listening'
                ? `Review Status: ${listeningAnsweredCount}/10 answered`
                : activeModule === 'writing'
                ? `Writing Status: ${writingEssay.trim().split(/\s+/).filter(Boolean).length} words`
                : 'Review Status: 2/13 answered'}
            </span>
            <button
              onClick={handleBack}
              className="px-3 py-1.5 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] text-xs font-medium hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors cursor-pointer"
            >
              Exit Simulator
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // 2. CANDIDATE DASHBOARD (/dashboard)
  if (route === '/dashboard') {
    if (!user) {
      return (
        <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#130922] py-16 px-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-8 text-center space-y-6 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC] mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                Candidate Portal Sign-In Required
              </h2>
              <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                Your candidate dashboard, mock test history, and diagnostic reports require an active session. Please log in with your email and password or register to view your account.
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth?.('login')}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Sign In to Candidate Account
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth?.('signup')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-[#35145A] dark:text-[#F7F5FA] bg-[#F0EAF8] dark:bg-[#26133E] rounded-xl transition-colors cursor-pointer"
              >
                Create New Candidate Account
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2 text-xs text-[#716A7B] dark:text-[#ABA1BC] hover:underline cursor-pointer"
              >
                ← Return to Home Landing Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#130922] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E0F36] p-6 rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B]">
            <div>
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#35145A] mb-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
              <h1 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                Candidate Portal Preview
              </h1>
              <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                Route: <code className="font-mono">/dashboard</code> · Planned Phase 2 User Profile & Historical Analytics Shell
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('/exam')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer"
              >
                Open CD Exam Simulator
              </button>
            </div>
          </div>

          {/* Live metrics cockpit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1E0F36] p-5 rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B]">
              <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Candidate Account</div>
              <div className="text-base font-bold text-[#211A2B] dark:text-[#F7F5FA] mt-1 truncate">
                {profile?.displayName || user?.displayName || 'Muhammadqodir Abdullajonov'}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>{user ? 'Firebase Active' : 'Prototype Session'}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E0F36] p-5 rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B]">
              <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Target Overall Band</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-2xl font-extrabold text-[#35145A] dark:text-[#8E54DC] font-mono">
                  {profile?.targetBand || '7.5'}
                </div>
                {user && (
                  <select
                    value={profile?.targetBand || '7.5'}
                    onChange={(e) => updateTargetBand(e.target.value)}
                    className="text-xs px-2 py-1 rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC] font-bold border border-[#E5E1EB] dark:border-[#361F5B] cursor-pointer"
                    title="Change target band in Firestore"
                  >
                    <option value="6.5">6.5</option>
                    <option value="7.0">7.0</option>
                    <option value="7.5">7.5</option>
                    <option value="8.0">8.0</option>
                    <option value="8.5">8.5</option>
                  </select>
                )}
              </div>
              <div className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC] mt-1">Academic Target (Firestore synced)</div>
            </div>

            <div className="bg-white dark:bg-[#1E0F36] p-5 rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B]">
              <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Offline Reserved Seats</div>
              <div className="text-base font-bold text-[#211A2B] dark:text-[#F7F5FA] mt-1">
                {userBookings.length > 0 ? `${userBookings.length} Active Booking` : 'Sunday, 09:00 AM'}
              </div>
              <div className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC] mt-1 truncate">
                {userBookings.length > 0 ? userBookings[0].preferredDate.split(' (')[0] : 'Workstation #14 (Reserved)'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E0F36] p-5 rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B]">
              <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">Cloud Database Status</div>
              <div className="text-sm font-bold text-[#35145A] dark:text-[#8E54DC] font-mono mt-1 truncate">
                asia-southeast1
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                Firestore Connected
              </div>
            </div>
          </div>

          {/* Section: Diagnostics & History Placeholder */}
          <div className="bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#211A2B] dark:text-[#F7F5FA]">
                Recent Test Report Forms & Diagnostics
              </h3>
              <button
                onClick={() => onNavigate('/results')}
                className="text-xs font-semibold text-[#35145A] dark:text-[#8E54DC] hover:underline cursor-pointer"
              >
                Inspect Sample TRF Breakdown →
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-sm text-[#211A2B] dark:text-[#F7F5FA]">
                  Official Mock #102 · Academic CD Simulation
                </div>
                <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
                  Taken at Chilanzar Center · Examiner moderation completed
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-mono font-extrabold text-[#35145A] dark:text-[#8E54DC]">7.5 Overall</div>
                  <div className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">L: 8.0 · R: 8.5 · W: 6.5 · S: 7.0</div>
                </div>
                <button
                  onClick={() => onNavigate('/results')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#F7F5FA] hover:bg-[#E5DAF3] transition-colors"
                >
                  View TRF
                </button>
              </div>
            </div>
          </div>

          {/* Phase 2 Architecture Notice */}
          <div className="p-5 rounded-2xl bg-[#F0EAF8] dark:bg-[#26133E] border border-[#E5E1EB] dark:border-[#361F5B] text-xs text-[#35145A] dark:text-[#F7F5FA] flex items-start gap-3">
            <Layers className="w-5 h-5 text-[#35145A] dark:text-[#8E54DC] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-bold">Phase 1 Architecture Status</strong>
              <p className="mt-1 leading-relaxed text-[#716A7B] dark:text-[#ABA1BC]">
                This route is provisioned as part of Phase 1 foundation. When Phase 2 begins, Firebase Authentication will manage candidate sessions, and Firestore collections (<code className="font-mono">users</code>, <code className="font-mono">test_attempts</code>, <code className="font-mono">trf_reports</code>) will stream live dynamic data into these components.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. RESULTS & TRF (/results)
  if (route === '/results') {
    return (
      <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#130922] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#35145A] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </button>
            <button
              onClick={() => onNavigate('/dashboard')}
              className="text-xs font-semibold text-[#35145A] dark:text-[#8E54DC] hover:underline"
            >
              Candidate Dashboard →
            </button>
          </div>

          {/* Realistic TRF Certificate Shell */}
          <div className="bg-white dark:bg-[#1E0F36] rounded-3xl border-2 border-[#35145A] dark:border-[#8E54DC] p-6 sm:p-10 shadow-lg space-y-8">
            {/* TRF Top Header */}
            <div className="border-b border-[#E5E1EB] dark:border-[#361F5B] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                  IELTS ZONE Diagnostic Certificate
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211A2B] dark:text-[#F7F5FA] mt-1">
                  Test Report Form (Mock TRF)
                </h1>
                <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
                  Academic Computer-Delivered Mock Examination · Reference #IZ-2026-TRF-0914
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block text-xs font-mono font-bold px-3 py-1 rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC]">
                  STATUS: VERIFIED BY EXAMINER
                </span>
                <div className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC] mt-1">Date: Oct 2026</div>
              </div>
            </div>

            {/* Candidate Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs p-4 rounded-2xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B]">
              <div>
                <span className="text-[#716A7B] dark:text-[#ABA1BC] block">Candidate Name:</span>
                <strong className="text-sm text-[#211A2B] dark:text-[#F7F5FA]">{profile?.displayName || user?.displayName || 'Muhammadqodir Abdullajonov'}</strong>
              </div>
              <div>
                <span className="text-[#716A7B] dark:text-[#ABA1BC] block">Center Number:</span>
                <strong className="text-sm text-[#211A2B] dark:text-[#F7F5FA]">UZ042 · Chilanzar Station</strong>
              </div>
              <div>
                <span className="text-[#716A7B] dark:text-[#ABA1BC] block">Module:</span>
                <strong className="text-sm text-[#211A2B] dark:text-[#F7F5FA]">Academic CD IELTS</strong>
              </div>
            </div>

            {/* Sub-skill score cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-[#F0EAF8] dark:bg-[#26133E] border border-[#E5E1EB] dark:border-[#361F5B]">
                <div className="text-xs font-bold text-[#716A7B] dark:text-[#ABA1BC]">Listening</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#35145A] dark:text-[#8E54DC] font-mono mt-1">8.0</div>
                <div className="text-[10px] text-[#716A7B] dark:text-[#ABA1BC] mt-1">35/40 Raw</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F0EAF8] dark:bg-[#26133E] border border-[#E5E1EB] dark:border-[#361F5B]">
                <div className="text-xs font-bold text-[#716A7B] dark:text-[#ABA1BC]">Reading</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#35145A] dark:text-[#8E54DC] font-mono mt-1">8.5</div>
                <div className="text-[10px] text-[#716A7B] dark:text-[#ABA1BC] mt-1">38/40 Raw</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F0EAF8] dark:bg-[#26133E] border border-[#E5E1EB] dark:border-[#361F5B]">
                <div className="text-xs font-bold text-[#716A7B] dark:text-[#ABA1BC]">Writing</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#35145A] dark:text-[#8E54DC] font-mono mt-1">6.5</div>
                <div className="text-[10px] text-[#716A7B] dark:text-[#ABA1BC] mt-1">Examiner Review</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F0EAF8] dark:bg-[#26133E] border border-[#E5E1EB] dark:border-[#361F5B]">
                <div className="text-xs font-bold text-[#716A7B] dark:text-[#ABA1BC]">Speaking</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#35145A] dark:text-[#8E54DC] font-mono mt-1">7.0</div>
                <div className="text-[10px] text-[#716A7B] dark:text-[#ABA1BC] mt-1">Live Interview</div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#35145A] dark:bg-[#8E54DC] text-white">
                <div className="text-xs font-bold text-white/80">OVERALL BAND</div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono mt-1">7.5</div>
                <div className="text-[10px] text-white/80 mt-1">C1 Proficient</div>
              </div>
            </div>

            {/* Detailed Examiner Commentary */}
            <div className="space-y-4 pt-4 border-t border-[#E5E1EB] dark:border-[#361F5B]">
              <h3 className="font-bold text-base text-[#211A2B] dark:text-[#F7F5FA]">
                Examiner Diagnostic Breakdown · Writing Module
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Task Achievement (Task 1) & Response (Task 2)</span>
                    <span className="text-[#35145A] dark:text-[#8E54DC] font-mono">Band 7.0</span>
                  </div>
                  <p className="text-[#716A7B] dark:text-[#ABA1BC]">
                    Clear position throughout; addresses all parts of prompt with relevant main ideas.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Coherence & Cohesion</span>
                    <span className="text-[#35145A] dark:text-[#8E54DC] font-mono">Band 6.0</span>
                  </div>
                  <p className="text-[#716A7B] dark:text-[#ABA1BC]">
                    Paragraphing is logical, but mechanical cohesive devices are overused in body paragraph 2.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Lexical Resource</span>
                    <span className="text-[#35145A] dark:text-[#8E54DC] font-mono">Band 7.0</span>
                  </div>
                  <p className="text-[#716A7B] dark:text-[#ABA1BC]">
                    Good range of topic-specific collocations with occasional slight inaccuracies in word choice.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Grammatical Range & Accuracy</span>
                    <span className="text-[#35145A] dark:text-[#8E54DC] font-mono">Band 6.0</span>
                  </div>
                  <p className="text-[#716A7B] dark:text-[#ABA1BC]">
                    Mix of simple and complex sentence forms; frequent minor article and punctuation errors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. BOOKINGS SCHEDULE (/bookings)
  if (route === '/bookings') {
    return (
      <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#130922] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#35145A] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </button>
            <button
              onClick={onOpenBookingModal}
              className="px-4 py-2 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer"
            >
              + Reserve a Seat Now
            </button>
          </div>

          <div className="bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 space-y-4">
            <h1 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
              Offline Test Center Schedule
            </h1>
            <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
              Route: <code className="font-mono">/bookings</code> · Upcoming weekend exam slots at the Chilanzar Examination Center.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  date: 'Saturday, Oct 17, 2026',
                  time: '09:00 AM – 13:00 PM',
                  status: 'Limited Seats (8 left)',
                  statusColor: 'text-amber-600 dark:text-amber-400',
                  examiner: 'Live Speaking Examiner On-Site',
                },
                {
                  date: 'Sunday, Oct 18, 2026',
                  time: '09:00 AM – 13:00 PM',
                  status: 'Available (12 seats left)',
                  statusColor: 'text-emerald-600 dark:text-emerald-400',
                  examiner: 'Live Speaking Examiner On-Site',
                },
                {
                  date: 'Saturday, Oct 24, 2026',
                  time: '09:00 AM – 13:00 PM',
                  status: 'Registration Open',
                  statusColor: 'text-[#35145A] dark:text-[#8E54DC]',
                  examiner: 'Live Speaking Examiner On-Site',
                },
              ].map((slot, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-bold text-sm text-[#211A2B] dark:text-[#F7F5FA]">
                      {slot.date} · {slot.time}
                    </div>
                    <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
                      {slot.examiner} · Academic & General Training
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${slot.statusColor}`}>{slot.status}</span>
                    <button
                      onClick={onOpenBookingModal}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#35145A] text-white hover:bg-[#481B7A] dark:bg-[#8E54DC] transition-colors cursor-pointer"
                    >
                      Book Seat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. EXAMINER & ADMIN PORTAL (/admin)
  if (route === '/admin') {
    const isAuthorized = Boolean(
      user && (
        profile?.role === 'admin' ||
        profile?.role === 'examiner' ||
        user.email === 'farhodjonovichm1301@gmail.com'
      )
    );

    if (!isAuthorized) {
      return (
        <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#130922] py-16 px-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-8 text-center space-y-6 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                Restricted Administration Area
              </h2>
              <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                {user
                  ? `Your authenticated account (${user.email}) currently has role "${profile?.role || 'candidate'}". Access to the Examiner Marking & Evaluation Console requires elevated administrator or certified examiner credentials.`
                  : 'This console is strictly restricted to certified examiners and platform administrators. Please log in with authorized examiner credentials.'}
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              {!user && (
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('login')}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Sign In with Examiner Account
                </button>
              )}
              {user && (
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard')}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-[#35145A] dark:text-[#F7F5FA] bg-[#F0EAF8] dark:bg-[#26133E] rounded-xl transition-colors cursor-pointer"
                >
                  Go to Candidate Dashboard
                </button>
              )}
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2 text-xs text-[#716A7B] dark:text-[#ABA1BC] hover:underline cursor-pointer"
              >
                ← Return to Home Landing Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#130922] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#35145A] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                ROLE: EXAMINER / ADMIN PREVIEW
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC]">
                {user?.email || 'admin@ieltszone.uz'}
              </span>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E5E1EB] dark:border-[#361F5B]">
            <button
              type="button"
              onClick={() => setAdminTab('resources')}
              className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                adminTab === 'resources'
                  ? 'border-[#35145A] dark:border-[#8E54DC] text-[#35145A] dark:text-[#8E54DC]'
                  : 'border-transparent text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B]'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Exam Resource Management (Phase 2C-0)
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('grading')}
              className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                adminTab === 'grading'
                  ? 'border-[#35145A] dark:border-[#8E54DC] text-[#35145A] dark:text-[#8E54DC]'
                  : 'border-transparent text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Examiner Evaluation Workspace
            </button>
          </div>

          {/* Tab 1: Resource Management (Phase 2C-0) */}
          {adminTab === 'resources' && (
            <ResourceManager />
          )}

          {/* Tab 2: Preserved Examiner Marking Queue */}
          {adminTab === 'grading' && (
            <div className="bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 space-y-4">
              <h1 className="text-2xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                Examiner Marking & Evaluation Workspace
              </h1>
              <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                Route: <code className="font-mono">/admin</code> · Examiner assessment interface for Task 1/2 marking and Speaking interview rubric calibration.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#211A2B] dark:text-[#F7F5FA]">
                      Pending Submissions Queue
                    </span>
                    <span className="text-xs font-mono text-[#716A7B] dark:text-[#ABA1BC]">
                      4 Submissions in Review
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white dark:bg-[#1E0F36] rounded-lg border border-[#E5E1EB] dark:border-[#361F5B]">
                      <div className="font-semibold text-[#211A2B] dark:text-[#F7F5FA]">Candidate #8041 · Task 2 Essay</div>
                      <div className="text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">Topic: Artificial Intelligence in Education · 284 words</div>
                      <div className="mt-2 text-[11px] font-mono text-[#35145A] dark:text-[#8E54DC]">Ready for Rubric Grading →</div>
                    </div>
                    <div className="p-3 bg-white dark:bg-[#1E0F36] rounded-lg border border-[#E5E1EB] dark:border-[#361F5B]">
                      <div className="font-semibold text-[#211A2B] dark:text-[#F7F5FA]">Candidate #8042 · Speaking Part 3 Audio</div>
                      <div className="text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">Recording Duration: 13m 42s · Quality Checked</div>
                      <div className="mt-2 text-[11px] font-mono text-[#35145A] dark:text-[#8E54DC]">Ready for Fluency Review →</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F0EAF8] dark:bg-[#26133E] border border-[#E5E1EB] dark:border-[#361F5B] text-xs text-[#35145A] dark:text-[#F7F5FA]">
                  <strong>Phase 2 Plan:</strong> Role-Based Access Control (RBAC) via Firebase Auth custom claims (<code className="font-mono">role: &apos;examiner&apos; | &apos;admin&apos;</code>) will restrict this view to authenticated evaluators with real-time assignment dispatch.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
        Route Foundation: {route}
      </h2>
      <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC] max-w-md">
        This route is scaffolded for Phase 2 development. Click below to return to the landing page.
      </p>
      <button
        onClick={handleBack}
        className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#35145A] text-white hover:bg-[#481B7A] dark:bg-[#8E54DC] transition-colors cursor-pointer"
      >
        Return to Home Landing Page
      </button>
    </div>
  );
};
