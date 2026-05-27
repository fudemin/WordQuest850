/**
 * 全局主题颜色与阴影 —— 与 wordquest_prototype.html 中 :root 变量保持一致
 */
export const Colors = {
  primary: '#FF6B35',
  primaryLight: '#FF8C5A',
  primaryBg: '#FFF3EE',

  green: '#2ECC71',
  greenBg: '#E8F8F0',
  blue: '#3498DB',
  blueBg: '#EBF5FB',
  purple: '#9B59B6',
  purpleBg: '#F5EEF8',
  amber: '#F39C12',
  amberBg: '#FEF9E7',
  red: '#E74C3C',
  redBg: '#FDEDEC',

  gray50: '#FAFAF9',
  gray100: '#F4F3F0',
  gray200: '#E8E6E1',
  gray400: '#A8A29E',
  gray700: '#44403C',
  gray900: '#1C1917',

  white: '#FFFFFF',
  background: '#F0EDE8',

  // 限时闯关深色背景
  darkBg: '#1A1A2E',
  darkCard: '#16213E',
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
