import { ExamAnswerKeyPackage } from '../types/resources';

/**
 * Confidential answer key matching the default simulation package.
 * Kept strictly isolated in this admin/examiner-only module.
 * CRITICAL SECURITY INVARIANT:
 * Candidate-facing exam views and bundles must NEVER import this module.
 */
export const DEFAULT_EXAM_KEYS: ExamAnswerKeyPackage = {
  id: 'pkg_academic_simulation_01',
  packageId: 'pkg_academic_simulation_01',
  listeningKeys: {
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
  },
  readingKeys: {
    q1: ['FALSE'], // Contradicted: "human brains do not possess dedicated genetic circuitry"
    q2: ['hippocampus', 'the hippocampus'],
  },
  writingCriteria: {
    task1Rubric: [
      'Task Achievement: Overview provided; key trends highlighted.',
      'Coherence and Cohesion: Logical sequencing with clear paragraphing.',
      'Lexical Resource: Academic vocabulary and data transition markers.',
      'Grammatical Range: Accurate comparative structures and complex sentences.',
    ],
    task2Rubric: [
      'Task Response: Both viewpoints discussed thoroughly with clear personal position.',
      'Coherence and Cohesion: Cohesive devices used naturally without mechanical repetition.',
      'Lexical Resource: Precise vocabulary regarding education and AI technology.',
      'Grammatical Range: Wide variety of grammatical structures with high accuracy.',
    ],
  },
  updatedAt: '2026-10-13T09:00:00.000Z',
};
