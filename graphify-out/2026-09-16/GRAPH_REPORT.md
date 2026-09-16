# Graph Report - Template Modul Ikram  (2026-09-16)

## Corpus Check
- 52 files · ~228,718 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1040 nodes · 1836 edges · 66 communities (50 shown, 16 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 182 edges (avg confidence: 0.84)
- Token cost: 117,159 input · 0 output

## Community Hubs (Navigation)
- Mesin Slide & Audio Modul
- Backend API & Draft Store
- Generator HTML Modul
- Rekam Aktivitas Sisi Peserta
- Konfigurasi Lint & Paket
- Cangkang Paket Modul
- Agregasi Aktivitas Server
- Mesin Demo Builder
- Export HTML & SCORM
- Unggah Media & Status Demo
- Kerangka Aplikasi Builder
- Dialog Export Paket Modul
- Kontrak API Frontend
- Tipe Data Command Center
- TypeScript Config Aplikasi
- Kanvas & Riwayat Undo
- Bedah Modul SCORM KLC2
- Command Center Co-creation
- TypeScript Config Node
- Menu Tambah Blok
- Konverter HKPD ke ModuleData
- Manajemen Draft Project
- Kuis & Kebijakan Section
- Pagar Pemeriksa Demo
- Kanvas Susun Slide
- Pemilih Gaya Grafis
- Klien API Command Center
- Blok Articulate 360
- Editor Tabel Data
- Bank Slide
- Penyimpanan R2
- Form Sampul & Tema
- Pelacakan Tontonan Video
- Penyusun Soal Kuis
- Ambang Kecepatan Baca
- Editor Blok Konten
- Pemeriksa Lingkungan LMS
- Set Ikon SVG
- Pemilih Emoji
- Cetak Source Code Repo
- Interaksi Menu Blok
- Pratinjau Slide
- Konfigurasi Deploy Vercel
- Unggah Gambar Blok
- Pemformat Teks Kaya
- Skema Tabel Draft
- Tipe Lingkungan Vite
- Referensi TypeScript Root
- Panduan Tahap Penyusunan
- Pembuat Template Sekali Jalan
- Berkas Masuk Vite
- Skema Tabel Aktivitas
- Favicon Aplikasi
- Ilustrasi Hero
- Logo React
- Logo Vite
- Pola Kartu ke Modal
- Panduan Fitur Lengkap
- Penutup Blok Modal
- Grafik Donat Rekap
- Laci Sidebar Mobile

## God Nodes (most connected - your core abstractions)
1. `App()` - 34 edges
2. `CommandCenter()` - 24 edges
3. `ModuleData` - 23 edges
4. `esc()` - 21 edges
5. `Navigate to a NAV index, enforcing all gating rules` - 20 edges
6. `PreviewExport()` - 20 edges
7. `generate_html()` - 20 edges
8. `compilerOptions` - 18 edges
9. `Render the current NAV item into the viewport` - 18 edges
10. `Canvas()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Import PPTX (Tahap 1)` --references--> `extract()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/pptx_extract.py
- `Preview & Export (Tahap 5)` --references--> `generate_html()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `14 Jenis Blok Konten` --references--> `render_block()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Verifikasi frontend lewat string di bundle` --semantically_similar_to--> `Cara memverifikasi ulang temuan bedah`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/bedah-scorm-klc2-skp.md
- `buka() (mockup: halaman penanda)` --semantically_similar_to--> `buka()`  [INFERRED] [semantically similar]
  mockups/landing-konsol-modul.html → app/src/paket/paket-shell.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Tiga konsep tata letak dashboard (Panel, Indeks, Orbit) dipilih satu lewat KONSEP** — mockups_landing_konsol_modul_panel_concept, mockups_landing_konsol_modul_indeks_concept, mockups_landing_konsol_modul_orbit_concept, app_src_paket_paket_shell_konsep, app_src_paket_paket_shell_token_warna_per_konsep [EXTRACTED 1.00]
- **Alur membuka modul: render daftar -> buka() -> tab mewarisi origin -> ISI ditulis** — app_src_paket_paket_shell_renderpanel, app_src_paket_paket_shell_renderindeks, app_src_paket_paket_shell_buildorbit, app_src_paket_paket_shell_buka, app_src_paket_paket_shell_isi, app_src_paket_paket_shell_document_write_bukan_blob [EXTRACTED 1.00]
- **Lima pola prioritas tinggi hasil bedah KLC2 yang diusulkan masuk builder** — docs_bedah_scorm_klc2_skp_fluid_clamp_sizing, docs_bedah_scorm_klc2_skp_searchtext_per_slide, docs_bedah_scorm_klc2_skp_resume_localstorage_stempel_build, docs_bedah_scorm_klc2_skp_preloader_import_meta_glob, docs_bedah_scorm_klc2_skp_token_warna_blok [EXTRACTED 1.00]
- **Activity buffer -> outbox -> Supabase send pipeline** — server_api_shell_template_actevent, server_api_shell_template_actflush, server_api_shell_template_actsend [EXTRACTED 1.00]
- **goTo() navigation gate checks** — server_api_shell_template_goto, server_api_shell_template_kcallansweredforslide, server_api_shell_template_artpendingonslide [EXTRACTED 1.00]
- **Filled black brand-logo icon group (Bluesky, Discord, GitHub, X)** — app_public_icons_bluesky_icon, app_public_icons_discord_icon, app_public_icons_github_icon, app_public_icons_x_icon [INFERRED 0.85]
- **Articulate SCORM-in-SCORM containment** — server_api_shell_template_artmakeshim, server_api_shell_template_scormfindapi, server_api_shell_template_concept_articulate_runtime [INFERRED 0.85]
- **Research Basis for Idle/Reading-speed Thresholds** — panduan_fitur_template_modul_ikram_ambang_ditinggal_4_menit, panduan_fitur_template_modul_ikram_ambang_dibaca_238wpm, server_api_shell_template_actidlethresholdms, server_api_generator [INFERRED 0.85]

## Communities (66 total, 16 thin omitted)

### Community 0 - "Mesin Slide & Audio Modul"
Cohesion: 0.06
Nodes (71): Peringatan Kecepatan Baca, Get or create the shared Web Audio context, Schedule a single oscillator tone, Record a quiz option selection, Show/hide the progress block per HIDE_PROGRESS, Inject/play per-slide voiceover audio, Group a section's NAV items into singles/bundles/quiz, Handle 'go back and reread' from reading warning (+63 more)

### Community 1 - "Backend API & Draft Store"
Cohesion: 0.05
Nodes (66): delete, get, Import PPTX (Tahap 1), post, delete_draft(), _headers(), list_drafts(), load_draft() (+58 more)

### Community 2 - "Generator HTML Modul"
Cohesion: 0.06
Nodes (62): Preview & Export (Tahap 5), art_entry(), _blok_heading(), build_nav(), _caption_html(), clamp_brightness(), count_articulate(), count_interaktif() (+54 more)

### Community 3 - "Rekam Aktivitas Sisi Peserta"
Cohesion: 0.06
Nodes (63): Alat "Cek Rekam Aktivitas", Command Center — Rekam Aktivitas & Analitik (Tahap 7), Deteksi Otomatis Data Janggal, Identitas Peserta Lintas Modul, Keandalan Pencatatan Data (Outbox Offline), Sisi Peserta — Yang Dialami Peserta (Tahap 6), Accordion block renderer, Bind global activity listeners for idle detection (+55 more)

### Community 4 - "Konfigurasi Lint & Paket"
Cohesion: 0.04
Nodes (46): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, dependencies, @dnd-kit/core, @dnd-kit/sortable (+38 more)

### Community 5 - "Cangkang Paket Modul"
Cohesion: 0.05
Nodes (44): buildOrbit(), buka(), Cangkang Paket Modul (paket-shell), cocok() - penyaring pencarian modul, document.write ke tab baru, bukan blob: URL, fokusOrbit(), ISI (HTML utuh tiap modul), Konstanta KONSEP (dipatok saat export) (+36 more)

### Community 6 - "Agregasi Aktivitas Server"
Cohesion: 0.08
Nodes (42): batalkan_tanda(), cocreation_notes_for_learner(), cocreation_tree(), fetch_rows(), _gabung_catatan(), _headers(), _interaksi_key(), iter_rows() (+34 more)

### Community 7 - "Mesin Demo Builder"
Cohesion: 0.10
Nodes (19): EntriBlok, TUR_BLOK, VIDEO_CONTOH, bersihkanChrome(), BuilderDemo, DEMO_ABORT, DEMO_IDLE_RESUME_MS, DemoCtx (+11 more)

### Community 8 - "Export HTML & SCORM"
Cohesion: 0.10
Nodes (30): deleteDraft(), fetchArticulateZip(), generateHtmlForZip(), renameDraft(), blobKeDataUri(), HasilSemat, namaAset(), sematkanGambarDataUri() (+22 more)

### Community 9 - "Unggah Media & Status Demo"
Cohesion: 0.09
Nodes (21): uploadMediaToStorage(), demoBoothJalan(), remove(), BlockFields(), blockSummary(), FieldStyle, GridCellPreview(), KnowledgeFields() (+13 more)

### Community 10 - "Kerangka Aplikasi Builder"
Cohesion: 0.12
Nodes (18): draftExists(), App(), handleCreateProject(), handleImportJson(), hentikanDemo(), mulaiDemo(), onKey(), AutosaveIndicator() (+10 more)

### Community 11 - "Dialog Export Paket Modul"
Cohesion: 0.14
Nodes (24): loadDraft(), inp, KONSEP_INFO, PaketExportDialog(), jalankan(), tambahBerkas(), Pilihan, Sumber (+16 more)

### Community 12 - "Kontrak API Frontend"
Cohesion: 0.12
Nodes (21): ArticulateInfo, CocreationSection, CocreationSlide, deleteArticulate(), extractPptx(), generateHtml(), payloadFor(), PeringatanDetail (+13 more)

### Community 13 - "Tipe Data Command Center"
Cohesion: 0.12
Nodes (17): ActivityLearner, ActivityModule, ActivitySession, CocreationModule, CocreationNote, CatatanSlidePeserta, CocreationPesertaView(), perPeserta() (+9 more)

### Community 14 - "TypeScript Config Aplikasi"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 15 - "Kanvas & Riwayat Undo"
Cohesion: 0.13
Nodes (14): History, Props, SlideRow(), DemoCaptionEditor(), Props, Props, Props, collectTypes() (+6 more)

### Community 16 - "Bedah Modul SCORM KLC2"
Cohesion: 0.09
Nodes (21): 10. Cara memverifikasi ulang temuan ini, 1. Ringkas teknologi, 2.1 Mesin layar (state machine di root), 2.2 Resume otomatis via localStorage ber-stempel build, 2.3 Struktur konten: slide = komponen React, bukan data, 2.4 Preloader yang mengukur progres nyata, 2. Arsitektur aplikasi, 3. Layar-layar (+13 more)

### Community 17 - "Command Center Co-creation"
Cohesion: 0.14
Nodes (17): ccCocreation(), ccRawRows(), barisCatatan(), CommandCenter(), bukaCocreation(), bukaCocreationSemua(), CocSakelar(), download() (+9 more)

### Community 18 - "TypeScript Config Node"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 19 - "Menu Tambah Blok"
Cohesion: 0.15
Nodes (15): BLOCK_LABELS, BLOCK_TYPES, Props, Props, AccordionDemo(), BLOCK_PREVIEW_STYLES, BlockPreviewCard(), FlowDemo() (+7 more)

### Community 20 - "Konverter HKPD ke ModuleData"
Cohesion: 0.16
Nodes (17): blockTypes, CALLOUT_VARIANT, decodeEntities(), htmlField(), [inFile, outFile], mapBlock(), mapKnowledgeCheck(), moduleData (+9 more)

### Community 21 - "Manajemen Draft Project"
Cohesion: 0.19
Nodes (16): copyDraft(), listDrafts(), saveDraft(), handleOpenExistingDraft(), NewProjectModal(), handleFile(), openExistingMode(), pickDraft() (+8 more)

### Community 22 - "Kuis & Kebijakan Section"
Cohesion: 0.24
Nodes (14): kebijakanKuisSection(), kebijakanMentah(), modeKuisSection(), applyBlockText(), BlockColor, changeBlockType(), DEFAULT_QUIZ_POLICY, KEBIJAKAN_GERBANG (+6 more)

### Community 23 - "Pagar Pemeriksa Demo"
Cohesion: 0.27
Nodes (15): AKAR, ambangIdleSamaDiDuaMesin(), baca(), captionTidakDitulisDuaKali(), F, gagal(), kaitDataDemoTerpasang(), kaitTemaTerpasang() (+7 more)

### Community 24 - "Kanvas Susun Slide"
Cohesion: 0.21
Nodes (14): Canvas(), addBundle(), addSection(), bukaSlideNomor(), bundlesFor(), gulirKeBaris(), onDragEnd(), removeBundle() (+6 more)

### Community 25 - "Pemilih Gaya Grafis"
Cohesion: 0.15
Nodes (10): GraphicStyleSelect(), hexToRgba(), KIND_LABEL, KINDS, PANEL_STYLE, Props, GRAPHIC_STYLE_PREVIEWS, GraphicStylePreviewSet (+2 more)

### Community 26 - "Klien API Command Center"
Cohesion: 0.21
Nodes (13): ccBatalkanTanda(), ccDitandai(), ccListLearners(), ccListModules(), ccListSessions(), ccPost(), ccTandaiUji(), batalkanTandaUji() (+5 more)

### Community 27 - "Blok Articulate 360"
Cohesion: 0.32
Nodes (13): Render completion status text for active Articulate blocks, Bind Articulate blocks active on the current slide, Toggle fullscreen for an Articulate iframe block, Load an Articulate block's stored CMI data, Build a fake SCORM 1.2/2004 API shim for embedded Articulate content, Articulate shim LMSGetValue/GetValue implementation, Articulate shim LMSSetValue/SetValue implementation, Mark an Articulate block as completed (+5 more)

### Community 29 - "Bank Slide"
Cohesion: 0.22
Nodes (8): addBlankSlide(), Props, SlideBank(), addToCanvas(), onUpload(), DraftSlide, renumberModule(), Slide

### Community 30 - "Penyimpanan R2"
Cohesion: 0.25
Nodes (10): _creds(), is_configured(), presign(), _quote(), Cloudflare R2 — penanda tangan URL (presigned URL) buat paket Articulate.…, Apakah kredensial R2 lengkap terpasang di environment backend? Dipakai frontend…, Encoding yang dipakai SigV4. Slash SENGAJA dibiarkan di canonical URI…, URL bertanda tangan buat satu objek. `method` 'PUT' (upload), 'GET' (unduh),… (+2 more)

### Community 31 - "Form Sampul & Tema"
Cohesion: 0.29
Nodes (8): checkTrackingConfig(), CoverForm(), Props, DEFAULT_THEME, findThemePresetId(), THEME_PRESETS, ThemeColors, ThemePreset

### Community 32 - "Pelacakan Tontonan Video"
Cohesion: 0.42
Nodes (10): Video Progress Tracking, Global callback: flush queued YouTube player requests, Replace a YouTube facade with a real tracked IFrame player, Instantiate a YT.Player with tracked state events, Fall back to a plain untracked YouTube iframe, Flush all in-progress video checkpoints and YT samplers, Mark a video block as started, capture its slide, Handle YouTube player state changes for tracking (+2 more)

### Community 33 - "Penyusun Soal Kuis"
Cohesion: 0.36
Nodes (7): QuizBuilder(), addQuestion(), autoDistribute(), move(), removeQuestion(), setQuestions(), updateQuestion()

### Community 34 - "Ambang Kecepatan Baca"
Cohesion: 0.22
Nodes (9): Ambang "Dibaca" — 238 kata/menit, gagal di bawah 50%, Ambang "Ditinggal" — 4 Menit, Brysbaert (2019) — Reading Research Quarterly Meta-analysis (238 wpm), Chartbeat — User Engagement Tracking Methodology, Dasar Riset (Tahap 8), Flowace (2026) — Keystroke & Mouse Activity Tracking, Google Research (2013) — Eye-mouse Behavior, Huang, White & Buscher — Gaze/Cursor Study (CHI 2012) (+1 more)

### Community 35 - "Editor Blok Konten"
Cohesion: 0.29
Nodes (5): BlockEditor(), add(), changeType(), toggleCollapse(), langgananBlokAktif()

### Community 36 - "Pemeriksa Lingkungan LMS"
Cohesion: 0.29
Nodes (6): checkNetwork(), checkScorm(), findAPI(), rows(), setVerdict(), lms-probe/README.md — Uji Koneksi LMS Guide

### Community 37 - "Set Ikon SVG"
Cohesion: 0.62
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol (generic profile/star icon), icons.svg (SVG sprite sheet), x-icon symbol (X/Twitter logo)

### Community 38 - "Pemilih Emoji"
Cohesion: 0.33
Nodes (3): EmojiPicker(), Props, EMOJI_CATEGORIES

### Community 39 - "Cetak Source Code Repo"
Cohesion: 0.38
Nodes (6): ambil_desain(), id_berkas(), main(), Bangun ulang Template-Modul-Ikram-Source-Code.html dari isi repo saat ini.…, Id jangkar yang stabil - dipakai href sidebar dan id <section>., Kembalikan (kepala, ekor): semuanya sebelum <div class="wrap"> dan blok…

### Community 41 - "Pratinjau Slide"
Cohesion: 0.53
Nodes (5): SlidePreview(), bawaPopupKeLayar(), gulirKeBlokAktif(), jumpToSlide(), sorotBlokAktif()

### Community 42 - "Konfigurasi Deploy Vercel"
Cohesion: 0.33
Nodes (5): includeFiles, maxDuration, crons, functions, api/index.py

### Community 43 - "Unggah Gambar Blok"
Cohesion: 0.50
Nodes (5): uploadImageToStorage(), detectPngTransparency(), ImageUploadField(), BackgroundImageField(), handleUpload()

### Community 44 - "Pemformat Teks Kaya"
Cohesion: 0.40
Nodes (4): lanjutkanDaftar(), pembungkusTag(), RichInput(), RichTextarea()

### Community 45 - "Skema Tabel Draft"
Cohesion: 0.40
Nodes (3): public.modul_drafts_touch, modul_drafts_touch_trigger, public.modul_drafts

### Community 48 - "Panduan Tahap Penyusunan"
Cohesion: 0.67
Nodes (3): Cek Kesiapan Sistem Rekam, Aktifkan Rekam Aktivitas Peserta (toggle), Sampul (Tahap 3)

## Ambiguous Edges - Review These
- `Deploy (dua project Vercel)` → `Aturan graphify untuk proyek ini`  [AMBIGUOUS]
  CLAUDE.md · relation: conceptually_related_to

## Knowledge Gaps
- **194 isolated node(s):** `ImportMeta`, `ImportMetaEnv`, `GraphicStylePreviewSet`, `GraphicStylePreset`, `allowImportingTsExtensions` (+189 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Deploy (dua project Vercel)` and `Aturan graphify untuk proyek ini`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Template Modul Ikram — Source Code (Full Repo Printout)` connect `Backend API & Draft Store` to `Kerangka Aplikasi Builder`, `Generator HTML Modul`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `react` connect `Kanvas & Riwayat Undo` to `Konfigurasi Lint & Paket`, `Pemilih Emoji`, `Unggah Media & Status Demo`, `Kerangka Aplikasi Builder`, `Dialog Export Paket Modul`, `Tipe Data Command Center`, `Menu Tambah Blok`, `Manajemen Draft Project`, `Kuis & Kebijakan Section`, `Pemilih Gaya Grafis`, `Bank Slide`, `Form Sampul & Tema`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `plugins` connect `Konfigurasi Lint & Paket` to `Kanvas & Riwayat Undo`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `App()` (e.g. with `onKey()` and `demoDariUrl()`) actually correct?**
  _`App()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ImportMeta`, `ImportMetaEnv`, `GraphicStylePreviewSet` to the rest of the system?**
  _194 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Mesin Slide & Audio Modul` be split into smaller, more focused modules?**
  _Cohesion score 0.055533199195171024 - nodes in this community are weakly interconnected._