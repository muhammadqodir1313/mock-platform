/**
 * IELTS ZONE Mock Testing Platform
 * Centralized Design System & Brand Tokens
 */

export const THEME_TOKENS = {
  brand: {
    name: 'IELTS ZONE',
    tagline: 'Mock Testing Platform',
    headline: 'Participate in the MOCK IELTS EXAM',
    subtitle: 'Prepare for IELTS with computer-delivered mock tests, realistic exam experiences, detailed feedback, and progress tracking.',
  },
  colors: {
    // Primary palette
    primary: '#35145A', // Primary Deep Purple
    primaryDark: '#24113F', // Dark Purple
    primaryHover: '#481B7A',
    white: '#FFFFFF',
    lightBg: '#F7F7FB',
    lightLavender: '#F0EAF8',
    border: '#E5E1EB',
    mainText: '#211A2B',
    mutedText: '#716A7B',

    // Dark Mode Palette
    dark: {
      bg: '#130922',
      surface: '#1E0F36',
      surfaceRaised: '#281547',
      border: '#361F5B',
      primary: '#8E54DC',
      primaryHover: '#A06BE3',
      lavender: '#26133E',
      textMain: '#F7F5FA',
      textMuted: '#ABA1BC',
    },

    // Accents & status
    accents: {
      success: '#059669',
      warning: '#D97706',
      info: '#2563EB',
    },
  },
  typography: {
    fontSans: "'DM Sans', system-ui, -apple-system, sans-serif",
    fontDisplay: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', monospace",
  },
  radii: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    '2xl': '1.25rem', // 20px
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 3px 0 rgba(33, 26, 43, 0.05), 0 1px 2px 0 rgba(33, 26, 43, 0.03)',
    card: '0 4px 20px -2px rgba(53, 20, 90, 0.06), 0 2px 6px -1px rgba(53, 20, 90, 0.03)',
    elevated: '0 12px 32px -4px rgba(53, 20, 90, 0.12), 0 4px 12px -2px rgba(53, 20, 90, 0.05)',
  },
} as const;
