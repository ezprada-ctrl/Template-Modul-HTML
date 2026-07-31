export interface GraphicStylePreset {
  id: string;
  label: string;
}

// 10 gaya dekorasi grafis siap-pakai - INDEPENDEN dari THEME_PRESETS (warna)
// di themes.ts, lihat ModuleData.graphicStyle di types.ts. Sengaja cuma
// id+label (TANPA deskripsi per gaya) - bentuknya udah langsung keliatan dari
// live preview (SlidePreview) begitu dipilih, teks penjelasan cuma nambah
// noise buat orang yang lagi milih sambil lihat hasilnya langsung.
export const GRAPHIC_STYLES: GraphicStylePreset[] = [
  { id: 'none', label: 'Tanpa Gaya Grafis' },
  { id: 'blob', label: 'Blob Abstrak' },
  { id: 'gradient-orb', label: 'Lingkaran Gradasi' },
  { id: 'dot-grid', label: 'Grid Titik' },
  { id: 'corner-bracket', label: 'Bingkai Sudut' },
  { id: 'diagonal-block', label: 'Blok Diagonal' },
  { id: 'ring', label: 'Cincin Garis' },
  { id: 'layered-triangle', label: 'Segitiga Berlapis' },
  { id: 'confetti', label: 'Konfeti Titik' },
  { id: 'stacked-arc', label: 'Lengkung Bertumpuk' },
  { id: 'layered-rect', label: 'Balok Lapis' },
];
