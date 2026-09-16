# Graph Report - Template Modul Ikram  (2026-09-14)

## Corpus Check
- 61 files · ~220,805 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 970 nodes · 1691 edges · 68 communities (53 shown, 15 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 168 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `148c048a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- steps.ts
- generator.py
- index.py
- Buffer an activity tracking event
- Canvas
- devDependencies
- CommandCenter.tsx
- Navigate to a NAV index, enforcing all gating rules
- compilerOptions
- activity_store.py
- compilerOptions
- Video Progress Tracking
- hkpd_to_moduledata.mjs
- api.ts
- Ambang "Ditinggal" — 4 Menit
- icons.svg (SVG sprite sheet)
- BlockAddMenu.tsx
- api/index.py
- vite-env.d.ts
- tsconfig.json
- CLAUDE.md - graphify project instructions
- Aktifkan Rekam Aktivitas Peserta (toggle)
- make_template.py
- app/index.html — Vite React Entry HTML
- App Favicon Icon (Purple-Blue Gradient Mark)
- Hero Illustration (Floating Rounded Square)
- React Logo (Vite Scaffold Asset)
- Vite Logo (Stock Asset)
- Panduan Fitur — Template Modul Ikram
- Close modal block
- SVG donut chart renderer
- Open the mobile sidebar drawer
- SlideBank.tsx
- App.tsx
- BlockEditor.tsx
- scormZip.ts
- DtableFields
- CommandCenter
- Bedah: SCORM "Penyusunan Sasaran Kinerja Pegawai" (KLC2)
- build_source_printout.py
- types.ts
- supabase_setup.sql
- supabase_activity_setup.sql
- PreviewExport
- BlockEditor
- r2.py
- PreviewExport.tsx
- GraphicStyleSelect.tsx
- QuizBuilder
- BlockPreview.tsx
- cek-demo.mjs
- ccPost
- ModuleData
- pembungkusTag
- Identity Resolution & NIP Capture
- moduleFromJson
- extractBlockText
- 14 Jenis Blok Konten
- CoverForm.tsx
- Canvas.tsx
- plugins
- EmojiPicker.tsx
- SlidePreview.tsx

## God Nodes (most connected - your core abstractions)
1. `App()` - 31 edges
2. `CommandCenter()` - 23 edges
3. `esc()` - 21 edges
4. `ModuleData` - 20 edges
5. `generate_html()` - 20 edges
6. `Navigate to a NAV index, enforcing all gating rules` - 20 edges
7. `PreviewExport()` - 19 edges
8. `compilerOptions` - 18 edges
9. `Render the current NAV item into the viewport` - 18 edges
10. `Canvas()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `14 Jenis Blok Konten` --references--> `render_block()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Preview & Export (Tahap 5)` --references--> `generate_html()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Import PPTX (Tahap 1)` --references--> `extract()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/pptx_extract.py
- `Keandalan Pencatatan Data (Outbox Offline)` --references--> `Push failed activity rows back into the outbox queue`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/shell-template.html
- `Alat "Cek Rekam Aktivitas"` --references--> `Send a live preflight event to verify activity recording works`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/shell-template.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Activity buffer -> outbox -> Supabase send pipeline** — server_api_shell_template_actevent, server_api_shell_template_actflush, server_api_shell_template_actsend [EXTRACTED 1.00]
- **goTo() navigation gate checks** — server_api_shell_template_goto, server_api_shell_template_kcallansweredforslide, server_api_shell_template_artpendingonslide [EXTRACTED 1.00]
- **Filled black brand-logo icon group (Bluesky, Discord, GitHub, X)** — app_public_icons_bluesky_icon, app_public_icons_discord_icon, app_public_icons_github_icon, app_public_icons_x_icon [INFERRED 0.85]
- **Articulate SCORM-in-SCORM containment** — server_api_shell_template_artmakeshim, server_api_shell_template_scormfindapi, server_api_shell_template_concept_articulate_runtime [INFERRED 0.85]
- **Research Basis for Idle/Reading-speed Thresholds** — panduan_fitur_template_modul_ikram_ambang_ditinggal_4_menit, panduan_fitur_template_modul_ikram_ambang_dibaca_238wpm, server_api_shell_template_actidlethresholdms, server_api_generator [INFERRED 0.85]

## Communities (68 total, 15 thin omitted)

### Community 0 - "steps.ts"
Cohesion: 0.10
Nodes (19): EntriBlok, TUR_BLOK, VIDEO_CONTOH, bersihkanChrome(), BuilderDemo, DEMO_ABORT, DEMO_IDLE_RESUME_MS, DemoCtx (+11 more)

### Community 2 - "generator.py"
Cohesion: 0.06
Nodes (62): Preview & Export (Tahap 5), art_entry(), _blok_heading(), build_nav(), _caption_html(), clamp_brightness(), count_articulate(), count_interaktif() (+54 more)

### Community 3 - "index.py"
Cohesion: 0.05
Nodes (66): delete, get, Import PPTX (Tahap 1), post, delete_draft(), _headers(), list_drafts(), load_draft() (+58 more)

### Community 4 - "Buffer an activity tracking event"
Cohesion: 0.08
Nodes (45): Alat "Cek Rekam Aktivitas", Command Center — Rekam Aktivitas & Analitik (Tahap 7), Deteksi Otomatis Data Janggal, Accordion block renderer, Bind global activity listeners for idle detection, Boot activity tracking: resume outbox, resolve identity, start/gate, Check elapsed time against idle threshold, pause segment, Close out timing for the previous slide and emit slide_view (+37 more)

### Community 5 - "Canvas"
Cohesion: 0.23
Nodes (14): Canvas(), addBundle(), bukaSlideNomor(), bundlesFor(), gulirKeBaris(), onDragEnd(), removeBundle(), removeSlide() (+6 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (39): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react, react-dom, @zip.js/zip.js, devDependencies (+31 more)

### Community 7 - "CommandCenter.tsx"
Cohesion: 0.12
Nodes (17): ActivityLearner, ActivityModule, ActivitySession, CocreationModule, CocreationNote, CatatanSlidePeserta, CocreationPesertaView(), perPeserta() (+9 more)

### Community 8 - "Navigate to a NAV index, enforcing all gating rules"
Cohesion: 0.06
Nodes (63): Peringatan Kecepatan Baca, Get or create the shared Web Audio context, Schedule a single oscillator tone, Record a quiz option selection, Show/hide the progress block per HIDE_PROGRESS, Inject/play per-slide voiceover audio, Group a section's NAV items into singles/bundles/quiz, Handle 'go back and reread' from reading warning (+55 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 10 - "activity_store.py"
Cohesion: 0.08
Nodes (42): batalkan_tanda(), cocreation_notes_for_learner(), cocreation_tree(), fetch_rows(), _gabung_catatan(), _headers(), _interaksi_key(), iter_rows() (+34 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 12 - "Video Progress Tracking"
Cohesion: 0.42
Nodes (10): Video Progress Tracking, Global callback: flush queued YouTube player requests, Replace a YouTube facade with a real tracked IFrame player, Instantiate a YT.Player with tracked state events, Fall back to a plain untracked YouTube iframe, Flush all in-progress video checkpoints and YT samplers, Mark a video block as started, capture its slide, Handle YouTube player state changes for tracking (+2 more)

### Community 13 - "hkpd_to_moduledata.mjs"
Cohesion: 0.16
Nodes (17): blockTypes, CALLOUT_VARIANT, decodeEntities(), htmlField(), [inFile, outFile], mapBlock(), mapKnowledgeCheck(), moduleData (+9 more)

### Community 14 - "api.ts"
Cohesion: 0.14
Nodes (17): ArticulateInfo, CocreationSection, CocreationSlide, extractPptx(), payloadFor(), PeringatanDetail, r2Tersedia(), readArticulateEntry() (+9 more)

### Community 15 - "Ambang "Ditinggal" — 4 Menit"
Cohesion: 0.22
Nodes (9): Ambang "Dibaca" — 238 kata/menit, gagal di bawah 50%, Ambang "Ditinggal" — 4 Menit, Brysbaert (2019) — Reading Research Quarterly Meta-analysis (238 wpm), Chartbeat — User Engagement Tracking Methodology, Dasar Riset (Tahap 8), Flowace (2026) — Keystroke & Mouse Activity Tracking, Google Research (2013) — Eye-mouse Behavior, Huang, White & Buscher — Gaze/Cursor Study (CHI 2012) (+1 more)

### Community 16 - "icons.svg (SVG sprite sheet)"
Cohesion: 0.62
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol (generic profile/star icon), icons.svg (SVG sprite sheet), x-icon symbol (X/Twitter logo)

### Community 17 - "BlockAddMenu.tsx"
Cohesion: 0.14
Nodes (8): BLOCK_LABELS, BLOCK_TYPES, BlockAddMenu(), Props, Props, BLOCK_PREVIEW_STYLES, Block, BlockType

### Community 18 - "api/index.py"
Cohesion: 0.33
Nodes (5): includeFiles, maxDuration, crons, functions, api/index.py

### Community 21 - "CLAUDE.md - graphify project instructions"
Cohesion: 1.00
Nodes (3): CLAUDE.md - graphify project instructions, graphify native integration (query/path/explain graphify-out/ before answering), graphify update workflow (run 'graphify update .' after modifying code)

### Community 22 - "Aktifkan Rekam Aktivitas Peserta (toggle)"
Cohesion: 0.67
Nodes (3): Cek Kesiapan Sistem Rekam, Aktifkan Rekam Aktivitas Peserta (toggle), Sampul (Tahap 3)

### Community 35 - "SlideBank.tsx"
Cohesion: 0.25
Nodes (6): Props, SlideBank(), addToCanvas(), onUpload(), DraftSlide, Slide

### Community 36 - "App.tsx"
Cohesion: 0.10
Nodes (19): draftExists(), App(), handleImportJson(), hentikanDemo(), mulaiDemo(), onKey(), AutosaveIndicator(), demoDariUrl() (+11 more)

### Community 37 - "BlockEditor.tsx"
Cohesion: 0.10
Nodes (18): deleteArticulate(), uploadMediaToStorage(), ArticulateFields(), pilihFile(), BlockFields(), detectPngTransparency(), FieldStyle, ImageUploadField() (+10 more)

### Community 38 - "scormZip.ts"
Cohesion: 0.21
Nodes (15): fetchArticulateZip(), generateHtmlForZip(), blobKeDataUri(), HasilSemat, namaAset(), sematkanGambarDataUri(), urlGambar(), articulateBlocks() (+7 more)

### Community 40 - "CommandCenter"
Cohesion: 0.18
Nodes (13): barisCatatan(), CommandCenter(), CocSakelar(), download(), toCsv(), unduhCatatan(), unduhMentah(), unduhPeserta() (+5 more)

### Community 41 - "Bedah: SCORM "Penyusunan Sasaran Kinerja Pegawai" (KLC2)"
Cohesion: 0.09
Nodes (21): 10. Cara memverifikasi ulang temuan ini, 1. Ringkas teknologi, 2.1 Mesin layar (state machine di root), 2.2 Resume otomatis via localStorage ber-stempel build, 2.3 Struktur konten: slide = komponen React, bukan data, 2.4 Preloader yang mengukur progres nyata, 2. Arsitektur aplikasi, 3. Layar-layar (+13 more)

### Community 42 - "build_source_printout.py"
Cohesion: 0.38
Nodes (6): ambil_desain(), id_berkas(), main(), Bangun ulang Template-Modul-Ikram-Source-Code.html dari isi repo saat ini.…, Id jangkar yang stabil - dipakai href sidebar dan id <section>., Kembalikan (kepala, ekor): semuanya sebelum <div class="wrap"> dan blok…

### Community 43 - "types.ts"
Cohesion: 0.31
Nodes (10): kebijakanKuisSection(), kebijakanMentah(), modeKuisSection(), BlockColor, DEFAULT_QUIZ_POLICY, KEBIJAKAN_GERBANG, QuizMode, QuizPolicy (+2 more)

### Community 44 - "supabase_setup.sql"
Cohesion: 0.40
Nodes (3): public.modul_drafts_touch, modul_drafts_touch_trigger, public.modul_drafts

### Community 48 - "PreviewExport"
Cohesion: 0.21
Nodes (15): generateHtml(), PreviewExport(), catatJudulExport(), doCopy(), doDelete(), doExport(), doExportScorm(), doPreview() (+7 more)

### Community 49 - "BlockEditor"
Cohesion: 0.19
Nodes (10): BlockEditor(), add(), changeType(), toggleCollapse(), addBlankSlide(), addSection(), applyBlockText(), changeBlockType() (+2 more)

### Community 50 - "r2.py"
Cohesion: 0.25
Nodes (10): _creds(), is_configured(), presign(), _quote(), Cloudflare R2 — penanda tangan URL (presigned URL) buat paket Articulate.…, Apakah kredensial R2 lengkap terpasang di environment backend? Dipakai frontend…, Encoding yang dipakai SigV4. Slash SENGAJA dibiarkan di canonical URI…, URL bertanda tangan buat satu objek. `method` 'PUT' (upload), 'GET' (unduh),… (+2 more)

### Community 51 - "PreviewExport.tsx"
Cohesion: 0.21
Nodes (11): copyDraft(), deleteDraft(), loadDraft(), renameDraft(), saveDraft(), handleOpenExistingDraft(), pickDraft(), doLoad() (+3 more)

### Community 52 - "GraphicStyleSelect.tsx"
Cohesion: 0.15
Nodes (10): GraphicStyleSelect(), hexToRgba(), KIND_LABEL, KINDS, PANEL_STYLE, Props, GRAPHIC_STYLE_PREVIEWS, GraphicStylePreviewSet (+2 more)

### Community 53 - "QuizBuilder"
Cohesion: 0.36
Nodes (7): QuizBuilder(), addQuestion(), autoDistribute(), move(), removeQuestion(), setQuestions(), updateQuestion()

### Community 54 - "BlockPreview.tsx"
Cohesion: 0.25
Nodes (7): AccordionDemo(), FlowDemo(), LOREM, ModalDemo(), TabsDemo(), useBlinkWithClick(), useCycleWithClick()

### Community 55 - "cek-demo.mjs"
Cohesion: 0.27
Nodes (15): AKAR, ambangIdleSamaDiDuaMesin(), baca(), captionTidakDitulisDuaKali(), F, gagal(), kaitDataDemoTerpasang(), kaitTemaTerpasang() (+7 more)

### Community 56 - "ccPost"
Cohesion: 0.15
Nodes (17): ccBatalkanTanda(), ccCocreation(), ccDitandai(), ccListLearners(), ccListModules(), ccListSessions(), ccPost(), ccRawRows() (+9 more)

### Community 57 - "ModuleData"
Cohesion: 0.31
Nodes (8): DemoCaptionEditor(), Props, Props, collectTypes(), DEMO_STEPS, DemoStep, moduleFacts, ModuleData

### Community 58 - "pembungkusTag"
Cohesion: 0.40
Nodes (4): lanjutkanDaftar(), pembungkusTag(), RichInput(), RichTextarea()

### Community 59 - "Identity Resolution & NIP Capture"
Cohesion: 0.07
Nodes (45): checkNetwork(), checkScorm(), findAPI(), rows(), setVerdict(), lms-probe/README.md — Uji Koneksi LMS Guide, Identitas Peserta Lintas Modul, Keandalan Pencatatan Data (Outbox Offline) (+37 more)

### Community 60 - "moduleFromJson"
Cohesion: 0.24
Nodes (10): listDrafts(), handleCreateProject(), NewProjectModal(), handleFile(), openExistingMode(), doImportJson(), setMode(), buildProjectSlugPrefix() (+2 more)

### Community 61 - "extractBlockText"
Cohesion: 0.29
Nodes (6): demoBoothJalan(), remove(), blockSummary(), GridCellPreview(), extractBlockText(), isBlockEmpty()

### Community 63 - "CoverForm.tsx"
Cohesion: 0.24
Nodes (10): checkTrackingConfig(), BackgroundImageField(), handleUpload(), CoverForm(), Props, DEFAULT_THEME, findThemePresetId(), THEME_PRESETS (+2 more)

### Community 64 - "Canvas.tsx"
Cohesion: 0.29
Nodes (3): Props, SlideRow(), Section

### Community 66 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 67 - "EmojiPicker.tsx"
Cohesion: 0.33
Nodes (3): EmojiPicker(), Props, EMOJI_CATEGORIES

### Community 69 - "SlidePreview.tsx"
Cohesion: 0.33
Nodes (7): langgananBlokAktif(), Props, SlidePreview(), bawaPopupKeLayar(), gulirKeBlokAktif(), jumpToSlide(), sorotBlokAktif()

## Knowledge Gaps
- **182 isolated node(s):** `pendengarBlokAktif`, `FieldStyle`, `PILIHAN_RATA`, `BlockColor`, `EntriBlok` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Template Modul Ikram — Source Code (Full Repo Printout)` connect `index.py` to `generator.py`, `App.tsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `Canvas.tsx`, `plugins`, `EmojiPicker.tsx`, `SlideBank.tsx`, `BlockEditor.tsx`, `SlidePreview.tsx`, `CommandCenter.tsx`, `types.ts`, `BlockAddMenu.tsx`, `PreviewExport.tsx`, `GraphicStyleSelect.tsx`, `BlockPreview.tsx`, `ModuleData`, `CoverForm.tsx`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `14 Jenis Blok Konten` connect `14 Jenis Blok Konten` to `generator.py`, `BlockEditor.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `App()` (e.g. with `onKey()` and `demoDariUrl()`) actually correct?**
  _`App()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `pendengarBlokAktif`, `FieldStyle`, `PILIHAN_RATA` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `steps.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0960960960960961 - nodes in this community are weakly interconnected._
- **Should `generator.py` be split into smaller, more focused modules?**
  _Cohesion score 0.058653846153846154 - nodes in this community are weakly interconnected._