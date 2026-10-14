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

const lightPrimary = '#1E9731';
const darkPrimary = '#5BC272';

export const Colors: Record<ThemeName, AppTheme> = {
  light: {
    primary: lightPrimary,
    primaryStrong: '#127A25',
    primarySoft: 'rgba(30, 151, 49, 0.12)',
    secondary: '#38B14F',
    accent: '#CC921E',
    background: '#F4F8F1',
    backgroundAlt: '#ECF3E7',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF4EA',
    card: '#FFFFFF',
    inputBackground: '#FBFDF8',
    border: '#D7E2D2',
    overlay: 'rgba(16, 34, 23, 0.06)',
    text: '#132218',
    textMuted: '#5B7361',
    textSoft: '#849488',
    icon: '#6A8170',
    tint: lightPrimary,
    tabIconDefault: '#7A8E7F',
    tabIconSelected: lightPrimary,
    tabBar: 'rgba(255, 255, 255, 0.94)',
    tabBarBorder: 'rgba(30, 151, 49, 0.16)',
    success: '#1E9731',
    warning: '#B97D15',
    error: '#C84F47',
    shadow: 'rgba(19, 34, 24, 0.16)',
    heroGradient: ['#FAFDF7', '#F0F7EC', '#E7F2E1'],
    primaryGradient: ['#1E9731', '#30A944'],
    rewardGradient: ['#F6E3A6', '#E0B24C'],
  },
  dark: {
    primary: darkPrimary,
    primaryStrong: '#41995A',
    primarySoft: 'rgba(91, 194, 114, 0.14)',
    secondary: '#7BE08F',
    accent: '#F4C95D',
    background: '#121212',
    backgroundAlt: '#181818',
    surface: '#1E1E1E',
    surfaceMuted: '#2A2A2A',
    card: '#1F1F1F',
    inputBackground: '#252525',
    border: '#333333',
    overlay: 'rgba(0, 0, 0, 0.4)',
    text: '#F3FBF5',
    textMuted: '#A4C1AA',
    textSoft: '#78917D',
    icon: '#9CBBA3',
    tint: darkPrimary,
    tabIconDefault: '#6E8D74',
    tabIconSelected: darkPrimary,
    tabBar: 'rgba(0, 0, 0, 0.96)',
    tabBarBorder: 'rgba(91, 194, 114, 0.12)',
    success: '#5BC272',
    warning: '#E2B24A',
    error: '#EC726B',
    shadow: 'rgba(0, 0, 0, 0.5)',
    heroGradient: ['#121212', '#161917', '#121212'],
    primaryGradient: ['#5BC272', '#4EAD66'],
    rewardGradient: ['#E0BF6A', '#C9922B'],
  },
};
