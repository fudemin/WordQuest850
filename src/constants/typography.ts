/**
 * 字体尺寸与字重规范
 * display: 数字/标题用大字重 (Nunito)
 * body: 中文正文 (System default，iOS 使用 PingFang SC)
 */
export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 36,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};
