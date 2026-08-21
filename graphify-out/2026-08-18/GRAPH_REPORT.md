# Graph Report - .  (2026-08-18)

## Corpus Check
- 4 files · ~85,723 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 559 nodes · 909 edges · 45 communities (31 shown, 14 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.66)
- Token cost: 0 input · 172,830 output

## Community Hubs (Navigation)
- React Builder App & Undo History
- HTML Generator (generator.py)
- Flask Backend: Drafts & PPTX Extract
- Runtime: Command Center & Interactive Blocks
- Activity API Client & Types
- tsconfig.app.json
- package.json & Lint Config
- Activity Store (activity_store.py)
- app/package.json Metadata
- tsconfig.node.json
- Runtime: Navigation Gating & Sidebar
- Block Add Menu & Preview
- Runtime: Recap Charts & Summary Screen
- Runtime: SCORM Writes & Quiz Scoring
- Graphic Style Picker
- Runtime: Idle Threshold & Identity Cache
- Runtime: SCORM Reads & Progress Visibility
- LMS Probe Diagnostic Tool
- Runtime: Activity Outbox & Send
- Panduan Fitur: Dasar Riset
- Runtime: Knowledge Check Popup
- Social Icon Sprite Sheet
- Runtime: Quiz Sound Effects
- server/vercel.json
- Emoji Picker
- Panduan Fitur: Sisi Peserta & Reading Warning
- Runtime: NIP Identity Form
- vite-env.d.ts
- tsconfig.json
- CLAUDE.md: Graphify Integration
- Panduan Fitur: Sampul
- Runtime: Badge Truncation Fix (Definisi/Flow)
- make_template.py One-off Script
- Vite Scaffold README/HTML
- App Favicon Asset
- Hero Illustration Asset
- React Logo Asset (Scaffold)
- Vite Logo Asset (Scaffold)
- Panduan Fitur Title Node
- Runtime: backToIdentityForm()
- Runtime: closeModal()
- Runtime: openSidebar()
- Runtime: scormFinish()

## God Nodes (most connected - your core abstractions)
1. `esc()` - 19 edges
2. `goTo() - navigates to a NAV index, enforcing all gates` - 19 edges
3. `App()` - 18 edges
4. `compilerOptions` - 18 edges
5. `generate_html()` - 18 edges
6. `render() - renders current NAV item and refreshes chrome` - 18 edges
7. `ModuleData` - 16 edges
8. `react` - 15 edges
9. `compilerOptions` - 15 edges
10. `saveState() - persists learner progress state` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Import PPTX (Tahap 1)` --references--> `extract()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/pptx_extract.py
- `14 Jenis Blok Konten` --references--> `render_block()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Preview & Export (Tahap 5)` --references--> `generate_html()`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/generator.py
- `Identitas Peserta Lintas Modul` --references--> `resolveIdentity() - resolves learner identity via priority chain`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/shell-template.html
- `Keandalan Pencatatan Data (Outbox Offline)` --references--> `outboxPush() - re-queues failed activity rows to outbox`  [INFERRED]
  Panduan-Fitur-Template-Modul-Ikram.html → server/api/shell-template.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Knowledge-Check popup gating flow** — server_api_shell_template_goto, server_api_shell_template_kcopenpopup, server_api_shell_template_kcanswer, server_api_shell_template_kcapply, server_api_shell_template_kccontinue [EXTRACTED 1.00]
- **Learner activity tracking pipeline (buffer -> flush -> outbox retry)** — server_api_shell_template_actstart, server_api_shell_template_actevent, server_api_shell_template_actflush, server_api_shell_template_actsend, server_api_shell_template_outboxpush [EXTRACTED 1.00]
- **YouTube video progress/checkpoint tracking** — server_api_shell_template_playyoutube, server_api_shell_template_videocreateyoutubeplayer, server_api_shell_template_videoonytstatechange, server_api_shell_template_videotracktime, server_api_shell_template_videosendcheckpoint [EXTRACTED 1.00]
- **Research Basis for Idle/Reading-speed Thresholds** — panduan_fitur_template_modul_ikram_ambang_ditinggal_4_menit, panduan_fitur_template_modul_ikram_ambang_dibaca_238wpm, server_api_shell_template_actidlethresholdms, server_api_generator [INFERRED 0.85]
- **Filled black brand-logo icon group (Bluesky, Discord, GitHub, X)** — app_public_icons_bluesky_icon, app_public_icons_discord_icon, app_public_icons_github_icon, app_public_icons_x_icon [INFERRED 0.85]

