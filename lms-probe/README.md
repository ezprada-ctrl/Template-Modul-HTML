# Uji Koneksi LMS (sekali pakai)

Alat uji sebelum kita bangun fitur rekam aktivitas peserta. Tujuannya menjawab
2 hal yang **tidak bisa dijawab dari kode** — cuma bisa dibuktikan dari LMS asli:

1. **Apakah API SCORM kejangkau** dari dalam Web Object Storyline?
   → kalau ya, kita bisa dapat **nama & ID peserta** dari LMS.
2. **Apakah modul boleh menembak internet** ke Supabase dari dalam LMS?
   → kalau diblokir firewall/CSP, rencana rekam aktivitas harus dirancang ulang.

Kalau dua-duanya lolos, fitur penuh (rekam durasi per slide + Command Center)
aman dibangun. Kalau mentok, kita ketahuan **sekarang** — bukan setelah semuanya
terlanjur dibuat.

---

## Langkah

### 1. Bikin tabelnya (sekali aja)

Buka **Supabase → SQL Editor** (project `fhlivnsasjgedeltaopv`), jalankan isi file:

```
server/supabase_activity_setup.sql
```

> Tanpa ini, uji koneksi bakal balikin **HTTP 404** `Could not find the table
> 'public.modul_activity'`. Itu bukan bug — artinya jaringan tembus, tabelnya aja
> yang belum ada.

### 2. Masukin ke Storyline

1. Storyline → **Insert → Web Object**
2. Pilih folder **`lms-probe`** ini (folder-nya, bukan file-nya)
3. Set **Display in: New browser window** atau tampil di slide — dua-duanya boleh
4. Publish **SCORM** (1.2 atau 2004, bebas)

### 3. Upload ke LMS, buka sebagai peserta

Buka modulnya **dari LMS, login sebagai peserta** — bukan dari preview Storyline
di laptop. Yang mau diuji itu justru kondisi aslinya (jaringan LMS, iframe LMS,
sesi SCORM LMS).

### 4. Screenshot hasilnya, kirim ke saya

Halaman ini nampilin hasilnya besar-besar di layar (karena di dalam LMS kamu gak
bisa buka DevTools).

---

## Cara baca hasilnya

### Bagian 1 — API SCORM

| Tampilan | Artinya |
|---|---|
| 🟢 **API SCORM ketemu — identitas peserta BISA diambil** | Ideal. Data aktivitas bisa ditempel ke nama peserta asli. |
| 🟡 **API SCORM ketemu, tapi LMS tidak memberi nama/ID** | Rekaman tetap jalan, tapi anonim. LMS-nya gak ngasih identitas. |
| 🟡 **API SCORM tidak ditemukan** | Normal **kalau dibuka di luar LMS**. Kalau muncul saat dibuka DARI LMS → masalah. |
| 🔴 **API SCORM kehalang (cross-origin)** | LMS naruh konten di domain beda. Identitas gak bisa diambil, tapi rekam anonim masih mungkin. |

### Bagian 2 — Koneksi Supabase

| Tampilan | Artinya | Tindakan |
|---|---|---|
| 🟢 **BERHASIL** | Semua lampu hijau. | Lanjut bangun fitur penuh. |
| 🔴 **GAGAL — server menolak (HTTP 4xx)** | Jaringan **tembus**, permintaannya yang ditolak. | Biasanya SQL di langkah 1 belum dijalankan. |
| 🔴 **GAGAL — tidak bisa menjangkau Supabase** | Permintaan **gak pernah nyampe**. | Ini yang berat: firewall/CSP LMS blokir domain luar. Teks error di kotak hitam nentuin obatnya. |

---

## Setelah selesai

Folder ini **alat sekali pakai** — bukan bagian modul yang dipublikasikan ke
peserta. Setelah hasilnya ketahuan, hapus Web Object-nya dari Storyline.

Baris uji yang keburu masuk database gampang dibersihin — semuanya bertanda
`module_slug = 'lms-probe'`:

```sql
delete from modul_activity where module_slug = 'lms-probe';
```
