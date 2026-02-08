# Comprehensive Implementation Roadmap: PrepHQ

> **API Keys Available:** Gemini (primary LLM + multimodal), OpenAI (TTS + fallback LLM).
> All other dependencies are **free / open-source**.

---

## Epic 1: Core Foundation & Infrastructure (The Engine)

### Sub-Epic 1.1: Project Scaffolding
- [x] **Electron + Vite + React 19 + TypeScript:** Bootstrap with `@electron-forge/cli` using the Vite template. Configure Concurrent Mode. *(free)*
- [x] **State Management:** Install and configure `zustand` (transient UI state) + `@tanstack/react-query` (API sync / caching). *(free)*
- [x] **Styling Layer:** Install `tailwindcss` + `@radix-ui/react-*` primitives + `framer-motion`. Create a `theme.ts` with Glassmorphism tokens (frosted glass, neon gradients, 1px `rgba(255,255,255,0.1)` borders). *(free)*
- [x] **IPC Architecture:** Define a typed Electron IPC bridge (`contextBridge` + `preload.ts`) to cleanly separate Main ↔ Renderer communication.

### Sub-Epic 1.2: Rust Native Module
- [ ] **Rust Crate Init:** Create a Rust workspace inside the project using `napi-rs` (NAPI-RS) for building native Node addons. *(free)*
- [ ] **Audio Buffer Module:** Expose a Rust function that accepts raw PCM frames and performs ring-buffer management to prevent JS thread blocking.
- [ ] **RNNoise Denoising:** Integrate the `nnnoiseless` Rust crate (RNNoise port) to denoise audio in the native layer before sending to JS. *(free)*
- [ ] **Image ROI Cropper:** Expose a Rust function to crop video frames to a "Region of Interest" (e.g., just the code editor area) using the `image` crate. *(free)*

### Sub-Epic 1.3: Audio Capture
- [ ] **System Audio Loopback (Windows):** Use `win-audio-loopback` (npm, free) or Rust WASAPI bindings to capture system audio (interviewer voice) as a separate channel. *Critical path.*
- [ ] **Microphone Capture:** Standard `getUserMedia({ audio: true })` for the candidate mic channel.
- [ ] **Dual-Channel Mixer:** Keep system audio and mic on separate channels so downstream can distinguish `INTERVIEWER` vs `USER` speaker.
- [ ] **Acoustic Echo Cancellation (AEC):** Implement a software AEC filter (Speex-based or `speex-resampler` via Rust) to prevent the AI from hearing its own TTS output fed back through system audio. *(free)*

### Sub-Epic 1.4: Local Database
- [x] **SQLite Setup:** Initialize `better-sqlite3` *(free)* with the schema from `design.md` — `Sessions`, `Transcripts`, `Metrics` tables.
- [x] **DAO Layer:** Write typed CRUD helpers (createSession, appendTranscript, upsertMetric, getSessionHistory, etc.).
- [x] **Zero-Persistence Default:** All streams processed in RAM; nothing written to DB unless the user explicitly clicks "Save Session".

### Sub-Epic 1.5: Onboarding & Permissions
- [x] **Permission Handler:** Create a step-by-step onboarding flow that requests Mic, Camera, and Screen Recording permissions with clear visual explanations.
- [x] **API Key Setup Screen:** UI to enter/validate Gemini and OpenAI API keys, stored securely via `electron safeStorage`. *(free)*
- [x] **First-Run Tutorial:** A brief 3-step walkthrough (Ghost Mode, Arena Mode, Analytics) using a dismissable overlay.

---

## Epic 2: The "Ghost" Mode (Live Copilot)

### Sub-Epic 2.1: The Floating UI
- [x] **Transparent Overlay Window:** Create a frameless, transparent, always-on-top `BrowserWindow` with `transparent: true` and `alwaysOnTop: true`.
- [x] **Click-Through Logic:** Implement `win.setIgnoreMouseEvents(true, { forward: true })` so empty regions pass clicks to the app underneath. On hover over the pill, re-enable mouse events.
- [x] **Draggable Pill Widget:** Build the floating "Pill" component with Framer Motion drag handles, smooth 60fps repositioning, and a collapsed/expanded state.
- [x] **Compliance Check Modal:** Mandatory modal with checkbox + 5-second countdown timer: *"I certify I am using this for educational purposes or mock interviews only."* Ghost Mode cannot activate until completed.

