# Graph Report - Template Modul Ikram  (2026-09-11)

## Corpus Check
- 58 files · ~215,564 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 938 nodes · 1675 edges · 63 communities (49 shown, 14 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 167 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ddee5e9c`
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
- BlockPreview.tsx
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
- plugins
- App.tsx
- BlockEditor.tsx
- PreviewExport.tsx
- DtableFields
- CommandCenter
- EmojiPicker.tsx
- build_source_printout.py
- types.ts
- supabase_setup.sql
- supabase_activity_setup.sql
- CoverForm.tsx
- BlockEditor
- r2.py
- NewProjectModal
- GraphicStyleSelect.tsx
- QuizBuilder
- Canvas.tsx
- cek-demo.mjs
- ccPost
- ModuleData
- Identity Resolution & NIP Capture
- pembungkusTag
- SlidePreview
- uploadImageToStorage
- ccCocreation

## God Nodes (most connected - your core abstractions)
1. `App()` - 34 edges
2. `CommandCenter()` - 24 edges
3. `ModuleData` - 23 edges
4. `esc()` - 21 edges
5. `PreviewExport()` - 20 edges
6. `Navigate to a NAV index, enforcing all gating rules` - 20 edges
7. `generate_html()` - 19 edges
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
- `Alat "Cek Rekam Aktivitas"` --references--> `Send a live preflight event to verify activity recording works`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/shell-template.html
- `Identitas Peserta Lintas Modul` --references--> `Resolve learner identity from state/SCORM/shared cache`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/shell-template.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Activity buffer -> outbox -> Supabase send pipeline** — server_api_shell_template_actevent, server_api_shell_template_actflush, server_api_shell_template_actsend [EXTRACTED 1.00]
- **goTo() navigation gate checks** — server_api_shell_template_goto, server_api_shell_template_kcallansweredforslide, server_api_shell_template_artpendingonslide [EXTRACTED 1.00]
- **Filled black brand-logo icon group (Bluesky, Discord, GitHub, X)** — app_public_icons_bluesky_icon, app_public_icons_discord_icon, app_public_icons_github_icon, app_public_icons_x_icon [INFERRED 0.85]
- **Articulate SCORM-in-SCORM containment** — server_api_shell_template_artmakeshim, server_api_shell_template_scormfindapi, server_api_shell_template_concept_articulate_runtime [INFERRED 0.85]
- **Research Basis for Idle/Reading-speed Thresholds** — panduan_fitur_template_modul_ikram_ambang_ditinggal_4_menit, panduan_fitur_template_modul_ikram_ambang_dibaca_238wpm, server_api_shell_template_actidlethresholdms, server_api_generator [INFERRED 0.85]

## Communities (63 total, 14 thin omitted)

### Community 0 - "steps.ts"
Cohesion: 0.10
Nodes (16): bersihkanChrome(), BuilderDemo, DEMO_ABORT, DEMO_IDLE_RESUME_MS, DemoCtx, DemoStep, pasangChrome(), qDemo() (+8 more)

### Community 2 - "generator.py"
Cohesion: 0.06
Nodes (61): Preview & Export (Tahap 5), art_entry(), _blok_heading(), build_nav(), _caption_html(), clamp_brightness(), count_articulate(), count_interaktif() (+53 more)

### Community 3 - "index.py"
Cohesion: 0.05
Nodes (66): delete, get, Import PPTX (Tahap 1), post, delete_draft(), _headers(), list_drafts(), load_draft() (+58 more)

### Community 4 - "Buffer an activity tracking event"
Cohesion: 0.07
Nodes (52): Alat "Cek Rekam Aktivitas", Command Center — Rekam Aktivitas & Analitik (Tahap 7), Deteksi Otomatis Data Janggal, Keandalan Pencatatan Data (Outbox Offline), Peringatan Kecepatan Baca, Sisi Peserta — Yang Dialami Peserta (Tahap 6), Accordion block renderer, Bind global activity listeners for idle detection (+44 more)

### Community 5 - "Canvas"
Cohesion: 0.28
Nodes (11): Canvas(), addBundle(), bukaSlideNomor(), bundlesFor(), gulirKeBaris(), onDragEnd(), removeBundle(), setBundles() (+3 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (39): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react, react-dom, @zip.js/zip.js, devDependencies (+31 more)

### Community 7 - "CommandCenter.tsx"
Cohesion: 0.12
Nodes (17): ActivityLearner, ActivityModule, ActivitySession, CocreationModule, CocreationNote, CatatanSlidePeserta, CocreationPesertaView(), perPeserta() (+9 more)

### Community 8 - "Navigate to a NAV index, enforcing all gating rules"
Cohesion: 0.07
Nodes (58): Get or create the shared Web Audio context, Schedule a single oscillator tone, Record a quiz option selection, Show/hide the progress block per HIDE_PROGRESS, Inject/play per-slide voiceover audio, Group a section's NAV items into singles/bundles/quiz, Handle 'go back and reread' from reading warning, Hide the dev-mode password modal (+50 more)

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
Cohesion: 0.13
Nodes (19): ArticulateInfo, CocreationSection, CocreationSlide, deleteArticulate(), extractPptx(), payloadFor(), PeringatanDetail, r2Tersedia() (+11 more)

### Community 15 - "Ambang "Ditinggal" — 4 Menit"
Cohesion: 0.22
Nodes (9): Ambang "Dibaca" — 238 kata/menit, gagal di bawah 50%, Ambang "Ditinggal" — 4 Menit, Brysbaert (2019) — Reading Research Quarterly Meta-analysis (238 wpm), Chartbeat — User Engagement Tracking Methodology, Dasar Riset (Tahap 8), Flowace (2026) — Keystroke & Mouse Activity Tracking, Google Research (2013) — Eye-mouse Behavior, Huang, White & Buscher — Gaze/Cursor Study (CHI 2012) (+1 more)

### Community 16 - "icons.svg (SVG sprite sheet)"
Cohesion: 0.62
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol (generic profile/star icon), icons.svg (SVG sprite sheet), x-icon symbol (X/Twitter logo)

### Community 17 - "BlockPreview.tsx"
Cohesion: 0.12
Nodes (14): BLOCK_LABELS, BLOCK_TYPES, BlockAddMenu(), Props, AccordionDemo(), BLOCK_PREVIEW_STYLES, BlockPreviewCard(), FlowDemo() (+6 more)

### Community 18 - "api/index.py"
Cohesion: 0.33
Nodes (5): includeFiles, maxDuration, crons, functions, api/index.py

### Community 21 - "CLAUDE.md - graphify project instructions"
Cohesion: 1.00
Nodes (3): CLAUDE.md - graphify project instructions, graphify native integration (query/path/explain graphify-out/ before answering), graphify update workflow (run 'graphify update .' after modifying code)

### Community 22 - "Aktifkan Rekam Aktivitas Peserta (toggle)"
Cohesion: 0.67
Nodes (3): Cek Kesiapan Sistem Rekam, Aktifkan Rekam Aktivitas Peserta (toggle), Sampul (Tahap 3)

### Community 35 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 36 - "App.tsx"
Cohesion: 0.11
Nodes (21): copyDraft(), draftExists(), saveDraft(), App(), handleCreateProject(), handleImportJson(), hentikanDemo(), mulaiDemo() (+13 more)

### Community 37 - "BlockEditor.tsx"
Cohesion: 0.10
Nodes (17): uploadMediaToStorage(), BlockFields(), FieldStyle, KnowledgeFields(), ModalFields(), pendengarBlokAktif, PILIHAN_RATA, Props (+9 more)

### Community 38 - "PreviewExport.tsx"
Cohesion: 0.10
Nodes (32): deleteDraft(), fetchArticulateZip(), generateHtml(), generateHtmlForZip(), renameDraft(), blobKeDataUri(), HasilSemat, namaAset() (+24 more)

### Community 40 - "CommandCenter"
Cohesion: 0.17
Nodes (14): ccRawRows(), barisCatatan(), CommandCenter(), CocSakelar(), download(), toCsv(), unduhCatatan(), unduhMentah() (+6 more)

### Community 41 - "EmojiPicker.tsx"
Cohesion: 0.33
Nodes (3): EmojiPicker(), Props, EMOJI_CATEGORIES

### Community 42 - "build_source_printout.py"
Cohesion: 0.38
Nodes (6): ambil_desain(), id_berkas(), main(), Bangun ulang Template-Modul-Ikram-Source-Code.html dari isi repo saat ini.…, Id jangkar yang stabil - dipakai href sidebar dan id <section>., Kembalikan (kepala, ekor): semuanya sebelum <div class="wrap"> dan blok…

### Community 43 - "types.ts"
Cohesion: 0.29
Nodes (11): Props, kebijakanKuisSection(), kebijakanMentah(), modeKuisSection(), DEFAULT_QUIZ_POLICY, KEBIJAKAN_GERBANG, QuizMode, QuizPolicy (+3 more)

### Community 44 - "supabase_setup.sql"
Cohesion: 0.40
Nodes (3): public.modul_drafts_touch, modul_drafts_touch_trigger, public.modul_drafts

### Community 48 - "CoverForm.tsx"
Cohesion: 0.31
Nodes (8): checkTrackingConfig(), CoverForm(), Props, DEFAULT_THEME, findThemePresetId(), THEME_PRESETS, ThemeColors, ThemePreset

### Community 49 - "BlockEditor"
Cohesion: 0.16
Nodes (13): BlockEditor(), add(), changeType(), remove(), toggleCollapse(), blockSummary(), GridCellPreview(), langgananBlokAktif() (+5 more)

### Community 50 - "r2.py"
Cohesion: 0.25
Nodes (10): _creds(), is_configured(), presign(), _quote(), Cloudflare R2 — penanda tangan URL (presigned URL) buat paket Articulate.…, Apakah kredensial R2 lengkap terpasang di environment backend? Dipakai frontend…, Encoding yang dipakai SigV4. Slash SENGAJA dibiarkan di canonical URI…, URL bertanda tangan buat satu objek. `method` 'PUT' (upload), 'GET' (unduh),… (+2 more)

### Community 51 - "NewProjectModal"
Cohesion: 0.26
Nodes (13): listDrafts(), loadDraft(), handleOpenExistingDraft(), NewProjectModal(), handleFile(), openExistingMode(), pickDraft(), doImportJson() (+5 more)

### Community 52 - "GraphicStyleSelect.tsx"
Cohesion: 0.15
Nodes (10): GraphicStyleSelect(), hexToRgba(), KIND_LABEL, KINDS, PANEL_STYLE, Props, GRAPHIC_STYLE_PREVIEWS, GraphicStylePreviewSet (+2 more)

### Community 53 - "QuizBuilder"
Cohesion: 0.36
Nodes (7): QuizBuilder(), addQuestion(), autoDistribute(), move(), removeQuestion(), setQuestions(), updateQuestion()

### Community 54 - "Canvas.tsx"
Cohesion: 0.12
Nodes (14): addBlankSlide(), addSection(), removeSlide(), updateSlide(), Props, SlideRow(), Props, SlideBank() (+6 more)

### Community 55 - "cek-demo.mjs"
Cohesion: 0.27
Nodes (15): AKAR, ambangIdleSamaDiDuaMesin(), baca(), captionTidakDitulisDuaKali(), F, gagal(), kaitDataDemoTerpasang(), kaitTemaTerpasang() (+7 more)

### Community 56 - "ccPost"
Cohesion: 0.21
Nodes (13): ccBatalkanTanda(), ccDitandai(), ccListLearners(), ccListModules(), ccListSessions(), ccPost(), ccTandaiUji(), batalkanTandaUji() (+5 more)

### Community 57 - "ModuleData"
Cohesion: 0.20
Nodes (11): History, DemoCaptionEditor(), Props, Props, Props, collectTypes(), DEMO_STEPS, DemoStep (+3 more)

### Community 58 - "Identity Resolution & NIP Capture"
Cohesion: 0.07
Nodes (43): checkNetwork(), checkScorm(), findAPI(), rows(), setVerdict(), lms-probe/README.md — Uji Koneksi LMS Guide, Identitas Peserta Lintas Modul, Render completion status text for active Articulate blocks (+35 more)

### Community 59 - "pembungkusTag"
Cohesion: 0.40
Nodes (4): lanjutkanDaftar(), pembungkusTag(), RichInput(), RichTextarea()

### Community 60 - "SlidePreview"
Cohesion: 0.53
Nodes (5): SlidePreview(), bawaPopupKeLayar(), gulirKeBlokAktif(), jumpToSlide(), sorotBlokAktif()

### Community 61 - "uploadImageToStorage"
Cohesion: 0.50
Nodes (5): uploadImageToStorage(), detectPngTransparency(), ImageUploadField(), BackgroundImageField(), handleUpload()

### Community 62 - "ccCocreation"
Cohesion: 0.67
Nodes (3): ccCocreation(), bukaCocreation(), bukaCocreationSemua()

## Knowledge Gaps
- **160 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Template Modul Ikram — Source Code (Full Repo Printout)` connect `index.py` to `generator.py`, `App.tsx`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `react` connect `ModuleData` to `plugins`, `App.tsx`, `BlockEditor.tsx`, `PreviewExport.tsx`, `CommandCenter.tsx`, `EmojiPicker.tsx`, `types.ts`, `CoverForm.tsx`, `BlockPreview.tsx`, `GraphicStyleSelect.tsx`, `Canvas.tsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `14 Jenis Blok Konten` connect `BlockEditor.tsx` to `generator.py`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `App()` (e.g. with `onKey()` and `demoDariUrl()`) actually correct?**
  _`App()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _160 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `steps.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10483870967741936 - nodes in this community are weakly interconnected._
- **Should `generator.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05952380952380952 - nodes in this community are weakly interconnected._