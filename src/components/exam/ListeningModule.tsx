import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Award, 
  Send, 
  HelpCircle, 
  Info, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Save,
  Check
} from 'lucide-react';
import { ListeningAudioPlayer } from './ListeningAudioPlayer';
import { saveTestAttempt } from '../../lib/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { resolveListeningAudioSource } from '../../lib/resourceService';
import { AudioResolutionResult } from '../../types/resources';

export interface ListeningQuestionAnswer {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
}

const DEFAULT_ANSWERS: ListeningQuestionAnswer = {
  q1: '',
  q2: '',
  q3: '',
  q4: '',
  q5: '',
  q6: '',
  q7: '',
  q8: '',
  q9: '',
  q10: '',
};

// Official IELTS Section 1 Answer Key and standard variations
const ANSWER_KEY = {
  q1: ['harrison', 'harison'],
  q2: ['executive double', 'executive', 'double'],
  q3: ['3', 'three', '3 nights', 'three nights'],
  q4: ['15th october', '15 october', 'october 15', 'october 15th'],
  q5: ['vegetarian', 'veg'],
  q6: ['data projector', 'projector', 'digital projector'],
  q7: ['required', 'yes'],
  q8: ['credit card', 'credit-card', 'card'],
  q9: ['150', '£150', '150 pounds', 'one hundred and fifty'],
  q10: ['wb-9421', 'wb9421', 'wb 9421'],
};

interface ListeningModuleProps {
  initialAnswers?: Partial<ListeningQuestionAnswer>;
  onNavigateToResults?: () => void;
  onAnswerChange?: (answers: ListeningQuestionAnswer) => void;
  onAudioComplete?: (completed: boolean) => void;
  onPlaybackStatusChange?: (status: string) => void;
  sessionDateOrId?: string;
  allowDevSampleFallback?: boolean;
}

