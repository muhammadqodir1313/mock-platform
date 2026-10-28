import React, { useState } from 'react';
import { 
  X, 
  Headphones, 
  BookOpen, 
  PenTool, 
  Key, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  ExamResourcePackage, 
  ExamAnswerKeyPackage,
  validateExamPackage 
} from '../../types/resources';
import { ListeningAudioPlayer } from '../exam/ListeningAudioPlayer';

interface ResourcePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: ExamResourcePackage;
  keys?: ExamAnswerKeyPackage | null;
}

export const ResourcePreviewModal: React.FC<ResourcePreviewModalProps> = ({
  isOpen,
  onClose,
  pkg,
  keys,
}) => {
  const [activeTab, setActiveTab] = useState<'listening' | 'reading' | 'writing' | 'keys'>('listening');
  const [showConfidentialKeys, setShowConfidentialKeys] = useState(false);
  const [activePassageIndex, setActivePassageIndex] = useState(0);

  if (!isOpen) return null;

  const validation = validateExamPackage(pkg, keys);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between bg-[#F7F7FB] dark:bg-[#130922]">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#35145A] dark:bg-[#8E54DC] text-white flex items-center justify-center font-bold text-xs">
              PV
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="preview-title" className="text-base font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                  {pkg.title}
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  pkg.status === 'published' 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  {pkg.status}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC]">
                  {pkg.module}
                </span>
              </div>
              <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-0.5">
                Examiner Content Inspector · Phase 2C-0 Pre-Flight Preview
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#E5E1EB] dark:hover:bg-[#361F5B] transition-colors cursor-pointer"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Status Bar */}
        <div className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
          validation.isValid 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span className="font-semibold">
              {validation.isValid 
                ? 'Ready for Examination Dispatch: All structural validation checks passed.' 
                : `${validation.errorCount} structural requirement(s) need attention before candidate dispatch.`}
            </span>
          </div>
          <span className="text-[11px] font-mono">
            {pkg.listening.questions.length} Listening Qs · {pkg.reading.questions.length} Reading Qs · 2 Writing Tasks
          </span>
        </div>

        {/* Sub-Module Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36]">
          <button
            onClick={() => setActiveTab('listening')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'listening'
                ? 'border-[#35145A] dark:border-[#8E54DC] text-[#35145A] dark:text-[#8E54DC]'
                : 'border-transparent text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B]'
            }`}
          >
            <Headphones className="w-4 h-4" />
            Listening Module
          </button>

          <button
            onClick={() => setActiveTab('reading')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reading'
                ? 'border-[#35145A] dark:border-[#8E54DC] text-[#35145A] dark:text-[#8E54DC]'
                : 'border-transparent text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Reading Stimulus & Questions
          </button>

          <button
            onClick={() => setActiveTab('writing')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'writing'
                ? 'border-[#35145A] dark:border-[#8E54DC] text-[#35145A] dark:text-[#8E54DC]'
                : 'border-transparent text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B]'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Writing Tasks (1 & 2)
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ml-auto cursor-pointer ${
              activeTab === 'keys'
                ? 'border-purple-600 dark:border-purple-400 text-purple-700 dark:text-purple-300'
                : 'border-transparent text-purple-700/70 dark:text-purple-300/70 hover:text-purple-800'
            }`}
          >
            <Key className="w-4 h-4" />
            Confidential Answer Keys
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: LISTENING */}
          {activeTab === 'listening' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#211A2B] dark:text-[#F7F5FA]">
                    Candidate Audio Interface Simulation
                  </span>
                  <span className="font-mono text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                    Source: <code className="text-[#35145A] dark:text-[#8E54DC]">{pkg.listening.audioSrc}</code>
                  </span>
                </div>
                {/* Audio Player Component */}
                <ListeningAudioPlayer
                  audioSrc={pkg.listening.audioSrc}
                  testSoundSrc={pkg.listening.testSoundSrc}
                />
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                    Listening Questions ({pkg.listening.questions.length} Items)
                  </h3>
                  <span className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                    Format: Note / Form Completion
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pkg.listening.questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-md bg-[#35145A] dark:bg-[#8E54DC] text-white flex items-center justify-center font-bold text-xs">
                          {q.number}
                        </span>
                        <span className="text-[10px] font-mono text-[#716A7B] dark:text-[#ABA1BC]">
                          Section {q.sectionNumber || 1}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                        {q.prompt}
                      </div>
                      <input
                        type="text"
                        disabled
                        placeholder={q.placeholder || 'Candidate response input'}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1E0F36] border border-[#E5E1EB] dark:border-[#361F5B] rounded-lg opacity-75 cursor-not-allowed"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Examiner Transcript */}
              {pkg.listening.transcript && (
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Examiner Reference Transcript
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed font-mono">
                    {pkg.listening.transcript}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: READING */}
          {activeTab === 'reading' && (
            <div className="space-y-4">
              {/* Multi-Passage Selector Tabs */}
              {pkg.reading.passages.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B]">
                  <span className="text-xs font-semibold text-[#716A7B] dark:text-[#ABA1BC] mr-1">
                    Select Stimulus Passage:
                  </span>
                  {pkg.reading.passages.map((p, idx) => (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={() => setActivePassageIndex(idx)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activePassageIndex === idx
                          ? 'bg-[#35145A] dark:bg-[#8E54DC] text-white shadow-xs'
                          : 'bg-white dark:bg-[#1E0F36] text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] dark:hover:text-[#F7F5FA] border border-[#E5E1EB] dark:border-[#361F5B]'
                      }`}
                    >
                      Passage {p.passageNumber || idx + 1} ({p.wordCount || p.body.split(/\s+/).filter(Boolean).length} words)
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Active Passage */}
                {(() => {
                  const currentPassage = pkg.reading.passages[activePassageIndex] || pkg.reading.passages[0];
                  return (
                    <div className="p-5 rounded-2xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-3">
                      <div className="border-b border-[#E5E1EB] dark:border-[#361F5B] pb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                            Passage {currentPassage?.passageNumber || activePassageIndex + 1} of {pkg.reading.passages.length}
                          </span>
                          <span className="text-[10px] font-mono text-[#716A7B] dark:text-[#ABA1BC]">
                            ~{currentPassage?.wordCount || currentPassage?.body?.split(/\s+/).filter(Boolean).length || 0} words
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#211A2B] dark:text-[#F7F5FA] mt-1">
                          {currentPassage?.title || `Reading Passage ${activePassageIndex + 1}`}
                        </h3>
                        {currentPassage?.subtitle && (
                          <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC] mt-0.5 italic">
                            {currentPassage.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="text-xs text-[#211A2B] dark:text-[#F7F5FA] leading-relaxed space-y-3 max-h-[460px] overflow-y-auto pr-2">
                        {currentPassage?.body ? (
                          currentPassage.body.split('\n\n').map((para, i) => (
                            <p key={i}>{para}</p>
                          ))
                        ) : (
                          <p className="text-[#716A7B] italic">No passage text provided.</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Right Column: Questions with Continuous Numbering */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-[#211A2B] dark:text-[#F7F5FA]">
                      Reading Questions ({pkg.reading.questions.length} Items Total)
                    </div>
                    <span className="text-xs font-mono text-[#716A7B] dark:text-[#ABA1BC]">
                      Continuous Q1–Q{pkg.reading.questions.length}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {pkg.reading.questions.map((q) => {
                      const isCurrentPassageQ = !q.passageNumber || q.passageNumber === (activePassageIndex + 1);
                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border space-y-2 transition-all ${
                            isCurrentPassageQ
                              ? 'bg-white dark:bg-[#1E0F36] border-[#35145A]/30 dark:border-[#8E54DC]/40 shadow-xs'
                              : 'bg-[#F7F7FB] dark:bg-[#130922] border-[#E5E1EB] dark:border-[#361F5B] opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-[#35145A] dark:bg-[#8E54DC] text-white flex items-center justify-center font-bold text-xs">
                                {q.number}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC]">
                                Passage {q.passageNumber || 1}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#716A7B] dark:text-[#ABA1BC] capitalize">
                              {q.type.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                            {q.prompt}
                          </div>

                          {q.options && q.options.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {q.options.map((opt) => (
                                <span
                                  key={opt}
                                  className="px-3 py-1 text-xs rounded-lg bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] font-medium"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <input
                              type="text"
                              disabled
                              placeholder={q.placeholder || 'Candidate answer input'}
                              className="w-full px-2.5 py-1.5 text-xs bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] rounded-lg opacity-75 cursor-not-allowed"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WRITING */}
          {activeTab === 'writing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task 1 */}
              <div className="p-5 rounded-2xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E1EB] dark:border-[#361F5B] pb-3">
                  <div className="font-bold text-sm text-[#211A2B] dark:text-[#F7F5FA]">
                    {pkg.writing.task1.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#716A7B] dark:text-[#ABA1BC]">
                    <Clock className="w-3.5 h-3.5" /> {pkg.writing.task1.suggestedMinutes} min
                  </div>
                </div>

                <p className="text-xs text-[#211A2B] dark:text-[#F7F5FA] leading-relaxed">
                  {pkg.writing.task1.prompt}
                </p>

                {pkg.writing.task1.chartUrl && (
                  <div className="p-3 bg-white dark:bg-[#1E0F36] rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
                      Task 1 Supporting Stimulus Image
                    </span>
                    <img
                      src={pkg.writing.task1.chartUrl}
                      alt="Task 1 Stimulus Graphic"
                      className="max-h-52 w-auto mx-auto rounded-lg border border-[#E5E1EB] dark:border-[#361F5B] object-contain bg-white"
                    />
                  </div>
                )}

                {pkg.writing.task1.chartDescription && (
                  <div className="p-3 bg-white dark:bg-[#1E0F36] rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                    <strong className="block text-[#211A2B] dark:text-[#F7F5FA] font-semibold mb-1">
                      Stimulus Visual Asset Specification:
                    </strong>
                    {pkg.writing.task1.chartDescription}
                  </div>
                )}

                <div className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">
                  Target Word Count: <strong>≥ {pkg.writing.task1.minimumWords} words</strong>
                </div>
              </div>

              {/* Task 2 */}
              <div className="p-5 rounded-2xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E1EB] dark:border-[#361F5B] pb-3">
                  <div className="font-bold text-sm text-[#211A2B] dark:text-[#F7F5FA]">
                    {pkg.writing.task2.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#716A7B] dark:text-[#ABA1BC]">
                    <Clock className="w-3.5 h-3.5" /> {pkg.writing.task2.suggestedMinutes} min
                  </div>
                </div>

                <p className="text-xs text-[#211A2B] dark:text-[#F7F5FA] leading-relaxed">
                  {pkg.writing.task2.prompt}
                </p>

                <div className="p-3 bg-white dark:bg-[#1E0F36] rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] text-xs text-[#716A7B] dark:text-[#ABA1BC] space-y-1">
                  <strong className="block text-[#211A2B] dark:text-[#F7F5FA] font-semibold">
                    Assessment Evaluation Criteria:
                  </strong>
                  <span>Task Response (TR), Coherence & Cohesion (CC), Lexical Resource (LR), Grammatical Range (GRA).</span>
                </div>

                <div className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">
                  Target Word Count: <strong>≥ {pkg.writing.task2.minimumWords} words</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONFIDENTIAL ANSWER KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-700 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide">
                      Strict Candidate Security Boundary
                    </h4>
                    <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5 leading-relaxed">
                      These answer keys are stored exclusively in the separate <code className="font-mono">/exam_answer_keys</code> Firestore collection. 
                      Standard candidates receive <strong>PERMISSION_DENIED</strong> on both client queries and direct document access via Firebase security rules.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfidentialKeys(!showConfidentialKeys)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  {showConfidentialKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showConfidentialKeys ? 'Mask Keys' : 'Reveal Keys'}
                </button>
              </div>

              {keys ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Listening Keys */}
                  <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-3">
                    <h4 className="text-xs font-bold text-[#211A2B] dark:text-[#F7F5FA] flex items-center justify-between">
                      <span>Listening Section 1 Answer Keys</span>
                      <span className="font-mono text-[10px] text-[#716A7B] dark:text-[#ABA1BC]">
                        {Object.keys(keys.listeningKeys).length} Keys
                      </span>
                    </h4>

                    <div className="space-y-1.5 text-xs font-mono">
                      {Object.entries(keys.listeningKeys).map(([qKey, accepted]) => (
                        <div
                          key={qKey}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#1E0F36] border border-[#E5E1EB] dark:border-[#361F5B]"
                        >
                          <span className="font-bold text-[#35145A] dark:text-[#8E54DC] uppercase">
                            {qKey}
                          </span>
                          <span className={showConfidentialKeys ? 'text-[#211A2B] dark:text-[#F7F5FA]' : 'blur-xs select-none'}>
                            {accepted.join(' / ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reading Keys */}
                  <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-3">
                    <h4 className="text-xs font-bold text-[#211A2B] dark:text-[#F7F5FA] flex items-center justify-between">
                      <span>Reading Passage 1 Answer Keys</span>
                      <span className="font-mono text-[10px] text-[#716A7B] dark:text-[#ABA1BC]">
                        {Object.keys(keys.readingKeys).length} Keys
                      </span>
                    </h4>

                    <div className="space-y-1.5 text-xs font-mono">
                      {Object.entries(keys.readingKeys).map(([qKey, accepted]) => (
                        <div
                          key={qKey}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#1E0F36] border border-[#E5E1EB] dark:border-[#361F5B]"
                        >
                          <span className="font-bold text-[#35145A] dark:text-[#8E54DC] uppercase">
                            {qKey}
                          </span>
                          <span className={showConfidentialKeys ? 'text-[#211A2B] dark:text-[#F7F5FA]' : 'blur-xs select-none'}>
                            {accepted.join(' / ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#716A7B] dark:text-[#ABA1BC] bg-[#F7F7FB] dark:bg-[#130922] rounded-xl border border-dashed border-[#E5E1EB] dark:border-[#361F5B]">
                  No answer keys registered for this package. Required before publishing for automatic score calculation.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between bg-[#F7F7FB] dark:bg-[#130922]">
          <span className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
            Package ID: <code className="font-mono text-[#211A2B] dark:text-[#F7F5FA]">{pkg.id}</code> (v{pkg.version})
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
