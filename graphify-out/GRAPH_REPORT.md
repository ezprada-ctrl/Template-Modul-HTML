# Graph Report - Template Modul Ikram  (2026-09-03)

## Corpus Check
- 50 files · ~171,359 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 795 nodes · 1360 edges · 50 communities (35 shown, 15 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 156 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0c4570a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PreviewExport.tsx
- Knowledge Check Gate
- generator.py
- index.py
- Buffer an activity tracking event
- Canvas
- devDependencies
- api.ts
- checkNetwork
- compilerOptions
- activity_store.py
- compilerOptions
- GraphicStyleSelect.tsx
- hkpd_to_moduledata.mjs
- Video Progress Tracking
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
- DtableFields
- BlockEditor
- EmojiPicker.tsx
- build_source_printout.py
- QuizBuilder
- supabase_setup.sql
- supabase_activity_setup.sql
- types.ts
- r2.py
- BlockAddMenu

## God Nodes (most connected - your core abstractions)
1. `App()` - 25 edges
2. `esc()` - 20 edges
3. `Navigate to a NAV index, enforcing all gating rules` - 20 edges
4. `generate_html()` - 19 edges
5. `compilerOptions` - 18 edges
6. `Render the current NAV item into the viewport` - 18 edges
7. `PreviewExport()` - 17 edges
8. `CommandCenter()` - 16 edges
9. `Canvas()` - 15 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Preview & Export (Tahap 5)` --references--> `generate_html()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `14 Jenis Blok Konten` --references--> `render_block()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Import PPTX (Tahap 1)` --references--> `extract()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/pptx_extract.py
- `Render Service: modul-builder-backend` --semantically_similar_to--> `server/vercel.json`  [INFERRED] [semantically similar]
  render.yaml → Template-Modul-Ikram-Source-Code.html
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

## Communities (50 total, 15 thin omitted)

### Community 0 - "PreviewExport.tsx"
Cohesion: 0.09
Nodes (34): copyDraft(), deleteDraft(), fetchArticulateZip(), generateHtml(), generateHtmlForZip(), renameDraft(), saveDraft(), blobKeDataUri() (+26 more)

### Community 1 - "Knowledge Check Gate"
Cohesion: 0.39
Nodes (12): Knowledge Check Gate, Check whether all Knowledge Check items on a slide are answered, Record a Knowledge Check answer, handle retry-until-correct, Apply the final locked result state for a KC question, Close the KC popup and resume pending navigation, Find a Knowledge Check question by block/index, Mark one KC option button as tried-and-wrong, Open the Knowledge Check popup for a slide (+4 more)

### Community 2 - "generator.py"
Cohesion: 0.06
Nodes (56): Preview & Export (Tahap 5), art_entry(), build_nav(), _caption_html(), clamp_brightness(), count_articulate(), count_interaktif(), count_words() (+48 more)

### Community 3 - "index.py"
Cohesion: 0.05
Nodes (61): delete, get, Import PPTX (Tahap 1), post, Render Service: modul-builder-backend, delete_draft(), _headers(), list_drafts() (+53 more)

### Community 4 - "Buffer an activity tracking event"
Cohesion: 0.05
Nodes (68): Alat "Cek Rekam Aktivitas", Command Center — Rekam Aktivitas & Analitik (Tahap 7), Deteksi Otomatis Data Janggal, Identitas Peserta Lintas Modul, Keandalan Pencatatan Data (Outbox Offline), Peringatan Kecepatan Baca, Sisi Peserta — Yang Dialami Peserta (Tahap 6), Accordion block renderer (+60 more)

### Community 5 - "Canvas"
Cohesion: 0.15
Nodes (17): Canvas(), addBlankSlide(), addBundle(), addSection(), bundlesFor(), onDragEnd(), removeBundle(), removeSlide() (+9 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (37): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react, react-dom, @zip.js/zip.js, devDependencies (+29 more)

### Community 7 - "api.ts"
Cohesion: 0.06
Nodes (44): ActivityLearner, ActivityModule, ActivitySession, ArticulateInfo, ccCocreation(), ccListLearners(), ccListModules(), ccListSessions() (+36 more)

### Community 8 - "checkNetwork"
Cohesion: 0.29
Nodes (6): checkNetwork(), checkScorm(), findAPI(), rows(), setVerdict(), lms-probe/README.md — Uji Koneksi LMS Guide

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 10 - "activity_store.py"
Cohesion: 0.12
Nodes (27): cocreation_notes_for_learner(), cocreation_tree(), fetch_rows(), _gabung_catatan(), _headers(), _interaksi_key(), _judul_per_slug(), list_modules() (+19 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 12 - "GraphicStyleSelect.tsx"
Cohesion: 0.15
Nodes (10): GraphicStyleSelect(), hexToRgba(), KIND_LABEL, KINDS, PANEL_STYLE, Props, GRAPHIC_STYLE_PREVIEWS, GraphicStylePreviewSet (+2 more)

### Community 13 - "hkpd_to_moduledata.mjs"
Cohesion: 0.16
Nodes (17): blockTypes, CALLOUT_VARIANT, decodeEntities(), htmlField(), [inFile, outFile], mapBlock(), mapKnowledgeCheck(), moduleData (+9 more)

### Community 14 - "Video Progress Tracking"
Cohesion: 0.42
Nodes (10): Video Progress Tracking, Global callback: flush queued YouTube player requests, Replace a YouTube facade with a real tracked IFrame player, Instantiate a YT.Player with tracked state events, Fall back to a plain untracked YouTube iframe, Flush all in-progress video checkpoints and YT samplers, Mark a video block as started, capture its slide, Handle YouTube player state changes for tracking (+2 more)

### Community 15 - "Ambang "Ditinggal" — 4 Menit"
Cohesion: 0.22
Nodes (9): Ambang "Dibaca" — 238 kata/menit, gagal di bawah 50%, Ambang "Ditinggal" — 4 Menit, Brysbaert (2019) — Reading Research Quarterly Meta-analysis (238 wpm), Chartbeat — User Engagement Tracking Methodology, Dasar Riset (Tahap 8), Flowace (2026) — Keystroke & Mouse Activity Tracking, Google Research (2013) — Eye-mouse Behavior, Huang, White & Buscher — Gaze/Cursor Study (CHI 2012) (+1 more)

### Community 16 - "icons.svg (SVG sprite sheet)"
Cohesion: 0.62
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol (generic profile/star icon), icons.svg (SVG sprite sheet), x-icon symbol (X/Twitter logo)

### Community 17 - "BlockPreview.tsx"
Cohesion: 0.18
Nodes (13): BLOCK_LABELS, BLOCK_TYPES, Props, AccordionDemo(), BLOCK_PREVIEW_STYLES, BlockPreviewCard(), FlowDemo(), LOREM (+5 more)

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
Nodes (67): Get or create the shared Web Audio context, Schedule a single oscillator tone, Record a quiz option selection, Show/hide the progress block per HIDE_PROGRESS, Inject/play per-slide voiceover audio, Render completion status text for active Articulate blocks, Bind Articulate blocks active on the current slide, Toggle fullscreen for an Articulate iframe block (+59 more)

### Community 37 - "BlockEditor.tsx"
Cohesion: 0.13
Nodes (10): detectPngTransparency(), FieldStyle, ImageUploadField(), KnowledgeFields(), Props, RichTextarea(), Block, KcQuestion (+2 more)

### Community 40 - "BlockEditor"
Cohesion: 0.22
Nodes (9): BlockEditor(), add(), changeType(), remove(), toggleCollapse(), blockSummary(), GridCellPreview(), extractBlockText() (+1 more)

### Community 41 - "EmojiPicker.tsx"
Cohesion: 0.33
Nodes (3): EmojiPicker(), Props, EMOJI_CATEGORIES

### Community 42 - "build_source_printout.py"
Cohesion: 0.38
Nodes (6): ambil_desain(), id_berkas(), main(), Bangun ulang Template-Modul-Ikram-Source-Code.html dari isi repo saat ini.…, Id jangkar yang stabil - dipakai href sidebar dan id <section>., Kembalikan (kepala, ekor): semuanya sebelum <div class="wrap"> dan blok…

### Community 43 - "QuizBuilder"
Cohesion: 0.52
Nodes (7): QuizBuilder(), addQuestion(), autoDistribute(), move(), removeQuestion(), setQuestions(), updateQuestion()

### Community 44 - "supabase_setup.sql"
Cohesion: 0.40
Nodes (3): public.modul_drafts_touch, modul_drafts_touch_trigger, public.modul_drafts

### Community 48 - "types.ts"
Cohesion: 0.05
Nodes (55): checkTrackingConfig(), listDrafts(), loadDraft(), uploadImageToStorage(), uploadMediaToStorage(), App(), handleCreateProject(), handleOpenExistingDraft() (+47 more)

### Community 50 - "r2.py"
Cohesion: 0.25
Nodes (10): _creds(), is_configured(), presign(), _quote(), Cloudflare R2 — penanda tangan URL (presigned URL) buat paket Articulate.…, Apakah kredensial R2 lengkap terpasang di environment backend? Dipakai frontend…, Encoding yang dipakai SigV4. Slash SENGAJA dibiarkan di canonical URI…, URL bertanda tangan buat satu objek. `method` 'PUT' (upload), 'GET' (unduh),… (+2 more)

## Knowledge Gaps
- **146 isolated node(s):** `Props`, `HasilSemat`, `Props`, `Props`, `GraphicStylePreviewSet` (+141 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Template Modul Ikram — Source Code (Full Repo Printout)` connect `index.py` to `types.ts`, `generator.py`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `react` connect `types.ts` to `PreviewExport.tsx`, `plugins`, `BlockEditor.tsx`, `api.ts`, `EmojiPicker.tsx`, `GraphicStyleSelect.tsx`, `BlockPreview.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `14 Jenis Blok Konten` connect `BlockEditor.tsx` to `generator.py`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `Props`, `HasilSemat`, `Props` to the rest of the system?**
  _146 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PreviewExport.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09390243902439024 - nodes in this community are weakly interconnected._
- **Should `generator.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06428988895382817 - nodes in this community are weakly interconnected._
- **Should `index.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05336538461538461 - nodes in this community are weakly interconnected._