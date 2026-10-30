export type ExamModule = 'Academic' | 'General Training';

export type ResourceStatus = 'draft' | 'review' | 'published' | 'archived';

export type QuestionType = 
  | 'note_completion' 
  | 'multiple_choice' 
  | 'matching' 
  | 'tfng' // True / False / Not Given
  | 'yes_no_not_given'
  | 'short_answer'
  | 'sentence_completion';

export interface QuestionItem {
  id: string;
  number: number;
  type: QuestionType;
  prompt: string;
  options?: string[]; // for multiple choice
  placeholder?: string;
  sectionNumber?: number; // 1-4 for Listening
  passageNumber?: number; // 1-3 for Reading
}

export interface ListeningResource {
  audioSrc: string; // URL or local asset path
  testSoundSrc?: string;
  title: string;
  durationSeconds: number;
  fileSizeBytes?: number;
  sectionsCount: number;
  transcript?: string; // Kept for examiner evaluation / transcripts
  questions: QuestionItem[];
}

export interface ReadingPassage {
  id: string;
  passageNumber: number; // 1, 2, or 3
  title: string;
  subtitle?: string;
  body: string;
  wordCount?: number;
}

export interface ReadingResource {
  passages: ReadingPassage[];
  questions: QuestionItem[];
}

export interface WritingTask {
  taskNumber: 1 | 2;
  title: string;
  prompt: string;
  minimumWords: number; // 150 for Task 1, 250 for Task 2
  suggestedMinutes: number; // 20 for Task 1, 40 for Task 2
  chartDescription?: string;
  chartUrl?: string; // Optional stimulus diagram/chart for Task 1
}

export interface WritingResource {
  task1: WritingTask;
  task2: WritingTask;
}

/**
 * Candidate-Facing Exam Resource Package.
 * CRITICAL SECURITY INVARIANT:
 * This package NEVER contains correct answer keys.
 * It contains only stimulus materials, questions, prompts, and audio paths.
 */
export interface ExamResourcePackage {
  id: string; // e.g. "pkg_academic_2026_01"
  title: string;
  module: ExamModule;
  version: string;
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
  assignedSessions?: string[]; // array of session dates or IDs
  listening: ListeningResource;
  reading: ReadingResource;
  writing: WritingResource;
}

/**
 * Confidential Answer Keys Package.
 * CRITICAL SECURITY INVARIANT:
 * Stored in an isolated collection (/exam_answer_keys/{packageId})
 * accessible ONLY by elevated administrators and verified examiners.
 * Candidates are completely blocked from reading this collection by firestore.rules.
 */
export interface ExamAnswerKeyPackage {
  id: string; // package ID
  packageId: string;
  listeningKeys: Record<string, string[]>; // e.g. { q1: ['harrison', 'harison'], ... }
  readingKeys: Record<string, string[]>; // e.g. { q1: ['TRUE'], q2: ['hippocampus'] }
  writingCriteria?: {
    task1Rubric: string[];
    task2Rubric: string[];
  };
  updatedAt: string;
}

/**
 * Automated Validation Result for an Exam Resource Package
 */
export interface ValidationCheck {
  id: string;
  label: string;
  passed: boolean;
  severity: 'error' | 'warning';
  message: string;
}

export interface PackageValidationReport {
  isValid: boolean;
  canPublish: boolean;
  errorCount: number;
  warningCount: number;
  checks: ValidationCheck[];
}

/**
 * Validates an Exam Resource Package and its Answer Keys before publishing
 */
