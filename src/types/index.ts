export type ThemeMode = 'light' | 'dark';

export type AppRoute =
  | '/'
  | '/login'
  | '/signup'
  | '/dashboard'
  | '/exam'
  | '/results'
  | '/bookings'
  | '/admin';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'scoring' | 'booking' | 'policies';
}

export interface TestimonialItem {
  id: string;
  name: string;
  targetBand: string;
  achievedBand?: string;
  city: string;
  review: string;
  testType: 'CD IELTS Academic' | 'CD IELTS General Training';
  date: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  highlights: string[];
}

export interface ComparisonFeature {
  title: string;
  offline: {
    included: boolean;
    detail: string;
  };
  online: {
    included: boolean;
    detail: string;
  };
}

export interface BookingFormData {
  fullName: string;
  phone: string;
  email: string;
  module: 'Academic' | 'General Training';
  preferredDate: string;
  notes?: string;
}
