## Deploy

Dua project Vercel, dua-duanya auto-deploy dari push ke `main`:

| | URL | Sumber |
|---|---|---|
| Frontend | https://template-modul-html-frontend.vercel.app | `app/` |
| Backend | https://template-modul-html-backend.vercel.app | `server/` (lihat `server/vercel.json`) |

**Konfigurasinya disimpan di sisi Vercel, bukan di repo ini.** Jadi tidak
adanya berkas konfigurasi deploy di root BUKAN berarti belum ter-deploy —
jangan simpulkan "belum deploy" hanya karena repo-nya sepi. (`render.yaml`
dulu ada di sini dan menyesatkan: service Render-nya tidak pernah hidup.
Dihapus di 88768e4.)

Cara memastikan sesuatu benar-benar sudah live — lebih meyakinkan daripada
dashboard, karena yang diuji perilaku nyata:

- **Backend**: POST modul uji ke `/api/generate`, lalu cari jejak fitur di
  HTML hasilnya. Catatan: HTML tiap slide tertanam di dalam string JS, jadi
  tanda kutipnya ter-escape (`class=\"acc-item\"`) — regex yang menganggapnya
  HTML biasa akan gagal menemukannya.
- **Frontend**: ambil `/`, baca `<script src>` bundle-nya, lalu cari string UI
  baru di bundle itu. Cari **string yang tampil di layar**, bukan nama
  variabel — nama variabel hilang kena minify.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
