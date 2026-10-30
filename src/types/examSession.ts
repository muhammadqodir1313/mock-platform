/**
 * Unified Exam Session State Model
 * Phase 2D-1: Unified Exam Session Persistence & Crash Recovery
 *
 * Defines the complete typed schema for in-progress candidate examination attempts,
 * ensuring crash resilience, multi-candidate isolation, and backward compatibility.
 */

export type ExamModuleType = 'listening' | 'reading' | 'writing';

export interface ExamModuleCompletion {
  listening: boolean;
  reading: boolean;
  writing: boolean;
}

export interface ExamSubmissionStatus {
  listening: 'not_started' | 'in_progress' | 'completed';
  reading: 'not_started' | 'in_progress' | 'completed';
  writing: 'not_started' | 'in_progress' | 'completed';
  overall: 'in_progress' | 'completed';
}

export interface ExamTimerMetadata {
  listeningRemainingSeconds: number;
  readingRemainingSeconds?: number;
  writingRemainingSeconds?: number;
  lastUpdatedTimestamp: number;
}

export interface UnifiedExamSessionState {
  /** Schema version for migrations (v1) */
  schemaVersion: number;

  /** Authoritative Candidate UID from Firebase Auth (or 'anonymous' for guest preview) */
  candidateUid: string;

  /** Candidate Email (informational, not used for auth) */
  candidateEmail?: string | null;

  /** Active Exam Session Date or Identifier (e.g., '2026-10-17') */
  sessionId: string;

  /** Assigned Exam Resource Package ID (e.g., 'pkg_academic_simulation_01') */
  packageId?: string;

  /** Module: Academic or General Training */
  module: 'Academic' | 'General Training';

  /** Current active view module */
  activeModule: ExamModuleType;

  /** Module prerequisite locks and completion flags */
  moduleCompletion: ExamModuleCompletion;

  /** Strict listening audio single-play verification */
  isListeningAudioComplete: boolean;

  /** Candidate answers for Listening (e.g., { q1: 'Harrison', q2: 'Executive Double' }) */
  listeningAnswers: Record<string, string>;

  /** Candidate answers for Reading (e.g., { q1: 'TRUE', q2: 'seed germinating' }) */
  readingAnswers: Record<string, string>;

  /** Candidate draft for Writing Task 1 (Academic Report / GT Letter) */
  writingTask1Draft: string;

  /** Candidate draft for Writing Task 2 (Essay) */
  writingTask2Draft: string;

  /** Submission lifecycle status */
  submissionStatus: ExamSubmissionStatus;

  /** Submitted attempt IDs in Firestore to prevent duplicate submissions */
  submittedAttemptIds?: {
    listening?: string;
    reading?: string;
    writing?: string;
    unified?: string;
  };

  /** Timer countdown metadata */
  timer: ExamTimerMetadata;

  /** ISO-8601 creation timestamp */
  createdAt: string;

  /** ISO-8601 last saved timestamp (for conflict resolution) */
  lastSavedAt: string;

  /** ISO-8601 last successful server-sync timestamp */
  serverSyncedAt?: string;
}

export const CURRENT_EXAM_SESSION_SCHEMA_VERSION = 1;

/**
 * Creates a clean, initialized default session state for a given candidate and session.
 */
export function createDefaultExamSessionState(
  candidateUid: string,
  sessionId: string,
  options?: {
    candidateEmail?: string | null;
    packageId?: string;
    module?: 'Academic' | 'General Training';
    initialModule?: ExamModuleType;
  }
): UnifiedExamSessionState {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_EXAM_SESSION_SCHEMA_VERSION,
    candidateUid: candidateUid || 'anonymous',
    candidateEmail: options?.candidateEmail || null,
    sessionId: sessionId || 'trial',
    packageId: options?.packageId || 'pkg_academic_simulation_01',
    module: options?.module || 'Academic',
    activeModule: options?.initialModule || 'listening',
    moduleCompletion: {
      listening: false,
      reading: false,
      writing: false,
    },
    isListeningAudioComplete: false,
    listeningAnswers: {},
    readingAnswers: {
      q1: 'TRUE',
      q2: '',
    },
    writingTask1Draft: '',
    writingTask2Draft: '',
    submissionStatus: {
      listening: 'not_started',
      reading: 'not_started',
      writing: 'not_started',
      overall: 'in_progress',
    },
    submittedAttemptIds: {},
    timer: {
      listeningRemainingSeconds: 30 * 60,
      readingRemainingSeconds: 60 * 60,
      writingRemainingSeconds: 40 * 60,
      lastUpdatedTimestamp: Date.now(),
    },
    createdAt: now,
    lastSavedAt: now,
  };
}
