-- Run this once in Supabase Studio -> SQL Editor (project yang sama dipakai
-- modul_drafts, lihat supabase_setup.sql). Bikin bucket Storage buat gambar
-- yang diupload lewat aplikasi (sampul + gambar dalam blok Card) — disimpan
-- kualitas asli, gak ada kompresi, gak lewat batas ukuran request Vercel
-- karena upload langsung dari browser ke Supabase, bukan lewat backend.
--
-- No auth: kebijakan dibuat terbuka (match desain "internal tool, no login")
-- — siapa pun yang punya anon key (publik, sama yang dipakai frontend) bisa
-- upload & lihat gambar di bucket ini.

insert into storage.buckets (id, name, public)
values ('modul-images', 'modul-images', true)
on conflict (id) do nothing;

create policy "modul_images_anon_insert" on storage.objects
  for insert
  with check (bucket_id = 'modul-images');

create policy "modul_images_anon_select" on storage.objects
  for select
  using (bucket_id = 'modul-images');