### Sub-Epic 2.2: Real-Time Audio Intelligence
- [x] **VAD (Voice Activity Detection):** Implemented Web Speech API with continuous speech recognition for real-time STT. VAD via `onspeechstart`/`onspeechend` events.
- [x] **Speech-to-Text Pipeline:** Using Web Speech API as free local STT. Gemini 2.0 Flash for context analysis. Integrated via IPC pipeline.
- [x] **Speaker Diarization:** Tag each transcript segment as `USER` or `INTERVIEWER` based on audio channel.
- [x] **Pixel-Diff Screen Trigger:** Use `desktopCapturer` to grab frames; run a simple pixel-diff algorithm (Canvas `getImageData` comparison) to detect significant screen changes and re-trigger context analysis.

### Sub-Epic 2.3: The "Brain" — Context-Aware Intelligence
- [x] **Interview Phase Detector:** Built Gemini-powered phase classifier detecting: `Introduction` → `Technical-DSA` → `System Design` → `Behavioral` → `Closing`. Auto-updates UI via IPC.
- [x] **Expectation Engine (Rubrics):** Gemini returns structured rubrics/frameworks instead of answers. STAR Method for behavioral, pattern names for DSA, component checklists for system design.
- [x] **Context Manager State Machine:** Implemented full state machine: `Idle` → `Listening` → `Processing` → `Suggesting` → `Idle` using Zustand ghost store.
- [x] **Prompt Engineering:** Crafted system prompts per phase. Gemini returns structured JSON: `{"phase": "...", "intent": "...", "hints": [...], "rubric": [...]}`.

### Sub-Epic 2.4: Panic Protocol
- [x] **Global Hotkey:** Register `Ctrl+Shift+H` via Electron `globalShortcut` as the "Rescue" trigger. Also add a subtle icon on the pill.
- [x] **Stall Script Generator:** On trigger, Gemini generates a "buy time" script. Displayed on a pulsing overlay with auto-dismiss.

---

## Epic 3: The "Arena" Mode (Deep Practice Simulator)

### Sub-Epic 3.1: The Workspace Layout
- [x] **Resizable Multi-Pane Layout:** Built 3-pane layout (Code Editor / Chat / Video Feed) using `react-resizable-panels`. Panes resize smoothly at 60fps. Webcam feed with AI avatar sidebar.
- [x] **Full-Screen Mode:** Arena launches as a dedicated view with full workspace layout.

### Sub-Epic 3.2: Integrated Code Editor
- [x] **Monaco Editor Embed:** Integrated `@monaco-editor/react` with local `monaco-editor` bundle (no CDN, CSP-safe), VS Dark theme and custom editor options.
- [x] **Language Support:** Configured support for **Python, JavaScript/TypeScript, Java, C++** with syntax highlighting via Monaco built-in capabilities.
- [ ] **LSP Integration (Stretch):** For advanced linting, connect Monaco to language servers (`pyright`, `clangd`, `typescript-language-server`) via a lightweight LSP client. *(all free)*
- [x] **Code Execution Sandbox:** Code runs in sandboxed child process (Node for JS/TS, Python) with stdout/stderr display and timeout protection.

### Sub-Epic 3.3: Whiteboard 2.0
- [x] **Excalidraw Embed:** Integrate `@excalidraw/excalidraw` *(free)*, strip unnecessary toolbar items for a clean System Design canvas.
- [x] **AI Canvas Watcher:** Gemini Vision API integration built for analyzing whiteboard images and asking probing questions.
- [x] **Canvas ↔ Chat Sync:** When AI references a diagram element, highlight it on the canvas.

### Sub-Epic 3.4: AI Interviewer Engine
- [x] **Persona Profiles:** Defined 5 built-in JSON profiles: FAANG Algorithmist, System Architect, Grumpy SysAdmin, HR Manager, Startup CTO. Each with strictness, focus, interruption frequency, and speech pace.
- [x] **Interview State Machine:** Full 5-stage state machine: Introduction → Problem Statement → Clarification → Deep Dive → Wrap-up & Scoring.
- [x] **TTS (Text-to-Speech):** Implemented Browser `SpeechSynthesis` API with per-persona speech rate, volume controls, and TTS toggle in Arena toolbar.
- [x] **STT for Arena:** Integrated Web Speech API voice input into Arena chat with microphone toggle button and real-time interim transcription.
- [x] **Video Feed & Webcam:** Built `useWebcam` hook + `VideoFeed` component. AI interviewer avatar with speaking animation + candidate webcam (mirrored, LIVE indicator). Camera toggle in toolbar. Ghost Mode gets PIP webcam overlay.
- [x] **Gemini Retry & Error Handling:** `withRetry()` wrapper with exponential backoff (max 2 retries, 3s base delay). Graceful 429 quota exceeded messages in chat. API error indicator in toolbar.

