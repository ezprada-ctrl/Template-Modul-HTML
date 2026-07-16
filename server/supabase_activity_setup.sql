-- =====================================================================
-- Tabel rekam aktivitas peserta di modul (buat riset habit belajar).
-- Jalankan sekali di Supabase → SQL Editor (project fhlivnsasjgedeltaopv).
--
-- Kenapa desainnya begini:
--
-- * Modul yang di-export itu HTML statis yang jalan di dalam LMS. Dia gak
--   punya backend sendiri, jadi dia nulis LANGSUNG ke sini pakai anon key
--   yang keliatan di source HTML-nya. Itu AMAN selama anon cuma boleh
--   INSERT dan sama sekali gak boleh SELECT — persis pola yang dipakai
--   project survei-pasca-pembelajaran.
--
-- * Data gak lewat SCORM karena `cmi.suspend_data` SCORM 1.2 dibatasi
--   ~4096 karakter — durasi per-slide buat puluhan slide bakal jebol dan
--   LMS motong datanya diam-diam. SCORM tetap dipakai, tapi cuma buat
--   ngambil identitas peserta + progres (seperti sekarang).
--
-- * Kolom vs jsonb: yang SELALU dipakai buat filter/group (modul mana,
--   sesi siapa, event apa) dibikin kolom beneran + index. Sisanya yang
--   berubah-ubah per jenis event (nomor slide, durasi, jawaban kuis)
--   masuk `payload` jsonb — biar nambah jenis event baru nanti gak perlu
--   migrasi tabel.
-- =====================================================================

create table if not exists modul_activity (
  id           bigint generated always as identity primary key,

  -- Modul mana. Sengaja TANPA foreign key ke modul_drafts: modul yang
  -- udah di-export hidup terus di LMS walau draft-nya dihapus dari
  -- builder — aktivitasnya gak boleh ikut ditolak gara-gara itu.
  module_slug  text not null,

  -- Satu kali duduk belajar (digenerate di browser peserta). Ini yang
  -- dipakai buat ngerangkai urutan slide jadi satu perjalanan utuh.
  session_id   text not null,

  -- Dari LMS lewat SCORM (cmi.core.student_id / cmi.core.student_name).
  -- NULL kalau modul dibuka di luar LMS atau API SCORM gak kejangkau —
  -- makanya nullable, bukan not null.
  learner_id   text,
  learner_name text,

  -- 'session_start' | 'slide_enter' | 'slide_exit' | 'quiz_answer' |
  -- 'quiz_submit' | 'interaction' | 'session_end' | 'probe' ...
  -- Sengaja tanpa CHECK constraint: nambah jenis event baru nanti gak
  -- perlu ALTER TABLE.
  event_type   text not null,

  payload      jsonb not null default '{}'::jsonb,

  -- Waktu menurut jam perangkat peserta (bisa dipercaya buat ngukur
  -- durasi antar-event, TAPI jangan buat urutan absolut lintas peserta —
  -- jam device bisa salah). created_at di bawah itu jam server.
  client_ts    timestamptz,
  created_at   timestamptz not null default now(),

  -- Katup pengaman: tabel ini bisa di-INSERT siapa pun yang punya anon
  -- key (yaitu siapa pun yang buka source modul). Tanpa ini, satu orang
  -- iseng bisa ngirim payload raksasa dan ngabisin jatah 500MB free tier.
  constraint modul_activity_payload_size check (pg_column_size(payload) < 8192)
);

-- Command Center selalu ambil "aktivitas modul X, terbaru dulu".
create index if not exists modul_activity_module_time_idx
  on modul_activity (module_slug, created_at desc);

-- Analisis per-sesi: rangkai semua event satu peserta dalam satu duduk.
create index if not exists modul_activity_session_idx
  on modul_activity (session_id);

-- =====================================================================
-- RLS: anon HANYA boleh INSERT. Nol SELECT/UPDATE/DELETE.
--
-- Konsekuensi yang HARUS diingat waktu nulis kode modul: jangan pernah
-- minta balikan data setelah insert (mis. header Prefer: return=...) —
-- itu bakal ditolak walau insert-nya sendiri sukses.
--
-- Command Center baca datanya lewat backend Vercel pakai service_role
-- key (server-side, gak pernah sampai ke browser), jadi gak butuh
-- policy SELECT buat anon di sini.
-- =====================================================================
alter table modul_activity enable row level security;

drop policy if exists "anon can insert activity" on modul_activity;
create policy "anon can insert activity"
  on modul_activity
  for insert
  to anon
  with check (true);
