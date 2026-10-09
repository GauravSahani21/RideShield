/**
 * RideShield Design System Tokens
 * Palette: White + Light Blue + Cool Gray + Crisp Navy & Deep Accents
 * Supports Light Mode & Dark Mode
 */

export interface ThemeColors {
  // Backgrounds & Canvas
  background: string;
  bg: string; // alias
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceHover: string;
  border: string;
  borderLight: string;
  
  // Brand & Action
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryText: string;

  // Status & Accents
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  dangerSurface: string;

  // Typography
  text: string; // alias for textPrimary
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Input elements
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;

  // Header & Navigation
  navBg: string;
  navActiveBg: string;
  navActiveText: string;
}

export const lightTheme: ThemeColors = {
  background: '#f8fafc',
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceMuted: '#f1f5f9',
  surfaceHover: '#f8fafc',
  border: '#e2e8f0',
  borderLight: '#edf2f7',
  
  primary: '#0284c7',        // Crisp Sky/Blue 600
  primaryHover: '#0369a1',   // Blue 700
  primaryLight: '#e0f2fe',   // Blue 100
  primaryText: '#ffffff',

  success: '#10b981',        // Emerald 500
  successLight: '#ecfdf5',
  warning: '#f59e0b',        // Amber 500
  warningLight: '#fffbeb',
  danger: '#ef4444',         // Red 500
  dangerLight: '#fef2f2',
  dangerSurface: '#fee2e2',

  text: '#0f172a',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  inputBg: '#f8fafc',
  inputBorder: '#cbd5e1',
  inputText: '#0f172a',
  inputPlaceholder: '#94a3b8',

  navBg: '#ffffff',
  navActiveBg: '#e0f2fe',
  navActiveText: '#0284c7',
};

export const darkTheme: ThemeColors = {
  background: '#090d16',
  bg: '#090d16',
  surface: '#111827',
  surfaceElevated: '#1f2937',
  surfaceMuted: '#1e293b',
  surfaceHover: '#1f2937',
  border: '#27354a',
  borderLight: '#1f2937',
  
  primary: '#38bdf8',        // Sky 400
  primaryHover: '#0ea5e9',   // Sky 500
  primaryLight: 'rgba(56, 189, 248, 0.15)',
  primaryText: '#090d16',

  success: '#10b981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#ef4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  dangerSurface: 'rgba(239, 68, 68, 0.25)',

  text: '#f8fafc',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  textInverse: '#0f172a',

  inputBg: '#0f172a',
  inputBorder: '#334155',
  inputText: '#f8fafc',
  inputPlaceholder: '#64748b',

  navBg: '#111827',
  navActiveBg: 'rgba(56, 189, 248, 0.12)',
  navActiveText: '#38bdf8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
  full: 9999,
};

export const typography = {
  fontFamily: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
};
