# Graph Report - Template Modul Ikram  (2026-09-07)

## Corpus Check
- 50 files · ~179,103 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 804 nodes · 1368 edges · 59 communities (44 shown, 15 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ba9f3fb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- scormZip.ts
- generator.py
- index.py
- Buffer an activity tracking event
- Canvas
- devDependencies
- api.ts
- CoverForm.tsx
- compilerOptions
- activity_store.py
- compilerOptions
- PreviewExport
- hkpd_to_moduledata.mjs
- checkNetwork
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
- BlockEditor
- DtableFields
- Learning Recap Popup ('Ringkasan Belajarmu')
- EmojiPicker.tsx
- build_source_printout.py
- PreviewExport.tsx
- supabase_setup.sql
- supabase_activity_setup.sql
- App.tsx
- generateHtml
- r2.py
- Canvas.tsx
- GraphicStyleSelect.tsx
- QuizBuilder
- BlockAddMenu
- types.ts
- moduleFromJson
- SlideBank
- Persist learner progress state to localStorage and SCORM

## God Nodes (most connected - your core abstractions)
1. `App()` - 25 edges
2. `esc()` - 20 edges
3. `Navigate to a NAV index, enforcing all gating rules` - 20 edges
4. `generate_html()` - 19 edges
5. `compilerOptions` - 18 edges
6. `Render the current NAV item into the viewport` - 18 edges
7. `PreviewExport()` - 17 edges
8. `Canvas()` - 16 edges
9. `CommandCenter()` - 16 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Preview & Export (Tahap 5)` --references--> `generate_html()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Import PPTX (Tahap 1)` --references--> `extract()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/pptx_extract.py
- `14 Jenis Blok Konten` --references--> `render_block()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
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

## Communities (59 total, 15 thin omitted)

### Community 0 - "scormZip.ts"
Cohesion: 0.18
Nodes (17): fetchArticulateZip(), generateHtmlForZip(), blobKeDataUri(), HasilSemat, namaAset(), sematkanGambarDataUri(), urlGambar(), doExportScorm() (+9 more)

### Community 2 - "generator.py"
Cohesion: 0.06
Nodes (61): 14 Jenis Blok Konten, Preview & Export (Tahap 5), Susun Modul (Tahap 2), art_entry(), _blok_heading(), build_nav(), _caption_html(), clamp_brightness() (+53 more)

### Community 3 - "index.py"
Cohesion: 0.06
Nodes (60): delete, get, Import PPTX (Tahap 1), post, delete_draft(), _headers(), list_drafts(), load_draft() (+52 more)

### Community 4 - "Buffer an activity tracking event"
Cohesion: 0.10
Nodes (37): Alat "Cek Rekam Aktivitas", Command Center — Rekam Aktivitas & Analitik (Tahap 7), Deteksi Otomatis Data Janggal, Accordion block renderer, Bind global activity listeners for idle detection, Boot activity tracking: resume outbox, resolve identity, start/gate, Check elapsed time against idle threshold, pause segment, Close out timing for the previous slide and emit slide_view (+29 more)

### Community 5 - "Canvas"
Cohesion: 0.23
Nodes (14): Canvas(), addBlankSlide(), addBundle(), addSection(), bundlesFor(), onDragEnd(), removeBundle(), removeSlide() (+6 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (37): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react, react-dom, @zip.js/zip.js, devDependencies (+29 more)

### Community 7 - "api.ts"
Cohesion: 0.06
Nodes (44): ActivityLearner, ActivityModule, ActivitySession, ArticulateInfo, ccCocreation(), ccListLearners(), ccListModules(), ccListSessions() (+36 more)

### Community 8 - "CoverForm.tsx"
Cohesion: 0.23
Nodes (11): checkTrackingConfig(), uploadImageToStorage(), BackgroundImageField(), handleUpload(), CoverForm(), Props, DEFAULT_THEME, findThemePresetId() (+3 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 10 - "activity_store.py"
Cohesion: 0.12
Nodes (27): cocreation_notes_for_learner(), cocreation_tree(), fetch_rows(), _gabung_catatan(), _headers(), _interaksi_key(), _judul_per_slug(), list_modules() (+19 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 12 - "PreviewExport"
Cohesion: 0.31
Nodes (9): PreviewExport(), doCopy(), doDelete(), doRename(), doSave(), persistOrder(), refreshDrafts(), reorder() (+1 more)

### Community 13 - "hkpd_to_moduledata.mjs"
Cohesion: 0.16
Nodes (17): blockTypes, CALLOUT_VARIANT, decodeEntities(), htmlField(), [inFile, outFile], mapBlock(), mapKnowledgeCheck(), moduleData (+9 more)

### Community 14 - "checkNetwork"
Cohesion: 0.29
Nodes (6): checkNetwork(), checkScorm(), findAPI(), rows(), setVerdict(), lms-probe/README.md — Uji Koneksi LMS Guide

### Community 15 - "Ambang "Ditinggal" — 4 Menit"
Cohesion: 0.22
Nodes (9): Ambang "Dibaca" — 238 kata/menit, gagal di bawah 50%, Ambang "Ditinggal" — 4 Menit, Brysbaert (2019) — Reading Research Quarterly Meta-analysis (238 wpm), Chartbeat — User Engagement Tracking Methodology, Dasar Riset (Tahap 8), Flowace (2026) — Keystroke & Mouse Activity Tracking, Google Research (2013) — Eye-mouse Behavior, Huang, White & Buscher — Gaze/Cursor Study (CHI 2012) (+1 more)

### Community 16 - "icons.svg (SVG sprite sheet)"
Cohesion: 0.62
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol (generic profile/star icon), icons.svg (SVG sprite sheet), x-icon symbol (X/Twitter logo)

### Community 17 - "BlockPreview.tsx"
Cohesion: 0.17
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
Nodes (64): Get or create the shared Web Audio context, Schedule a single oscillator tone, Record a quiz option selection, Show/hide the progress block per HIDE_PROGRESS, Inject/play per-slide voiceover audio, Group a section's NAV items into singles/bundles/quiz, Hide the dev-mode password modal, Close the mobile sidebar drawer (+56 more)

### Community 37 - "BlockEditor.tsx"
Cohesion: 0.12
Nodes (14): BlockFields(), detectPngTransparency(), FieldStyle, ImageUploadField(), KnowledgeFields(), ModalFields(), pembungkusTag(), Props (+6 more)

### Community 38 - "BlockEditor"
Cohesion: 0.22
Nodes (9): BlockEditor(), add(), changeType(), remove(), toggleCollapse(), blockSummary(), GridCellPreview(), extractBlockText() (+1 more)

### Community 40 - "Learning Recap Popup ('Ringkasan Belajarmu')"
Cohesion: 0.25
Nodes (14): SVG bar chart renderer, Learning Recap Popup ('Ringkasan Belajarmu'), Render the recap bar chart of engagement signals, Close the learner recap popup, HTML-escape a value for the recap popup, Join a list of strings with Indonesian 'dan' conjunction, Build the per-signal narration text builders for recap, Open the learner recap popup, fetching data if needed (+6 more)

### Community 41 - "EmojiPicker.tsx"
Cohesion: 0.33
Nodes (3): EmojiPicker(), Props, EMOJI_CATEGORIES

### Community 42 - "build_source_printout.py"
Cohesion: 0.38
Nodes (6): ambil_desain(), id_berkas(), main(), Bangun ulang Template-Modul-Ikram-Source-Code.html dari isi repo saat ini.…, Id jangkar yang stabil - dipakai href sidebar dan id <section>., Kembalikan (kepala, ekor): semuanya sebelum <div class="wrap"> dan blok…

### Community 43 - "PreviewExport.tsx"
Cohesion: 0.33
Nodes (5): copyDraft(), deleteDraft(), renameDraft(), saveDraft(), Props

### Community 44 - "supabase_setup.sql"
Cohesion: 0.40
Nodes (3): public.modul_drafts_touch, modul_drafts_touch_trigger, public.modul_drafts

### Community 48 - "App.tsx"
Cohesion: 0.11
Nodes (16): loadDraft(), App(), handleCreateProject(), handleOpenExistingDraft(), AutosaveIndicator(), History, pickDraft(), ProjectBar() (+8 more)

### Community 49 - "generateHtml"
Cohesion: 0.33
Nodes (6): generateHtml(), doExport(), doPreview(), SlidePreview(), bawaPopupKeLayar(), jumpToSlide()

### Community 50 - "r2.py"
Cohesion: 0.25
Nodes (10): _creds(), is_configured(), presign(), _quote(), Cloudflare R2 — penanda tangan URL (presigned URL) buat paket Articulate.…, Apakah kredensial R2 lengkap terpasang di environment backend? Dipakai frontend…, Encoding yang dipakai SigV4. Slash SENGAJA dibiarkan di canonical URI…, URL bertanda tangan buat satu objek. `method` 'PUT' (upload), 'GET' (unduh),… (+2 more)

### Community 51 - "Canvas.tsx"
Cohesion: 0.22
Nodes (6): uploadMediaToStorage(), VideoUploadField(), Props, SlideAudioField(), SlideRow(), Section

### Community 52 - "GraphicStyleSelect.tsx"
Cohesion: 0.15
Nodes (10): GraphicStyleSelect(), hexToRgba(), KIND_LABEL, KINDS, PANEL_STYLE, Props, GRAPHIC_STYLE_PREVIEWS, GraphicStylePreviewSet (+2 more)

### Community 53 - "QuizBuilder"
Cohesion: 0.52
Nodes (7): QuizBuilder(), addQuestion(), autoDistribute(), move(), removeQuestion(), setQuestions(), updateQuestion()

### Community 55 - "types.ts"
Cohesion: 0.24
Nodes (13): Props, Props, Props, applyBlockText(), changeBlockType(), DraftSlide, ModuleData, newBlock() (+5 more)

### Community 56 - "moduleFromJson"
Cohesion: 0.33
Nodes (7): listDrafts(), NewProjectModal(), handleFile(), openExistingMode(), doImportJson(), moduleFromJson(), slugify()

### Community 57 - "SlideBank"
Cohesion: 0.40
Nodes (3): SlideBank(), addToCanvas(), onUpload()

### Community 58 - "Persist learner progress state to localStorage and SCORM"
Cohesion: 0.08
Nodes (42): Identitas Peserta Lintas Modul, Keandalan Pencatatan Data (Outbox Offline), Peringatan Kecepatan Baca, Sisi Peserta — Yang Dialami Peserta (Tahap 6), Render completion status text for active Articulate blocks, Bind Articulate blocks active on the current slide, Toggle fullscreen for an Articulate iframe block, Load an Articulate block's stored CMI data (+34 more)

## Knowledge Gaps
- **149 isolated node(s):** `Tab`, `TABS`, `History`, `Props`, `Props` (+144 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Template Modul Ikram — Source Code (Full Repo Printout)` connect `index.py` to `App.tsx`, `generator.py`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `react` connect `types.ts` to `plugins`, `BlockEditor.tsx`, `api.ts`, `CoverForm.tsx`, `EmojiPicker.tsx`, `PreviewExport.tsx`, `App.tsx`, `BlockPreview.tsx`, `Canvas.tsx`, `GraphicStyleSelect.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `14 Jenis Blok Konten` connect `generator.py` to `BlockEditor.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `Tab`, `TABS`, `History` to the rest of the system?**
  _149 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `generator.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05853174603174603 - nodes in this community are weakly interconnected._
- **Should `index.py` be split into smaller, more focused modules?**
  _Cohesion score 0.055299539170506916 - nodes in this community are weakly interconnected._
- **Should `Buffer an activity tracking event` be split into smaller, more focused modules?**
  _Cohesion score 0.09759759759759759 - nodes in this community are weakly interconnected._