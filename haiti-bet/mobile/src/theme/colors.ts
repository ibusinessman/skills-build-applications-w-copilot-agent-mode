export const colors = {
  haitiBlue: '#003087',
  haitiRed: '#D21034',
  haitiGold: '#FFD700',
  dark: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  green: '#16a34a',
  yellow: '#eab308',
  white: '#ffffff',
  textMuted: '#94a3b8',
} as const;

export type ColorKey = keyof typeof colors;