### Sub-Epic 3.5: Multiplayer Mock (Peer-to-Peer)
- [x] **Signaling Server:** Set up a lightweight WebSocket signaling server (can be embedded in Electron Main process for LAN, or use a free service like `PeerJS Cloud` *(free)*).
- [x] **WebRTC Connection:** Use `simple-peer` *(free)* for P2P video/audio streaming between two users.
- [x] **Invite Flow:** Generate a shareable invite link/code. Second user opens PrepHQ → enters code → P2P handshake.
- [x] **AI Mediator:** In multiplayer mode, the AI acts as a "third party" providing real-time critique to *both* participants via a shared chat panel.
- [x] **Shared Editor State:** Sync Monaco editor content between peers using `Yjs` + `y-webrtc` *(free)* for conflict-free real-time collaboration.

---

## Epic 4: Deep ML Analytics & Reporting

### Sub-Epic 4.1: Real-Time Biometric Analysis (Local ML)
- [x] **Face Mesh Worker:** Spawn a Web Worker running `@mediapipe/tasks-vision` Face Mesh *(free)*. Extract 468 facial landmarks per frame.
- [x] **Eye Tracking Heatmap:** From Face Mesh iris landmarks, estimate gaze direction. Accumulate gaze points over the session → render as a heatmap overlay (Camera vs Screen vs Notes).
- [x] **Posture Detection:** Use `@mediapipe/tasks-vision` Pose Landmark *(free)* to detect slouching or excessive movement. Trigger gentle alerts ("Sit up straight 🪑") during Arena sessions.
- [x] **Local Sentiment Analysis:** Run a lightweight sentiment model (ONNX, `ort-wasm` *(free)*) on user's speech segments for real-time confidence estimation.

### Sub-Epic 4.2: Voice Analytics
- [x] **Filler Word Counter:** Real-time filler word detection with regex patterns (12 categories). Running count displayed in Ghost Mode info cards with detailed breakdown component.
- [x] **Confidence Score (Voice):** Analyze pitch variance and volume over time. Compare against standard confident speech patterns. Generate a time-series confidence score.
- [x] **Stress / Micro-Tremor Detection:** Use pitch jitter and shimmer analysis (librosa-style FFT on audio segments, implementable in Rust or JS via `meyda` *(free)*) to detect vocal stress markers.

### Sub-Epic 4.3: Content Auditing
- [x] **Keyword Density Tracker:** Tracks 7 keyword categories with 60+ technical terms. Displays as category bar chart + tag cloud component.
- [x] **Answer Completeness Score:** Gemini-powered rubric scoring. Sends transcript + rubric, returns structured JSON with score, covered/missed points, and feedback.

### Sub-Epic 4.4: Post-Session Report ("The Hiring Packet")
- [x] **Data Visualization Dashboard:** Implemented with `recharts`: Confidence Over Time (Line Chart), Topic Coverage (Radar Chart), Filler Words Breakdown (Bar Chart), Eye Gaze Distribution (Pie Chart). Score cards for Technical, Communication, Confidence, Filler Words.
- [x] **PDF Report Generator:** Multi-page PDF using `@react-pdf/renderer`: summary page with score cards, filler word breakdown, keyword tags, AI recommendations; transcript highlights page.
- [x] **Session History Viewer:** Dashboard to browse past sessions with search, filtering by mode/date/score, view details, and delete sessions.

---

## Epic 5: UI Polish & "Wow" Factors

