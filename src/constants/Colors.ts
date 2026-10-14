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

// CRED Signature Palette
const credNeonGreen = '#00E575';
const credNeonMint = '#05DF72';
const credGold = '#F5A623';
const credDarkObsidian = '#0A0A0B';
const credDarkOnyx = '#121215';

export const Colors: Record<ThemeName, AppTheme> = {
  // CRED Dark Luxury (Hero Default)
  dark: {
    primary: credNeonGreen,
    primaryStrong: '#00BF5E',
    primarySoft: 'rgba(0, 229, 117, 0.12)',
    secondary: credNeonMint,
    accent: credGold,
    background: credDarkObsidian,
    backgroundAlt: '#060607',
    surface: credDarkOnyx,
    surfaceMuted: '#17171C',
    card: '#131316',
    inputBackground: '#16161B',
    border: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardHighlight: 'rgba(255, 255, 255, 0.12)',
    neon: credNeonGreen,
    gold: credGold,
    obsidian: credDarkObsidian,
    onyx: credDarkOnyx,
    overlay: 'rgba(0, 0, 0, 0.78)',
    text: '#FFFFFF',
    textMuted: '#8E8E93',
    textSoft: '#636366',
    icon: '#A1A1A6',
    tint: credNeonGreen,
    tabIconDefault: '#636366',
    tabIconSelected: credNeonGreen,
    tabBar: 'rgba(10, 10, 11, 0.98)',
    tabBarBorder: 'rgba(255, 255, 255, 0.06)',
    success: credNeonGreen,
    warning: credGold,
    error: '#FF3B30',
    shadow: 'rgba(0, 0, 0, 0.8)',
    heroGradient: ['#0A0A0B', '#121216', '#0A0A0B'],
    primaryGradient: ['#00E575', '#00BF5E'],
    rewardGradient: ['#F5A623', '#D48806'],
  },

  // CRED High-Contrast Bone White (Alternative)
  light: {
    primary: '#00B85C',
    primaryStrong: '#008F47',
    primarySoft: 'rgba(0, 184, 92, 0.10)',
    secondary: '#00E575',
    accent: '#D48806',
    background: '#F6F6F4',
    backgroundAlt: '#EDEDEB',
    surface: '#FFFFFF',
    surfaceMuted: '#F0F0EE',
    card: '#FFFFFF',
    inputBackground: '#FFFFFF',
    border: 'rgba(0, 0, 0, 0.08)',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    cardHighlight: 'rgba(255, 255, 255, 0.8)',
    neon: credNeonGreen,
    gold: credGold,
    obsidian: credDarkObsidian,
    onyx: credDarkOnyx,
    overlay: 'rgba(0, 0, 0, 0.15)',
    text: '#0A0A0B',
    textMuted: '#6B6B70',
    textSoft: '#8E8E93',
    icon: '#6B6B70',
    tint: '#00B85C',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#00B85C',
    tabBar: 'rgba(255, 255, 255, 0.96)',
    tabBarBorder: 'rgba(0, 0, 0, 0.06)',
    success: '#00B85C',
    warning: '#D48806',
    error: '#D32F2F',
    shadow: 'rgba(0, 0, 0, 0.12)',
    heroGradient: ['#FFFFFF', '#F6F6F4', '#EDEDEB'],
    primaryGradient: ['#00B85C', '#00964B'],
    rewardGradient: ['#F5A623', '#D48806'],
  },
};
