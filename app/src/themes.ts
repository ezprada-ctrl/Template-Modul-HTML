export interface ThemeColors {
  accent: string;
  accent2: string;
  onAccent: string;
  navy: string;
}

export interface ThemePreset extends ThemeColors {
  id: string;
  label: string;
}

// Curated brand-color combos (accent + navy only) - the 5 semantic colors
// (correct/wrong/info/warning callouts) stay fixed across every theme since
// they carry meaning, not brand identity.
export const THEME_PRESETS: ThemePreset[] = [
  { id: 'gold-navy', label: 'Emas Klasik', accent: '#c99a3d', accent2: '#b3822a', onAccent: '#2a1c04', navy: '#1b2a4a' },
  { id: 'blue-navy', label: 'Biru Kemenkeu', accent: '#2e6da4', accent2: '#234f7d', onAccent: '#ffffff', navy: '#16233d' },
  { id: 'forest-green', label: 'Hijau Zamrud', accent: '#3f7a4e', accent2: '#2f5e3b', onAccent: '#ffffff', navy: '#17281a' },
  { id: 'maroon', label: 'Merah Marun', accent: '#9c3b46', accent2: '#7a2e37', onAccent: '#ffffff', navy: '#2b1418' },
  { id: 'purple', label: 'Ungu Elegan', accent: '#6c4fa1', accent2: '#52397e', onAccent: '#ffffff', navy: '#201a35' },
  { id: 'teal', label: 'Teal Modern', accent: '#1f8a8c', accent2: '#17696b', onAccent: '#ffffff', navy: '#102b2c' },
];

export const DEFAULT_THEME: ThemeColors = THEME_PRESETS[0];

export function findThemePresetId(theme: ThemeColors): string | null {
  const match = THEME_PRESETS.find(p => p.accent === theme.accent && p.navy === theme.navy);
  return match ? match.id : null;
}