## Communities (45 total, 14 thin omitted)

### Community 0 - "React Builder App & Undo History"
Cohesion: 0.05
Nodes (60): checkTrackingConfig(), extractPptx(), generateHtml(), listDrafts(), loadDraft(), saveDraft(), App(), AutosaveIndicator() (+52 more)

### Community 1 - "HTML Generator (generator.py)"
Cohesion: 0.07
Nodes (50): Preview & Export (Tahap 5), build_nav(), _caption_html(), clamp_brightness(), count_interaktif(), count_words(), esc(), generate_html() (+42 more)

### Community 2 - "Flask Backend: Drafts & PPTX Extract"
Cohesion: 0.08
Nodes (42): get, Import PPTX (Tahap 1), post, Render Service: modul-builder-backend, _headers(), list_drafts(), load_draft(), ping() (+34 more)

### Community 3 - "Runtime: Command Center & Interactive Blocks"
Cohesion: 0.08
Nodes (26): activity_store.py (backend activity aggregation, external), Alat "Cek Rekam Aktivitas", Command Center — Rekam Aktivitas & Analitik (Tahap 7), Deteksi Otomatis Data Janggal, accordion() - renders accordion HTML, actInteraksi() - logs a content-interaction event, actNewSessionId() - generates a new activity session id, closeDevModeModal() - closes Dev Mode password modal (+18 more)

### Community 4 - "Activity API Client & Types"
Cohesion: 0.17
Nodes (18): ActivityLearner, ActivityModule, ActivitySession, ccListLearners(), ccListModules(), ccListSessions(), ccPost(), ccRawRows() (+10 more)

### Community 5 - "tsconfig.app.json"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 6 - "package.json & Lint Config"
Cohesion: 0.09
Nodes (22): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, devDependencies, oxlint, @types/node (+14 more)

### Community 7 - "Activity Store (activity_store.py)"
Cohesion: 0.16
Nodes (19): fetch_rows(), _headers(), _interaksi_key(), _judul_per_slug(), list_modules(), _rata_kelas_tatap_menit(), Baca data rekaman aktivitas peserta buat Command Center. Kenapa file ini ada di…, Peta module_slug -> daftar judul modul (module_title) yang pernah muncul.… (+11 more)

### Community 8 - "app/package.json Metadata"
Cohesion: 0.10
Nodes (20): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react, react-dom, name, private (+12 more)

### Community 9 - "tsconfig.node.json"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 10 - "Runtime: Navigation Gating & Sidebar"
Cohesion: 0.16
Nodes (18): buildNavGroups() - groups NAV items into sidebar bundles, closeSidebar() - closes mobile sidebar, goPrev() - navigates to previous NAV item, goTo() - navigates to a NAV index, enforcing all gates, isQuizAccessible() - checks whether a section quiz can be opened, isSectionUnlocked() - checks whether a section is unlocked, itemKey() - derives stable state key for a NAV item, kcAllAnsweredForSlide() - checks if all Knowledge-Check items answered (+10 more)

### Community 11 - "Block Add Menu & Preview"
Cohesion: 0.18
Nodes (13): BLOCK_LABELS, BLOCK_TYPES, Props, AccordionDemo(), BLOCK_PREVIEW_STYLES, BlockPreviewCard(), FlowDemo(), LOREM (+5 more)

### Community 12 - "Runtime: Recap Charts & Summary Screen"
Cohesion: 0.17
Nodes (15): Deci & Ryan (1985/2000) - Self-Determination Theory, barChartSVG() - bar SVG chart renderer, donutChartSVG() - donut/pie SVG chart renderer, recapChartHtml() - renders recap engagement bar chart, recapClose() - closes the recap popup, recapEsc() - HTML-escapes text for recap rendering, recapGabung() - joins a list into Indonesian 'X, Y dan Z' phrasing, recapNarasi() - builds per-signal narration sentences for recap (+7 more)

