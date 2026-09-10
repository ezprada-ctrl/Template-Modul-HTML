import type { ModuleData, Section, QuizMode, QuizPolicy } from './types';
import { DEFAULT_QUIZ_POLICY, KEBIJAKAN_GERBANG } from './types';

/* Mode kuis yang BERLAKU untuk satu section.
 *
 * Kalau `quizMode` belum pernah dipilih, modenya DISIMPULKAN dari angka yang
 * berlaku - bukan dipatok ke salah satu. Sebabnya: sebelum mode ini ada,
 * "wajib benar semua + ulang tanpa batas" memang sudah berarti gerbang, dan
 * itu juga bawaan tiap modul. Menyimpulkannya bikin setiap modul lama
 * langsung berlabel benar tanpa satu pun data perlu diubah, sekaligus
 * menjaga perilakunya persis sama.
 */
export function modeKuisSection(module: ModuleData, section: Section): QuizMode {
  if (section.quizMode) return section.quizMode;
  const p = kebijakanMentah(module, section);
  return p.passPercent === 100 && p.maxAttempts === 0 ? 'gerbang' : 'nilai';
}

/* Angka yang tertulis (bawaan modul + timpaan section), TANPA memaksakan
 * aturan mode. Dipakai modeKuisSection untuk menyimpulkan mode - kalau dia
 * memanggil kebijakanKuisSection() di bawah, hasilnya jadi berputar. */
function kebijakanMentah(module: ModuleData, section: Section): QuizPolicy {
  const dasar = { ...DEFAULT_QUIZ_POLICY, ...(module.quizPolicy || {}) };
  const timpa = section.quizPolicy || {};
  return {
    passPercent: timpa.passPercent ?? dasar.passPercent,
    maxAttempts: timpa.maxAttempts ?? dasar.maxAttempts,
  };
}

/* Aturan yang BENAR-BENAR dipakai. Di mode gerbang, angka yang tertulis
 * diabaikan - lihat KEBIJAKAN_GERBANG di types.ts untuk alasannya. */
export function kebijakanKuisSection(module: ModuleData, section: Section): QuizPolicy {
  return modeKuisSection(module, section) === 'gerbang'
    ? { ...KEBIJAKAN_GERBANG }
    : kebijakanMentah(module, section);
}
