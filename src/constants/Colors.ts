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

// Playful Retro-Futurism Master Color Palette (Specification from Design Board)
export const RETRO_PALETTE = {
  spaceBlue: '#0B1E3B',        // Primary Canvas (Deep Space)
  spaceBlueDark: '#07152B',    // Deepest Cosmos
  spaceBlueElevated: '#102548',// Elevated Retro-Futuristic Card
  spaceBlueSurface: '#0E2140', // Surface Container
  electricBlue: '#3B82F6',     // Primary Interactive / Button / Active
  electricBlueDark: '#2563EB', // Pressed State / Deep Cobalt
  electricBlueSoft: 'rgba(59, 130, 246, 0.18)',
  neonCyan: '#22D3EE',         // Energy Accent / Glowing Orbital Ring
  neonCyanSoft: 'rgba(34, 211, 238, 0.18)',
  mintGreen: '#22D3A7',        // Success / Live Available / Active Power
  mintGreenSoft: 'rgba(34, 211, 167, 0.18)',
  sunYellow: '#FBBF24',        // Rating / Highlight / Star / Warning
  sunYellowSoft: 'rgba(251, 191, 36, 0.18)',
  cream: '#F8FAFC',            // Crisp Text / High-Contrast Elements
  slate: '#64748B',            // Muted Text / Icons
  slateLight: '#94A3B8',       // Subtitles / Secondary Labels
};

