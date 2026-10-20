export type ThemeName = 'light' | 'dark';
type GradientColors = readonly [string, string, ...string[]];

export type AppTheme = {
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  tertiary: string;
  tertiarySoft: string;
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

  // Unified 3-Color Theory System: Primary (Ice Blue), Secondary (Sunset Coral), Tertiary (Neo Mint)
  iceBlue: string;
  iceBlueLight: string;
  iceBlueDark: string;
  coral: string;
  coralLight: string;
  coralDark: string;
  mint: string;
  mintLight: string;
  mintDark: string;
  lavender: string;
  lavenderLight: string;
  lavenderDark: string;
  amber: string;
  amberLight: string;
  amberDark: string;
  pillWhite: string;
  pillDark: string;
};

// Rich Matte Obsidian & Expressive Accents
const matteObsidian = '#0D0E13';
const matteOnyx = '#16171E';
const chalkWhite = '#FFFFFF';
const platinumSilver = '#E5E5EA';
const chromeMetal = '#8E8E93';

export const Colors: Record<ThemeName, AppTheme> = {
  // Chat-Style Minimal Dark Palette (Unified 3-Color Theory)
  dark: {
    primary: '#38BDF8', // Primary: Ice Blue
    primaryStrong: '#7DD3FC',
    primarySoft: 'rgba(56, 189, 248, 0.16)',
    secondary: '#FF5B45', // Secondary: Sunset Coral
    secondarySoft: 'rgba(255, 91, 69, 0.16)',
    tertiary: '#10B981', // Tertiary: Neo Mint
    tertiarySoft: 'rgba(16, 185, 129, 0.16)',
    accent: '#FF5B45', // Sunset Coral Accent
    background: matteObsidian,
    backgroundAlt: '#07080B',
    surface: matteOnyx,
    surfaceMuted: '#1F2129',
    card: '#1A1B23',
    inputBackground: '#22242F',
    border: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardHighlight: 'rgba(255, 255, 255, 0.18)',
    neon: '#10B981',
    gold: '#FFC043',
    obsidian: matteObsidian,
    onyx: matteOnyx,
    overlay: 'rgba(0, 0, 0, 0.85)',
    text: chalkWhite,
    textMuted: chromeMetal,
    textSoft: '#636366',
    icon: platinumSilver,
    tint: '#38BDF8',
    tabIconDefault: '#71717A',
    tabIconSelected: '#38BDF8',
    tabBar: 'rgba(16, 17, 22, 0.96)',
    tabBarBorder: 'rgba(255, 255, 255, 0.08)',
    success: '#10B981',
    warning: '#FFC043',
    error: '#FF453A',
    shadow: 'rgba(0, 0, 0, 0.5)',
    heroGradient: ['#0D0E13', '#1A1B23', '#0D0E13'],
    primaryGradient: ['#38BDF8', '#0284C7'],
    rewardGradient: ['#FF5B45', '#FF8A75'],

    // Unified 3-Color Triad + Theme Accents
    iceBlue: '#38BDF8',
    iceBlueLight: '#7DD3FC',
    iceBlueDark: 'rgba(56, 189, 248, 0.20)',
    coral: '#FF5B45',
    coralLight: '#FF7E6C',
    coralDark: 'rgba(255, 91, 69, 0.20)',
    mint: '#10B981',
    mintLight: '#34D399',
    mintDark: 'rgba(16, 185, 129, 0.20)',
    lavender: '#818CF8',
    lavenderLight: '#A5B4FC',
    lavenderDark: 'rgba(129, 140, 248, 0.20)',
    amber: '#FFC043',
    amberLight: '#FFD074',
    amberDark: 'rgba(255, 192, 67, 0.20)',
    pillWhite: '#FFFFFF',
    pillDark: '#20222B',
  },

  // High-Contrast Clean Porcelain Light Mode (Unified 3-Color Theory)
  light: {
    primary: '#0284C7', // Primary: Ice Blue (Deep high-contrast)
    primaryStrong: '#0369A1',
    primarySoft: 'rgba(2, 132, 199, 0.12)',
    secondary: '#FF5B45', // Secondary: Sunset Coral
    secondarySoft: 'rgba(255, 91, 69, 0.12)',
    tertiary: '#10B981', // Tertiary: Neo Mint
    tertiarySoft: 'rgba(16, 185, 129, 0.12)',
    accent: '#FF5B45',
    background: '#F5F6F8',
    backgroundAlt: '#ECEEF2',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF0F5',
    card: '#FFFFFF',
    inputBackground: '#F3F4F8',
    border: 'rgba(0, 0, 0, 0.07)',
    cardBorder: 'rgba(0, 0, 0, 0.07)',
    cardHighlight: 'rgba(255, 255, 255, 0.9)',
    neon: '#10B981',
    gold: '#D97706',
    obsidian: matteObsidian,
    onyx: matteOnyx,
    overlay: 'rgba(0, 0, 0, 0.35)',
    text: '#0D0E13',
    textMuted: '#6B6B70',
    textSoft: '#8E8E93',
    icon: '#48484A',
    tint: '#0284C7',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#0284C7',
    tabBar: 'rgba(255, 255, 255, 0.96)',
    tabBarBorder: 'rgba(0, 0, 0, 0.06)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    shadow: 'rgba(0, 0, 0, 0.08)',
    heroGradient: ['#FFFFFF', '#F5F6F8', '#ECEEF2'],
    primaryGradient: ['#0284C7', '#0369A1'],
    rewardGradient: ['#FF5B45', '#FF8A75'],

    // Unified 3-Color Triad + Theme Accents
    iceBlue: '#0284C7',
    iceBlueLight: '#E0F2FE',
    iceBlueDark: '#0369A1',
    coral: '#FF5B45',
    coralLight: '#FFF0ED',
    coralDark: '#E0422D',
    mint: '#10B981',
    mintLight: '#ECFDF5',
    mintDark: '#059669',
    lavender: '#818CF8',
    lavenderLight: '#EEF0FF',
    lavenderDark: '#464BC8',
    amber: '#F59E0B',
    amberLight: '#FEF3C7',
    amberDark: '#D97706',
    pillWhite: '#FFFFFF',
    pillDark: '#F3F4F8',
  },
};
