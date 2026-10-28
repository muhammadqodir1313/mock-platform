import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Headphones, 
  BookOpen, 
  PenTool, 
  Key, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Calendar, 
  X, 
  FileAudio, 
  Layers, 
  Loader2,
  Play,
  Volume2,
  FileCheck
} from 'lucide-react';
import { 
  ExamResourcePackage, 
  ExamAnswerKeyPackage, 
  ExamModule, 
  validateExamPackage, 
  PackageValidationReport 
} from '../../types/resources';
import { 
  probeAudioFile, 
  parseReadingSingleFile, 
  parseReadingSeparateFiles, 
  parseQuestionsData 
} from '../../lib/resourceParsers';
import { 
  validateAudioFile, 
  uploadExamAudio, 
  AudioUploadProgress,
  createLocalAudioPreviewUrl 
} from '../../lib/storageService';
import { 
  saveExamPackage, 
  assignPackageToSessionExclusively 
} from '../../lib/resourceService';

interface ResourceImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storageReady: boolean;
  onOpenStorageGuide: () => void;
  editingPackage?: ExamResourcePackage | null;
}

type WizardStep = 'select' | 'validate' | 'preview' | 'confirm' | 'saved';

export const ResourceImportWizard: React.FC<ResourceImportWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storageReady,
  onOpenStorageGuide,
  editingPackage = null,
}) => {
  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState<WizardStep>('select');

  // Package Metadata State
  const [packageId, setPackageId] = useState(`pkg_academic_${Date.now().toString().slice(-6)}`);
  const [title, setTitle] = useState('');
  const [module, setModule] = useState<ExamModule>('Academic');
  const [version, setVersion] = useState('2026.1');

  // Audio State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState('/audio/ielts_listening_section1.wav');
  const [audioDuration, setAudioDuration] = useState(45);
  const [audioFormat, setAudioFormat] = useState('WAV');
  const [audioUploadProgress, setAudioUploadProgress] = useState<AudioUploadProgress | null>(null);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);

  // Reading Mode State
  const [readingFileMode, setReadingFileMode] = useState<'single' | 'separate'>('single');
  const [readingSingleContent, setReadingSingleContent] = useState('');
  const [readingPassageFiles, setReadingPassageFiles] = useState<{ filename: string; content: string }[]>([]);

  // Questions and Prompts
  const [listeningQuestionsText, setListeningQuestionsText] = useState('');
  const [readingQuestionsText, setReadingQuestionsText] = useState('');

  // Writing Prompts & Supporting Assets
  const [writingTask1Prompt, setWritingTask1Prompt] = useState(
    'The chart below shows the percentage of international students achieving Band 7.5 or higher across four testing centers between 2020 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  );
  const [writingTask1MinWords, setWritingTask1MinWords] = useState(150);
  const [writingTask1ChartUrl, setWritingTask1ChartUrl] = useState('');
  const [writingTask1ChartDesc, setWritingTask1ChartDesc] = useState(
    'Comparative bar chart illustrating four testing centers (Tashkent, Samarkand, London, Sydney) across 5 academic years.'
  );
  const [writingTask2Prompt, setWritingTask2Prompt] = useState(
    'Some people believe that artificial intelligence and computer-graded systems will eventually replace human language instructors in IELTS exam preparation. Others argue that human mentorship remains irreplaceable. Discuss both views and give your own opinion.'
  );
  const [writingTask2MinWords, setWritingTask2MinWords] = useState(250);

  // Synchronize state when editingPackage changes or modal opens
  useEffect(() => {
    if (editingPackage) {
      setPackageId(editingPackage.id);
      setTitle(editingPackage.title);
      setModule(editingPackage.module);
      setVersion(editingPackage.version);
      setAudioSrc(editingPackage.listening.audioSrc || '/audio/ielts_listening_section1.wav');
      setAudioDuration(editingPackage.listening.durationSeconds || 45);
      setListeningQuestionsText(JSON.stringify(editingPackage.listening.questions || [], null, 2));
      setReadingFileMode('single');
      setReadingSingleContent(JSON.stringify(editingPackage.reading.passages || [], null, 2));
      setReadingQuestionsText(JSON.stringify(editingPackage.reading.questions || [], null, 2));
      setWritingTask1Prompt(editingPackage.writing.task1.prompt);
      setWritingTask1MinWords(editingPackage.writing.task1.minimumWords);
      setWritingTask1ChartUrl(editingPackage.writing.task1.chartUrl || '');
      setWritingTask1ChartDesc(editingPackage.writing.task1.chartDescription || '');
      setWritingTask2Prompt(editingPackage.writing.task2.prompt);
      setWritingTask2MinWords(editingPackage.writing.task2.minimumWords);
    } else {
      setPackageId(`pkg_academic_${Date.now().toString().slice(-6)}`);
      setTitle('');
      setModule('Academic');
      setVersion('2026.1');
      setAudioFile(null);
      setAudioSrc('/audio/ielts_listening_section1.wav');
      setAudioDuration(45);
      setReadingFileMode('single');
      setReadingSingleContent('');
      setReadingPassageFiles([]);
      setListeningQuestionsText('');
      setReadingQuestionsText('');
      setWritingTask1ChartUrl('');
      setWritingTask1ChartDesc('Comparative bar chart illustrating four testing centers across 5 academic years.');
    }
    setCurrentStep('select');
    setConstructedPackage(null);
    setConstructedKeys(null);
    setValidationReport(null);
    setSaveError(null);
  }, [editingPackage, isOpen]);

  // Compiled Packages for Review
  const [constructedPackage, setConstructedPackage] = useState<ExamResourcePackage | null>(null);
  const [constructedKeys, setConstructedKeys] = useState<ExamAnswerKeyPackage | null>(null);
  const [validationReport, setValidationReport] = useState<PackageValidationReport | null>(null);

  // Saving & Post-save assignment
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedPackageId, setSavedPackageId] = useState<string | null>(null);
  const [selectedSessionToAssign, setSelectedSessionToAssign] = useState<string>('2026-10-17');
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);

  // Audio Preview Object URL lifecycle management
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // 1. Handle Audio File Selection
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioUploadError(null);
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      setAudioUploadError(validation.error || 'Invalid audio file.');
      return;
    }

    setAudioFile(file);
    setAudioFormat(validation.detectedFormat);

    // Measure duration using in-browser probe
    const probe = await probeAudioFile(file);
    setAudioDuration(probe.durationSeconds);

    // Revoke any previous preview object URL to prevent memory leaks
    if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    // Create immediate local object URL for previewing in browser
    const localUrl = createLocalAudioPreviewUrl(file);
    previewUrlRef.current = localUrl;
    setAudioSrc(localUrl);
  };

  // 2. Perform live upload if requested
  const handleUploadAudioToCloud = async () => {
    if (!audioFile) return;
    setAudioUploadError(null);

    try {
      const result = await uploadExamAudio(audioFile, packageId, (progress) => {
        setAudioUploadProgress(progress);
      });
      setAudioSrc(result.downloadUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setAudioUploadError(msg);
    }
  };

  // 3. Compile Raw Form Data into Strict ExamResourcePackage + AnswerKeys
  const buildPackages = (): { pkg: ExamResourcePackage; keys: ExamAnswerKeyPackage } => {
    // Parse Reading Passages
    let passages = readingFileMode === 'single'
      ? parseReadingSingleFile(readingSingleContent || 'Recent neuro-imaging investigations demonstrate that human brains do not possess dedicated genetic circuitry for reading; rather, the reading circuit emerges from neuro-plastic repurposing of visual and linguistic processing hubs.')
      : parseReadingSeparateFiles(readingPassageFiles);

    if (passages.length === 0) {
      passages = [
        {
          id: 'r_passage_01',
          passageNumber: 1,
          title: 'The Neural Architecture of Deep Reading',
          body: 'Recent neuro-imaging investigations demonstrate that human brains do not possess dedicated genetic circuitry for reading.',
          wordCount: 15,
        },
      ];
    }

    // Parse Questions & Confidential Answer Keys
    const listeningData = parseQuestionsData(
      listeningQuestionsText || JSON.stringify([
        { number: 1, type: 'note_completion', prompt: 'Caller Last Name:', placeholder: 'e.g. Harrison', answerKey: ['harrison', 'harison'] },
        { number: 2, type: 'note_completion', prompt: 'Room accommodation type:', placeholder: 'e.g. Executive Double', answerKey: ['executive double', 'double'] },
      ]),
      'listening'
    );

    const readingData = parseQuestionsData(
      readingQuestionsText || JSON.stringify([
        { number: 1, type: 'tfng', prompt: 'The human brain has biologically pre-programmed genetic circuitry solely dedicated to reading.', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answerKey: ['FALSE'] },
        { number: 2, type: 'short_answer', prompt: 'Which brain structure alongside the left angular gyrus is highlighted?', placeholder: 'Write NO MORE THAN TWO WORDS', answerKey: ['hippocampus'] },
      ]),
      'reading'
    );

    const pkg: ExamResourcePackage = {
      id: packageId.trim(),
      title: title.trim() || 'Untitled IELTS Resource Package',
      module,
      version: version.trim() || '2026.1',
      status: editingPackage ? editingPackage.status : 'draft', // Preserve status or default to draft
      createdAt: editingPackage ? editingPackage.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedSessions: editingPackage ? (editingPackage.assignedSessions || []) : [],
      listening: {
        audioSrc: audioSrc.trim(),
        title: `${title} - Listening Section`,
        durationSeconds: audioDuration,
        sectionsCount: 1,
        questions: listeningData.questions,
      },
      reading: {
        passages,
        questions: readingData.questions,
      },
      writing: {
        task1: {
          taskNumber: 1,
          title: `${module} Writing Task 1`,
          prompt: writingTask1Prompt.trim(),
          minimumWords: writingTask1MinWords,
          suggestedMinutes: 20,
          chartUrl: writingTask1ChartUrl.trim() || undefined,
          chartDescription: writingTask1ChartDesc.trim() || undefined,
        },
        task2: {
          taskNumber: 2,
          title: `${module} Writing Task 2`,
          prompt: writingTask2Prompt.trim(),
          minimumWords: writingTask2MinWords,
          suggestedMinutes: 40,
        },
      },
    };

    const keys: ExamAnswerKeyPackage = {
      id: packageId.trim(),
      packageId: packageId.trim(),
      listeningKeys: listeningData.answerKeys,
      readingKeys: readingData.answerKeys,
      updatedAt: new Date().toISOString(),
    };

    return { pkg, keys };
  };

  // Step 1 -> Step 2: Validate
  const handleProceedToValidate = () => {
    const { pkg, keys } = buildPackages();
    const report = validateExamPackage(pkg, keys);
    setConstructedPackage(pkg);
    setConstructedKeys(keys);
    setValidationReport(report);
    setCurrentStep('validate');
  };

  // Step 2 -> Step 3: Preview
  const handleProceedToPreview = () => {
    setCurrentStep('preview');
  };

  // Step 3 -> Step 4: Confirm
  const handleProceedToConfirm = () => {
    setCurrentStep('confirm');
  };

  // Step 4 -> Step 5: Save as Draft
  const handleConfirmSaveDraft = async () => {
    if (!constructedPackage) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      // Strictly enforce status 'draft'
      const draftPkg: ExamResourcePackage = {
        ...constructedPackage,
        status: 'draft',
      };

      await saveExamPackage(draftPkg, constructedKeys);
      setSavedPackageId(draftPkg.id);
      setCurrentStep('saved');
      onSuccess();
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save draft package');
    } finally {
      setIsSaving(false);
    }
  };

  // Step 5: Assign to Session
  const handleAssignToSession = async () => {
    if (!savedPackageId || !selectedSessionToAssign) return;
    try {
      await assignPackageToSessionExclusively(savedPackageId, selectedSessionToAssign);
      setAssignmentNotice(`Package assigned exclusively to session ${selectedSessionToAssign}.`);
      onSuccess();
    } catch (err) {
      setAssignmentNotice(`Assignment failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#1E0F36] border border-[#E5E1EB] dark:border-[#361F5B] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between bg-[#F7F7FB] dark:bg-[#130922]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#35145A] dark:bg-[#8E54DC] text-white flex items-center justify-center shadow-sm">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                {editingPackage ? `Edit Package: ${editingPackage.title}` : 'IELTS Resource Import & Creation Wizard'}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">
                <span>{editingPackage ? 'Updating Registered Material' : 'Phase 2C-1 Resource Workflow'}</span>
                <span>•</span>
                <span className="font-mono font-semibold text-[#35145A] dark:text-[#8E54DC]">
                  Step: {currentStep.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#716A7B] hover:text-[#211A2B] dark:text-[#ABA1BC] dark:hover:text-[#F7F5FA] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Steps Bar */}
        <div className="px-6 py-2.5 bg-[#F0EAF8]/50 dark:bg-[#26133E]/40 border-b border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between text-xs overflow-x-auto">
          {[
            { id: 'select', label: '1. Select & Configure' },
            { id: 'validate', label: '2. Validate' },
            { id: 'preview', label: '3. Examiner Preview' },
            { id: 'confirm', label: '4. Confirm' },
            { id: 'saved', label: '5. Save & Assign' },
          ].map((s, idx) => {
            const isCurrent = currentStep === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    isCurrent
                      ? 'bg-[#35145A] text-white dark:bg-[#8E54DC]'
                      : 'text-[#716A7B] dark:text-[#ABA1BC]'
                  }`}
                >
                  {s.label}
                </span>
                {idx < 4 && <span className="text-[#C5B8D8] dark:text-[#4A2D73]">→</span>}
              </div>
            );
          })}
        </div>

        {/* Wizard Step Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: SELECT & CONFIGURE */}
          {currentStep === 'select' && (
            <div className="space-y-6">
              {/* Metadata Section */}
              <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 1. Package Metadata
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#211A2B] dark:text-[#F7F5FA] mb-1">
                      Package Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. IELTS Academic Mock Exam 2 (November 2026)"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-1 focus:ring-[#8E54DC]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#211A2B] dark:text-[#F7F5FA] mb-1">
                      Package Identifier (ID) *
                    </label>
                    <input
                      type="text"
                      value={packageId}
                      onChange={(e) => setPackageId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] font-mono text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-1 focus:ring-[#8E54DC]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#211A2B] dark:text-[#F7F5FA] mb-1">
                      Exam Module
                    </label>
                    <select
                      value={module}
                      onChange={(e) => setModule(e.target.value as ExamModule)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA]"
                    >
                      <option value="Academic">Academic</option>
                      <option value="General Training">General Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#211A2B] dark:text-[#F7F5FA] mb-1">
                      Version
                    </label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] font-mono text-[#211A2B] dark:text-[#F7F5FA]"
                    />
                  </div>
                </div>
              </div>

              {/* Listening Audio Section */}
              <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC] flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5" /> 2. Listening Audio File (MP3, WAV, M4A, OGG)
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    Max 50MB
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="px-4 py-2.5 rounded-xl border-2 border-dashed border-[#8E54DC]/50 hover:border-[#8E54DC] bg-purple-50/50 dark:bg-[#26133E]/40 text-[#35145A] dark:text-[#8E54DC] font-semibold cursor-pointer flex items-center gap-2 transition-colors">
                      <FileAudio className="w-4 h-4" />
                      <span>{audioFile ? audioFile.name : 'Choose Audio File...'}</span>
                      <input
                        type="file"
                        accept=".mp3,.wav,.m4a,.ogg,audio/*"
                        onChange={handleAudioFileChange}
                        className="hidden"
                      />
                    </label>

                    {audioFile && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">
                          {audioFormat} · {(audioFile.size / (1024 * 1024)).toFixed(1)}MB · {audioDuration}s
                        </span>
                        {storageReady ? (
                          <button
                            type="button"
                            onClick={handleUploadAudioToCloud}
                            disabled={Boolean(audioUploadProgress && audioUploadProgress.status === 'uploading')}
                            className="px-3 py-1.5 rounded-lg bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] text-white font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload to Storage</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onOpenStorageGuide}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-semibold cursor-pointer text-[10px]"
                          >
                            Storage Diagnostic
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {audioUploadProgress && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Upload Progress ({audioUploadProgress.status})</span>
                        <span className="font-mono">{audioUploadProgress.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-[#E5E1EB] dark:bg-[#361F5B] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#8E54DC] h-full transition-all duration-300"
                          style={{ width: `${audioUploadProgress.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {audioUploadError && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs border border-rose-200 dark:border-rose-900/50 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{audioUploadError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-[#716A7B] dark:text-[#ABA1BC] mb-1">
                      Audio Source Reference URL / Asset Path:
                    </label>
                    <input
                      type="text"
                      value={audioSrc}
                      onChange={(e) => setAudioSrc(e.target.value)}
                      placeholder="/audio/ielts_listening_section1.wav"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] font-mono text-[11px] text-[#211A2B] dark:text-[#F7F5FA]"
                    />
                  </div>
                </div>
              </div>

              {/* Reading Passages Section */}
              <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> 3. Reading Passages (Single 3-Passage File or 3 Separate Files)
                  </h3>
                  <div className="flex items-center gap-1 bg-[#E5E1EB] dark:bg-[#361F5B] p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setReadingFileMode('single')}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                        readingFileMode === 'single'
                          ? 'bg-white dark:bg-[#1E0F36] text-[#35145A] dark:text-[#8E54DC] shadow-sm'
                          : 'text-[#716A7B] dark:text-[#ABA1BC]'
                      }`}
                    >
                      Single File (1-3 Passages)
                    </button>
                    <button
                      type="button"
                      onClick={() => setReadingFileMode('separate')}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                        readingFileMode === 'separate'
                          ? 'bg-white dark:bg-[#1E0F36] text-[#35145A] dark:text-[#8E54DC] shadow-sm'
                          : 'text-[#716A7B] dark:text-[#ABA1BC]'
                      }`}
                    >
                      3 Separate Files
                    </button>
                  </div>
                </div>

                {readingFileMode === 'single' ? (
                  <div className="space-y-2 text-xs">
                    <label className="block text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">
                      Paste passage text or JSON below (delimit passages with <code className="font-mono">--- PASSAGE 2 ---</code> or JSON object):
                    </label>
                    <textarea
                      rows={4}
                      value={readingSingleContent}
                      onChange={(e) => setReadingSingleContent(e.target.value)}
                      placeholder="Recent neuro-imaging investigations demonstrate that human brains do not possess dedicated genetic circuitry for reading... --- PASSAGE 2 --- Modern agricultural biotechnology..."
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-xs text-[#211A2B] dark:text-[#F7F5FA] font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <p className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">
                      Upload up to 3 separate text/markdown files for Passage 1, Passage 2, and Passage 3:
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.json"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        const loaded = await Promise.all(
                          files.map(async (f) => ({ filename: f.name, content: await f.text() }))
                        );
                        setReadingPassageFiles(loaded);
                      }}
                      className="text-xs"
                    />
                    {readingPassageFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {readingPassageFiles.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC] font-mono text-[11px]"
                          >
                            Passage {i + 1}: {f.filename} ({f.content.split(/\s+/).length} words)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Questions & Answer Keys */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-2">
                  <h4 className="text-xs font-bold text-[#35145A] dark:text-[#8E54DC] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Listening Questions (JSON or formatted text)
                  </h4>
                  <textarea
                    rows={4}
                    value={listeningQuestionsText}
                    onChange={(e) => setListeningQuestionsText(e.target.value)}
                    placeholder='[{"number": 1, "prompt": "Caller Last Name:", "answerKey": ["harrison"]}]'
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[11px] font-mono"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-2">
                  <h4 className="text-xs font-bold text-[#35145A] dark:text-[#8E54DC] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Reading Questions (JSON or formatted text)
                  </h4>
                  <textarea
                    rows={4}
                    value={readingQuestionsText}
                    onChange={(e) => setReadingQuestionsText(e.target.value)}
                    placeholder='[{"number": 1, "type": "tfng", "prompt": "The brain has...", "options": ["TRUE","FALSE"], "answerKey": ["FALSE"]}]'
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[11px] font-mono"
                  />
                </div>
              </div>

              {/* Writing Prompts Section */}
              <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC] flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5" /> 4. Writing Prompts (Task 1 & Task 2)
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Writing Task 1 Prompt (Min {writingTask1MinWords} words):</label>
                    <textarea
                      rows={2}
                      value={writingTask1Prompt}
                      onChange={(e) => setWritingTask1Prompt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#716A7B] dark:text-[#ABA1BC] mb-1">
                        Task 1 Diagram/Chart Image URL (Optional):
                      </label>
                      <input
                        type="text"
                        value={writingTask1ChartUrl}
                        onChange={(e) => setWritingTask1ChartUrl(e.target.value)}
                        placeholder="https://example.com/charts/task1_barchart.png"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#716A7B] dark:text-[#ABA1BC] mb-1">
                        Visual Specification / Description:
                      </label>
                      <input
                        type="text"
                        value={writingTask1ChartDesc}
                        onChange={(e) => setWritingTask1ChartDesc(e.target.value)}
                        placeholder="Comparative bar chart illustrating four testing centers..."
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Writing Task 2 Prompt (Min {writingTask2MinWords} words):</label>
                    <textarea
                      rows={2}
                      value={writingTask2Prompt}
                      onChange={(e) => setWritingTask2Prompt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VALIDATE */}
          {currentStep === 'validate' && validationReport && (
            <div className="space-y-6">
              <div
                className={`p-4 rounded-xl flex items-center justify-between border ${
                  validationReport.isValid
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {validationReport.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold">
                      {validationReport.isValid ? 'Validation Passed: Package Ready for Preview' : 'Validation Failed: Fix Structural Issues'}
                    </h3>
                    <p className="text-xs opacity-90">
                      {validationReport.errorCount} Error(s) · {validationReport.warningCount} Warning(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                {validationReport.checks.map((chk) => (
                  <div
                    key={chk.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      chk.passed
                        ? 'bg-white dark:bg-[#1E0F36] border-[#E5E1EB] dark:border-[#361F5B]'
                        : chk.severity === 'error'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : chk.severity === 'error' ? (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold">{chk.label}</div>
                        <div className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">{chk.message}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        chk.passed
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : chk.severity === 'error'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {chk.passed ? 'PASSED' : chk.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {currentStep === 'preview' && constructedPackage && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#8E54DC]" />
                  <span>Examiner Pre-Flight Inspection Mode: Live in-browser candidate view verification.</span>
                </div>
              </div>

              {/* Listening Preview */}
              <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-3">
                <h4 className="text-xs font-bold text-[#35145A] dark:text-[#8E54DC] flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5" /> Listening Section Audio Player
                </h4>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1E0F36] rounded-xl border border-[#E5E1EB] dark:border-[#361F5B]">
                  <audio controls src={constructedPackage.listening.audioSrc} className="w-full h-8" />
                </div>
                <div className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">
                  {constructedPackage.listening.questions.length} Question(s) mapped to Audio Track.
                </div>
              </div>

              {/* Reading Passages Preview */}
              <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-3">
                <h4 className="text-xs font-bold text-[#35145A] dark:text-[#8E54DC] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Reading Stimulus ({constructedPackage.reading.passages.length} Passages)
                </h4>
                <div className="space-y-2">
                  {constructedPackage.reading.passages.map((p) => (
                    <div key={p.id} className="p-3 bg-white dark:bg-[#1E0F36] rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] text-xs">
                      <div className="font-bold">{p.title} ({p.wordCount || 0} words)</div>
                      <p className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC] mt-1 line-clamp-3">{p.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Writing Prompts Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B]">
                  <div className="font-bold text-[#35145A] dark:text-[#8E54DC]">Task 1 (Min 150 words)</div>
                  <p className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC] mt-1">{constructedPackage.writing.task1.prompt}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B]">
                  <div className="font-bold text-[#35145A] dark:text-[#8E54DC]">Task 2 (Min 250 words)</div>
                  <p className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC] mt-1">{constructedPackage.writing.task2.prompt}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM */}
          {currentStep === 'confirm' && constructedPackage && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 text-xs space-y-2">
                <h3 className="font-bold text-sm text-[#35145A] dark:text-[#8E54DC] flex items-center gap-2">
                  <FileCheck className="w-4 h-4" /> Ready to Save Package as DRAFT
                </h3>
                <p className="text-[#716A7B] dark:text-[#ABA1BC]">
                  In accordance with Phase 2C-1 security requirements, this resource will be saved strictly as <strong>draft</strong>. It will not be published or visible to candidates until explicitly assigned to an exam session and verified.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] text-xs space-y-2 font-mono">
                <div>Package ID: <strong>{constructedPackage.id}</strong></div>
                <div>Title: <strong>{constructedPackage.title}</strong></div>
                <div>Module: <strong>{constructedPackage.module}</strong></div>
                <div>Listening Questions: <strong>{constructedPackage.listening.questions.length}</strong></div>
                <div>Reading Passages: <strong>{constructedPackage.reading.passages.length}</strong></div>
                <div>Status to Save: <strong className="text-amber-600 dark:text-amber-400">DRAFT (Unpublished)</strong></div>
              </div>

              {saveError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: SAVED AS DRAFT & ASSIGN */}
          {currentStep === 'saved' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Exam Package Successfully Saved as DRAFT!
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300/90 max-w-md mx-auto leading-relaxed">
                  Package <code className="font-mono font-bold bg-white/60 dark:bg-black/30 px-1.5 py-0.5 rounded">{savedPackageId}</code> is safely stored in Firestore. Answer keys are strictly isolated in <code className="font-mono">/exam_answer_keys</code>.
                </p>
              </div>

              {/* Session Assignment Section */}
              <div className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#130922] border border-[#E5E1EB] dark:border-[#361F5B] space-y-4 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#8E54DC]" />
                  <h4 className="font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                    Assign Exclusively to Upcoming Exam Session
                  </h4>
                </div>
                <p className="text-[#716A7B] dark:text-[#ABA1BC]">
                  Select the examination session date. Exclusive assignment guarantees that assigning this resource to one session cannot accidentally replace the resources of another session.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <select
                    value={selectedSessionToAssign}
                    onChange={(e) => setSelectedSessionToAssign(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA]"
                  >
                    <option value="2026-10-17">Saturday, Oct 17, 2026 (Chilanzar Station)</option>
                    <option value="2026-10-18">Sunday, Oct 18, 2026 (Chilanzar Station)</option>
                    <option value="2026-10-24">Saturday, Oct 24, 2026 (Chilanzar Station)</option>
                    <option value="2026-10-25">Sunday, Oct 25, 2026 (Chilanzar Station)</option>
                    <option value="2026-10-31">Saturday, Oct 31, 2026 (Chilanzar Station)</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAssignToSession}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Assign to Session</span>
                  </button>
                </div>

                {assignmentNotice && (
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 text-xs border border-purple-200 dark:border-purple-900/50">
                    {assignmentNotice}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-4 border-t border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between bg-[#F7F7FB] dark:bg-[#130922]">
          {currentStep !== 'select' && currentStep !== 'saved' ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 'validate') setCurrentStep('select');
                if (currentStep === 'preview') setCurrentStep('validate');
                if (currentStep === 'confirm') setCurrentStep('preview');
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-[#716A7B] dark:text-[#ABA1BC] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            {currentStep === 'select' && (
              <button
                type="button"
                onClick={handleProceedToValidate}
                disabled={!title.trim()}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <span>Validate Package</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 'validate' && (
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Proceed to Preview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 'preview' && (
              <button
                type="button"
                onClick={handleProceedToConfirm}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Confirm Draft</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 'confirm' && (
              <button
                type="button"
                onClick={handleConfirmSaveDraft}
                disabled={isSaving}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Saving Draft...' : 'Save as Draft'}</span>
              </button>
            )}

            {currentStep === 'saved' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuccess();
                }}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] text-white cursor-pointer shadow-sm"
              >
                Finish & View in Catalog
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
