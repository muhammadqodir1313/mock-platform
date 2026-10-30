import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  where,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  ExamResourcePackage, 
  ExamAnswerKeyPackage,
  validateExamPackage,
  PackageValidationReport,
  AudioResolutionResult,
  AudioResolutionOptions
} from '../types/resources';

const EXAM_RESOURCES_COLLECTION = 'exam_resources';
const EXAM_KEYS_COLLECTION = 'exam_answer_keys';

/**
 * Default official template package modeling the verified Section 1 Listening audio,
 * Reading passage, and Writing tasks currently running in the simulator.
 */
export const DEFAULT_EXAM_PACKAGE: ExamResourcePackage = {
  id: 'pkg_academic_simulation_01',
  title: 'IELTS Academic Official Simulation Pack 1 (Chilanzar Station)',
  module: 'Academic',
  version: '2026.1',
  status: 'published',
  createdAt: '2026-10-13T09:00:00.000Z',
  updatedAt: '2026-10-13T09:00:00.000Z',
  assignedSessions: ['2026-10-17', '2026-10-18', '2026-10-24'],
  listening: {
    audioSrc: '/audio/ielts_listening_section1.wav',
    testSoundSrc: '/audio/sound_check.wav',
    title: 'Section 1: Hotel Conference Booking Inquiry',
    durationSeconds: 45,
    fileSizeBytes: 1982764, // 1.9MB
    sectionsCount: 1,
    transcript: 'Good morning, Carlton Conference Center, Sarah speaking. Hello, I would like to inquire about booking a conference room... Caller name is Mr. John Harrison... Room type required is an Executive Double...',
    questions: [
      { id: 'l_q1', number: 1, type: 'note_completion', prompt: 'Caller Last Name:', placeholder: 'e.g. Harrison', sectionNumber: 1 },
      { id: 'l_q2', number: 2, type: 'note_completion', prompt: 'Room accommodation type:', placeholder: 'e.g. Executive Double', sectionNumber: 1 },
      { id: 'l_q3', number: 3, type: 'note_completion', prompt: 'Total stay length (nights):', placeholder: 'e.g. 3', sectionNumber: 1 },
      { id: 'l_q4', number: 4, type: 'note_completion', prompt: 'Arrival date:', placeholder: 'e.g. 15th October', sectionNumber: 1 },
      { id: 'l_q5', number: 5, type: 'note_completion', prompt: 'Special dietary catering:', placeholder: 'e.g. Vegetarian', sectionNumber: 1 },
      { id: 'l_q6', number: 6, type: 'note_completion', prompt: 'Audio-visual equipment required:', placeholder: 'e.g. Data projector', sectionNumber: 1 },
      { id: 'l_q7', number: 7, type: 'note_completion', prompt: 'VIP car parking permit:', placeholder: 'e.g. Required', sectionNumber: 1 },
      { id: 'l_q8', number: 8, type: 'note_completion', prompt: 'Preferred payment method:', placeholder: 'e.g. Credit card', sectionNumber: 1 },
      { id: 'l_q9', number: 9, type: 'note_completion', prompt: 'Deposit amount (£):', placeholder: 'e.g. 150', sectionNumber: 1 },
      { id: 'l_q10', number: 10, type: 'note_completion', prompt: 'Booking reference code:', placeholder: 'e.g. WB-9421', sectionNumber: 1 },
    ],
  },
  reading: {
    passages: [
      {
        id: 'r_passage_01',
        passageNumber: 1,
        title: 'The Neural Architecture of Deep Reading',
        subtitle: 'Cognitive adaptations in digital vs. print text processing',
        wordCount: 380,
        body: `Recent neuro-imaging investigations demonstrate that human brains do not possess dedicated genetic circuitry for reading; rather, the reading circuit emerges from neuro-plastic repurposing of visual and linguistic processing hubs. When processing deep, complex expository prose on printed mediums, readers exhibit sustained activation within the left angular gyrus and the hippocampus, fostering inferential comprehension and retention.\n\nConversely, screen-based reading environments frequently trigger an alternate reading pathway characterized by rapid scanning, superficial keyword spotting, and diminished linear comprehension. Cognitive researchers term this phenomenon "skimming habituation," hypothesizing that fragmented digital interactions decrease executive focus necessary for critical synthesis.`,
      },
    ],
    questions: [
      {
        id: 'r_q1',
        number: 1,
        type: 'tfng',
        passageNumber: 1,
        prompt: 'The human brain has biologically pre-programmed genetic circuitry solely dedicated to reading written text.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      },
      {
        id: 'r_q2',
        number: 2,
        type: 'short_answer',
        passageNumber: 1,
        prompt: 'Which brain structure alongside the left angular gyrus is highlighted as essential for long-term memory consolidation during deep reading?',
        placeholder: 'Write NO MORE THAN TWO WORDS',
      },
    ],
  },
  writing: {
    task1: {
      taskNumber: 1,
      title: 'Academic Task 1: Data Report',
      prompt: 'The chart below shows the percentage of international students achieving Band 7.5 or higher across four testing centers between 2020 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      minimumWords: 150,
      suggestedMinutes: 20,
      chartDescription: 'Comparative bar chart illustrating four testing centers (Tashkent, Samarkand, London, Sydney) across 5 academic years.',
    },
    task2: {
      taskNumber: 2,
      title: 'Academic Task 2: Discursive Essay',
      prompt: 'Some people believe that artificial intelligence and computer-graded systems will eventually replace human language instructors in IELTS exam preparation. Others argue that human mentorship remains irreplaceable. Discuss both views and give your own opinion.',
      minimumWords: 250,
      suggestedMinutes: 40,
    },
  },
};

import { DEFAULT_EXAM_KEYS } from './adminExamKeys';
export { DEFAULT_EXAM_KEYS };


/**
 * 1. Fetch published packages for Candidates in Exam Simulator
 * Security: Firestore rules only allow candidates to read packages where status == 'published'.
 */
export async function getPublishedPackages(): Promise<ExamResourcePackage[]> {
  try {
    const q = query(
      collection(db, EXAM_RESOURCES_COLLECTION),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      // Fallback to initial verified simulation pack
      return [DEFAULT_EXAM_PACKAGE];
    }
    return snap.docs.map((d) => d.data() as ExamResourcePackage);
  } catch (error) {
    console.warn('Fallback to local default package:', error);
    return [DEFAULT_EXAM_PACKAGE];
  }
}

/**
 * 2. Fetch all packages (Drafts, Review, Published, Archived) for Administrator Console
 */
export async function getAllPackagesForAdmin(): Promise<ExamResourcePackage[]> {
  const path = EXAM_RESOURCES_COLLECTION;
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return [DEFAULT_EXAM_PACKAGE];
    }
    const packages = snap.docs.map((d) => d.data() as ExamResourcePackage);
    // Ensure default package is visible if not in DB
    if (!packages.some((p) => p.id === DEFAULT_EXAM_PACKAGE.id)) {
      packages.unshift(DEFAULT_EXAM_PACKAGE);
    }
    return packages;
  } catch (error) {
    console.warn('Fallback to default package in admin view:', error);
    return [DEFAULT_EXAM_PACKAGE];
  }
}