export const Colors: Record<ThemeName, AppTheme> = {
  // Playful Retro-Futurism Dark Mode (Deep Space Blue Canvas with Electric Accents)
  dark: {
    primary: RETRO_PALETTE.electricBlue,
    primaryStrong: '#60A5FA',
    primarySoft: RETRO_PALETTE.electricBlueSoft,
    secondary: RETRO_PALETTE.neonCyan,
    secondarySoft: RETRO_PALETTE.neonCyanSoft,
    tertiary: RETRO_PALETTE.mintGreen,
    tertiarySoft: RETRO_PALETTE.mintGreenSoft,
    accent: RETRO_PALETTE.electricBlue,
    background: RETRO_PALETTE.spaceBlue,
    backgroundAlt: RETRO_PALETTE.spaceBlueDark,
    surface: RETRO_PALETTE.spaceBlueElevated,
    surfaceMuted: RETRO_PALETTE.spaceBlueSurface,
    card: RETRO_PALETTE.spaceBlueElevated,
    inputBackground: RETRO_PALETTE.spaceBlueSurface,
    border: 'rgba(59, 130, 246, 0.20)',
    cardBorder: 'rgba(59, 130, 246, 0.24)',
    cardHighlight: 'rgba(34, 211, 238, 0.30)',
    neon: RETRO_PALETTE.neonCyan,
    gold: RETRO_PALETTE.sunYellow,
    obsidian: RETRO_PALETTE.spaceBlue,
    onyx: RETRO_PALETTE.spaceBlueElevated,
    overlay: 'rgba(11, 30, 59, 0.88)',
    text: RETRO_PALETTE.cream,
    textMuted: RETRO_PALETTE.slateLight,
    textSoft: RETRO_PALETTE.slate,
    icon: RETRO_PALETTE.cream,
    tint: RETRO_PALETTE.electricBlue,
    tabIconDefault: RETRO_PALETTE.slate,
    tabIconSelected: RETRO_PALETTE.electricBlue,
    tabBar: 'rgba(11, 30, 59, 0.96)',
    tabBarBorder: 'rgba(59, 130, 246, 0.20)',
    success: RETRO_PALETTE.mintGreen,
    warning: RETRO_PALETTE.sunYellow,
    error: '#FF453A',
    shadow: 'rgba(11, 30, 59, 0.7)',
    heroGradient: [RETRO_PALETTE.spaceBlue, RETRO_PALETTE.spaceBlueElevated, RETRO_PALETTE.spaceBlue],
    primaryGradient: [RETRO_PALETTE.electricBlue, RETRO_PALETTE.neonCyan],
    rewardGradient: [RETRO_PALETTE.sunYellow, '#F59E0B'],

    // Signature 3-Color Triad & Playful Retro Palette
    iceBlue: RETRO_PALETTE.electricBlue,
    iceBlueLight: '#93C5FD',
    iceBlueDark: RETRO_PALETTE.electricBlueDark,
    coral: '#FF5B45',
    coralLight: '#FF7E6C',
    coralDark: 'rgba(255, 91, 69, 0.20)',
    mint: RETRO_PALETTE.mintGreen,
    mintLight: '#6EE7B7',
    mintDark: 'rgba(34, 211, 167, 0.20)',
    lavender: RETRO_PALETTE.neonCyan,
    lavenderLight: '#67E8F9',
    lavenderDark: 'rgba(34, 211, 238, 0.20)',
    amber: RETRO_PALETTE.sunYellow,
    amberLight: '#FDE68A',
    amberDark: 'rgba(251, 191, 36, 0.20)',
    pillWhite: RETRO_PALETTE.cream,
    pillDark: RETRO_PALETTE.spaceBlueSurface,
  },

  // Playful Retro-Futurism Light Mode (Crisp Cream & Sky Canvas)
  light: {
    primary: RETRO_PALETTE.electricBlueDark,
    primaryStrong: '#1D4ED8',
    primarySoft: 'rgba(37, 99, 235, 0.12)',
    secondary: '#0891B2',
    secondarySoft: 'rgba(8, 145, 178, 0.12)',
    tertiary: '#059669',
    tertiarySoft: 'rgba(5, 150, 105, 0.12)',
    accent: RETRO_PALETTE.electricBlueDark,
    background: RETRO_PALETTE.cream,
    backgroundAlt: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F5F9',
    card: '#FFFFFF',
    inputBackground: '#F1F5F9',
    border: 'rgba(59, 130, 246, 0.14)',
    cardBorder: 'rgba(59, 130, 246, 0.16)',
    cardHighlight: 'rgba(255, 255, 255, 0.9)',
    neon: '#0891B2',
    gold: '#D97706',
    obsidian: RETRO_PALETTE.spaceBlue,
    onyx: RETRO_PALETTE.spaceBlueElevated,
    overlay: 'rgba(11, 30, 59, 0.35)',
    text: RETRO_PALETTE.spaceBlue,
    textMuted: '#475569',
    textSoft: RETRO_PALETTE.slate,
    icon: RETRO_PALETTE.spaceBlue,
    tint: RETRO_PALETTE.electricBlueDark,
    tabIconDefault: RETRO_PALETTE.slate,
    tabIconSelected: RETRO_PALETTE.electricBlueDark,
    tabBar: 'rgba(248, 250, 252, 0.96)',
    tabBarBorder: 'rgba(59, 130, 246, 0.12)',
    success: '#059669',
    warning: '#D97706',
    error: '#EF4444',
    shadow: 'rgba(11, 30, 59, 0.08)',
    heroGradient: ['#FFFFFF', RETRO_PALETTE.cream, '#F1F5F9'],
    primaryGradient: [RETRO_PALETTE.electricBlueDark, '#0284C7'],
    rewardGradient: [RETRO_PALETTE.sunYellow, '#D97706'],

    iceBlue: RETRO_PALETTE.electricBlueDark,
    iceBlueLight: '#DBEAFE',
    iceBlueDark: '#1E40AF',
    coral: '#FF5B45',
    coralLight: '#FFF0ED',
    coralDark: '#E0422D',
    mint: '#059669',
    mintLight: '#D1FAE5',
    mintDark: '#065F46',
    lavender: '#0891B2',
    lavenderLight: '#CFFAFE',
    lavenderDark: '#155E75',
    amber: '#D97706',
    amberLight: '#FEF3C7',
    amberDark: '#92400E',
    pillWhite: '#FFFFFF',
    pillDark: '#E2E8F0',
  },
};
