import React from 'react';
import { 
  Building2, 
  FileCheck2, 
  PenTool, 
  Headphones, 
  Mic2, 
  FileText 
} from 'lucide-react';

interface FeatureCardData {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
  keyPoints: string[];
}

const FEATURES: FeatureCardData[] = [
  {
    id: 'atmosphere',
    number: '01',
    title: 'Authentic IELTS Exam Atmosphere',
    description: 'Replicate real test conditions to manage pacing, stress, and screen fatigue before exam day.',
    icon: Building2,
    keyPoints: [
      'Standardized test room layout',
      'Timed sections with automated countdowns',
      'Supervised environment reducing anxiety',
    ],
  },
  {
    id: 'materials',
    number: '02',
    title: 'High-Quality IELTS-Style Practice Materials',
    description: 'Carefully curated test items structured according to Cambridge IELTS specifications and difficulty levels.',
    icon: FileCheck2,
    keyPoints: [
      'Passages covering diverse academic topics',
      'Standard question types: MCQs, matching, headings, gap fills',
      'Balanced British, American, and Australian audio accents',
    ],
  },
  {
    id: 'writing',
    number: '03',
    title: 'Writing Assessment by Qualified Examiners',
    description: 'Task 1 and Task 2 submissions evaluated against standard public IELTS band descriptors.',
    icon: PenTool,
    keyPoints: [
      'Scoring across Task Achievement, Coherence & Cohesion',
      'Lexical Resource & Grammatical Range diagnostics',
      'Concrete inline suggestions for paragraph cohesion',
    ],
  },
  {
    id: 'listening',
    number: '04',
    title: 'Professional Listening Equipment',
    description: 'Dedicated workstations equipped with high-fidelity, closed-back headphones to avoid audio interference.',
    icon: Headphones,
    keyPoints: [
      'Crisp audio playback with volume calibration',
      'Acoustic isolation preventing distractions',
      'Simulated one-time playback as in real exam',
    ],
  },
  {
    id: 'speaking',
    number: '05',
    title: 'Speaking Assessment',
    description: 'Comprehensive 3-part oral interview conducted in full alignment with the IELTS Speaking format.',
    icon: Mic2,
    keyPoints: [
      'Part 1: Introduction & familiar topics',
      'Part 2: 1-minute prep card and 2-minute monologue',
      'Part 3: In-depth analytical two-way discussion',
    ],
  },
  {
    id: 'feedback',
    number: '06',
    title: 'Personalized Feedback',
    description: 'Actionable diagnostic reports highlighting specific skill gaps and targeted recommendations.',
    icon: FileText,
    keyPoints: [
      'Band score breakdown for each criterion',
      'Error analysis for high-frequency mistakes',
      'Tailored roadmap for score improvement',
    ],
  },
];

export const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="py-16 lg:py-24 bg-[#F7F7FB] dark:bg-[#130922] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
            Why Choose Us
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#211A2B] dark:text-[#F7F5FA] tracking-tight">
            Six Pillars of a Realistic IELTS Mock Experience
          </h2>
          <p className="text-sm sm:text-base text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
            Our methodology is designed to eliminate test-day surprises through rigorous simulations, genuine formats, and constructive diagnostic scoring.
          </p>
        </div>

        {/* 6 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-7 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#F0EAF8] dark:bg-[#26133E] flex items-center justify-center text-[#35145A] dark:text-[#8E54DC]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-[#716A7B] dark:text-[#ABA1BC]">
                      {item.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#211A2B] dark:text-[#F7F5FA] leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
                    {item.description}
                  </p>

                  <ul className="space-y-2 pt-2 text-xs text-[#211A2B] dark:text-[#F7F5FA] border-t border-[#E5E1EB]/60 dark:border-[#361F5B]/60">
                    {item.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#35145A] dark:text-[#8E54DC] font-bold text-xs mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
