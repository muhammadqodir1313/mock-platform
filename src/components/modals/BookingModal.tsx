import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, CheckCircle, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { BookingFormData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { createBooking } from '../../lib/firestoreService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState<BookingFormData>({
    fullName: profile?.displayName || user?.displayName || 'Muhammadqodir Abdullajonov',
    phone: '',
    email: user?.email || '',
    module: 'Academic',
    preferredDate: 'Saturday, Oct 17, 2026 - 09:00 AM (Morning Session)',
    notes: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      if (user) {
        setFormData((prev) => ({
          ...prev,
          fullName: profile?.displayName || user.displayName || prev.fullName,
          email: user.email || prev.email,
        }));
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, user, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const refCode = `IZ-${Math.floor(1000 + Math.random() * 9000)}-${formData.module === 'Academic' ? 'ACAD' : 'GEN'}`;
    setBookingRef(refCode);
    setIsSubmitted(true);

    if (user) {
      try {
        await createBooking({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          module: formData.module,
          preferredDate: formData.preferredDate,
          referenceCode: refCode,
          notes: formData.notes,
        });
      } catch (err) {
        console.error('Failed to persist booking in Firestore:', err);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] shadow-2xl overflow-hidden z-10 transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#35145A] dark:bg-[#8E54DC] flex items-center justify-center text-white font-bold text-xs">
              IZ
            </div>
            <div>
              <h3 id="booking-modal-title" className="text-base font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                Reserve CD OFFLINE Mock Seat
              </h3>
              <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                Chilanzar Examination Center · In-Person Station
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close booking modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          /* Confirmation View */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                Seat Reservation Confirmed!
              </h4>
              <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC] max-w-sm mx-auto">
                Your workstation reservation has been recorded in the demonstration booking ledger.
              </p>
            </div>

            <div className="bg-[#F7F7FB] dark:bg-[#130922] p-4 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-[#716A7B] dark:text-[#ABA1BC]">Reference Code:</span>
                <span className="font-bold text-[#35145A] dark:text-[#8E54DC]">{bookingRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716A7B] dark:text-[#ABA1BC]">Candidate Name:</span>
                <span className="text-[#211A2B] dark:text-[#F7F5FA] font-sans font-medium">{formData.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716A7B] dark:text-[#ABA1BC]">Exam Module:</span>
                <span className="text-[#211A2B] dark:text-[#F7F5FA] font-sans font-medium">CD IELTS {formData.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716A7B] dark:text-[#ABA1BC]">Scheduled Session:</span>
                <span className="text-[#211A2B] dark:text-[#F7F5FA] font-sans font-medium">{formData.preferredDate.split(' (')[0]}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 text-left flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Please arrive at least 30 minutes before 09:00 AM for biometric check-in and acoustic headphone calibration. Bring your physical national ID / Passport.
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer"
            >
              Close Confirmation
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                Select Examination Module
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                  formData.module === 'Academic'
                    ? 'border-[#35145A] bg-[#F0EAF8] text-[#35145A] dark:border-[#8E54DC] dark:bg-[#26133E] dark:text-white font-bold'
                    : 'border-[#E5E1EB] dark:border-[#361F5B] text-[#716A7B] dark:text-[#ABA1BC]'
                }`}>
                  <input
                    type="radio"
                    name="module"
                    value="Academic"
                    checked={formData.module === 'Academic'}
                    onChange={() => setFormData({ ...formData, module: 'Academic' })}
                    className="accent-[#35145A]"
                  />
                  <span>IELTS Academic</span>
                </label>

                <label className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                  formData.module === 'General Training'
                    ? 'border-[#35145A] bg-[#F0EAF8] text-[#35145A] dark:border-[#8E54DC] dark:bg-[#26133E] dark:text-white font-bold'
                    : 'border-[#E5E1EB] dark:border-[#361F5B] text-[#716A7B] dark:text-[#ABA1BC]'
                }`}>
                  <input
                    type="radio"
                    name="module"
                    value="General Training"
                    checked={formData.module === 'General Training'}
                    onChange={() => setFormData({ ...formData, module: 'General Training' })}
                    className="accent-[#35145A]"
                  />
                  <span>General Training</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                Upcoming Scheduled Weekend Sessions
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#716A7B] dark:text-[#ABA1BC] absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#130922] text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-2 focus:ring-[#35145A] dark:focus:ring-[#8E54DC]"
                >
                  <option value="Saturday, Oct 17, 2026 - 09:00 AM (Morning Session)">
                    Saturday, Oct 17, 2026 · 09:00 AM (8 seats left)
                  </option>
                  <option value="Sunday, Oct 18, 2026 - 09:00 AM (Morning Session)">
                    Sunday, Oct 18, 2026 · 09:00 AM (12 seats left)
                  </option>
                  <option value="Saturday, Oct 24, 2026 - 09:00 AM (Morning Session)">
                    Saturday, Oct 24, 2026 · 09:00 AM (Available)
                  </option>
                  <option value="Sunday, Oct 25, 2026 - 09:00 AM (Morning Session)">
                    Sunday, Oct 25, 2026 · 09:00 AM (Available)
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                  Candidate Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g., Muhammadqodir Abdullajonov"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#130922] text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-2 focus:ring-[#35145A] dark:focus:ring-[#8E54DC]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                  Phone Number (for SMS & Telegram)
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#130922] text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-2 focus:ring-[#35145A] dark:focus:ring-[#8E54DC]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                Email Address (for Digital TRF)
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="candidate@example.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#130922] text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-2 focus:ring-[#35145A] dark:focus:ring-[#8E54DC]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] dark:hover:bg-[#7C42C4] rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Confirm Mock Exam Seat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-center text-[11px] text-[#716A7B] dark:text-[#ABA1BC] flex items-center justify-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Chilanzar District Bunyodkor Ave · 100084</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
