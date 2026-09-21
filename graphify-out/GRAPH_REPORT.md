# Graph Report - Template Modul Ikram  (2026-09-21)

## Corpus Check
- 63 files · ~246,665 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1079 nodes · 1909 edges · 73 communities (57 shown, 16 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 183 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e6047d02`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Navigate to a NAV index, enforcing all gating rules
- index.py
- generator.py
- Buffer an activity tracking event
- devDependencies
- buka
- activity_store.py
- steps.ts
- PaketExportDialog.tsx
- BlockEditor.tsx
- App.tsx
- Learning Recap Popup ('Ringkasan Belajarmu')
- api.ts
- CommandCenter.tsx
- compilerOptions
- ModuleData
- Bedah: SCORM "Penyusunan Sasaran Kinerja Pegawai" (KLC2)
- post
- compilerOptions
- BlockPreview.tsx
- hkpd_to_moduledata.mjs
- Knowledge Check Gate
- Render the current NAV item into the viewport
- cek-demo.mjs
- Canvas
- GraphicStyleSelect.tsx
- draft_store.py
- extractBlockText
- DtableFields
- plugins
- r2.py
- CommandCenter
- PreviewExport
- types.ts
- Ambang "Ditinggal" — 4 Menit
- BlockEditor
- Canvas.tsx
- icons.svg (SVG sprite sheet)
- EmojiPicker.tsx
- build_source_printout.py
- Video Progress Tracking
- ccPost
- api/index.py
- QuizBuilder
- uploadImageToStorage
- supabase_setup.sql
- vite-env.d.ts
- tsconfig.json
- Aktifkan Rekam Aktivitas Peserta (toggle)
- make_template.py
- app/index.html — Vite React Entry HTML
- supabase_activity_setup.sql
- App Favicon Icon (Purple-Blue Gradient Mark)
- Hero Illustration (Floating Rounded Square)
- React Logo (Vite Scaffold Asset)
- Vite Logo (Stock Asset)
- Pola kartu -> modal detail
- Panduan Fitur — Template Modul Ikram
- Close modal block
- SVG donut chart renderer
- Open the mobile sidebar drawer
- get
- PreviewExport.tsx
- api_r2_download_url
- pptx_extract.py
- Identity Resolution & NIP Capture
- CoverForm.tsx
- Send a live preflight event to verify activity recording works

## God Nodes (most connected - your core abstractions)
1. `App()` - 34 edges
2. `CommandCenter()` - 27 edges
3. `ModuleData` - 23 edges
4. `esc()` - 21 edges
5. `PreviewExport()` - 20 edges
6. `generate_html()` - 20 edges
7. `Navigate to a NAV index, enforcing all gating rules` - 20 edges
8. `Canvas()` - 18 edges
9. `compilerOptions` - 18 edges
10. `Render the current NAV item into the viewport` - 18 edges

## Surprising Connections (you probably didn't know these)
- `14 Jenis Blok Konten` --references--> `render_block()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Preview & Export (Tahap 5)` --references--> `generate_html()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Import PPTX (Tahap 1)` --references--> `extract()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/pptx_extract.py
- `Token warna blok colorClasses(name)` --semantically_similar_to--> `Token warna ditukar utuh per konsep`  [INFERRED] [semantically similar]
  docs/bedah-scorm-klc2-skp.md → app/src/paket/paket-shell.html
- `Verifikasi frontend lewat string di bundle` --semantically_similar_to--> `Cara memverifikasi ulang temuan bedah`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/bedah-scorm-klc2-skp.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Activity buffer -> outbox -> Supabase send pipeline** — server_api_shell_template_actevent, server_api_shell_template_actflush, server_api_shell_template_actsend [EXTRACTED 1.00]
- **goTo() navigation gate checks** — server_api_shell_template_goto, server_api_shell_template_kcallansweredforslide, server_api_shell_template_artpendingonslide [EXTRACTED 1.00]
- **Alur membuka modul: render daftar -> buka() -> tab mewarisi origin -> ISI ditulis** — app_src_paket_paket_shell_renderpanel, app_src_paket_paket_shell_renderindeks, app_src_paket_paket_shell_buildorbit, app_src_paket_paket_shell_buka, app_src_paket_paket_shell_isi, app_src_paket_paket_shell_document_write_bukan_blob [EXTRACTED 1.00]
- **Lima pola prioritas tinggi hasil bedah KLC2 yang diusulkan masuk builder** — docs_bedah_scorm_klc2_skp_fluid_clamp_sizing, docs_bedah_scorm_klc2_skp_searchtext_per_slide, docs_bedah_scorm_klc2_skp_resume_localstorage_stempel_build, docs_bedah_scorm_klc2_skp_preloader_import_meta_glob, docs_bedah_scorm_klc2_skp_token_warna_blok [EXTRACTED 1.00]
- **Tiga konsep tata letak dashboard (Panel, Indeks, Orbit) dipilih satu lewat KONSEP** — mockups_landing_konsol_modul_panel_concept, mockups_landing_konsol_modul_indeks_concept, mockups_landing_konsol_modul_orbit_concept, app_src_paket_paket_shell_konsep, app_src_paket_paket_shell_token_warna_per_konsep [EXTRACTED 1.00]
- **Filled black brand-logo icon group (Bluesky, Discord, GitHub, X)** — app_public_icons_bluesky_icon, app_public_icons_discord_icon, app_public_icons_github_icon, app_public_icons_x_icon [INFERRED 0.85]
- **Articulate SCORM-in-SCORM containment** — server_api_shell_template_artmakeshim, server_api_shell_template_scormfindapi, server_api_shell_template_concept_articulate_runtime [INFERRED 0.85]
- **Research Basis for Idle/Reading-speed Thresholds** — panduan_fitur_template_modul_ikram_ambang_ditinggal_4_menit, panduan_fitur_template_modul_ikram_ambang_dibaca_238wpm, server_api_shell_template_actidlethresholdms, server_api_generator [INFERRED 0.85]

## Communities (73 total, 16 thin omitted)

### Community 0 - "Navigate to a NAV index, enforcing all gating rules"
Cohesion: 0.14
Nodes (24): Peringatan Kecepatan Baca, Group a section's NAV items into singles/bundles/quiz, Handle 'go back and reread' from reading warning, Handle 'proceed anyway' from reading warning, Close the mobile sidebar drawer, Reading-Speed & Idle Detection, Sidebar & Slide Navigation, Navigate to the next NAV item (+16 more)

### Community 1 - "index.py"
Cohesion: 0.17
Nodes (15): delete, api_activity_my_recap(), api_cocreation_my_notes(), api_delete_draft(), api_extract_pptx(), api_r2_delete_url(), api_r2_upload_url(), URL sementara buat browser meng-upload satu paket Articulate langsung ke R2.… (+7 more)

### Community 2 - "generator.py"
Cohesion: 0.06
Nodes (62): Preview & Export (Tahap 5), art_entry(), _blok_heading(), build_nav(), _caption_html(), clamp_brightness(), count_articulate(), count_interaktif() (+54 more)

### Community 3 - "Buffer an activity tracking event"
Cohesion: 0.15
Nodes (25): Accordion block renderer, Bind global activity listeners for idle detection, Boot activity tracking: resume outbox, resolve identity, start/gate, Check elapsed time against idle threshold, pause segment, Close out timing for the previous slide and emit slide_view, End the activity session and flush final events, Buffer an activity tracking event, Flush buffered + outboxed activity events to the server (+17 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (39): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react, react-dom, @zip.js/zip.js, devDependencies (+31 more)

### Community 5 - "buka"
Cohesion: 0.05
Nodes (44): buildOrbit(), buka(), Cangkang Paket Modul (paket-shell), cocok() - penyaring pencarian modul, document.write ke tab baru, bukan blob: URL, fokusOrbit(), ISI (HTML utuh tiap modul), Konstanta KONSEP (dipatok saat export) (+36 more)

### Community 6 - "activity_store.py"
Cohesion: 0.07
Nodes (48): batalkan_tanda(), cocreation_notes_for_learner(), cocreation_tree(), fetch_rows(), _gabung_catatan(), _headers(), _interaksi_key(), iter_rows() (+40 more)

### Community 7 - "steps.ts"
Cohesion: 0.08
Nodes (26): EntriBlok, TUR_BLOK, VIDEO_CONTOH, bersihkanChrome(), BuilderDemo, DEMO_ABORT, DEMO_IDLE_RESUME_MS, DemoCtx (+18 more)

### Community 8 - "PaketExportDialog.tsx"
Cohesion: 0.12
Nodes (27): DraftRingkas, listDraftsRingkas(), bacaLogoPng(), inp, KONSEP_INFO, LogoBaca, PaketExportDialog(), jalankan() (+19 more)

### Community 9 - "BlockEditor.tsx"
Cohesion: 0.07
Nodes (25): uploadMediaToStorage(), BlockFields(), FieldStyle, IZIN_SARANG, KnowledgeFields(), lanjutkanDaftar(), ModalFields(), pembungkusTag() (+17 more)

### Community 10 - "App.tsx"
Cohesion: 0.12
Nodes (19): draftExists(), App(), handleCreateProject(), handleImportJson(), hentikanDemo(), mulaiDemo(), onKey(), AutosaveIndicator() (+11 more)

### Community 11 - "Learning Recap Popup ('Ringkasan Belajarmu')"
Cohesion: 0.25
Nodes (14): SVG bar chart renderer, Learning Recap Popup ('Ringkasan Belajarmu'), Render the recap bar chart of engagement signals, Close the learner recap popup, HTML-escape a value for the recap popup, Join a list of strings with Indonesian 'dan' conjunction, Build the per-signal narration text builders for recap, Open the learner recap popup, fetching data if needed (+6 more)

### Community 12 - "api.ts"
Cohesion: 0.11
Nodes (23): ArticulateInfo, CocreationSection, CocreationSlide, deleteArticulate(), extractPptx(), generateHtmlForZip(), payloadFor(), PeringatanDetail (+15 more)

### Community 13 - "CommandCenter.tsx"
Cohesion: 0.12
Nodes (17): ActivityLearner, ActivityModule, ActivitySession, CocreationModule, CocreationNote, CatatanSlidePeserta, CocreationPesertaView(), perPeserta() (+9 more)

### Community 14 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 15 - "ModuleData"
Cohesion: 0.21
Nodes (11): History, Props, DemoCaptionEditor(), Props, Props, Props, collectTypes(), DEMO_STEPS (+3 more)

### Community 16 - "Bedah: SCORM "Penyusunan Sasaran Kinerja Pegawai" (KLC2)"
Cohesion: 0.09
Nodes (21): 10. Cara memverifikasi ulang temuan ini, 1. Ringkas teknologi, 2.1 Mesin layar (state machine di root), 2.2 Resume otomatis via localStorage ber-stempel build, 2.3 Struktur konten: slide = komponen React, bukan data, 2.4 Preloader yang mengukur progres nyata, 2. Arsitektur aplikasi, 3. Layar-layar (+13 more)

### Community 17 - "post"
Cohesion: 0.13
Nodes (21): post, api_activity_batalkan_tanda(), api_activity_cocreation(), api_activity_ditandai(), api_activity_learners(), api_activity_modules(), api_activity_rincian(), api_activity_rows() (+13 more)

### Community 18 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 19 - "BlockPreview.tsx"
Cohesion: 0.12
Nodes (14): BLOCK_LABELS, BLOCK_TYPES, BlockAddMenu(), Props, AccordionDemo(), BLOCK_PREVIEW_STYLES, BlockPreviewCard(), FlowDemo() (+6 more)

### Community 20 - "hkpd_to_moduledata.mjs"
Cohesion: 0.16
Nodes (17): blockTypes, CALLOUT_VARIANT, decodeEntities(), htmlField(), [inFile, outFile], mapBlock(), mapKnowledgeCheck(), moduleData (+9 more)

### Community 21 - "Knowledge Check Gate"
Cohesion: 0.45
Nodes (11): Knowledge Check Gate, Check whether all Knowledge Check items on a slide are answered, Record a Knowledge Check answer, handle retry-until-correct, Apply the final locked result state for a KC question, Find a Knowledge Check question by block/index, Mark one KC option button as tried-and-wrong, Open the Knowledge Check popup for a slide, Restore prior wrong KC attempts on popup reopen (+3 more)

### Community 22 - "Render the current NAV item into the viewport"
Cohesion: 0.18
Nodes (21): Get or create the shared Web Audio context, Schedule a single oscillator tone, Record a quiz option selection, Inject/play per-slide voiceover audio, Section Quiz Checkpoint, Check whether a section's quiz has been passed, Play the correct-answer chime, Play the quiz-failed tone (+13 more)

### Community 23 - "cek-demo.mjs"
Cohesion: 0.27
Nodes (15): AKAR, ambangIdleSamaDiDuaMesin(), baca(), captionTidakDitulisDuaKali(), F, gagal(), kaitDataDemoTerpasang(), kaitTemaTerpasang() (+7 more)

### Community 24 - "Canvas"
Cohesion: 0.28
Nodes (11): Canvas(), addBundle(), bukaSlideNomor(), bundlesFor(), gulirKeBaris(), onDragEnd(), removeBundle(), setBundles() (+3 more)

### Community 25 - "GraphicStyleSelect.tsx"
Cohesion: 0.15
Nodes (10): GraphicStyleSelect(), hexToRgba(), KIND_LABEL, KINDS, PANEL_STYLE, Props, GRAPHIC_STYLE_PREVIEWS, GraphicStylePreviewSet (+2 more)

### Community 26 - "draft_store.py"
Cohesion: 0.18
Nodes (18): delete_draft(), _headers(), _judul_berkas(), list_drafts_with_title(), load_draft(), ping(), Draft persistence via Supabase (PostgREST), so drafts survive redeploys/…, Seperti list_drafts(), tapi tiap baris bawa judul modulnya. Dipakai daftar… (+10 more)

### Community 27 - "extractBlockText"
Cohesion: 0.29
Nodes (6): demoBoothJalan(), remove(), blockSummary(), GridCellPreview(), extractBlockText(), isBlockEmpty()

### Community 29 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 30 - "r2.py"
Cohesion: 0.25
Nodes (10): _creds(), is_configured(), presign(), _quote(), Cloudflare R2 — penanda tangan URL (presigned URL) buat paket Articulate.…, Apakah kredensial R2 lengkap terpasang di environment backend? Dipakai frontend…, Encoding yang dipakai SigV4. Slash SENGAJA dibiarkan di canonical URI…, URL bertanda tangan buat satu objek. `method` 'PUT' (upload), 'GET' (unduh),… (+2 more)

### Community 31 - "CommandCenter"
Cohesion: 0.16
Nodes (18): ccRawRows(), ccRincian(), barisCatatan(), CommandCenter(), ambilRincian(), CocSakelar(), download(), toCsv() (+10 more)

### Community 32 - "PreviewExport"
Cohesion: 0.08
Nodes (37): deleteDraft(), fetchArticulateZip(), generateHtml(), renameDraft(), blobKeDataUri(), HasilSemat, namaAset(), sematkanGambarDataUri() (+29 more)

### Community 33 - "types.ts"
Cohesion: 0.31
Nodes (10): kebijakanKuisSection(), kebijakanMentah(), modeKuisSection(), BlockColor, DEFAULT_QUIZ_POLICY, KEBIJAKAN_GERBANG, QuizMode, QuizPolicy (+2 more)

### Community 34 - "Ambang "Ditinggal" — 4 Menit"
Cohesion: 0.22
Nodes (9): Ambang "Dibaca" — 238 kata/menit, gagal di bawah 50%, Ambang "Ditinggal" — 4 Menit, Brysbaert (2019) — Reading Research Quarterly Meta-analysis (238 wpm), Chartbeat — User Engagement Tracking Methodology, Dasar Riset (Tahap 8), Flowace (2026) — Keystroke & Mouse Activity Tracking, Google Research (2013) — Eye-mouse Behavior, Huang, White & Buscher — Gaze/Cursor Study (CHI 2012) (+1 more)

### Community 35 - "BlockEditor"
Cohesion: 0.15
Nodes (12): ambilDaftar(), BlockEditor(), add(), changeType(), toggleCollapse(), langgananBlokAktif(), sarangRapiNyala(), setSarangRapi() (+4 more)

### Community 36 - "Canvas.tsx"
Cohesion: 0.11
Nodes (15): addBlankSlide(), addSection(), removeSlide(), updateSlide(), Props, SlideRow(), Props, SlideBank() (+7 more)

### Community 37 - "icons.svg (SVG sprite sheet)"
Cohesion: 0.62
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol (generic profile/star icon), icons.svg (SVG sprite sheet), x-icon symbol (X/Twitter logo)

### Community 38 - "EmojiPicker.tsx"
Cohesion: 0.33
Nodes (3): EmojiPicker(), Props, EMOJI_CATEGORIES

### Community 39 - "build_source_printout.py"
Cohesion: 0.38
Nodes (6): ambil_desain(), id_berkas(), main(), Bangun ulang Template-Modul-Ikram-Source-Code.html dari isi repo saat ini.…, Id jangkar yang stabil - dipakai href sidebar dan id <section>., Kembalikan (kepala, ekor): semuanya sebelum <div class="wrap"> dan blok…

### Community 40 - "Video Progress Tracking"
Cohesion: 0.42
Nodes (10): Video Progress Tracking, Global callback: flush queued YouTube player requests, Replace a YouTube facade with a real tracked IFrame player, Instantiate a YT.Player with tracked state events, Fall back to a plain untracked YouTube iframe, Flush all in-progress video checkpoints and YT samplers, Mark a video block as started, capture its slide, Handle YouTube player state changes for tracking (+2 more)

### Community 41 - "ccPost"
Cohesion: 0.16
Nodes (16): ccBatalkanTanda(), ccCocreation(), ccDitandai(), ccListLearners(), ccListModules(), ccListSessions(), ccPost(), ccTandaiUji() (+8 more)

### Community 42 - "api/index.py"
Cohesion: 0.33
Nodes (5): includeFiles, maxDuration, crons, functions, api/index.py

### Community 43 - "QuizBuilder"
Cohesion: 0.36
Nodes (7): QuizBuilder(), addQuestion(), autoDistribute(), move(), removeQuestion(), setQuestions(), updateQuestion()

### Community 44 - "uploadImageToStorage"
Cohesion: 0.50
Nodes (5): uploadImageToStorage(), detectPngTransparency(), ImageUploadField(), BackgroundImageField(), handleUpload()

### Community 45 - "supabase_setup.sql"
Cohesion: 0.40
Nodes (3): public.modul_drafts_touch, modul_drafts_touch_trigger, public.modul_drafts

### Community 48 - "Aktifkan Rekam Aktivitas Peserta (toggle)"
Cohesion: 0.67
Nodes (3): Cek Kesiapan Sistem Rekam, Aktifkan Rekam Aktivitas Peserta (toggle), Sampul (Tahap 3)

### Community 66 - "get"
Cohesion: 0.20
Nodes (10): get, list_drafts(), api_health(), api_keepalive(), api_list_drafts(), api_r2_configured(), api_tracking_config(), Apakah backend punya kredensial R2? Frontend menanyakan ini SEBELUM pengguna… (+2 more)

### Community 67 - "PreviewExport.tsx"
Cohesion: 0.20
Nodes (16): copyDraft(), listDrafts(), loadDraft(), saveDraft(), handleOpenExistingDraft(), NewProjectModal(), handleFile(), openExistingMode() (+8 more)

### Community 69 - "pptx_extract.py"
Cohesion: 0.43
Nodes (6): Import PPTX (Tahap 1), extract(), PPTX -> draft slide JSON. Mirrors the manual extraction process already proven…, _shape_image(), _shape_table(), _shape_text()

### Community 72 - "Identity Resolution & NIP Capture"
Cohesion: 0.07
Nodes (45): checkNetwork(), checkScorm(), findAPI(), rows(), setVerdict(), lms-probe/README.md — Uji Koneksi LMS Guide, Identitas Peserta Lintas Modul, Keandalan Pencatatan Data (Outbox Offline) (+37 more)

### Community 73 - "CoverForm.tsx"
Cohesion: 0.36
Nodes (7): checkTrackingConfig(), CoverForm(), DEFAULT_THEME, findThemePresetId(), THEME_PRESETS, ThemeColors, ThemePreset

### Community 75 - "Send a live preflight event to verify activity recording works"
Cohesion: 0.17
Nodes (13): Alat "Cek Rekam Aktivitas", Command Center — Rekam Aktivitas & Analitik (Tahap 7), Deteksi Otomatis Data Janggal, Generate a new activity session id, Show/hide the progress block per HIDE_PROGRESS, Hide the dev-mode password modal, Dev Mode Panel, Load queued failed activity batches from localStorage (+5 more)

## Ambiguous Edges - Review These
- `Deploy (dua project Vercel)` → `Aturan graphify untuk proyek ini`  [AMBIGUOUS]
  CLAUDE.md · relation: conceptually_related_to

## Knowledge Gaps
- **204 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Deploy (dua project Vercel)` and `Aturan graphify untuk proyek ini`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Template Modul Ikram — Source Code (Full Repo Printout)` connect `draft_store.py` to `App.tsx`, `generator.py`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `CommandCenter()` connect `CommandCenter` to `ccPost`, `App.tsx`, `CommandCenter.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `react` connect `Canvas.tsx` to `types.ts`, `PreviewExport.tsx`, `EmojiPicker.tsx`, `PaketExportDialog.tsx`, `BlockEditor.tsx`, `App.tsx`, `CoverForm.tsx`, `CommandCenter.tsx`, `ModuleData`, `BlockPreview.tsx`, `GraphicStyleSelect.tsx`, `plugins`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `App()` (e.g. with `onKey()` and `demoDariUrl()`) actually correct?**
  _`App()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Navigate to a NAV index, enforcing all gating rules` be split into smaller, more focused modules?**
  _Cohesion score 0.14130434782608695 - nodes in this community are weakly interconnected._