/**
 * 3. Fetch confidential answer keys for Administrator
 * Security: Firestore rules strictly restrict /exam_answer_keys to isAdmin().
 */
export async function getAnswerKeysForAdmin(packageId: string): Promise<ExamAnswerKeyPackage | null> {
  const user = auth.currentUser;
  if (!user) return null;

  if (packageId === DEFAULT_EXAM_PACKAGE.id) {
    return DEFAULT_EXAM_KEYS;
  }

  const path = `${EXAM_KEYS_COLLECTION}/${packageId}`;
  try {
    const docSnap = await getDoc(doc(db, EXAM_KEYS_COLLECTION, packageId));
    if (docSnap.exists()) {
      return docSnap.data() as ExamAnswerKeyPackage;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// In-flight save tracker to prevent duplicate concurrent submissions
const inFlightSaves = new Set<string>();

/**
 * 4. Save an exam package and its isolated answer keys (Administrator only)
 */
export async function saveExamPackage(
  pkg: ExamResourcePackage,
  keys?: ExamAnswerKeyPackage | null
): Promise<{ success: boolean; packageId: string; validation: PackageValidationReport }> {
  if (inFlightSaves.has(pkg.id)) {
    throw new Error(`A save operation for package ID "${pkg.id}" is already in progress. Duplicate submission prevented.`);
  }

  inFlightSaves.add(pkg.id);
  try {
    if (pkg.listening?.audioSrc?.startsWith('blob:')) {
      throw new Error(
        'Cannot save package with temporary browser "blob:" audio URL. Audio must be uploaded to Firebase Storage or reference a permanent asset.'
      );
    }
    if (pkg.writing?.task1?.chartUrl?.startsWith('blob:')) {
      throw new Error(
        'Cannot save package with temporary browser "blob:" diagram URL. Diagram must be uploaded to Firebase Storage or reference a permanent asset.'
      );
    }

    const validation = validateExamPackage(pkg, keys);
    if (!validation.isValid && pkg.status === 'published') {
      throw new Error(`Cannot publish package: ${validation.errorCount} validation error(s) detected.`);
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('Must be an authenticated administrator to save exam packages.');
    }

    // Defensive sanitation: Deep-strip any leaked answer keys from the candidate document
    const cleanCandidatePackage: ExamResourcePackage = {
      ...pkg,
      updatedAt: new Date().toISOString(),
    };
    const rawData = cleanCandidatePackage as unknown as Record<string, unknown>;
    delete rawData['answerKeys'];
    delete rawData['answers'];
    delete rawData['keys'];
    delete rawData['correctAnswers'];
    delete rawData['solution'];

    // Deep-clean listening questions so no candidate document contains answer keys
    if (cleanCandidatePackage.listening?.questions) {
      cleanCandidatePackage.listening.questions = cleanCandidatePackage.listening.questions.map((q) => {
        const rawQ = q as unknown as Record<string, unknown>;
        return {
          id: String(rawQ.id || ''),
          number: Number(rawQ.number || 0),
          type: (rawQ.type as any) || 'note_completion',
          prompt: String(rawQ.prompt || ''),
          ...(Array.isArray(rawQ.options) ? { options: rawQ.options.map(String) } : {}),
          ...(typeof rawQ.placeholder === 'string' ? { placeholder: rawQ.placeholder } : {}),
          ...(typeof rawQ.sectionNumber === 'number' ? { sectionNumber: rawQ.sectionNumber } : {}),
        };
      });
    }

    // Deep-clean reading questions so no candidate document contains answer keys
    if (cleanCandidatePackage.reading?.questions) {
      cleanCandidatePackage.reading.questions = cleanCandidatePackage.reading.questions.map((q) => {
        const rawQ = q as unknown as Record<string, unknown>;
        return {
          id: String(rawQ.id || ''),
          number: Number(rawQ.number || 0),
          type: (rawQ.type as any) || 'note_completion',
          prompt: String(rawQ.prompt || ''),
          ...(Array.isArray(rawQ.options) ? { options: rawQ.options.map(String) } : {}),
          ...(typeof rawQ.placeholder === 'string' ? { placeholder: rawQ.placeholder } : {}),
          ...(typeof rawQ.passageNumber === 'number' ? { passageNumber: rawQ.passageNumber } : {}),
        };
      });
    }

    const packageDocRef = doc(db, EXAM_RESOURCES_COLLECTION, pkg.id);

    try {
      await setDoc(packageDocRef, cleanCandidatePackage);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${EXAM_RESOURCES_COLLECTION}/${pkg.id}`);
    }

    // Save answer keys to the confidential isolated collection (/exam_answer_keys/{pkg_id})
    if (keys) {
      const keysDocRef = doc(db, EXAM_KEYS_COLLECTION, pkg.id);
      const keysData: ExamAnswerKeyPackage = {
        ...keys,
        id: pkg.id,
        packageId: pkg.id,
        updatedAt: new Date().toISOString(),
      };
      try {
        await setDoc(keysDocRef, keysData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${EXAM_KEYS_COLLECTION}/${pkg.id}`);
      }
    }

    return { success: true, packageId: pkg.id, validation };
  } finally {
    inFlightSaves.delete(pkg.id);
  }
}

/**
 * 5. Assign package to upcoming test session exclusively.
 * Ensures a resource assigned to one session cannot accidentally replace the resources of another session,
 * and removes the session from any other package where it was previously linked.
 */
export async function assignPackageToSessionExclusively(packageId: string, sessionDate: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthorized: Must be logged in as administrator');

  try {
    // 1. Find all packages currently having this sessionDate
    const q = query(
      collection(db, EXAM_RESOURCES_COLLECTION),
      where('assignedSessions', 'array-contains', sessionDate)
    );
    const snap = await getDocs(q);

    // Remove this sessionDate from other packages
    for (const d of snap.docs) {
      if (d.id !== packageId) {
        const pkgData = d.data() as ExamResourcePackage;
        const filtered = (pkgData.assignedSessions || []).filter((s) => s !== sessionDate);
        await setDoc(doc(db, EXAM_RESOURCES_COLLECTION, d.id), { ...pkgData, assignedSessions: filtered }, { merge: true });
      }
    }

    // 2. Add sessionDate to target package
    const targetRef = doc(db, EXAM_RESOURCES_COLLECTION, packageId);
    const targetSnap = await getDoc(targetRef);
    if (targetSnap.exists()) {
      const targetData = targetSnap.data() as ExamResourcePackage;
      const current = targetData.assignedSessions || [];
      if (!current.includes(sessionDate)) {
        await setDoc(targetRef, { ...targetData, assignedSessions: [...current, sessionDate] }, { merge: true });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${EXAM_RESOURCES_COLLECTION}/${packageId}`);
  }
}

/**
 * Backward compatibility alias
 */
export async function assignPackageToSession(packageId: string, sessionDate: string): Promise<void> {
  return assignPackageToSessionExclusively(packageId, sessionDate);
}

/**
 * Unassigns a session from an exam package
 */
export async function unassignPackageFromSession(packageId: string, sessionDate: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthorized');

  const pkgRef = doc(db, EXAM_RESOURCES_COLLECTION, packageId);
  try {
    const snap = await getDoc(pkgRef);
    if (snap.exists()) {
      const data = snap.data() as ExamResourcePackage;
      const current = (data.assignedSessions || []).filter((s) => s !== sessionDate);
      await setDoc(pkgRef, { ...data, assignedSessions: current }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${EXAM_RESOURCES_COLLECTION}/${packageId}`);
  }
}

/**
 * 6. Get assigned package for a specific exam session date or identifier.
 * Returns null if no verified published package is assigned to the requested session.
 * Used by the Candidate Exam Simulator (/exam) to load verified exam content.
 */
export async function getPackageForSession(sessionDateOrId: string): Promise<ExamResourcePackage | null> {
  if (!sessionDateOrId || !sessionDateOrId.trim()) {
    return null;
  }
  try {
    const q = query(
      collection(db, EXAM_RESOURCES_COLLECTION),
      where('status', '==', 'published'),
      where('assignedSessions', 'array-contains', sessionDateOrId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as ExamResourcePackage;
    }
  } catch (error) {
    console.warn('Could not fetch session package from Firestore:', error);
  }

  // Check if default official package has this session assigned
  if (DEFAULT_EXAM_PACKAGE.assignedSessions?.includes(sessionDateOrId)) {
    return DEFAULT_EXAM_PACKAGE;
  }

  return null;
}

/**
 * Resolves the listening audio source in strict compliance with IELTS Phase 2C-2:
 * 1. The valid audio resource assigned to the candidate's active exam session.
 * 2. An existing harmless local sample asset, only when explicitly enabled for development/testing.
 * 3. A clear error state when no valid audio resource is available.
 * 
 * Never silently substitutes sample audio during a real examination.
 * Does not use fabricated URLs or assume Firebase Storage is active.
 */
export async function resolveListeningAudioSource(
  options: AudioResolutionOptions
): Promise<AudioResolutionResult> {
  const { sessionDateOrId, allowDevSampleFallback = false } = options;

  // 1. Valid audio resource assigned to candidate's active exam session
  if (sessionDateOrId && sessionDateOrId.trim()) {
    const pkg = await getPackageForSession(sessionDateOrId);
    if (pkg && pkg.listening) {
      const audioSrc = pkg.listening.audioSrc?.trim();
      if (audioSrc && audioSrc.length > 0) {
        const isStorageUrl = audioSrc.startsWith('http://') || audioSrc.startsWith('https://');
        return {
          status: 'assigned_resource',
          audioSrc,
          testSoundSrc: pkg.listening.testSoundSrc || '/audio/sound_check.wav',
          title: pkg.listening.title || 'Official Exam Listening Recording',
          durationSeconds: pkg.listening.durationSeconds || 45,
          metadata: {
            packageId: pkg.id,
            packageTitle: pkg.title,
            version: pkg.version,
            fileSizeBytes: pkg.listening.fileSizeBytes,
            sectionsCount: pkg.listening.sectionsCount || 1,
            assignedSession: sessionDateOrId,
            isDevSample: false,
            storageType: isStorageUrl ? 'firebase_storage' : 'local_sample',
          },
        };
      } else {
        return {
          status: 'invalid_source',
          title: pkg.listening.title || 'Assigned Package Audio Missing',
          durationSeconds: 0,
          metadata: {
            packageId: pkg.id,
            packageTitle: pkg.title,
            version: pkg.version,
            assignedSession: sessionDateOrId,
            isDevSample: false,
            storageType: 'none',
          },
          errorMessage: `The examination package assigned to session "${sessionDateOrId}" does not contain a valid audio file path or URL.`,
        };
      }
    }
  }

  // 2. An existing harmless local sample asset, only when explicitly enabled for development/testing
  if (allowDevSampleFallback) {
    return {
      status: 'dev_sample_fallback',
      audioSrc: '/audio/ielts_listening_section1.wav',
      testSoundSrc: '/audio/sound_check.wav',
      title: 'Section 1: Hotel Conference Booking Inquiry (Practice / Dev Asset)',
      durationSeconds: 45,
      metadata: {
        packageId: 'sample_asset_dev',
        packageTitle: 'Official IELTS Section 1 Demonstration Asset',
        version: 'Sample.1',
        fileSizeBytes: 1982764,
        sectionsCount: 1,
        isDevSample: true,
        storageType: 'local_sample',
      },
    };
  }

  // 3. Clear error state when no valid audio resource is available
  return {
    status: 'missing_or_unassigned',
    title: 'No Audio Resource Assigned',
    durationSeconds: 0,
    metadata: {
      assignedSession: sessionDateOrId,
      isDevSample: false,
      storageType: 'none',
    },
    errorMessage: sessionDateOrId
      ? `No verified Listening audio resource is assigned to exam session "${sessionDateOrId}". Under IELTS CD examination regulations, sample audio cannot be substituted during a live examination. Please contact the test center supervisor.`
      : 'No examination session date or resource package is selected for this candidate. Audio playback cannot be initialized.',
  };
}

/**
 * 7. Delete an exam package and its confidential answer keys (Admin only)
 */
export async function deleteExamPackage(packageId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthorized');

  // Prevent deleting the default official simulation pack
  if (packageId === DEFAULT_EXAM_PACKAGE.id) {
    throw new Error('The default IELTS simulation pack cannot be deleted.');
  }


  try {
    await deleteDoc(doc(db, EXAM_RESOURCES_COLLECTION, packageId));
    await deleteDoc(doc(db, EXAM_KEYS_COLLECTION, packageId)).catch(() => null);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EXAM_RESOURCES_COLLECTION}/${packageId}`);
  }
}

/**
 * 8. Storage Readiness Diagnostic & Setup Instructions
 * Explains exact status of Firebase Storage and required configuration.
 */
export interface StorageReadinessReport {
  isConfiguredInApplet: boolean;
  bucketName: string;
  isStorageSDKInitialized: boolean;
  status: 'pending_console_setup' | 'active';
  requiredSteps: { step: number; title: string; detail: string; command?: string }[];
  recommendedRules: string;
}

export function checkStorageConfiguration(): StorageReadinessReport {
  const bucketName = firebaseConfig.storageBucket || 'ielts-zone-mock-platform.firebasestorage.app';
  
  return {
    isConfiguredInApplet: Boolean(bucketName),
    bucketName,
    isStorageSDKInitialized: false, // Intentionally unmounted until Console Storage & CORS are activated
    status: 'pending_console_setup',
    requiredSteps: [
      {
        step: 1,
        title: 'Activate Firebase Storage in Console',
        detail: 'Navigate to Firebase Console > Project: ielts-zone-mock-platform > Build > Storage, then click "Get Started". Select your primary region (e.g., asia-east1).',
      },
      {
        step: 2,
        title: 'Deploy Storage Security Rules',
        detail: 'Deploy storage.rules ensuring that only administrators can write audio/stimulus files, while authenticated candidates have read-only access to published media.',
      },
      {
        step: 3,
        title: 'Configure CORS on Google Cloud Storage',
        detail: 'Audio streaming and candidate browser playback requires cross-origin access. Configure CORS for your bucket via gsutil or gcloud command.',
        command: 'gsutil cors set cors.json gs://ielts-zone-mock-platform.firebasestorage.app',
      },
    ],
    recommendedRules: `rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Global default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isStaff() {
      return isSignedIn() && (
        request.auth.token.role in ['admin', 'examiner'] ||
        request.auth.token.admin == true ||
        firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid)) ||
        firestore.exists(/databases/(default)/documents/examiners/$(request.auth.uid)) ||
        (request.auth.token.email == 'farhodjonovichm1301@gmail.com' && request.auth.token.email_verified == true)
      );
    }

    // 1. Confidential Exam Answer Keys (Examiners & Admins ONLY)
    match /exam_answer_keys/{allPaths=**} {
      allow read, write: if isStaff();
    }

    // 2. Draft / in-review materials (Staff ONLY)
    match /exam_resources/drafts/{allPaths=**} {
      allow read, write: if isStaff();
    }

    // 3. Published Exam Stimulus & Audio Materials
    match /exam_resources/{packageId}/{fileName} {
      allow write: if isStaff();
      // Candidates can only stream audio if the package is published in Firestore
      allow read: if isStaff() || (
        isSignedIn() &&
        firestore.get(/databases/(default)/documents/exam_resources/$(packageId)).data.status == 'published'
      );
    }
  }
}`,
  };
}
