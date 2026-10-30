import { 
  ReadingPassage, 
  QuestionItem, 
  QuestionType,
  WritingTask 
} from '../types/resources';
import { sanitizeIeltsHtml } from './sanitizer';

/**
 * Parses audio file in browser to measure exact duration (seconds) and format.
 */
export function probeAudioFile(file: File): Promise<{
  durationSeconds: number;
  format: string;
  sizeBytes: number;
}> {
  return new Promise((resolve) => {
    const format = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';
    const tempUrl = URL.createObjectURL(file);
    const audio = new Audio();

    const cleanup = () => {
      URL.revokeObjectURL(tempUrl);
    };

    audio.onloadedmetadata = () => {
      const dur = Math.round(audio.duration) || 0;
      cleanup();
      resolve({
        durationSeconds: dur,
        format,
        sizeBytes: file.size,
      });
    };

    audio.onerror = () => {
      cleanup();
      // If browser can't decode, estimate fallback based on file size (avg ~128kbps)
      const estimatedSec = Math.round(file.size / (16 * 1024));
      resolve({
        durationSeconds: Math.max(30, Math.min(3600, estimatedSec)),
        format,
        sizeBytes: file.size,
      });
    };

    audio.src = tempUrl;
  });
}

/**
 * Parses reading passages from a single file containing up to 3 passages.
 * Handles JSON or text/markdown with section delimiters.
 */
