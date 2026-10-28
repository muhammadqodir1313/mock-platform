import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';

export interface BookingRecord {
  id: string;
  candidateId: string;
  fullName: string;
  phone: string;
  email: string;
  module: 'Academic' | 'General Training';
  preferredDate: string;
  referenceCode: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  notes?: string;
}

export interface TestAttemptRecord {
  id: string;
  candidateId: string;
  module: 'Academic' | 'General Training';
  testType: 'online' | 'offline';
  status: 'in_progress' | 'completed' | 'graded';
  answers?: Record<string, string>;
  rawListeningScore?: number;
  rawReadingScore?: number;
  overallBand?: number;
  createdAt: string;
  completedAt?: string;
}

export interface DiagnosticTRFRecord {
  id: string;
  attemptId: string;
  candidateId: string;
  overallBand: number;
  listeningBand: number;
  readingBand: number;
  writingBand: number;
  speakingBand: number;
  writingFeedback?: string;
  speakingFeedback?: string;
  examinerEmail?: string;
  issuedAt: string;
}

// 1. Create a new offline booking
export async function createBooking(data: Omit<BookingRecord, 'id' | 'candidateId' | 'status' | 'createdAt'>): Promise<BookingRecord> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Must be signed in to reserve a mock workstation');
  }

  const id = `b_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const booking: BookingRecord = {
    ...data,
    id,
    candidateId: user.uid,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  const path = `bookings/${id}`;
  try {
    await setDoc(doc(db, 'bookings', id), booking);
    return booking;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 2. Fetch candidate bookings
export async function getCandidateBookings(): Promise<BookingRecord[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const path = 'bookings';
  try {
    const q = query(collection(db, path), where('candidateId', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as BookingRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// 3. Save a completed test attempt
export async function saveTestAttempt(
  data: Omit<TestAttemptRecord, 'id' | 'candidateId' | 'createdAt'>
): Promise<TestAttemptRecord> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Must be signed in to submit an exam attempt');
  }

  const id = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const attempt: TestAttemptRecord = {
    ...data,
    id,
    candidateId: user.uid,
    createdAt: new Date().toISOString(),
  };

  const path = `test_attempts/${id}`;
  try {
    await setDoc(doc(db, 'test_attempts', id), attempt);
    return attempt;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 4. Fetch candidate test attempts
export async function getCandidateAttempts(): Promise<TestAttemptRecord[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const path = 'test_attempts';
  try {
    const q = query(collection(db, path), where('candidateId', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as TestAttemptRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// 5. Fetch candidate Diagnostic TRFs
export async function getCandidateTRFs(): Promise<DiagnosticTRFRecord[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const path = 'diagnostic_trfs';
  try {
    const q = query(collection(db, path), where('candidateId', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as DiagnosticTRFRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
