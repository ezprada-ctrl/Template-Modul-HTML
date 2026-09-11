import type { ModuleData } from '../types';
import { emptyModule } from '../types';

/* Proyek contoh yang dipakai Demo Booth Penyusun.
 *
 * ADA agar demo tidak pernah menyentuh pekerjaan orang: draft sungguhan
 * tersimpan di server per slug, dan demo yang mengetik di atasnya berarti
 * mengubah modul yang sedang disusun seseorang. Di mode demo autosave
 * dimatikan dan modulnya diganti dengan yang ini.
 *
 * Sengaja SETENGAH JADI: dua slide sudah terisi, satu bagian masih kosong,
 * kuisnya belum ada. Yang dipamerkan demo adalah PEKERJAAN MENYUSUN - kalau
 * proyeknya sudah lengkap, tidak ada yang tersisa untuk diperagakan selain
 * menggulir.
 */
export function sampleProject(): ModuleData {
  const m = emptyModule('demo-booth');
  return {
    ...m,
    title: 'Dasar-Dasar Perbendaharaan',
    heroTitleHtml: 'Dasar-Dasar<br><span>Perbendaharaan</span>',
    heroDesc: 'Modul contoh yang sedang disusun di booth ini.',
    sidebarTitle: 'Dasar-Dasar Perbendaharaan',
    sections: [
      { id: 'a', title: 'A. Pengantar', short: 'Pengantar', icon: 'A', color: '#c99a3d' },
      { id: 'b', title: 'B. Praktik', short: 'Praktik', icon: 'B', color: '#3d7fc9' },
    ],
    slides: [
      {
        id: 'demo-s1', number: 2, sectionId: 'a',
        title: 'Apa yang Dipelajari di Sini',
        kickerLabel: 'A.1 TUJUAN',
        blocks: [
          { id: 'demo-b1', type: 'card', icon: '🎯', heading: 'Tujuan Pembelajaran',
            bodyHtml: '<p>Setelah modul ini, peserta dapat menjelaskan alur dasar perbendaharaan negara.</p>' },
          { id: 'demo-b2', type: 'callout', variant: 'amber',
            bodyHtml: 'Materi ini prasyarat untuk modul lanjutan.' },
        ],
      },
      {
        id: 'demo-s2', number: 3, sectionId: 'a',
        title: 'Tiga Pilar yang Harus Dipegang',
        kickerLabel: 'A.2 KONSEP',
        blocks: [
          { id: 'demo-b3', type: 'ticklist', ordered: true,
            items: ['Perencanaan yang terukur', 'Pelaksanaan yang tertib', 'Pertanggungjawaban yang terbuka'] },
        ],
      },
    ],
    quizzes: {},
  };
}
