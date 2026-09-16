# Graph Report - Template Modul Ikram  (2026-09-09)

## Corpus Check
- 50 files · ~194,233 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 850 nodes · 1473 edges · 58 communities (43 shown, 15 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5ccc3ddd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- generator.py
- index.py
- Learner Activity Tracking
- Canvas
- devDependencies
- CommandCenter.tsx
- types.ts
- compilerOptions
- activity_store.py
- compilerOptions
- Video Progress Tracking
- hkpd_to_moduledata.mjs
- PreviewExport.tsx
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
- Navigate to a NAV index, enforcing all gating rules
- BlockEditor.tsx
- scormZip.ts
- DtableFields
- PreviewExport
- EmojiPicker.tsx
- build_source_printout.py
- CoverForm.tsx
- supabase_setup.sql
- supabase_activity_setup.sql
- SlidePreview
- BlockEditor
- r2.py
- BlockAddMenu
- GraphicStyleSelect.tsx
- QuizBuilder
- 14 Jenis Blok Konten
- pembungkusTag
- api.ts
- Identity Resolution & NIP Capture

## God Nodes (most connected - your core abstractions)
1. `App()` - 28 edges
2. `CommandCenter()` - 21 edges
3. `esc()` - 21 edges
4. `PreviewExport()` - 20 edges
5. `Navigate to a NAV index, enforcing all gating rules` - 20 edges
6. `generate_html()` - 19 edges
7. `compilerOptions` - 18 edges
8. `Render the current NAV item into the viewport` - 18 edges
9. `Canvas()` - 17 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Preview & Export (Tahap 5)` --references--> `generate_html()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `14 Jenis Blok Konten` --references--> `render_block()`  [INFERRED]
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

## Communities (58 total, 15 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.12
Nodes (15): draftExists(), App(), handleCreateProject(), handleImportJson(), handleOpenExistingDraft(), AutosaveIndicator(), History, ProjectBar() (+7 more)

### Community 2 - "generator.py"
Cohesion: 0.06
Nodes (59): Preview & Export (Tahap 5), art_entry(), _blok_heading(), build_nav(), _caption_html(), clamp_brightness(), count_articulate(), count_interaktif() (+51 more)

### Community 3 - "index.py"
Cohesion: 0.05
Nodes (66): delete, get, Import PPTX (Tahap 1), post, delete_draft(), _headers(), list_drafts(), load_draft() (+58 more)

### Community 4 - "Learner Activity Tracking"
Cohesion: 0.08
Nodes (42): Alat "Cek Rekam Aktivitas", Command Center — Rekam Aktivitas & Analitik (Tahap 7), Deteksi Otomatis Data Janggal, Accordion block renderer, Bind global activity listeners for idle detection, Boot activity tracking: resume outbox, resolve identity, start/gate, Check elapsed time against idle threshold, pause segment, End the activity session and flush final events (+34 more)

### Community 5 - "Canvas"
Cohesion: 0.14
Nodes (19): Canvas(), addBlankSlide(), addBundle(), addSection(), bukaSlideNomor(), bundlesFor(), gulirKeBaris(), onDragEnd() (+11 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (37): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react, react-dom, @zip.js/zip.js, devDependencies (+29 more)

### Community 7 - "CommandCenter.tsx"
Cohesion: 0.07
Nodes (42): ActivityLearner, ActivityModule, ActivitySession, ccBatalkanTanda(), ccCocreation(), ccDitandai(), ccListLearners(), ccListModules() (+34 more)

### Community 8 - "types.ts"
Cohesion: 0.15
Nodes (18): Props, SlideRow(), Props, Props, Props, applyBlockText(), changeBlockType(), DEFAULT_QUIZ_POLICY (+10 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 10 - "activity_store.py"
Cohesion: 0.09
Nodes (36): batalkan_tanda(), cocreation_notes_for_learner(), cocreation_tree(), fetch_rows(), _gabung_catatan(), _headers(), _interaksi_key(), _judul_per_slug() (+28 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 12 - "Video Progress Tracking"
Cohesion: 0.42
Nodes (10): Video Progress Tracking, Global callback: flush queued YouTube player requests, Replace a YouTube facade with a real tracked IFrame player, Instantiate a YT.Player with tracked state events, Fall back to a plain untracked YouTube iframe, Flush all in-progress video checkpoints and YT samplers, Mark a video block as started, capture its slide, Handle YouTube player state changes for tracking (+2 more)

### Community 13 - "hkpd_to_moduledata.mjs"
Cohesion: 0.16
Nodes (17): blockTypes, CALLOUT_VARIANT, decodeEntities(), htmlField(), [inFile, outFile], mapBlock(), mapKnowledgeCheck(), moduleData (+9 more)

### Community 14 - "PreviewExport.tsx"
Cohesion: 0.18
Nodes (17): copyDraft(), deleteDraft(), listDrafts(), loadDraft(), renameDraft(), saveDraft(), NewProjectModal(), handleFile() (+9 more)

### Community 15 - "Ambang "Ditinggal" — 4 Menit"
Cohesion: 0.22
Nodes (9): Ambang "Dibaca" — 238 kata/menit, gagal di bawah 50%, Ambang "Ditinggal" — 4 Menit, Brysbaert (2019) — Reading Research Quarterly Meta-analysis (238 wpm), Chartbeat — User Engagement Tracking Methodology, Dasar Riset (Tahap 8), Flowace (2026) — Keystroke & Mouse Activity Tracking, Google Research (2013) — Eye-mouse Behavior, Huang, White & Buscher — Gaze/Cursor Study (CHI 2012) (+1 more)

### Community 16 - "icons.svg (SVG sprite sheet)"
Cohesion: 0.62
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol (generic profile/star icon), icons.svg (SVG sprite sheet), x-icon symbol (X/Twitter logo)

### Community 17 - "BlockPreview.tsx"
Cohesion: 0.16
Nodes (12): BLOCK_LABELS, BLOCK_TYPES, Props, AccordionDemo(), BLOCK_PREVIEW_STYLES, FlowDemo(), LOREM, ModalDemo() (+4 more)

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

### Community 36 - "Navigate to a NAV index, enforcing all gating rules"
Cohesion: 0.06
Nodes (66): Peringatan Kecepatan Baca, Get or create the shared Web Audio context, Schedule a single oscillator tone, Close out timing for the previous slide and emit slide_view, Buffer an activity tracking event, Compute idle threshold for the current slide mark, Record a quiz option selection, Show/hide the progress block per HIDE_PROGRESS (+58 more)

### Community 37 - "BlockEditor.tsx"
Cohesion: 0.11
Nodes (16): deleteArticulate(), ArticulateFields(), pilihFile(), BlockFields(), detectPngTransparency(), FieldStyle, ImageUploadField(), ModalFields() (+8 more)

### Community 38 - "scormZip.ts"
Cohesion: 0.19
Nodes (16): fetchArticulateZip(), generateHtmlForZip(), blobKeDataUri(), HasilSemat, namaAset(), sematkanGambarDataUri(), urlGambar(), artPaths() (+8 more)

### Community 40 - "PreviewExport"
Cohesion: 0.21
Nodes (15): generateHtml(), PreviewExport(), catatJudulExport(), doCopy(), doDelete(), doExport(), doExportScorm(), doPreview() (+7 more)

### Community 41 - "EmojiPicker.tsx"
Cohesion: 0.33
Nodes (3): EmojiPicker(), Props, EMOJI_CATEGORIES

### Community 42 - "build_source_printout.py"
Cohesion: 0.38
Nodes (6): ambil_desain(), id_berkas(), main(), Bangun ulang Template-Modul-Ikram-Source-Code.html dari isi repo saat ini.…, Id jangkar yang stabil - dipakai href sidebar dan id <section>., Kembalikan (kepala, ekor): semuanya sebelum <div class="wrap"> dan blok…

### Community 43 - "CoverForm.tsx"
Cohesion: 0.23
Nodes (11): checkTrackingConfig(), uploadImageToStorage(), BackgroundImageField(), handleUpload(), CoverForm(), Props, DEFAULT_THEME, findThemePresetId() (+3 more)

### Community 44 - "supabase_setup.sql"
Cohesion: 0.40
Nodes (3): public.modul_drafts_touch, modul_drafts_touch_trigger, public.modul_drafts

### Community 48 - "SlidePreview"
Cohesion: 0.53
Nodes (5): SlidePreview(), bawaPopupKeLayar(), gulirKeBlokAktif(), jumpToSlide(), sorotBlokAktif()

### Community 49 - "BlockEditor"
Cohesion: 0.18
Nodes (10): BlockEditor(), add(), changeType(), remove(), toggleCollapse(), blockSummary(), GridCellPreview(), langgananBlokAktif() (+2 more)

### Community 50 - "r2.py"
Cohesion: 0.25
Nodes (10): _creds(), is_configured(), presign(), _quote(), Cloudflare R2 — penanda tangan URL (presigned URL) buat paket Articulate.…, Apakah kredensial R2 lengkap terpasang di environment backend? Dipakai frontend…, Encoding yang dipakai SigV4. Slash SENGAJA dibiarkan di canonical URI…, URL bertanda tangan buat satu objek. `method` 'PUT' (upload), 'GET' (unduh),… (+2 more)

### Community 52 - "GraphicStyleSelect.tsx"
Cohesion: 0.15
Nodes (10): GraphicStyleSelect(), hexToRgba(), KIND_LABEL, KINDS, PANEL_STYLE, Props, GRAPHIC_STYLE_PREVIEWS, GraphicStylePreviewSet (+2 more)

### Community 53 - "QuizBuilder"
Cohesion: 0.36
Nodes (7): QuizBuilder(), addQuestion(), autoDistribute(), move(), removeQuestion(), setQuestions(), updateQuestion()

### Community 54 - "14 Jenis Blok Konten"
Cohesion: 0.33
Nodes (3): KnowledgeFields(), 14 Jenis Blok Konten, Susun Modul (Tahap 2)

### Community 55 - "pembungkusTag"
Cohesion: 0.50
Nodes (3): pembungkusTag(), RichInput(), RichTextarea()

### Community 57 - "api.ts"
Cohesion: 0.16
Nodes (14): ArticulateInfo, CocreationNote, CocreationSection, CocreationSlide, extractPptx(), r2Tersedia(), readArticulateEntry(), SesiUntukDitandai (+6 more)

### Community 58 - "Identity Resolution & NIP Capture"
Cohesion: 0.07
Nodes (45): checkNetwork(), checkScorm(), findAPI(), rows(), setVerdict(), lms-probe/README.md — Uji Koneksi LMS Guide, Identitas Peserta Lintas Modul, Keandalan Pencatatan Data (Outbox Offline) (+37 more)

## Knowledge Gaps
- **154 isolated node(s):** `SesiUntukDitandai`, `CocreationNote`, `CocreationSlide`, `CocreationSection`, `ArticulateInfo` (+149 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Template Modul Ikram — Source Code (Full Repo Printout)` connect `index.py` to `App.tsx`, `generator.py`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `react` connect `types.ts` to `App.tsx`, `plugins`, `BlockEditor.tsx`, `CommandCenter.tsx`, `EmojiPicker.tsx`, `CoverForm.tsx`, `PreviewExport.tsx`, `BlockPreview.tsx`, `GraphicStyleSelect.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `14 Jenis Blok Konten` connect `14 Jenis Blok Konten` to `generator.py`, `BlockEditor.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `SesiUntukDitandai`, `CocreationNote`, `CocreationSlide` to the rest of the system?**
  _154 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12333333333333334 - nodes in this community are weakly interconnected._
- **Should `generator.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06240084611316764 - nodes in this community are weakly interconnected._
- **Should `index.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05115089514066496 - nodes in this community are weakly interconnected._