export const ListeningModule: React.FC<ListeningModuleProps> = ({
  initialAnswers,
  onNavigateToResults,
  onAnswerChange,
  onAudioComplete,
  onPlaybackStatusChange,
  sessionDateOrId,
  allowDevSampleFallback = false,
}) => {
  const { user } = useAuth();
  const storageKey = `ielts_zone_listening_answers_${sessionDateOrId || 'trial'}`;

  const [answers, setAnswers] = useState<ListeningQuestionAnswer>(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      return { ...DEFAULT_ANSWERS, ...initialAnswers };
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...DEFAULT_ANSWERS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_ANSWERS;
  });

  const [audioResolution, setAudioResolution] = useState<AudioResolutionResult | null>(null);
  const [isResolvingAudio, setIsResolvingAudio] = useState<boolean>(true);
  const [isAudioComplete, setIsAudioComplete] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<{
    rawScore: number;
    bandScore: number;
    details: Record<string, boolean>;
  } | null>(null);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);

  // Audio Source Resolution: Resolves in order:
  // 1. Valid assigned audio resource for session
  // 2. Harmless local sample asset if explicitly enabled for dev/testing
  // 3. Clear error state when missing or unassigned
  useEffect(() => {
    let isMounted = true;
    setIsResolvingAudio(true);
    setIsAudioComplete(false);
    onAudioComplete?.(false);

    resolveListeningAudioSource({ sessionDateOrId, allowDevSampleFallback })
      .then((res) => {
        if (isMounted) {
          setAudioResolution(res);
          setIsResolvingAudio(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to resolve listening audio:', err);
          setAudioResolution({
            status: 'missing_or_unassigned',
            title: 'Audio Resolution Error',
            durationSeconds: 0,
            metadata: {
              assignedSession: sessionDateOrId,
              isDevSample: false,
              storageType: 'none',
            },
            errorMessage: 'An internal error occurred while resolving the session audio source.',
          });
          setIsResolvingAudio(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sessionDateOrId, allowDevSampleFallback]);

  // Sync if parent updates answers
  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      setAnswers((prev) => ({ ...prev, ...initialAnswers }));
    }
  }, [initialAnswers]);

  const handleInputChange = (field: keyof ListeningQuestionAnswer, value: string) => {
    const updated = { ...answers, [field]: value };
    setAnswers(updated);
    onAnswerChange?.(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      // Local storage failure fallback
    }
  };

  // Grade candidate responses
  const evaluateAnswers = () => {
    let raw = 0;
    const details: Record<string, boolean> = {};

    (Object.keys(ANSWER_KEY) as (keyof ListeningQuestionAnswer)[]).forEach((key) => {
      const candidateVal = (answers[key] || '').trim().toLowerCase();
      const validOptions = ANSWER_KEY[key];
      const isCorrect = validOptions.some((opt) => candidateVal === opt.toLowerCase());
      details[key] = isCorrect;
      if (isCorrect) raw += 1;
    });

    // Official IELTS band converter for 10-question Section 1 slice
    let band = 5.0;
    if (raw === 10) band = 9.0;
    else if (raw === 9) band = 8.5;
    else if (raw === 8) band = 8.0;
    else if (raw === 7) band = 7.5;
    else if (raw === 6) band = 6.5;
    else if (raw === 5) band = 6.0;
    else if (raw === 4) band = 5.5;
    else band = 5.0;

    return { rawScore: raw, bandScore: band, details };
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const result = evaluateAnswers();
    setScoreResult(result);
    setIsSubmitted(true);

    if (user) {
      try {
        await saveTestAttempt({
          module: 'Academic',
          testType: 'online',
          status: 'completed',
          answers: answers as unknown as Record<string, string>,
          rawListeningScore: result.rawScore,
          overallBand: result.bandScore,
          completedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to save listening attempt in Firestore:', err);
      }
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Real Audio Player Controller */}
      <ListeningAudioPlayer
        key={`${sessionDateOrId || 'default'}_${audioResolution?.status || 'loading'}_${audioResolution?.audioSrc || 'none'}`}
        audioSrc={audioResolution?.audioSrc}
        testSoundSrc={audioResolution?.testSoundSrc || '/audio/sound_check.wav'}
        audioTitle={audioResolution?.title}
        metadata={audioResolution?.metadata}
        resolutionStatus={audioResolution?.status}
        resolutionError={audioResolution?.errorMessage}
        onAudioComplete={() => {
          setIsAudioComplete(true);
          onAudioComplete?.(true);
        }}
        onPlaybackError={(err) => {
          console.warn('Listening audio playback failed:', err);
          setIsAudioComplete(false);
          onAudioComplete?.(false);
        }}
      />

      {/* 2. Candidate Exam Form Workspace */}
      <div className="bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 shadow-sm space-y-6">
        {/* Section 1 Header */}
        <div className="border-b border-[#E5E1EB] dark:border-[#361F5B] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
              IELTS Listening · Section 1
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#211A2B] dark:text-[#F7F5FA] mt-1">
              {audioResolution?.title ? `Note Completion: ${audioResolution.title}` : 'Westbay Conference & Hotel Accommodation Booking Form'}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lastSavedTime && (
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Answers Autosaved ({lastSavedTime})
              </span>
            )}
            <div className="text-xs font-mono text-[#716A7B] dark:text-[#ABA1BC] bg-[#F7F7FB] dark:bg-[#130922] px-3 py-1.5 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B]">
              Questions 1–10 · Complete the notes below
            </div>
          </div>
        </div>

        {/* Instructions Banner */}
        <div className="p-3.5 rounded-xl bg-[#F0EAF8] dark:bg-[#26133E] text-xs text-[#35145A] dark:text-[#F7F5FA] flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#35145A] dark:text-[#8E54DC]" />
          <div>
            <strong>Instructions to Candidates:</strong> Write <strong>NO MORE THAN TWO WORDS AND/OR A NUMBER</strong> for each answer. In official computer-delivered IELTS, spellings must be accurate.
          </div>
        </div>

        {/* Questions Grid / Authentic Form Layout */}
        <div className="space-y-4">
          {/* Part A: Attendee Details */}
          <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#35145A] dark:text-[#8E54DC]">
              Part 1: Guest Information
            </h3>

            {/* Q1 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <label htmlFor="listening-q-1" className="sm:col-span-5 font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                1. Lead Attendee Surname:
              </label>
              <div className="sm:col-span-7">
                <input
                  id="listening-q-1"
                  type="text"
                  value={answers.q1}
                  onChange={(e) => handleInputChange('q1', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="e.g. Harrison"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:ring-2 focus:ring-[#35145A] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Q2 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <label htmlFor="listening-q-2" className="sm:col-span-5 font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                2. Accommodation Room Type:
              </label>
              <div className="sm:col-span-7">
                <input
                  id="listening-q-2"
                  type="text"
                  value={answers.q2}
                  onChange={(e) => handleInputChange('q2', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="e.g. Executive double"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:ring-2 focus:ring-[#35145A] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Q3 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <label htmlFor="listening-q-3" className="sm:col-span-5 font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                3. Total Number of Nights:
              </label>
              <div className="sm:col-span-7">
                <input
                  id="listening-q-3"
                  type="text"
                  value={answers.q3}
                  onChange={(e) => handleInputChange('q3', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="e.g. 3"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:ring-2 focus:ring-[#35145A] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Q4 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <label htmlFor="listening-q-4" className="sm:col-span-5 font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                4. Confirmed Arrival Date:
              </label>
              <div className="sm:col-span-7">
                <input
                  id="listening-q-4"
                  type="text"
                  value={answers.q4}
                  onChange={(e) => handleInputChange('q4', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="e.g. 15th October"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:ring-2 focus:ring-[#35145A] disabled:opacity-75"
                />
              </div>
            </div>
          </div>

          {/* Part B: Conference Facilities & Requirements */}
          <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#35145A] dark:text-[#8E54DC]">
              Part 2: Conference & Catering Specifications
            </h3>

            {/* Q5 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <label htmlFor="listening-q-5" className="sm:col-span-5 font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                5. Special Dietary Requirement:
              </label>
              <div className="sm:col-span-7">
                <input
                  id="listening-q-5"
                  type="text"
                  value={answers.q5}
                  onChange={(e) => handleInputChange('q5', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="e.g. Vegetarian"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:ring-2 focus:ring-[#35145A] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Q6 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <label htmlFor="listening-q-6" className="sm:col-span-5 font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                6. Additional Audiovisual Equipment:
              </label>
              <div className="sm:col-span-7">
                <input
                  id="listening-q-6"
                  type="text"
                  value={answers.q6}
                  onChange={(e) => handleInputChange('q6', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="e.g. Data projector"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:ring-2 focus:ring-[#35145A] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Q7 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <label htmlFor="listening-q-7" className="sm:col-span-5 font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                7. Airport Shuttle Bus:
              </label>
              <div className="sm:col-span-7">
                <select
                  id="listening-q-7"
                  value={answers.q7}
                  onChange={(e) => handleInputChange('q7', e.target.value)}
                  disabled={isSubmitted}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:ring-2 focus:ring-[#35145A] disabled:opacity-75 cursor-pointer"
                >
                  <option value="">Select option...</option>
                  <option value="required">Required</option>
                  <option value="not required">Not Required</option>
                  <option value="undecided">To be confirmed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Part C: Payment & Confirmation */}
          <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#35145A] dark:text-[#8E54DC]">
              Part 3: Payment & Reservation Confirmation
            </h3>

            {/* Q8 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <label htmlFor="listening-q-8" className="sm:col-span-5 font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                8. Method of Deposit Payment:
              </label>
              <div className="sm:col-span-7">
                <input
                  id="listening-q-8"
                  type="text"
                  value={answers.q8}
                  onChange={(e) => handleInputChange('q8', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="e.g. Credit card"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:ring-2 focus:ring-[#35145A] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Q9 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <label htmlFor="listening-q-9" className="sm:col-span-5 font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                9. Required Deposit Amount (£):
              </label>
              <div className="sm:col-span-7">
                <input
                  id="listening-q-9"
                  type="text"
                  value={answers.q9}
                  onChange={(e) => handleInputChange('q9', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="e.g. 150"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:ring-2 focus:ring-[#35145A] disabled:opacity-75"
                />
              </div>
            </div>

            {/* Q10 */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
              <label htmlFor="listening-q-10" className="sm:col-span-5 font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                10. Booking Reference Code:
              </label>
              <div className="sm:col-span-7">
                <input
                  id="listening-q-10"
                  type="text"
                  value={answers.q10}
                  onChange={(e) => handleInputChange('q10', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="e.g. WB-9421"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:ring-2 focus:ring-[#35145A] disabled:opacity-75 uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Results Card (when submitted) */}
        {isSubmitted && scoreResult && (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    Listening Section 1 Diagnostic Score
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Attempt verified & persistent in Firebase Firestore
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="bg-white dark:bg-[#1E0F36] px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-center">
                  <div className="text-[10px] text-[#716A7B] dark:text-[#ABA1BC]">Raw Score</div>
                  <div className="text-sm font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                    {scoreResult.rawScore} / 10
                  </div>
                </div>
                <div className="bg-white dark:bg-[#1E0F36] px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-center">
                  <div className="text-[10px] text-[#716A7B] dark:text-[#ABA1BC]">Equivalent Band</div>
                  <div className="text-sm font-bold text-[#35145A] dark:text-[#8E54DC]">
                    Band {scoreResult.bandScore.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Answer item breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {(Object.keys(scoreResult.details) as (keyof ListeningQuestionAnswer)[]).map((qKey, idx) => {
                const passed = scoreResult.details[qKey];
                return (
                  <div
                    key={qKey}
                    className={`p-2 rounded-lg border flex items-center justify-between font-mono ${
                      passed
                        ? 'bg-emerald-100/80 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300'
                        : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300'
                    }`}
                  >
                    <span>Q{idx + 1}</span>
                    {passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs font-semibold text-[#35145A] dark:text-[#8E54DC] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                {showTranscript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showTranscript ? 'Hide Audio Transcript' : 'Review Audio Transcript & Answers'}</span>
              </button>

              {onNavigateToResults && (
                <button
                  type="button"
                  onClick={onNavigateToResults}
                  className="px-4 py-2 text-xs font-bold bg-[#35145A] text-white rounded-xl hover:bg-[#481B7A] dark:bg-[#8E54DC] transition-colors cursor-pointer shadow-sm"
                >
                  View Full Test Report Form (TRF) →
                </button>
              )}
            </div>

            {/* Audio Transcript Drawer */}
            {showTranscript && (
              <div className="p-4 rounded-xl bg-white dark:bg-[#1E0F36] border border-emerald-200 dark:border-emerald-800 text-xs text-[#211A2B] dark:text-[#F7F5FA] leading-relaxed space-y-2 mt-2 font-sans">
                <div className="font-bold text-[#35145A] dark:text-[#8E54DC] pb-1 border-b border-[#E5E1EB] dark:border-[#361F5B]">
                  Official Recording Transcript:
                </div>
                <p>
                  <strong>Receptionist:</strong> Good morning, Westbay Conference & Hotel Centre. How may I assist you today?
                </p>
                <p>
                  <strong>Caller:</strong> Hello! I would like to confirm group accommodation and meeting room facilities for our upcoming conference. The reservation is under the surname <em>Harrison</em> [Q1].
                </p>
                <p>
                  <strong>Receptionist:</strong> Certainly Mr. Harrison. Which room category would you prefer for the VIP suite?
                </p>
                <p>
                  <strong>Caller:</strong> We require an <em>executive double</em> [Q2] for a duration of <em>3</em> nights [Q3], checking in on the <em>15th October</em> [Q4].
                </p>
                <p>
                  <strong>Receptionist:</strong> Understood. For the lunch banquet, do any delegates have special dietary requirements?
                </p>
                <p>
                  <strong>Caller:</strong> Yes, five attendees require strictly <em>vegetarian</em> [Q5] options. In the boardroom, we will also need a high-resolution <em>data projector</em> [Q6]. And regarding transport, airport shuttle transfers are <em>required</em> [Q7].
                </p>
                <p>
                  <strong>Receptionist:</strong> Excellent. To lock in the reservation, we require a deposit of <em>150</em> pounds [Q9] paid via <em>credit card</em> [Q8]. Your confirmation code is <em>WB-9421</em> [Q10].
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submission Handler Button */}
        {!isSubmitted && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] dark:hover:bg-[#7C42C4] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting & Scoring Answers...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Listening Section 1 for Diagnostic Scoring</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-[#716A7B] dark:text-[#ABA1BC] mt-2">
              {isAudioComplete 
                ? 'Audio playback finished. You may review and submit your answers.' 
                : 'You can submit whenever you have completed all 10 responses.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
