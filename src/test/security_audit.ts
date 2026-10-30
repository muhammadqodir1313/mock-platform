/**
 * Security & Validation Test Suite for Phase 2C-E
 * Executes unit tests for File Validation, HTML Sanitization, and Answer-Key Isolation.
 */

import { validateAudioFile, validateImageFile } from '../lib/storageService';
import { sanitizeIeltsHtml, isSafeUrl } from '../lib/sanitizer';
import { validateExamPackage } from '../types/resources';

interface TestResult {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function assert(id: string, name: string, condition: boolean, details: string) {
  results.push({
    id,
    name,
    status: condition ? 'PASS' : 'FAIL',
    details,
  });
}

// Mock File helper for Node/TSX environment
class MockFile {
  name: string;
  size: number;
  type: string;
  constructor(name: string, size: number, type: string) {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

console.log('=== RUNNING SECURITY & STORAGE VALIDATION SUITE ===\n');

// 1. Audio Validation Tests
const validMp3 = new MockFile('listening_section1.mp3', 5 * 1024 * 1024, 'audio/mpeg') as unknown as File;
const mp3Res = validateAudioFile(validMp3);
assert('TEST 14', 'MP3 upload validation succeeds', mp3Res.isValid && mp3Res.detectedFormat === '.mp3', 'MP3 accepted');

const validWav = new MockFile('listening_section2.wav', 12 * 1024 * 1024, 'audio/wav') as unknown as File;
const wavRes = validateAudioFile(validWav);
assert('TEST 15', 'WAV upload validation succeeds', wavRes.isValid && wavRes.detectedFormat === '.wav', 'WAV accepted');

const validM4a = new MockFile('listening_section3.m4a', 8 * 1024 * 1024, 'audio/m4a') as unknown as File;
const m4aRes = validateAudioFile(validM4a);
assert('TEST 16', 'M4A upload validation succeeds', m4aRes.isValid && m4aRes.detectedFormat === '.m4a', 'M4A accepted');

const validOgg = new MockFile('listening_section4.ogg', 7 * 1024 * 1024, 'audio/ogg') as unknown as File;
const oggRes = validateAudioFile(validOgg);
assert('TEST 17', 'OGG upload validation succeeds', oggRes.isValid && oggRes.detectedFormat === '.ogg', 'OGG accepted');

const invalidExe = new MockFile('malicious_audio.exe', 1024, 'application/x-msdownload') as unknown as File;
const exeRes = validateAudioFile(invalidExe);
assert('TEST 18', 'Unsupported audio format is rejected', !exeRes.isValid, 'EXE audio rejected');

const oversizedAudio = new MockFile('huge_exam_audio.wav', 65 * 1024 * 1024, 'audio/wav') as unknown as File;
const overRes = validateAudioFile(oversizedAudio);
assert('TEST 19', 'Oversized audio file (>50MB) is rejected', !overRes.isValid, 'Oversized audio rejected');

// 2. Image Validation Tests (SVG Block)
const validPng = new MockFile('task1_chart.png', 2 * 1024 * 1024, 'image/png') as unknown as File;
const pngRes = validateImageFile(validPng);
assert('TEST 22', 'Valid PNG image accepted', pngRes.isValid && pngRes.detectedFormat === '.png', 'PNG chart accepted');

const activeSvg = new MockFile('xss_diagram.svg', 10 * 1024, 'image/svg+xml') as unknown as File;
const svgRes = validateImageFile(activeSvg);
assert('TEST 22b', 'Active SVG diagram is blocked', !svgRes.isValid && svgRes.detectedFormat.includes('Blocked'), 'SVG rejected for XSS prevention');

// 3. HTML Sanitization Tests
const dirtyScript = '<p>Passage paragraph</p><script>alert("hacked")</script>';
const cleanScript = sanitizeIeltsHtml(dirtyScript);
assert('TEST 24', 'Script tags cannot execute (stripped)', !cleanScript.includes('<script>') && !cleanScript.includes('alert'), 'Script stripped');

const dirtyEvent = '<img src="chart.png" onload="fetch(\'/steal\')" onerror="alert(1)">';
const cleanEvent = sanitizeIeltsHtml(dirtyEvent);
assert('TEST 25', 'Inline event handlers cannot execute (stripped)', !cleanEvent.includes('onload') && !cleanEvent.includes('onerror'), 'Event handlers stripped');

const dirtyHref = '<a href="javascript:alert(1)">Click for IELTS Question</a>';
assert('TEST 26', 'javascript: links are neutralized', !isSafeUrl('javascript:alert(1)'), 'javascript: URL rejected');

const ieltsTable = '<table border="1"><thead><tr><th>Criteria</th><th>Band 9</th></tr></thead><tbody><tr><td>Fluency</td><td>Natural</td></tr></tbody></table>';
const cleanTable = sanitizeIeltsHtml(ieltsTable);
assert('TEST 27', 'Legitimate IELTS tables and formatting are preserved', cleanTable.includes('<table') && cleanTable.includes('<th>Criteria</th>') && cleanTable.includes('<td>Natural</td>'), 'Table preserved');

// 4. Answer-Key Isolation Tests
const candidatePackageWithLeak: any = {
  id: 'pkg_test_01',
  title: 'Test Package',
  module: 'Academic',
  version: '1.0',
  status: 'published',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  listening: {
    audioSrc: '/audio/test.wav',
    title: 'Listening',
    durationSeconds: 120,
    sectionsCount: 1,
    questions: [
      {
        id: 'l_q1',
        number: 1,
        type: 'note_completion',
        prompt: 'First name:',
        answerKey: ['John'], // leaked answer
      },
    ],
  },
  reading: {
    passages: [{ id: 'p1', passageNumber: 1, title: 'Title', body: 'Passage body content with more than 50 characters for test validity...' }],
    questions: [{ id: 'r_q1', number: 1, type: 'tfng', prompt: 'Prompt', options: ['TRUE', 'FALSE', 'NOT GIVEN'] }],
  },
  writing: {
    task1: { taskNumber: 1, title: 'Task 1', prompt: 'A long prompt for Task 1 meeting the minimum length criteria...', minimumWords: 150, suggestedMinutes: 20 },
    task2: { taskNumber: 2, title: 'Task 2', prompt: 'A long prompt for Task 2 meeting the minimum length criteria...', minimumWords: 250, suggestedMinutes: 40 },
  },
};

const leakReport = validateExamPackage(candidatePackageWithLeak);
assert('TEST 12', 'Candidate package cannot leak private answer keys', !leakReport.isValid && leakReport.checks.some(c => c.id === 'security-key-isolation' && !c.passed), 'Key leakage detected and failed');

// 5. Blob URL Persistence Rejection Tests
const candidatePackageWithBlobAudio: any = {
  ...candidatePackageWithLeak,
  listening: {
    ...candidatePackageWithLeak.listening,
    audioSrc: 'blob:http://localhost:3000/1234-5678',
    questions: [{ id: 'l_q1', number: 1, type: 'note_completion', prompt: 'First name:' }],
  },
};

const blobReport = validateExamPackage(candidatePackageWithBlobAudio);
assert('TEST 18b', 'Temporary blob: audio URL is rejected in package validation', !blobReport.isValid && blobReport.checks.some(c => c.id === 'listening-audio-src' && !c.passed), 'Blob audio rejected');

// Print Summary Table
console.table(results.map(r => ({ Test: r.id, Description: r.name, Status: r.status, Details: r.details })));

const allPassed = results.every(r => r.status === 'PASS');
console.log(`\nAll Unit Security Checks Passed: ${allPassed ? 'YES' : 'NO'}`);

if (!allPassed) {
  process.exit(1);
} else {
  process.exit(0);
}
