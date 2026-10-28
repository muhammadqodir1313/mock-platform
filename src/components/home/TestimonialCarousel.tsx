import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Quote } from 'lucide-react';
import { TestimonialItem } from '../../types';

const DEMO_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'demo-1',
    name: 'Dilnoza R.',
    targetBand: 'Target Band 7.5',
    achievedBand: 'Sample Mock Result: 7.5',
    city: 'Tashkent Examination Hub',
    review:
      'Taking the in-person CD IELTS mock on authentic computers completely changed how I managed my time in Academic Reading. The detailed examiner commentary on my Task 2 essay pinpointed exactly why my Coherence was stuck at 6.0.',
    testType: 'CD IELTS Academic',
    date: 'Demonstration Profile',
  },
  {
    id: 'demo-2',
    name: 'Bekzod M.',
    targetBand: 'Target Band 7.0',
    achievedBand: 'Sample Mock Result: 7.0',
    city: 'Samarkand Regional Center',
    review:
      'The noise-isolating headphones and split passage view are identical to what you see on official exam day. The live Speaking interview gave me the exact adrenaline of the actual test, eliminating test-day panic.',
    testType: 'CD IELTS Academic',
    date: 'Demonstration Profile',
  },
  {
    id: 'demo-3',
    name: 'Nigora K.',
    targetBand: 'Target Band 8.0',
    achievedBand: 'Sample Mock Result: 8.0',
    city: 'Bukhara Examination Hub',
    review:
      'The 48-hour diagnostic report is unmatched. Instead of just giving a band number, it showed my specific weakness in Part 3 abstract reasoning and gave grammar recommendations that helped me refine complex structures.',
    testType: 'CD IELTS General Training',
    date: 'Demonstration Profile',
  },
  {
    id: 'demo-4',
    name: 'Jasur T.',
    targetBand: 'Target Band 6.5',
    achievedBand: 'Sample Mock Result: 6.5',
    city: 'Fergana Branch',
    review:
      'Practicing typing the Writing essays under a realistic ticking clock made me realize how much time I was losing editing on screen. This platform was crucial for my computer-delivered preparation.',
    testType: 'CD IELTS Academic',
    date: 'Demonstration Profile',
  },
];

export const TestimonialCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPausedHover, setIsPausedHover] = useState(false);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? DEMO_TESTIMONIALS.length - 1 : prev - 1));
  };

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === DEMO_TESTIMONIALS.length - 1 ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !isAutoPlaying || isPausedHover) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isPausedHover, nextSlide]);

  const current = DEMO_TESTIMONIALS[currentIndex];

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-[#1E0F36] border-b border-[#E5E1EB] dark:border-[#361F5B] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC]">
            <span>Demonstration Testimonials</span>
            <span aria-hidden="true">·</span>
            <span>Sample Candidate Profiles</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#211A2B] dark:text-[#F7F5FA] tracking-tight">
            How Candidates Experience Our Simulations
          </h2>
          <p className="text-xs sm:text-sm text-[#716A7B] dark:text-[#ABA1BC] max-w-xl mx-auto">
            Sample qualitative feedback illustrating candidate exam preparation workflows. (Non-verified demonstration content for Phase 1 interface preview).
          </p>
        </div>

        {/* Carousel Card Container */}
        <div
          className="relative bg-[#F7F7FB] dark:bg-[#130922] rounded-3xl border border-[#E5E1EB] dark:border-[#361F5B] p-8 sm:p-12 transition-all shadow-xs"
          onMouseEnter={() => setIsPausedHover(true)}
          onMouseLeave={() => setIsPausedHover(false)}
        >
          <Quote className="w-10 h-10 text-[#35145A]/20 dark:text-[#8E54DC]/30 mb-4" />

          {/* Testimonial Quote */}
          <blockquote className="text-base sm:text-lg lg:text-xl font-medium text-[#211A2B] dark:text-[#F7F5FA] leading-relaxed mb-8 min-h-[90px]">
            &ldquo;{current.review}&rdquo;
          </blockquote>

          {/* Author info & metadata strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[#E5E1EB] dark:border-[#361F5B]">
            <div>
              <div className="font-bold text-base text-[#211A2B] dark:text-[#F7F5FA]">
                {current.name}
              </div>
              <div className="text-xs text-[#716A7B] dark:text-[#ABA1BC] flex items-center gap-2 mt-0.5">
                <span>{current.city}</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#35145A] dark:text-[#8E54DC]">{current.testType}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{current.achievedBand}</span>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Play / Pause Auto-slide */}
              <button
                type="button"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                aria-label={isAutoPlaying ? 'Pause carousel auto-rotation' : 'Start carousel auto-rotation'}
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] dark:hover:text-white transition-colors cursor-pointer"
              >
                {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Prev Button */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous testimonial"
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next testimonial"
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#1E0F36] text-[#211A2B] dark:text-[#F7F5FA] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {DEMO_TESTIMONIALS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Jump to testimonial ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 bg-[#35145A] dark:bg-[#8E54DC]'
                    : 'w-2 bg-[#E5E1EB] dark:bg-[#361F5B] hover:bg-[#716A7B]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