### Community 13 - "Runtime: SCORM Writes & Quiz Scoring"
Cohesion: 0.20
Nodes (15): applySlideAudio() - wires per-slide voiceover audio player, goNext() - navigates to next NAV item, isQuizPassed() - checks whether a section quiz is passed, quizScore() - computes correct-answer count for a section quiz, render() - renders current NAV item and refreshes chrome, renderBottomNav() - renders bottom nav buttons and dots, renderCrumb() - renders breadcrumb for current item, renderHero() - renders the cover/hero screen (+7 more)

### Community 14 - "Graphic Style Picker"
Cohesion: 0.18
Nodes (10): GraphicStyleSelect(), hexToRgba(), KIND_LABEL, KINDS, PANEL_STYLE, Props, GRAPHIC_STYLE_PREVIEWS, GraphicStylePreviewSet (+2 more)

### Community 15 - "Runtime: Idle Threshold & Identity Cache"
Cohesion: 0.18
Nodes (14): Brysbaert (2019) - 238 words/min reading speed, generator.py (module HTML generator, external), Backend endpoint /api/activity/my-recap, actBindActivity() - binds user-activity listeners for idle detection, actCheckIdle() - checks and freezes active time on idle, actCloseSlide() - closes timing segment for a slide, actIdleThresholdMs() - computes idle threshold per slide, actMarkSlide() - marks current slide as being timed (+6 more)

### Community 16 - "Runtime: SCORM Reads & Progress Visibility"
Cohesion: 0.17
Nodes (13): actBoot() - bootstraps activity tracking at load, applyProgressVisibility() - toggles progress bar visibility, identityFromScorm() - extracts learner identity from SCORM, Top-level bootstrap sequence (loadState -> render -> actBoot), loadSharedIdentity() - loads cross-module cached identity, loadState() - loads learner progress state (SCORM/localStorage), openDevModeModal() - opens Dev Mode password modal, openIdentityGate() - opens identity entry overlay (+5 more)

### Community 17 - "LMS Probe Diagnostic Tool"
Cohesion: 0.20
Nodes (9): checkNetwork(), checkScorm(), findAPI(), rows(), setVerdict(), lms-probe/README.md — Uji Koneksi LMS Guide, scormFindAPI() - walks window/parent chain for SCORM API, scormGetAPI() - finds SCORM API incl. window.opener (+1 more)

### Community 18 - "Runtime: Activity Outbox & Send"
Cohesion: 0.24
Nodes (11): actEnd() - ends activity session (session_end event), actEvent() - queues an activity event into buffer, actFlush() - flushes buffered + outbox activity rows, actSend() - POSTs activity rows to Supabase, chooseReadingWarningKembali() - returns to re-read rushed slides, chooseReadingWarningYakin() - proceeds to quiz despite warning, loadOutbox() - loads queued undelivered activity rows, outboxPush() - re-queues failed activity rows to outbox (+3 more)

### Community 19 - "Panduan Fitur: Dasar Riset"
Cohesion: 0.22
Nodes (9): Ambang "Dibaca" — 238 kata/menit, gagal di bawah 50%, Ambang "Ditinggal" — 4 Menit, Brysbaert (2019) — Reading Research Quarterly Meta-analysis (238 wpm), Chartbeat — User Engagement Tracking Methodology, Dasar Riset (Tahap 8), Flowace (2026) — Keystroke & Mouse Activity Tracking, Google Research (2013) — Eye-mouse Behavior, Huang, White & Buscher — Gaze/Cursor Study (CHI 2012) (+1 more)

### Community 20 - "Runtime: Knowledge Check Popup"
Cohesion: 0.42
Nodes (9): kcAnswer() - handles a Knowledge-Check option click, kcApply() - applies final locked state for a KC question, kcFindItem() - looks up a Knowledge-Check question object, kcMarkAttempt() - marks one KC option as tried/wrong, kcOpenPopup() - opens the Knowledge-Check gating popup, kcRestoreAttempts() - restores prior KC attempts on popup reopen, kcShowAttemptFeedback() - shows feedback for a KC attempt, kcUpdateContinueBtn() - shows/hides KC popup continue button (+1 more)

