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

  // Legacy accent slots (kept so every existing screen keeps working)
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

  // Pulse style: playful payment-app palette
  lime: string; // "Go" colour: start, pay, success moments (always black text on it)
  onLime: string;
  violet: string; // Brand / primary
  pink: string; // Rewards, delight
  sun: string; // Warnings, holds, pending
  sky: string; // Info, live data
  ink: string; // Always-dark surface (pass cards, dock)
  inkSoft: string;
  paper: string; // Always-light surface (car garage card, receipts)
  passGradient: GradientColors;
  limeGradient: GradientColors;
};

/**
 * iOS style palette (from the iOS 27 design in the UI/UX document)
 *  Accent    system blue  #007AFF  → actions, selected, links ("lime" token kept for compatibility)
 *  Secondary indigo       #5856D6  → icon tiles, secondary info ("violet" token)
 *  Neutral   iOS grouped greys / white cards (light), near-black and #1C1C1E (dark)
 *  Status    green #34C759 (ok), orange #FF9500 (warn), red #FF3B30 (error): meaning only
 */
const BLUE = '#007AFF';
const BLUE_DEEP = '#0A60D6';
const INDIGO = '#5856D6';
const GREEN = '#34C759';
const ORANGE = '#FF9500';
const RED = '#FF3B30';
const CYAN = '#32ADE6';

export const Colors: Record<ThemeName, AppTheme> = {
  light: {
    primary: BLUE,
    primaryStrong: BLUE_DEEP,
    primarySoft: 'rgba(0, 122, 255, 0.12)',
    secondary: INDIGO,
    secondarySoft: 'rgba(88, 86, 214, 0.12)',
    tertiary: GREEN,
    tertiarySoft: 'rgba(52, 199, 89, 0.14)',
    accent: BLUE,
    background: '#F2F2F7',
    backgroundAlt: '#E9E9EE',
    surface: '#FFFFFF',
    surfaceMuted: '#EBEBF0',
    card: '#FFFFFF',
    inputBackground: '#FFFFFF',
    border: 'rgba(60, 60, 67, 0.14)',
    cardBorder: 'rgba(60, 60, 67, 0.10)',
    cardHighlight: 'rgba(255, 255, 255, 0.9)',
    neon: GREEN,
    gold: ORANGE,
    obsidian: '#000000',
    onyx: '#1C1C1E',
    overlay: 'rgba(0, 0, 0, 0.4)',
    text: '#000000',
    textMuted: '#6C6C70',
    textSoft: '#8E8E93',
    icon: '#3A3A3C',
    tint: BLUE,
    tabIconDefault: '#3A3A3C',
    tabIconSelected: BLUE,
    tabBar: 'rgba(255, 255, 255, 0.72)',
    tabBarBorder: 'rgba(60, 60, 67, 0.12)',
    success: GREEN,
    warning: ORANGE,
    error: RED,
    shadow: 'rgba(0, 0, 0, 0.10)',
    heroGradient: ['#FFFFFF', '#F2F2F7', '#E9E9EE'],
    primaryGradient: ['#4DA3FF', BLUE],
    rewardGradient: [BLUE, '#4DA3FF'],

    iceBlue: BLUE,
    iceBlueLight: '#E5F1FF',
    iceBlueDark: BLUE_DEEP,
    coral: INDIGO,
    coralLight: '#ECECFB',
    coralDark: '#3F3DB0',
    mint: GREEN,
    mintLight: '#E4F7E9',
    mintDark: '#248A3D',
    lavender: INDIGO,
    lavenderLight: '#ECECFB',
    lavenderDark: '#3F3DB0',
    amber: ORANGE,
    amberLight: '#FFF1DC',
    amberDark: '#C93400',
    pillWhite: '#FFFFFF',
    pillDark: '#EBEBF0',

    lime: BLUE,
    onLime: '#FFFFFF',
    violet: INDIGO,
    pink: INDIGO,
    sun: ORANGE,
    sky: CYAN,
    ink: '#000000',
    inkSoft: '#1C1C1E',
    paper: '#FFFFFF',
    passGradient: ['#4DA3FF', BLUE, BLUE_DEEP],
    limeGradient: ['#4DA3FF', BLUE],
  },

  dark: {
    primary: '#0A84FF',
    primaryStrong: '#409CFF',
    primarySoft: 'rgba(10, 132, 255, 0.20)',
    secondary: '#5E5CE6',
    secondarySoft: 'rgba(94, 92, 230, 0.20)',
    tertiary: '#30D158',
    tertiarySoft: 'rgba(48, 209, 88, 0.20)',
    accent: '#0A84FF',
    background: '#0B0C10',
    backgroundAlt: '#000000',
    surface: '#1C1C1E',
    surfaceMuted: '#2C2C2E',
    card: '#1C1C1E',
    inputBackground: '#1C1C1E',
    border: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardHighlight: 'rgba(255, 255, 255, 0.18)',
    neon: '#30D158',
    gold: '#FF9F0A',
    obsidian: '#000000',
    onyx: '#1C1C1E',
    overlay: 'rgba(0, 0, 0, 0.6)',
    text: '#FFFFFF',
    textMuted: '#A1A1A6',
    textSoft: '#6E6E73',
    icon: '#E5E5EA',
    tint: '#0A84FF',
    tabIconDefault: '#D1D1D6',
    tabIconSelected: '#0A84FF',
    tabBar: 'rgba(28, 28, 30, 0.72)',
    tabBarBorder: 'rgba(255, 255, 255, 0.10)',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    shadow: 'rgba(0, 0, 0, 0.5)',
    heroGradient: ['#000000', '#1C1C1E', '#000000'],
    primaryGradient: ['#409CFF', '#0A84FF'],
    rewardGradient: ['#0A84FF', '#409CFF'],

    iceBlue: '#0A84FF',
    iceBlueLight: '#409CFF',
    iceBlueDark: 'rgba(10, 132, 255, 0.22)',
    coral: '#5E5CE6',
    coralLight: '#7D7AFF',
    coralDark: 'rgba(94, 92, 230, 0.22)',
    mint: '#30D158',
    mintLight: '#63E67F',
    mintDark: 'rgba(48, 209, 88, 0.22)',
    lavender: '#5E5CE6',
    lavenderLight: '#7D7AFF',
    lavenderDark: 'rgba(94, 92, 230, 0.22)',
    amber: '#FF9F0A',
    amberLight: '#FFB340',
    amberDark: 'rgba(255, 159, 10, 0.22)',
    pillWhite: '#FFFFFF',
    pillDark: '#2C2C2E',

    lime: '#0A84FF',
    onLime: '#FFFFFF',
    violet: '#5E5CE6',
    pink: '#5E5CE6',
    sun: '#FF9F0A',
    sky: '#64D2FF',
    ink: '#000000',
    inkSoft: '#1C1C1E',
    paper: '#1C1C1E',
    passGradient: ['#409CFF', '#0A84FF', '#0A60D6'],
    limeGradient: ['#409CFF', '#0A84FF'],
  },
};