export function validateExamPackage(
  pkg: ExamResourcePackage,
  keys?: ExamAnswerKeyPackage | null
): PackageValidationReport {
  const checks: ValidationCheck[] = [];

  // 1. Metadata checks
  checks.push({
    id: 'meta-title',
    label: 'Package Title and ID',
    passed: Boolean(pkg.id && pkg.id.trim() && pkg.title && pkg.title.trim()),
    severity: 'error',
    message: pkg.title ? 'Package title and identifier configured.' : 'Package ID and Title are required.',
  });

  checks.push({
    id: 'meta-module',
    label: 'Module Designation',
    passed: ['Academic', 'General Training'].includes(pkg.module),
    severity: 'error',
    message: `Module set to ${pkg.module}.`,
  });

  // 2. Listening checks
  const hasAudioSrc = Boolean(pkg.listening?.audioSrc && pkg.listening.audioSrc.trim());
  checks.push({
    id: 'listening-audio-src',
    label: 'Listening Audio Asset Path / URL',
    passed: hasAudioSrc,
    severity: 'error',
    message: hasAudioSrc ? `Audio source configured: ${pkg.listening.audioSrc}` : 'Listening audio file URL or asset path is missing.',
  });

  const validDuration = (pkg.listening?.durationSeconds || 0) > 0;
  checks.push({
    id: 'listening-duration',
    label: 'Audio Duration Registered',
    passed: validDuration,
    severity: 'warning',
    message: validDuration ? `Estimated duration: ${pkg.listening.durationSeconds}s` : 'Audio duration not specified.',
  });

  const listeningQCount = pkg.listening?.questions?.length || 0;
  checks.push({
    id: 'listening-questions',
    label: 'Listening Questions Configured',
    passed: listeningQCount > 0,
    severity: 'error',
    message: `${listeningQCount} listening question(s) defined.`,
  });

  // 3. Reading checks
  const readingPassageCount = pkg.reading?.passages?.length || 0;
  const hasPassageText = pkg.reading?.passages?.every((p) => p.body && p.body.length > 50) ?? false;
  checks.push({
    id: 'reading-passages',
    label: 'Reading Stimulus Passages',
    passed: readingPassageCount > 0 && hasPassageText,
    severity: 'error',
    message: `${readingPassageCount} passage(s) provided with sufficient text.`,
  });

  const readingQCount = pkg.reading?.questions?.length || 0;
  checks.push({
    id: 'reading-questions',
    label: 'Reading Questions Configured',
    passed: readingQCount > 0,
    severity: 'error',
    message: `${readingQCount} reading question(s) defined.`,
  });

  // 4. Writing checks
  const task1Valid = Boolean(
    pkg.writing?.task1?.prompt &&
    pkg.writing.task1.prompt.length > 20 &&
    pkg.writing.task1.minimumWords >= 150
  );
  checks.push({
    id: 'writing-task1',
    label: 'Writing Task 1 Prompt (Min 150 words)',
    passed: task1Valid,
    severity: 'error',
    message: task1Valid ? 'Task 1 meets IELTS specifications (≥150 words requirement).' : 'Task 1 prompt missing or minimum words < 150.',
  });

  const task2Valid = Boolean(
    pkg.writing?.task2?.prompt &&
    pkg.writing.task2.prompt.length > 20 &&
    pkg.writing.task2.minimumWords >= 250
  );
  checks.push({
    id: 'writing-task2',
    label: 'Writing Task 2 Prompt (Min 250 words)',
    passed: task2Valid,
    severity: 'error',
    message: task2Valid ? 'Task 2 meets IELTS specifications (≥250 words requirement).' : 'Task 2 prompt missing or minimum words < 250.',
  });

  // 5. Security & Answer Key Isolation checks
  // Candidate package must NOT contain answer key fields directly or inside question items
  const rawPkg = pkg as unknown as Record<string, unknown>;
  const rootKeyLeak = Boolean(
    rawPkg['answerKeys'] || rawPkg['keys'] || rawPkg['answers'] || rawPkg['correctAnswers'] || rawPkg['solution']
  );
  
  // Inspect individual listening questions for embedded answers
  const listeningQuestionLeak = (pkg.listening?.questions || []).some((q: any) =>
    Boolean(q.answerKey || q.correctAnswer || q.answer || q.keys || q.solution || q.expectedAnswer)
  );

  // Inspect individual reading questions for embedded answers
  const readingQuestionLeak = (pkg.reading?.questions || []).some((q: any) =>
    Boolean(q.answerKey || q.correctAnswer || q.answer || q.keys || q.solution || q.expectedAnswer)
  );

  const keyLeakDetected = rootKeyLeak || listeningQuestionLeak || readingQuestionLeak;

  checks.push({
    id: 'security-key-isolation',
    label: 'Candidate Data Security (No Key Leakage)',
    passed: !keyLeakDetected,
    severity: 'error',
    message: !keyLeakDetected
      ? 'Pass: Candidate package has no embedded answer keys in root or question items.'
      : 'Security Violation: Confidential answer keys detected within candidate package or question definitions.',
  });

  // Check if examiner answer keys exist in the separate package
  if (keys) {
    const listeningKeyCount = Object.keys(keys.listeningKeys || {}).length;
    const readingKeyCount = Object.keys(keys.readingKeys || {}).length;
    const hasKeys = listeningKeyCount > 0 && readingKeyCount > 0;
    checks.push({
      id: 'answer-keys-coverage',
      label: 'Confidential Answer Keys Registered',
      passed: hasKeys,
      severity: 'error',
      message: `Answer keys configured: ${listeningKeyCount} Listening, ${readingKeyCount} Reading.`,
    });
  } else {
    checks.push({
      id: 'answer-keys-coverage',
      label: 'Confidential Answer Keys Registered',
      passed: false,
      severity: 'warning',
      message: 'No separate answer keys package loaded. Required before publishing for automatic scoring.',
    });
  }

  const errors = checks.filter((c) => !c.passed && c.severity === 'error');
  const warnings = checks.filter((c) => !c.passed && c.severity === 'warning');

  return {
    isValid: errors.length === 0,
    canPublish: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    checks,
  };
}

/**
 * Audio Resolution Type Definitions for Phase 2C-2
 */
export type AudioResolutionStatus =
  | 'assigned_resource'
  | 'dev_sample_fallback'
  | 'missing_or_unassigned'
  | 'invalid_source';

export interface AudioMetadata {
  packageId?: string;
  packageTitle?: string;
  version?: string;
  fileSizeBytes?: number;
  sectionsCount?: number;
  assignedSession?: string;
  isDevSample: boolean;
  storageType: 'firebase_storage' | 'supabase_storage' | 'local_sample' | 'none';
}

export interface AudioResolutionResult {
  status: AudioResolutionStatus;
  audioSrc?: string;
  testSoundSrc?: string;
  title: string;
  durationSeconds: number;
  metadata: AudioMetadata;
  errorMessage?: string;
}

export interface AudioResolutionOptions {
  sessionDateOrId?: string;
  allowDevSampleFallback?: boolean;
}