### Sub-Epic 5.1: Design System — Glassmorphism 3.0
- [x] **Design Tokens:** Create a Tailwind preset with Glassmorphism tokens: `backdrop-blur`, frosted-glass `bg-white/5`, neon gradient accents for active states, ultra-thin `border border-white/10`.
- [x] **Radix UI Component Library:** Built styled primitives: GlassButton, GlassCard, GlassDialog, GlassTooltip, GlassTabs, GlassSelect, Skeleton, Badge — all wrapped with Glassmorphism styles.
- [x] **Dark / Light / Cyberpunk Themes:** Theme Provider (Zustand + CSS variables) with 3 themes. ThemeSwitcher component on HomePage. Theme-specific CSS overrides for glassmorphism, glows, scrollbar.

### Sub-Epic 5.2: Animations & Micro-Interactions
- [x] **Hint Appear/Disappear:** Framer Motion `AnimatePresence` for smooth enter/exit of suggestion cards. No layout shifts.
- [x] **Audio Visualizer:** Canvas-based frequency visualizer with bar and wave variants, configurable colors, glow effects, and responsive sizing via ResizeObserver.
- [x] **Skeleton Loaders:** Built content-aware Skeleton component with line, circle, and rect variants with shimmer effect.
- [x] **Page Transitions:** Smooth route transitions (opacity + slide) via Framer Motion layout animations.

---

## Epic 6: Privacy, Security & Performance

### Sub-Epic 6.1: Privacy-First Architecture
- [x] **RAM-Only Processing:** All audio/video streams are processed in memory and discarded immediately after inference. No temp files.
- [x] **Explicit Save Flow:** Sessions are only persisted to SQLite when the user clicks "Save Session". Clear UI indicator of save state.
- [x] **API Key Encryption:** Store Gemini/OpenAI keys using Electron's `safeStorage` API (OS-level encryption). *(free)*
- [x] **No Telemetry:** Zero analytics/tracking. Disabled breakpad crash reports. Network requests blocked except Gemini API + localhost. Referrer/Origin headers stripped.

### Sub-Epic 6.2: Performance Optimization
- [ ] **Target Budgets:** <2% CPU when idle, <500MB RAM total. Profile with Electron DevTools + Chrome Task Manager.
- [ ] **Memory Leak Audit:** Ensure all `MediaStream`, `AudioContext`, `OffscreenCanvas`, and video buffers are properly released/GC'd after use.
- [x] **Web Worker Offloading:** All ML inference (MediaPipe, ONNX) runs in dedicated Web Workers to keep the main thread at 60fps.
- [x] **Lazy Loading:** React.lazy + Suspense for GhostPage, ArenaPage, AnalyticsPage. Loading spinner fallback.

### Sub-Epic 6.3: Build & Deployment
- [x] **Auto-Updater:** Configure `electron-updater` *(free)* for OTA updates via GitHub Releases.
- [ ] **Code Signing:** Set up Windows code signing (self-signed for dev, purchase cert for release) and macOS Developer ID.
- [x] **CI/CD Pipeline:** GitHub Actions workflow: lint → test → build (Windows/macOS/Linux) → publish to GitHub Releases. *(free for public repos)*
- [x] **Installer:** Electron Forge makers for `.exe` (Windows), `.dmg` (macOS), `.AppImage` (Linux). *(free)*

---

## Dependency Summary (Free & Open Source)

| Category | Package | Cost |
|---|---|---|
| Framework | `electron`, `@electron-forge/cli`, `vite`, `react` 19, `typescript` | Free |
| Native | `napi-rs`, `nnnoiseless` (Rust RNNoise), `image` crate | Free |
| State | `zustand`, `@tanstack/react-query` | Free |
| Styling | `tailwindcss`, `@radix-ui/react-*`, `framer-motion` | Free |
| Editor | `@monaco-editor/react` | Free |
| Whiteboard | `@excalidraw/excalidraw` | Free |
| ML (Local) | `@mediapipe/tasks-vision`, `onnxruntime-web`, Silero VAD | Free |
| Audio | `win-audio-loopback`, `meyda` (audio features) | Free |
| DB | `better-sqlite3` | Free |
| Charts | `recharts` | Free |
| PDF | `@react-pdf/renderer` | Free |
| P2P | `simple-peer`, `yjs`, `y-webrtc`, `peerjs` | Free |
| AI (Cloud) | **Gemini 1.5 Flash** (STT + LLM + Vision) | API Key ✓ |
| AI (Cloud) | **OpenAI TTS** (`tts-1`) | API Key ✓ |
| Fallback STT | `whisper.cpp` via WASM (local, offline) | Free |
| Fallback TTS | Browser `SpeechSynthesis` API | Free |