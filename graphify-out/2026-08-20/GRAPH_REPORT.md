# Graph Report - Template Modul Ikram  (2026-08-19)

## Corpus Check
- 45 files · ~91,010 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 600 nodes · 1081 edges · 35 communities (23 shown, 12 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a7e08ebb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- Navigate to a NAV index, enforcing all gating rules
- generator.py
- index.py
- Buffer an activity tracking event
- BlockEditor.tsx
- devDependencies
- api.ts
- Persist learner progress state to localStorage and SCORM
- compilerOptions
- activity_store.py
- compilerOptions
- GraphicStyleSelect.tsx
- Learning Recap Popup ('Ringkasan Belajarmu')
- Video Progress Tracking
- Ambang "Ditinggal" — 4 Menit
- icons.svg (SVG sprite sheet)
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

## God Nodes (most connected - your core abstractions)
1. `esc()` - 20 edges
2. `Navigate to a NAV index, enforcing all gating rules` - 20 edges
3. `App()` - 18 edges
4. `compilerOptions` - 18 edges
5. `generate_html()` - 18 edges
6. `Render the current NAV item into the viewport` - 18 edges
7. `ModuleData` - 17 edges
8. `react` - 15 edges
9. `compilerOptions` - 15 edges
10. `Persist learner progress state to localStorage and SCORM` - 14 edges

## Surprising Connections (you probably didn't know these)
- `14 Jenis Blok Konten` --references--> `render_block()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Preview & Export (Tahap 5)` --references--> `generate_html()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Import PPTX (Tahap 1)` --references--> `extract()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/pptx_extract.py
- `Identitas Peserta Lintas Modul` --references--> `Resolve learner identity from state/SCORM/shared cache`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/shell-template.html
- `Render Service: modul-builder-backend` --semantically_similar_to--> `server/vercel.json`  [INFERRED] [semantically similar]
  render.yaml → Template-Modul-Ikram-Source-Code.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Articulate SCORM-in-SCORM containment** — server_api_shell_template_artmakeshim, server_api_shell_template_scormfindapi, server_api_shell_template_concept_articulate_runtime [INFERRED 0.85]
- **goTo() navigation gate checks** — server_api_shell_template_goto, server_api_shell_template_kcallansweredforslide, server_api_shell_template_artpendingonslide [EXTRACTED 1.00]
- **Activity buffer -> outbox -> Supabase send pipeline** — server_api_shell_template_actevent, server_api_shell_template_actflush, server_api_shell_template_actsend [EXTRACTED 1.00]
- **Research Basis for Idle/Reading-speed Thresholds** — panduan_fitur_template_modul_ikram_ambang_ditinggal_4_menit, panduan_fitur_template_modul_ikram_ambang_dibaca_238wpm, server_api_shell_template_actidlethresholdms, server_api_generator [INFERRED 0.85]
- **Filled black brand-logo icon group (Bluesky, Discord, GitHub, X)** — app_public_icons_bluesky_icon, app_public_icons_discord_icon, app_public_icons_github_icon, app_public_icons_x_icon [INFERRED 0.85]

## Communities (35 total, 12 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (50): checkTrackingConfig(), copyDraft(), extractPptx(), generateHtml(), listDrafts(), loadDraft(), renameDraft(), saveDraft() (+42 more)

### Community 1 - "Navigate to a NAV index, enforcing all gating rules"
Cohesion: 0.07
Nodes (56): Get or create the shared Web Audio context, Schedule a single oscillator tone, Record a quiz option selection, Show/hide the progress block per HIDE_PROGRESS, Inject/play per-slide voiceover audio, Group a section's NAV items into singles/bundles/quiz, Handle 'go back and reread' from reading warning, Hide the dev-mode password modal (+48 more)

### Community 2 - "generator.py"
Cohesion: 0.07
Nodes (54): Preview & Export (Tahap 5), art_entry(), build_nav(), _caption_html(), clamp_brightness(), count_interaktif(), count_words(), esc() (+46 more)

### Community 3 - "index.py"
Cohesion: 0.07
Nodes (45): get, Import PPTX (Tahap 1), post, Render Service: modul-builder-backend, _headers(), list_drafts(), load_draft(), ping() (+37 more)

### Community 4 - "Buffer an activity tracking event"
Cohesion: 0.09
Nodes (39): Alat "Cek Rekam Aktivitas", Command Center — Rekam Aktivitas & Analitik (Tahap 7), Deteksi Otomatis Data Janggal, Identitas Peserta Lintas Modul, Keandalan Pencatatan Data (Outbox Offline), Peringatan Kecepatan Baca, Sisi Peserta — Yang Dialami Peserta (Tahap 6), Accordion block renderer (+31 more)

### Community 5 - "BlockEditor.tsx"
Cohesion: 0.06
Nodes (37): deleteArticulate(), uploadMediaToStorage(), BLOCK_LABELS, BLOCK_TYPES, BlockAddMenu(), Props, ArticulateFields(), BlockEditor() (+29 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (37): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react, react-dom, @zip.js/zip.js, devDependencies (+29 more)

### Community 7 - "api.ts"
Cohesion: 0.11
Nodes (29): ActivityLearner, ActivityModule, ActivitySession, ArticulateInfo, ccListLearners(), ccListModules(), ccListSessions(), ccPost() (+21 more)

### Community 8 - "Persist learner progress state to localStorage and SCORM"
Cohesion: 0.08
Nodes (43): checkNetwork(), checkScorm(), findAPI(), rows(), setVerdict(), lms-probe/README.md — Uji Koneksi LMS Guide, Render completion status text for active Articulate blocks, Bind Articulate blocks active on the current slide (+35 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 10 - "activity_store.py"
Cohesion: 0.16
Nodes (19): fetch_rows(), _headers(), _interaksi_key(), _judul_per_slug(), list_modules(), _rata_kelas_tatap_menit(), Baca data rekaman aktivitas peserta buat Command Center. Kenapa file ini ada di…, Peta module_slug -> daftar judul modul (module_title) yang pernah muncul.… (+11 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 12 - "GraphicStyleSelect.tsx"
Cohesion: 0.18
Nodes (10): GraphicStyleSelect(), hexToRgba(), KIND_LABEL, KINDS, PANEL_STYLE, Props, GRAPHIC_STYLE_PREVIEWS, GraphicStylePreviewSet (+2 more)

### Community 13 - "Learning Recap Popup ('Ringkasan Belajarmu')"
Cohesion: 0.24
Nodes (15): SVG bar chart renderer, Learning Recap Popup ('Ringkasan Belajarmu'), Render the recap bar chart of engagement signals, Close the learner recap popup, HTML-escape a value for the recap popup, Flush pending activity then fetch the recap payload, Join a list of strings with Indonesian 'dan' conjunction, Build the per-signal narration text builders for recap (+7 more)

### Community 14 - "Video Progress Tracking"
Cohesion: 0.42
Nodes (10): Video Progress Tracking, Global callback: flush queued YouTube player requests, Replace a YouTube facade with a real tracked IFrame player, Instantiate a YT.Player with tracked state events, Fall back to a plain untracked YouTube iframe, Flush all in-progress video checkpoints and YT samplers, Mark a video block as started, capture its slide, Handle YouTube player state changes for tracking (+2 more)

### Community 15 - "Ambang "Ditinggal" — 4 Menit"
Cohesion: 0.22
Nodes (9): Ambang "Dibaca" — 238 kata/menit, gagal di bawah 50%, Ambang "Ditinggal" — 4 Menit, Brysbaert (2019) — Reading Research Quarterly Meta-analysis (238 wpm), Chartbeat — User Engagement Tracking Methodology, Dasar Riset (Tahap 8), Flowace (2026) — Keystroke & Mouse Activity Tracking, Google Research (2013) — Eye-mouse Behavior, Huang, White & Buscher — Gaze/Cursor Study (CHI 2012) (+1 more)

### Community 16 - "icons.svg (SVG sprite sheet)"
Cohesion: 0.62
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol (generic profile/star icon), icons.svg (SVG sprite sheet), x-icon symbol (X/Twitter logo)

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

## Knowledge Gaps
- **124 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+119 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Template Modul Ikram — Source Code (Full Repo Printout)` connect `index.py` to `App.tsx`, `generator.py`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `plugins`, `GraphicStyleSelect.tsx`, `BlockEditor.tsx`, `api.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `Persist learner progress state to localStorage and SCORM` connect `Persist learner progress state to localStorage and SCORM` to `Navigate to a NAV index, enforcing all gating rules`, `Buffer an activity tracking event`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _124 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07645687645687646 - nodes in this community are weakly interconnected._
- **Should `Navigate to a NAV index, enforcing all gating rules` be split into smaller, more focused modules?**
  _Cohesion score 0.07012987012987013 - nodes in this community are weakly interconnected._
- **Should `generator.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06704260651629072 - nodes in this community are weakly interconnected._