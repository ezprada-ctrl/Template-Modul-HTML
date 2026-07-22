-- Run this once in Supabase Studio -> SQL Editor (project yang sama dipakai
-- modul_drafts & modul-images, lihat supabase_setup.sql /
-- supabase_storage_setup.sql). Bikin/lengkapi bucket Storage buat video &
-- audio yang diupload lewat blok Media dan audio per-slide — disimpan
-- kualitas asli, upload langsung dari browser ke Supabase (bukan lewat
-- backend Vercel), jadi gak kena batas ukuran request.
--
-- Kalau bucket "modul-media" udah kamu buat manual lewat dashboard
-- (Storage -> New bucket), baris `insert into storage.buckets` di bawah ini
-- aman dijalankan ulang (`on conflict do nothing`) - dia gak akan menimpa
-- apa pun, cuma bagian CREATE POLICY yang beneran dibutuhkan di kasus itu
-- (bikin bucket lewat dashboard TIDAK otomatis bikin policy read/write-nya,
-- makanya upload masih ditolak RLS walau bucket-nya udah ada).
--
-- No auth: kebijakan dibuat terbuka (match desain "internal tool, no login"
-- yang sama dipakai modul-images) — siapa pun yang punya anon key (publik,
-- sama yang dipakai frontend) bisa upload & lihat file di bucket ini.

insert into storage.buckets (id, name, public)
values ('modul-media', 'modul-media', true)
on conflict (id) do nothing;

create policy "modul_media_anon_insert" on storage.objects
  for insert
  with check (bucket_id = 'modul-media');

create policy "modul_media_anon_select" on storage.objects
  for select
  using (bucket_id = 'modul-media');
