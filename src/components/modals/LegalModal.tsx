import React, { useEffect } from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !type) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] shadow-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#35145A] dark:bg-[#8E54DC] flex items-center justify-center text-white font-bold text-xs">
              {type === 'privacy' ? <Shield className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <h3 id="legal-modal-title" className="text-base font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                IELTS ZONE Mock Testing Platform · Document Version 1.0 (Phase 1)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable text */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#716A7B] dark:text-[#ABA1BC] leading-relaxed">
          {type === 'privacy' ? (
            <>
              <div>
                <h4 className="font-bold text-[#211A2B] dark:text-[#F7F5FA] mb-1">
                  1. Candidate Data Collection
                </h4>
                <p>
                  We collect candidate contact information (Full Name, Phone number, Email address) solely for examination seat reservations, Speaking interview time allocation, and sending test results / diagnostic TRF reports.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#211A2B] dark:text-[#F7F5FA] mb-1">
                  2. Speaking Audio Recording Confidentiality
                </h4>
                <p>
                  Audio recorded during offline Speaking mock tests is strictly used for examiner calibration and candidate evaluation. Recordings are archived securely and are never shared publicly.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#211A2B] dark:text-[#F7F5FA] mb-1">
                  3. Non-Disclosure & Security
                </h4>
                <p>
                  In Phase 2, persistent candidate data will be stored with encrypted transport and strict Firestore security rules preventing unauthorized access between candidate accounts.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="font-bold text-[#211A2B] dark:text-[#F7F5FA] mb-1">
                  1. Trademark and Non-Affiliation Disclaimer
                </h4>
                <p>
                  IELTS is a registered trademark of University of Cambridge ESOL, the British Council, and IDP Education Australia. IELTS ZONE is an independent preparatory platform and test-simulation provider. Our diagnostic mock scores are for practice and training purposes only and do not replace official IELTS Test Report Forms.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#211A2B] dark:text-[#F7F5FA] mb-1">
                  2. Examination Room Conduct
                </h4>
                <p>
                  Candidates taking offline mock tests must adhere to official test-center regulations, including turning off mobile devices and bringing acceptable photo identification.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#211A2B] dark:text-[#F7F5FA] mb-1">
                  3. Rescheduling & Diagnostic Delivery
                </h4>
                <p>
                  Diagnostic feedback and examiner scores are delivered within 48 hours following exam completion. Rescheduling requests must be placed at least 24 hours in advance.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F7F7FB] dark:bg-[#130922] border-t border-[#E5E1EB] dark:border-[#361F5B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
