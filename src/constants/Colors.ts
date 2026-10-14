export type ThemeName = 'light' | 'dark';
type GradientColors = readonly [string, string, ...string[]];

export type AppTheme = {
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceMuted: string;
  card: string;
  inputBackground: string;
  border: string;
  cardBorder: string;
  cardHighlight: string;
  neon: string;
  gold: string;
  obsidian: string;
  onyx: string;
  overlay: string;
  text: string;
  textMuted: string;
  textSoft: string;
  icon: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  tabBar: string;
  tabBarBorder: string;
  success: string;
  warning: string;
  error: string;
  shadow: string;
  heroGradient: GradientColors;
  primaryGradient: GradientColors;
  rewardGradient: GradientColors;
};

// CRED Stark Monochrome Noir & Chalk White Palette
const noirObsidian = '#070709';
const noirOnyx = '#111115';
const chalkWhite = '#FFFFFF';
const platinumSilver = '#E5E5EA';
const chromeMetal = '#8E8E93';

export const Colors: Record<ThemeName, AppTheme> = {
  // CRED Stark Black & White Luxury (Default Hero Theme)
  dark: {
    primary: chalkWhite,
    primaryStrong: platinumSilver,
    primarySoft: 'rgba(255, 255, 255, 0.12)',
    secondary: '#D1D1D6',
    accent: chalkWhite,
    background: noirObsidian,
    backgroundAlt: '#040405',
    surface: noirOnyx,
    surfaceMuted: '#18181D',
    card: '#131317',
    inputBackground: '#16161B',
    border: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    cardHighlight: 'rgba(255, 255, 255, 0.22)',
    neon: chalkWhite,
    gold: platinumSilver,
    obsidian: noirObsidian,
    onyx: noirOnyx,
    overlay: 'rgba(0, 0, 0, 0.85)',
    text: chalkWhite,
    textMuted: chromeMetal,
    textSoft: '#636366',
    icon: platinumSilver,
    tint: chalkWhite,
    tabIconDefault: '#636366',
    tabIconSelected: chalkWhite,
    tabBar: 'rgba(7, 7, 9, 0.98)',
    tabBarBorder: 'rgba(255, 255, 255, 0.10)',
    success: chalkWhite,
    warning: platinumSilver,
    error: '#FF453A',
    shadow: 'rgba(0, 0, 0, 0.9)',
    heroGradient: ['#070709', '#141419', '#070709'],
    primaryGradient: [chalkWhite, platinumSilver],
    rewardGradient: [chalkWhite, '#C7C7CC'],
  },

  // High-Contrast Monochrome Light Mode
  light: {
    primary: '#000000',
    primaryStrong: '#1C1C1E',
    primarySoft: 'rgba(0, 0, 0, 0.08)',
    secondary: '#3A3A3C',
    accent: '#000000',
    background: '#F4F4F6',
    backgroundAlt: '#EBEBF0',
    surface: '#FFFFFF',
    surfaceMuted: '#EFEFF4',
    card: '#FFFFFF',
    inputBackground: '#FFFFFF',
    border: 'rgba(0, 0, 0, 0.10)',
    cardBorder: 'rgba(0, 0, 0, 0.10)',
    cardHighlight: 'rgba(255, 255, 255, 0.9)',
    neon: '#000000',
    gold: '#48484A',
    obsidian: noirObsidian,
    onyx: noirOnyx,
    overlay: 'rgba(0, 0, 0, 0.25)',
    text: '#070709',
    textMuted: '#6B6B70',
    textSoft: '#8E8E93',
    icon: '#48484A',
    tint: '#000000',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#000000',
    tabBar: 'rgba(255, 255, 255, 0.98)',
    tabBarBorder: 'rgba(0, 0, 0, 0.08)',
    success: '#000000',
    warning: '#48484A',
    error: '#D32F2F',
    shadow: 'rgba(0, 0, 0, 0.12)',
    heroGradient: ['#FFFFFF', '#F4F4F6', '#EBEBF0'],
    primaryGradient: ['#000000', '#2C2C2E'],
    rewardGradient: ['#000000', '#2C2C2E'],
  },
};