export function parseReadingSingleFile(text: string): ReadingPassage[] {
  const trimmed = text.trim();

  // 1. Try parsing as JSON first
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : (parsed.passages || [parsed]);
      return list.map((item: any, idx: number) => {
        const cleanBody = sanitizeIeltsHtml(item.body || item.content || item.text || '');
        return {
          id: item.id || `r_passage_0${idx + 1}`,
          passageNumber: item.passageNumber || idx + 1,
          title: item.title || `Reading Passage ${idx + 1}`,
          subtitle: item.subtitle,
          body: cleanBody,
          wordCount: cleanBody ? cleanBody.split(/\s+/).filter(Boolean).length : undefined,
        };
      });
    } catch {
      // Fall through to text delimiter parsing
    }
  }

  // 2. Delimiter parsing for text/markdown:
  // e.g. "--- PASSAGE 1 ---", "## Passage 2", "Reading Passage 3"
  const passagePattern = /(?:---|\b)(?:PASSAGE|Reading Passage)\s*([1-3])(?:\s*---|\b|:|\n)/gi;
  const matches = [...trimmed.matchAll(passagePattern)];

  if (matches.length > 1) {
    const passages: ReadingPassage[] = [];
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const passageNum = parseInt(currentMatch[1], 10) || (i + 1);
      const startIndex = (currentMatch.index || 0) + currentMatch[0].length;
      const endIndex = i + 1 < matches.length ? matches[i + 1].index : trimmed.length;
      const rawBody = trimmed.slice(startIndex, endIndex).trim();

      // Extract title from first line if available
      const lines = rawBody.split('\n');
      const firstLine = lines[0]?.replace(/^[#\s*-]+/, '').trim();
      const title = firstLine && firstLine.length < 100 ? firstLine : `Reading Passage ${passageNum}`;
      const body = sanitizeIeltsHtml(firstLine && firstLine.length < 100 ? lines.slice(1).join('\n').trim() : rawBody);

      passages.push({
        id: `r_passage_0${passageNum}`,
        passageNumber: passageNum,
        title,
        body,
        wordCount: body.split(/\s+/).filter(Boolean).length,
      });
    }
    return passages;
  }

  // 3. Fallback: Entire text is single passage
  const firstLine = trimmed.split('\n')[0]?.replace(/^[#\s*-]+/, '').trim() || 'Reading Passage 1';
  const cleanBody = sanitizeIeltsHtml(trimmed);
  return [
    {
      id: 'r_passage_01',
      passageNumber: 1,
      title: firstLine.length < 80 ? firstLine : 'Reading Passage 1',
      body: cleanBody,
      wordCount: cleanBody.split(/\s+/).filter(Boolean).length,
    },
  ];
}

/**
 * Parses reading passages from 3 separate files.
 */
export function parseReadingSeparateFiles(
  files: { filename: string; content: string }[]
): ReadingPassage[] {
  // Sort by passage number in filename or index
  const sorted = [...files].sort((a, b) => {
    const numA = (a.filename.match(/(\d)/) || [])[1] || '0';
    const numB = (b.filename.match(/(\d)/) || [])[1] || '0';
    return parseInt(numA, 10) - parseInt(numB, 10);
  });

  return sorted.slice(0, 3).map((item, idx) => {
    const passageNumber = idx + 1;
    const trimmed = item.content.trim();
    const firstLine = trimmed.split('\n')[0]?.replace(/^[#\s*-]+/, '').trim() || '';
    const title = firstLine && firstLine.length < 80 ? firstLine : `Reading Passage ${passageNumber}`;
    const rawBody = firstLine && firstLine.length < 80 ? trimmed.split('\n').slice(1).join('\n').trim() : trimmed;
    const body = sanitizeIeltsHtml(rawBody);

    return {
      id: `r_passage_0${passageNumber}`,
      passageNumber,
      title,
      body,
      wordCount: body.split(/\s+/).filter(Boolean).length,
    };
  });
}

/**
 * Parses Questions and Answer Keys from JSON or structured text.
 */
export function parseQuestionsData(
  text: string,
  moduleContext: 'listening' | 'reading'
): { questions: QuestionItem[]; answerKeys: Record<string, string[]> } {
  const trimmed = text.trim();
  const questions: QuestionItem[] = [];
  const answerKeys: Record<string, string[]> = {};

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const rawList: any[] = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      rawList.forEach((q: any, idx: number) => {
        const num = q.number || idx + 1;
        const qId = q.id || `${moduleContext === 'listening' ? 'l' : 'r'}_q${num}`;
        const type: QuestionType = q.type || 'note_completion';

        questions.push({
          id: qId,
          number: num,
          type,
          prompt: sanitizeIeltsHtml(q.prompt || q.question || ''),
          options: q.options,
          placeholder: q.placeholder,
          sectionNumber: moduleContext === 'listening' ? (q.sectionNumber || 1) : undefined,
          passageNumber: moduleContext === 'reading' ? (q.passageNumber || 1) : undefined,
        });

        // Answer key extraction (isolated from candidate package)
        if (q.answerKey || q.correctAnswer || q.answer || q.keys) {
          const rawKey = q.answerKey || q.correctAnswer || q.answer || q.keys;
          answerKeys[`q${num}`] = Array.isArray(rawKey) ? rawKey.map(String) : [String(rawKey)];
        }
      });

      // If separate keys object provided in JSON
      if (parsed.answerKeys || parsed.keys) {
        const extraKeys = parsed.answerKeys || parsed.keys;
        Object.entries(extraKeys).forEach(([k, v]) => {
          const keyNormalized = k.startsWith('q') ? k : `q${k}`;
          answerKeys[keyNormalized] = Array.isArray(v) ? v.map(String) : [String(v)];
        });
      }

      return { questions, answerKeys };
    } catch {
      // Fall through to text line parser
    }
  }

  // Fallback: Line-by-line question parser
  // Matches e.g. "1. Question prompt [Answer: xyz]"
  const lines = trimmed.split('\n');
  lines.forEach((line) => {
    const match = line.match(/^(\d+)[\.\)]\s*(.*?)(?:\[(?:Answer|Key):\s*(.*?)\])?$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const prompt = match[2].trim();
      const rawAnswer = match[3]?.trim();
      const qId = `${moduleContext === 'listening' ? 'l' : 'r'}_q${num}`;

      questions.push({
        id: qId,
        number: num,
        type: 'note_completion',
        prompt: sanitizeIeltsHtml(prompt),
        sectionNumber: moduleContext === 'listening' ? 1 : undefined,
        passageNumber: moduleContext === 'reading' ? 1 : undefined,
      });

      if (rawAnswer) {
        answerKeys[`q${num}`] = [rawAnswer];
      }
    }
  });

  return { questions, answerKeys };
}

/**
 * Validates writing prompts for standard IELTS Task 1 & Task 2 specifications
 */
export function validateWritingTasks(task1: WritingTask, task2: WritingTask): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!task1.prompt || task1.prompt.trim().length < 20) {
    errors.push('Task 1 prompt must be at least 20 characters long.');
  }
  if (task1.minimumWords < 150) {
    errors.push(`Task 1 word requirement must be at least 150 words (currently ${task1.minimumWords}).`);
  }
  if (!task2.prompt || task2.prompt.trim().length < 20) {
    errors.push('Task 2 prompt must be at least 20 characters long.');
  }
  if (task2.minimumWords < 250) {
    errors.push(`Task 2 word requirement must be at least 250 words (currently ${task2.minimumWords}).`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
