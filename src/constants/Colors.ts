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
 * PALETTE (one system, strict roles)
 *  Brand    lime   #A996FF  → the action colour: buttons, live, selected, "go"
 *           violet #7B5CFF  → the deep brand colour: wallet, info, links, charts
 *  Neutral  ink / paper     → backgrounds, cards, text
 *  Status   green #22D38A (ok), amber #FFC83D (warn), red #FF5A5F (error)
 *           Status colours show meaning only, never decoration.
 * No pink, sky-blue, coral or yellow-green anywhere.
 */
// Pulse palette
const LIME = '#A996FF';
const VIOLET = '#7B5CFF';
const VIOLET_DEEP = '#5B3DF0';
const PINK = VIOLET; // retired: decorative pink now maps to violet
const SUN = '#FFC83D'; // warning only
const SKY = VIOLET; // retired: decorative sky now maps to violet
const MINT = '#22D38A';
const INK = '#0B0B0F';
const INK_SOFT = '#15151C';
const PAPER = '#F6F3EE';

export const Colors: Record<ThemeName, AppTheme> = {
  dark: {
    primary: VIOLET,
    primaryStrong: '#9B84FF',
    primarySoft: 'rgba(123, 92, 255, 0.18)',
    secondary: PINK,
    secondarySoft: 'rgba(123, 92, 255, 0.16)',
    tertiary: MINT,
    tertiarySoft: 'rgba(34, 211, 138, 0.16)',
    accent: LIME,
    background: INK,
    backgroundAlt: '#060608',
    surface: INK_SOFT,
    surfaceMuted: '#1F1F28',
    card: '#17171F',
    inputBackground: '#1F1F28',
    border: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardHighlight: 'rgba(255, 255, 255, 0.16)',
    neon: LIME,
    gold: SUN,
    obsidian: INK,
    onyx: INK_SOFT,
    overlay: 'rgba(0, 0, 0, 0.82)',
    text: '#FFFFFF',
    textMuted: '#A1A1B0',
    textSoft: '#6E6E7E',
    icon: '#E8E8F0',
    tint: VIOLET,
    tabIconDefault: '#6E6E7E',
    tabIconSelected: LIME,
    tabBar: 'rgba(21, 21, 28, 0.98)',
    tabBarBorder: 'rgba(255, 255, 255, 0.08)',
    success: MINT,
    warning: SUN,
    error: '#FF5A5F',
    shadow: 'rgba(0, 0, 0, 0.5)',
    heroGradient: [INK, '#17171F', INK],
    primaryGradient: [VIOLET, VIOLET_DEEP],
    rewardGradient: [VIOLET, '#9B84FF'],

    iceBlue: VIOLET,
    iceBlueLight: '#9B84FF',
    iceBlueDark: 'rgba(123, 92, 255, 0.22)',
    coral: PINK,
    coralLight: '#9B84FF',
    coralDark: 'rgba(123, 92, 255, 0.22)',
    mint: MINT,
    mintLight: '#5BE6AC',
    mintDark: 'rgba(34, 211, 138, 0.22)',
    lavender: '#9B84FF',
    lavenderLight: '#B7A6FF',
    lavenderDark: 'rgba(123, 92, 255, 0.22)',
    amber: SUN,
    amberLight: '#FFDA7A',
    amberDark: 'rgba(255, 200, 61, 0.22)',
    pillWhite: '#FFFFFF',
    pillDark: '#1F1F28',

    lime: LIME,
    onLime: INK,
    violet: VIOLET,
    pink: PINK,
    sun: SUN,
    sky: SKY,
    ink: INK,
    inkSoft: INK_SOFT,
    paper: PAPER,
    passGradient: [VIOLET, '#6A4AF5', VIOLET_DEEP],
    limeGradient: [LIME, '#8F78FF'],
  },

  light: {
    primary: VIOLET_DEEP,
    primaryStrong: '#4527D6',
    primarySoft: 'rgba(91, 61, 240, 0.12)',
    secondary: VIOLET_DEEP,
    secondarySoft: 'rgba(91, 61, 240, 0.12)',
    tertiary: '#0FA86B',
    tertiarySoft: 'rgba(15, 168, 107, 0.12)',
    accent: VIOLET_DEEP,
    background: PAPER,
    backgroundAlt: '#EDE8E0',
    surface: '#FFFFFF',
    surfaceMuted: '#EFEAE2',
    card: '#FFFFFF',
    inputBackground: '#EFEAE2',
    border: 'rgba(11, 11, 15, 0.08)',
    cardBorder: 'rgba(11, 11, 15, 0.08)',
    cardHighlight: 'rgba(255, 255, 255, 0.9)',
    neon: '#0FA86B',
    gold: '#C98A00',
    obsidian: INK,
    onyx: INK_SOFT,
    overlay: 'rgba(11, 11, 15, 0.4)',
    text: INK,
    textMuted: '#5F5C66',
    textSoft: '#8C8894',
    icon: '#2B2933',
    tint: VIOLET_DEEP,
    tabIconDefault: '#8C8894',
    tabIconSelected: LIME,
    tabBar: 'rgba(11, 11, 15, 0.98)',
    tabBarBorder: 'rgba(255, 255, 255, 0.06)',
    success: '#0FA86B',
    warning: '#C98A00',
    error: '#E5383B',
    shadow: 'rgba(11, 11, 15, 0.10)',
    heroGradient: ['#FFFFFF', PAPER, '#EDE8E0'],
    primaryGradient: [VIOLET, VIOLET_DEEP],
    rewardGradient: [VIOLET_DEEP, VIOLET],

    iceBlue: VIOLET_DEEP,
    iceBlueLight: '#ECE7FF',
    iceBlueDark: '#4527D6',
    coral: VIOLET_DEEP,
    coralLight: '#ECE7FF',
    coralDark: '#4527D6',
    mint: '#0FA86B',
    mintLight: '#E3F8EE',
    mintDark: '#0B8455',
    lavender: VIOLET_DEEP,
    lavenderLight: '#F0EBFF',
    lavenderDark: '#5B3DF0',
    amber: '#C98A00',
    amberLight: '#FFF4D6',
    amberDark: '#A06D00',
    pillWhite: '#FFFFFF',
    pillDark: '#EFEAE2',

    lime: LIME,
    onLime: INK,
    violet: VIOLET_DEEP,
    pink: VIOLET_DEEP,
    sun: SUN,
    sky: VIOLET_DEEP,
    ink: INK,
    inkSoft: INK_SOFT,
    paper: PAPER,
    passGradient: [VIOLET, '#6A4AF5', VIOLET_DEEP],
    limeGradient: [LIME, '#8F78FF'],
  },
};