### Community 21 - "Social Icon Sprite Sheet"
Cohesion: 0.62
Nodes (7): bluesky-icon symbol, discord-icon symbol, documentation-icon symbol, github-icon symbol, social-icon symbol (generic profile/star icon), icons.svg (SVG sprite sheet), x-icon symbol (X/Twitter logo)

### Community 22 - "Runtime: Quiz Sound Effects"
Cohesion: 0.52
Nodes (7): _getAudioCtx() - lazily creates/resumes shared AudioContext, _tone() - schedules one oscillator tone, answerQuiz() - records a section-quiz answer, playCorrectSound() - plays correct-answer chime, playQuizFailSound() - plays quiz-fail tone, playQuizPassSound() - plays quiz-pass fanfare, playWrongSound() - plays wrong-answer tone

### Community 23 - "server/vercel.json"
Cohesion: 0.33
Nodes (5): includeFiles, maxDuration, crons, functions, api/index.py

### Community 25 - "Panduan Fitur: Sisi Peserta & Reading Warning"
Cohesion: 0.40
Nodes (5): Identitas Peserta Lintas Modul, Keandalan Pencatatan Data (Outbox Offline), Peringatan Kecepatan Baca, Sisi Peserta — Yang Dialami Peserta (Tahap 6), openReadingWarning() - opens reading-speed warning overlay

### Community 26 - "Runtime: NIP Identity Form"
Cohesion: 0.50
Nodes (5): formatNip() - groups NIP digits per PNS NIP structure, formatNipInput() - live-formats NIP input field, nipDigits() - strips NIP input to digits only, showIdentityError() - shows identity form validation error, submitIdentity() - validates and stages identity form

### Community 29 - "CLAUDE.md: Graphify Integration"
Cohesion: 1.00
Nodes (3): CLAUDE.md - graphify project instructions, graphify native integration (query/path/explain graphify-out/ before answering), graphify update workflow (run 'graphify update .' after modifying code)

### Community 30 - "Panduan Fitur: Sampul"
Cohesion: 0.67
Nodes (3): Cek Kesiapan Sistem Rekam, Aktifkan Rekam Aktivitas Peserta (toggle), Sampul (Tahap 3)

### Community 31 - "Runtime: Badge Truncation Fix (Definisi/Flow)"
Cohesion: 1.00
Nodes (3): Rationale: cap absolutely-positioned badge text with white-space:nowrap+ellipsis instead of letting it wrap into an oversized blob, .definition .tag (absolutely-positioned badge pill), .flow-step .fs-badge (absolutely-positioned 'new' badge)

## Knowledge Gaps
- **139 isolated node(s):** `$schema`, `oxc`, `react/rules-of-hooks`, `warn`, `name` (+134 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Template Modul Ikram — Source Code (Full Repo Printout)` connect `Flask Backend: Drafts & PPTX Extract` to `React Builder App & Undo History`, `HTML Generator (generator.py)`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `react` connect `React Builder App & Undo History` to `Activity API Client & Types`, `package.json & Lint Config`, `Block Add Menu & Preview`, `Graphic Style Picker`, `Emoji Picker`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `plugins` connect `package.json & Lint Config` to `React Builder App & Undo History`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `$schema`, `oxc`, `react/rules-of-hooks` to the rest of the system?**
  _139 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `React Builder App & Undo History` be split into smaller, more focused modules?**
  _Cohesion score 0.051590483827853514 - nodes in this community are weakly interconnected._
- **Should `HTML Generator (generator.py)` be split into smaller, more focused modules?**
  _Cohesion score 0.07256894049346879 - nodes in this community are weakly interconnected._
- **Should `Flask Backend: Drafts & PPTX Extract` be split into smaller, more focused modules?**
  _Cohesion score 0.07632850241545894 - nodes in this community are weakly interconnected._