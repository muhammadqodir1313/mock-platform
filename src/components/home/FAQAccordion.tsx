import React, { useState } from 'react';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';
import { FAQItem } from '../../types';

const FAQ_DATA: FAQItem[] = [
  {
    id: 'how-it-works',
    category: 'general',
    question: 'How do the mock exams work?',
    answer:
      'Our mock exams follow the exact computer-delivered (CD) IELTS format. You take the Listening, Reading, and Writing components on a desktop terminal in one continuous session (approx. 2 hours 45 minutes), followed by an individual 11-14 minute Speaking interview with an examiner. The exam questions, user interface, timers, and invigilation mirror the official test.',
  },
  {
    id: 'lr-scoring',
    category: 'scoring',
    question: 'How are the Listening and Reading sections scored?',
    answer:
      'Both Listening and Reading comprise 40 questions each. Raw correct scores out of 40 are converted into the official IELTS 9-band scale (e.g., 30-31 raw marks in Academic Reading typically converts to Band 7.0). In our online system, raw scoring is instantaneous; for offline mocks, answers are verified against standard official answer keys including alternate spellings.',
  },
  {
    id: 'writing-assessment',
    category: 'scoring',
    question: 'How is the Writing assessment evaluated?',
    answer:
      'Writing Task 1 (150 words) and Task 2 (250 words) are evaluated manually by experienced IELTS instructors using the four official IELTS criteria: Task Achievement / Response (25%), Coherence & Cohesion (25%), Lexical Resource (25%), and Grammatical Range & Accuracy (25%). You receive itemized band scores plus specific feedback on grammar and coherence.',
  },
  {
    id: 'exam-frequency',
    category: 'booking',
    question: 'How frequently are mock exams held?',
    answer:
      'Offline in-person sessions are held every weekend (Saturday and Sunday morning slots) at our designated testing center. Online mock tests can be accessed on-demand 24/7 once you activate a practice session in your candidate dashboard.',
  },
  {
    id: 'offline-booking',
    category: 'booking',
    question: 'How do I book an offline in-person mock exam?',
    answer:
      'Click the "Book Now" button on the CD OFFLINE card or navigation bar. Choose your preferred weekend date, select whether you need Academic or General Training, provide your contact details, and reserve your seat. You will receive an SMS and Telegram confirmation with your workstation number.',
  },
  {
    id: 'online-access',
    category: 'general',
    question: 'What do I need to access the online mock platform?',
    answer:
      'A modern desktop or laptop computer with a stable internet connection and Google Chrome or Firefox is recommended. A physical keyboard and stereo headphones are required to simulate test-center conditions accurately. Tablets and phones are not recommended for taking simulated tests.',
  },
  {
    id: 'result-availability',
    category: 'scoring',
    question: 'When will my results and Test Report Form (TRF) be available?',
    answer:
      'Listening and Reading scores are compiled immediately upon submission. Writing and Speaking sections undergo manual moderation, with complete diagnostic reports delivered within 48 hours of test completion directly to your candidate portal and via Telegram notification.',
  },
  {
    id: 'feedback-depth',
    category: 'scoring',
    question: 'What kind of feedback do I receive after the mock test?',
    answer:
      'You receive a comprehensive Diagnostic Report covering your overall band score, breakdown across all four sub-skills, detailed commentary on your Writing essays (pointing out recurring grammatical patterns, lexical variety, and paragraph structure), and examiner notes from your Speaking interview.',
  },
  {
    id: 'pricing-placeholder',
    category: 'policies',
    question: 'What is the pricing for offline and online mock exams?',
    answer:
      '[Configurable Placeholder]: Single offline full-format mock exam starts at $25 (or regional equivalent), including live Speaking interview and 48-hour diagnostic report. Online mock packages start at $12 per complete test. Bundled packs (3-test and 5-test preparation packages) offer discounted rates. Official pricing will be updated prior to Phase 2 registration launch.',
  },
  {
    id: 'policies-reschedule',
    category: 'policies',
    question: 'What is the rescheduling and cancellation policy?',
    answer:
      '[Configurable Placeholder]: Candidates may reschedule their offline test session up to 24 hours prior to the scheduled start time without penalty. Cancellations made within 24 hours of the exam are subject to a nominal rebooking fee to cover reserved examiner slots.',
  },
];

export const FAQAccordion: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('how-it-works');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const toggleAccordion = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const filteredFAQs = FAQ_DATA.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesQuery =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <section id="faq" className="py-16 lg:py-24 bg-[#F7F7FB] dark:bg-[#130922] transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-[#35145A] dark:text-[#8E54DC]">
            Candidate Assistance
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#211A2B] dark:text-[#F7F5FA] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-[#716A7B] dark:text-[#ABA1BC]">
            Clear answers on examination formats, scoring rubrics, offline booking, and diagnostic feedback.
          </p>
        </div>

        {/* Filter controls */}
        <div className="space-y-4 mb-8">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#716A7B] dark:text-[#ABA1BC] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Search frequently asked questions by keyword"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQ (e.g., scoring, writing, booking, pricing)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-sm text-[#211A2B] dark:text-[#F7F5FA] placeholder-[#716A7B]/70 focus:outline-none focus:ring-2 focus:ring-[#35145A] dark:focus:ring-[#8E54DC]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#35145A] text-white dark:bg-[#8E54DC]'
                  : 'bg-white dark:bg-[#1E0F36] text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] dark:hover:text-white border border-[#E5E1EB] dark:border-[#361F5B]'
              }`}
            >
              All Topics
            </button>
            <button
              onClick={() => setActiveCategory('general')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeCategory === 'general'
                  ? 'bg-[#35145A] text-white dark:bg-[#8E54DC]'
                  : 'bg-white dark:bg-[#1E0F36] text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] dark:hover:text-white border border-[#E5E1EB] dark:border-[#361F5B]'
              }`}
            >
              General & Setup
            </button>
            <button
              onClick={() => setActiveCategory('scoring')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeCategory === 'scoring'
                  ? 'bg-[#35145A] text-white dark:bg-[#8E54DC]'
                  : 'bg-white dark:bg-[#1E0F36] text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] dark:hover:text-white border border-[#E5E1EB] dark:border-[#361F5B]'
              }`}
            >
              Scoring & Feedback
            </button>
            <button
              onClick={() => setActiveCategory('booking')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeCategory === 'booking'
                  ? 'bg-[#35145A] text-white dark:bg-[#8E54DC]'
                  : 'bg-white dark:bg-[#1E0F36] text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] dark:hover:text-white border border-[#E5E1EB] dark:border-[#361F5B]'
              }`}
            >
              Booking & Center
            </button>
            <button
              onClick={() => setActiveCategory('policies')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeCategory === 'policies'
                  ? 'bg-[#35145A] text-white dark:bg-[#8E54DC]'
                  : 'bg-white dark:bg-[#1E0F36] text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] dark:hover:text-white border border-[#E5E1EB] dark:border-[#361F5B]'
              }`}
            >
              Pricing & Policies
            </button>
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] p-6 text-sm text-[#716A7B] dark:text-[#ABA1BC]">
              No questions found matching your search. Please try a different query.
            </div>
          ) : (
            filteredFAQs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] transition-colors overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 hover:bg-[#F0EAF8]/40 dark:hover:bg-[#26133E]/40 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-sm sm:text-base text-[#211A2B] dark:text-[#F7F5FA] flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-[#35145A] dark:text-[#8E54DC] shrink-0" />
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716A7B] dark:text-[#ABA1BC] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#35145A] dark:text-[#8E54DC]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed border-t border-[#E5E1EB]/50 dark:border-[#361F5B]/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
