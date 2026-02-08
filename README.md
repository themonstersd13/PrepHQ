<p align="center">
  <img src="https://img.shields.io/badge/Electron-40.2.1-47848F?style=for-the-badge&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-4.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

<h1 align="center">⚡ PrepHQ</h1>
<h3 align="center">The Ultimate Interview Intelligence Suite</h3>

<p align="center">
  Dual-mode desktop platform combining a <strong>live interview copilot</strong> (Ghost Mode) with a
  <strong>deep practice simulator</strong> (Arena Mode) — powered by Gemini AI, real-time ML biometrics,
  and a stunning Glassmorphism UI.
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Troubleshooting](#-troubleshooting)
- [Build & Distribution](#-build--distribution)
- [CI/CD](#-cicd)
- [Privacy & Security](#-privacy--security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔭 Overview

PrepHQ is a **privacy-first, offline-capable** desktop app built with Electron that helps you ace technical interviews through two complementary modes:

| Mode | What It Does |
|------|-------------|
| **👻 Ghost Mode** | Real-time copilot overlay during live interviews — transcribes speech, detects interview phase, and surfaces contextual hints via Gemini AI |
| **⚔️ Arena Mode** | Full interview simulator with AI personas, Monaco code editor, Excalidraw whiteboard, webcam feed, voice analytics, and face mesh biometrics |
| **📊 Analytics** | Post-session dashboard with confidence/stress time-series, eye-gaze heatmap, filler word breakdown, topic radar, and PDF export |

---

## ✨ Features

### Ghost Mode — Live Interview Copilot
- 🎙️ **Real-time Speech-to-Text** — Web Speech API with speaker diarization (USER / INTERVIEWER)
- 🧠 **AI-Powered Hints** — Gemini 2.0 Flash analyzes transcript + screen context and returns phase-aware rubrics, frameworks, and suggestions
- 📡 **Interview Phase Detection** — Automatically classifies: Introduction → Technical-DSA → System Design → Behavioral → Closing
- 🚨 **Panic Protocol** — `Ctrl+Shift+H` emergency hotkey generates a "buy time" stall script when you're stuck
- 🫧 **Floating Pill Widget** — Draggable, transparent, click-through overlay with expand/collapse states
- ✅ **Compliance Modal** — Mandatory ethical-use check before activation
- 📷 **Webcam PIP** — Picture-in-picture camera overlay with posture monitoring
- 🗣️ **Filler Word Counter** — Real-time detection of 12 filler word categories (um, uh, like, you know, etc.)

### Arena Mode — Deep Practice Simulator
- 🤖 **5 AI Personas** — FAANG Algorithmist, System Architect, Grumpy SysAdmin, HR Manager, Startup CTO — each with unique strictness, focus, and speech patterns
- 💻 **Monaco Code Editor** — Full VS Code editor with syntax highlighting for Python, JavaScript, TypeScript, Java, C++
- 🏗️ **Excalidraw Whiteboard** — Integrated system design canvas with AI snapshot analysis (Code / Board / Split view toggle)
- ▶️ **Code Execution Sandbox** — Run code in-editor with stdout/stderr output and 10-second timeout
- 🔊 **Text-to-Speech** — AI persona speaks responses aloud with per-persona speech rate
- 📷 **Webcam + AI Avatar** — Side-by-side candidate webcam and animated AI interviewer avatar
- 🎤 **Voice Input** — Microphone toggle for hands-free responses
- ♟️ **5-Stage Interview Flow** — Introduction → Problem Statement → Clarification → Deep Dive → Wrap-up & Scoring
- 🔄 **Gemini Retry** — Exponential backoff (max 2 retries, 3s base) with graceful 429 quota-exceeded handling

### Real-Time ML Biometrics (All Local, All In Web Workers)
- 👁️ **Face Mesh (468 landmarks)** — MediaPipe FaceLandmarker running at configurable FPS in a dedicated Web Worker
- 🎯 **Eye Gaze Tracking** — Iris landmark estimation classifying gaze target: Camera / Screen / Notes / Other
- 🪑 **Posture Detection** — MediaPipe PoseLandmarker detecting slouching, head tilt, and shoulder angle with gentle posture alerts
- 🔬 **Sentiment Analysis** — Lexicon-based NLP with ONNX infrastructure ready, negation handling, hedging phrase detection
- 📊 **Voice Confidence Scoring** — Meyda audio feature extraction with autocorrelation pitch detection, jitter/shimmer analysis
- 😰 **Stress Detection** — Vocal micro-tremor analysis via pitch variance, spectral centroid, and amplitude perturbation

### Analytics Dashboard
- 📈 **Confidence Over Time** — Line chart (Recharts) tracking confidence + stress across the session
- 🕸️ **Topic Coverage Radar** — Radar chart across Data Structures, Algorithms, System Design, Communication, Problem Solving, Code Quality
- 🗣️ **Filler Words Breakdown** — Color-coded bar chart with per-filler counts
- 🔥 **Eye Gaze Heatmap** — Canvas-rendered heatmap with distribution percentages per gaze target
- 📄 **PDF Report Export** — Multi-page PDF via `@react-pdf/renderer` with scores, filler breakdown, AI feedback
- 📜 **Session History** — Browse, view, and delete past Ghost and Arena sessions

### Multiplayer (P2P)
- 🌐 **PeerJS WebRTC** — Create/join rooms with shareable room codes
- 📹 **Video/Audio Streaming** — Send webcam + mic streams to remote peers
- 💬 **Data Channel** — Real-time chat and data exchange
- 📝 **Shared Editor** — Yjs + y-webrtc infrastructure for conflict-free collaborative editing

### Platform & Polish
- 🎨 **3 Themes** — Dark (default), Light, Cyberpunk — with full Glassmorphism design system
- 🧊 **Glassmorphism UI** — Frosted glass cards, neon accents, ultra-thin borders, backdrop-blur effects
- 🔘 **9 Radix UI Primitives** — GlassButton, GlassCard, GlassDialog, GlassTabs, GlassSelect, GlassTooltip, Badge, Skeleton, etc.
- ✨ **Framer Motion Animations** — Page transitions, AnimatePresence, drag handles, micro-interactions
- 🖥️ **Custom Title Bar** — Frameless window with Windows overlay controls
- 🔄 **Auto-Updater** — OTA updates via `electron-updater` + GitHub Releases
- 📦 **Cross-Platform Installers** — `.exe` (Windows), `.deb`/`.rpm` (Linux), `.dmg` (macOS)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     RENDERER PROCESS                      │
│  React 19 + Zustand + Framer Motion + Tailwind CSS 4     │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ GhostPage│ │ArenaPage │ │Analytics │ │ Onboarding │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────────┘  │
│       │             │            │                         │
│  ┌────┴─────────────┴────────────┴──────────────────┐    │
│  │              Custom Hooks Layer                    │    │
│  │  useAudioCapture · useFaceMesh · useVoiceAnalytics│    │
│  │  useSentiment · useWebcam · useTTS · usePeer      │    │
│  │  usePerformance                                   │    │
│  └────┬─────────────┬────────────┬──────────────────┘    │
│       │             │            │                         │
│  ┌────┴─────┐ ┌─────┴────┐ ┌────┴─────┐                 │
│  │ Vision   │ │  Audio   │ │Sentiment │  ← Web Workers   │
│  │ Worker   │ │ Analysis │ │ Worker   │    (off main      │
│  │(MediaPipe)│ │ Worker  │ │ (NLP)    │     thread)       │
│  └──────────┘ │ (Meyda)  │ └──────────┘                  │
│               └──────────┘                                │
├───────────────────── IPC Bridge ─────────────────────────┤
│                contextBridge (preload.ts)                  │
├──────────────────────────────────────────────────────────┤
│                      MAIN PROCESS                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Gemini       │ │ Ghost        │ │  Auto-Updater    │ │
│  │ Service      │ │ Session      │ │  (electron-      │ │
│  │ (AI + Vision)│ │ Orchestrator │ │   updater)       │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐                       │
│  │ SQLite DB    │ │ IPC Handlers │                       │
│  │(better-sqlite3)│ │ (typed)     │                      │
│  └──────────────┘ └──────────────┘                       │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Core Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| Electron | 40.2.1 | Desktop shell with OS-level APIs |
| Electron Forge | 7.11.1 | Build tooling, packaging, makers |
| Vite | 5.4 | Lightning-fast HMR & bundling |
| React | 19.2 | UI with Concurrent Mode |
| TypeScript | ~4.5.4 | Type safety across all processes |

### State & Data
| Technology | Purpose |
|-----------|---------|
| Zustand 5 | Lightweight global state (5 stores) |
| @tanstack/react-query 5 | API sync & caching |
| better-sqlite3 12 | Embedded SQLite for sessions, transcripts, metrics |

### AI & ML
| Technology | Purpose |
|-----------|---------|
| @google/generative-ai (Gemini) | LLM for hints, persona responses, whiteboard analysis |
| @mediapipe/tasks-vision | Face Mesh (468 landmarks) + Pose Landmark (33 points) |
| Meyda 5 | Audio feature extraction (RMS, spectral centroid, ZCR) |
| onnxruntime-web | ONNX model inference infrastructure (sentiment) |

### Editor & Whiteboard
| Technology | Purpose |
|-----------|---------|
| Monaco Editor 0.55 | Full VS Code editor experience |
| @excalidraw/excalidraw 0.18 | System design whiteboard canvas |

### Multiplayer
| Technology | Purpose |
|-----------|---------|
| PeerJS 1.5 | WebRTC signaling & peer connections |
| simple-peer 9.11 | Low-level WebRTC streams |
| Yjs 13 + y-webrtc 10 | CRDT-based collaborative editing |

### UI & Styling
| Technology | Purpose |
|-----------|---------|
| Tailwind CSS 4 | Utility-first styling with Glassmorphism tokens |
| Framer Motion 12 | Animations, page transitions, drag |
| Radix UI | Accessible headless primitives |
| Recharts 3 | Data visualization (Line, Bar, Radar, Pie) |
| @react-pdf/renderer 4 | PDF report generation |

### Build & Deploy
| Technology | Purpose |
|-----------|---------|
| electron-updater 6 | OTA auto-updates via GitHub Releases |
| GitHub Actions | CI/CD: lint → build → release |
| Squirrel (Windows) | `.exe` installer with auto-update |
| Makers | `.deb`, `.rpm`, `.zip`, `.dmg` |

---

## 📁 Project Structure

```
PrepHQ/
├── .github/
│   └── workflows/
│       └── build.yml              # CI/CD pipeline
├── .specs/
│   └── tasks.md                   # Implementation roadmap
├── src/
│   ├── main.ts                    # Electron main process entry
│   ├── main/
│   │   ├── database/              # SQLite schema, DAO layer
│   │   ├── ipc-handlers.ts        # All IPC handler registrations
│   │   └── services/
│   │       ├── gemini-service.ts   # Gemini AI wrapper (retry, streaming)
│   │       ├── ghost-session.ts    # Ghost Mode state machine
│   │       └── auto-updater.ts     # electron-updater OTA service
│   ├── preload/
│   │   └── index.ts               # contextBridge API (typed)
│   ├── renderer/
│   │   ├── App.tsx                # Root app with routing & lazy loading
│   │   ├── index.tsx              # React entry point
│   │   ├── pages/
│   │   │   ├── HomePage.tsx       # Landing with mode cards
│   │   │   ├── GhostPage.tsx      # Ghost Mode (pill + transcript + ML)
│   │   │   ├── ArenaPage.tsx      # Arena Mode (editor + chat + video + whiteboard)
│   │   │   ├── AnalyticsPage.tsx  # Dashboard with charts & PDF export
│   │   │   └── Onboarding.tsx     # First-run tutorial + API key setup
│   │   ├── components/
│   │   │   ├── ui/                # Glassmorphism design system (9 components)
│   │   │   ├── ghost/             # ComplianceModal, GhostPill, PanicOverlay, TranscriptPanel
│   │   │   ├── arena/             # CodeEditor, ArenaChat, PersonaSelector, VideoFeed, Whiteboard
│   │   │   ├── analytics/         # EyeTrackingHeatmap, FillerWordCounter, KeywordDensity,
│   │   │   │                      # PdfReport, PostureAlert, VoiceMetricsDisplay
│   │   │   ├── AudioVisualizer.tsx
│   │   │   ├── ThemeSwitcher.tsx
│   │   │   └── TitleBar.tsx
│   │   ├── hooks/
│   │   │   ├── useAudioCapture.ts  # Mic + Web Speech API STT
│   │   │   ├── useFaceMesh.ts      # Vision worker manager (face + pose)
│   │   │   ├── useVoiceAnalytics.ts# Audio worker manager (Meyda)
│   │   │   ├── useSentiment.ts     # Sentiment worker manager
│   │   │   ├── useWebcam.ts        # Camera stream lifecycle
│   │   │   ├── useTTS.ts           # Browser SpeechSynthesis wrapper
│   │   │   ├── usePeer.ts          # PeerJS WebRTC connections
│   │   │   └── usePerformance.ts   # FPS, memory, long task monitoring
│   │   ├── workers/
│   │   │   ├── vision.worker.ts         # MediaPipe Face Mesh + Pose (Web Worker)
│   │   │   ├── audio-analysis.worker.ts # Meyda audio features (Web Worker)
│   │   │   └── sentiment.worker.ts      # Lexicon + ONNX sentiment (Web Worker)
│   │   ├── stores/
│   │   │   ├── app-store.ts       # Navigation, mode selection
│   │   │   ├── arena-store.ts     # Arena session state (persona, stage, code, chat)
│   │   │   ├── ghost-store.ts     # Ghost session state (pill, hints, transcripts)
│   │   │   ├── settings-store.ts  # API keys, preferences
│   │   │   └── theme-store.ts     # Dark / Light / Cyberpunk
│   │   ├── services/
│   │   │   └── filler-word-analyzer.ts  # Regex-based filler detection engine
│   │   └── styles/
│   │       └── globals.css        # Tailwind imports + Glassmorphism tokens
│   └── shared/
│       ├── types/index.ts         # All TypeScript interfaces & types
│       └── constants/
│           └── ipc-channels.ts    # Typed IPC channel names
├── forge.config.ts                # Electron Forge config (makers, plugins, fuses)
├── vite.main.config.ts            # Vite config for main process
├── vite.preload.config.ts         # Vite config for preload
├── vite.renderer.config.ts        # Vite config for renderer
├── tsconfig.json                  # TypeScript configuration
├── index.html                     # Renderer HTML entry
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x (recommended: 20.x LTS)
- **npm** ≥ 9.x
- **Git**
- **Python 3.x** (optional, for Python code execution in Arena)
- **Windows Build Tools** (Windows only, for `better-sqlite3` native compilation):
  ```bash
  npm install -g windows-build-tools
  ```

### Installation

```bash
# Clone the repository
git clone https://github.com/themonstersd13/PrepHQ.git
cd PrepHQ

# Install dependencies
npm install

# Start in development mode (with hot reload)
npm start
```

### First Run

1. The app opens with an **Onboarding** flow
2. Enter your **Gemini API Key** (get one free at [ai.google.dev](https://ai.google.dev))
3. Grant **Microphone** and **Camera** permissions when prompted
4. Choose Ghost Mode or Arena Mode and start practicing!

---

## ⚙️ Configuration

### API Keys

| Key | Required | How to Get | Purpose |
|-----|----------|-----------|---------|
| **Gemini API Key** | ✅ Yes | [ai.google.dev](https://ai.google.dev) | AI hints, persona responses, whiteboard analysis |

API keys are encrypted at rest using Electron's `safeStorage` API (OS-level keychain).

### Environment

No `.env` file is needed. All configuration happens through the in-app Settings page. The app works entirely offline except for Gemini API calls.

---

## 📖 Usage Guide

### 👻 Ghost Mode

1. Click **Ghost Mode** on the home screen
2. Accept the **Compliance Check** (ethical use agreement)
3. The app starts listening — speak naturally during your interview
4. **Hints** appear in the floating pill when the AI detects you need help
5. Click the pill to expand and see detailed suggestions
6. Press **`Ctrl+Shift+H`** for **Panic Protocol** if you're completely stuck
7. View real-time metrics: transcripts, filler words, posture score, sentiment

### ⚔️ Arena Mode

1. Click **Arena Mode** on the home screen
2. **Choose an AI Persona** — each has unique interviewing style
3. Chat with the AI interviewer in the right panel
4. Write code in the **Monaco Editor** (left panel) — toggle between Code / Whiteboard / Split
5. Click ▶️ **Run** to execute your solution
6. Use the 🎤 microphone for voice input
7. Monitor your **confidence** and **stress** gauges in the sidebar
8. Click **End Interview** for the AI's wrap-up feedback and scoring

### 📊 Analytics

1. Click **Analytics** on the home screen
2. Browse **Session History** — view any past Ghost or Arena session
3. The dashboard shows:
   - Confidence & Stress over time
   - Topic coverage radar
   - Filler word breakdown
   - Eye gaze heatmap
4. Click **Export PDF Report** for a shareable document

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+H` | 🚨 Panic Protocol (Ghost Mode) |
| `Ctrl+Enter` | Run code (Arena Mode editor) |
| `Ctrl+S` | Save session |

---

## 🔧 Troubleshooting

### Black Screen on Launch

**Cause:** Content Security Policy (CSP) blocking inline scripts.

**Fix:** The app uses a strict CSP. If you see a blank screen:
1. Open DevTools (`Ctrl+Shift+I`)
2. Check the Console for CSP violations
3. Ensure `vite.renderer.config.ts` doesn't inject inline scripts
4. Verify Monaco Editor is loaded from the local bundle, not CDN

### `better-sqlite3` Native Module Error

**Cause:** The native SQLite module isn't compiled for Electron's Node version.

**Fix:**
```bash
# Rebuild native modules for Electron
npx electron-rebuild

# Or delete node_modules and reinstall
rm -rf node_modules
npm install
```

If on Windows and you see `gyp ERR!`:
```bash
# Install Windows build tools
npm install -g windows-build-tools

# Set Python path if needed
npm config set python python3
```

### Monaco Editor Not Loading / Blank Editor

**Cause:** Monaco workers trying to load from CDN (blocked by CSP).

**Fix:** The project bundles Monaco locally. If it still fails:
1. Ensure `monaco-editor` is in `dependencies` (not just `@monaco-editor/react`)
2. Check that `vite.renderer.config.ts` includes the Monaco ESM worker plugin
3. Clear the Vite cache: `rm -rf .vite && npm start`

### MediaPipe Models Failing to Load

**Cause:** CDN domains blocked by the network request filter in `main.ts`.

**Fix:** Verify these domains are in the `allowedDomains` array in `src/main.ts`:
```typescript
const allowedDomains = [
  'generativelanguage.googleapis.com',
  'localhost',
  '127.0.0.1',
  'cdn.jsdelivr.net',          // ← MediaPipe WASM runtime
  'storage.googleapis.com',     // ← MediaPipe models
  '0.peerjs.com',              // ← PeerJS signaling
];
```

### Webcam / Microphone Not Working

**Cause:** Permissions not granted or device in use by another app.

**Fix:**
1. Check that no other app is using the camera/microphone
2. On Windows, go to **Settings → Privacy → Camera/Microphone** and ensure the app has access
3. In DevTools Console, run: `navigator.mediaDevices.enumerateDevices()` to verify devices are visible
4. Try restarting the app after closing other video/audio apps

### Gemini API "429 Quota Exceeded" Error

**Cause:** Too many requests to the Gemini API within the rate limit window.

**Fix:**
1. The app has built-in retry with exponential backoff (waits 3s → 6s → 12s)
2. If you see persistent 429 errors, wait 60 seconds before retrying
3. Check your API quota at [ai.google.dev](https://ai.google.dev)
4. Consider upgrading your Gemini plan for higher rate limits
5. Arena Mode shows a yellow error badge in the toolbar when rate-limited

### PeerJS Multiplayer Connection Fails

**Cause:** Firewall blocking WebRTC or PeerJS signaling server unreachable.

**Fix:**
1. Ensure `0.peerjs.com` is reachable from your network
2. Check that the firewall allows UDP traffic (WebRTC STUN/TURN)
3. Both peers must be on PrepHQ with the same version
4. Try a different network — some corporate firewalls block P2P

### Electron Forge Build Fails

**Cause:** Missing native dependencies or incompatible Node version.

**Fix:**
```bash
# Ensure you're on Node 20.x
node --version

# Clean rebuild
rm -rf out/ .vite/ node_modules/
npm install
npm run make
```

### High CPU / Memory Usage

**Cause:** ML workers (MediaPipe, Meyda) are computationally intensive.

**Fix:**
1. Lower the face mesh FPS (default: 8fps) — edit `useFaceMesh` hook's `fps` parameter
2. Disable webcam when not needed (toggle in toolbar)
3. Close DevTools in production (they consume extra memory)
4. Use the `usePerformance` hook to monitor: FPS, heap size, DOM nodes

### TypeScript Compile Errors from `node_modules`

**Cause:** The project uses TypeScript ~4.5.4, but some `@types/node` definitions require TS 5+.

**Fix:** This is a known issue and does **not affect the Vite build** (Vite uses esbuild, not tsc). The errors only appear when running `tsc --noEmit`. They can be ignored, or you can:
```bash
# Run with skipLibCheck (skips node_modules type checking)
npx tsc --noEmit --skipLibCheck
```

### Auto-Updater Not Working in Dev

**Cause:** `electron-updater` only works in packaged builds, not dev mode.

**Fix:** This is by design. The auto-updater is intentionally disabled during development. To test:
```bash
# Build a production package first
npm run make

# Run the packaged app from out/
```

---

## 📦 Build & Distribution

### Development

```bash
npm start          # Start with Vite HMR + DevTools
```

### Package (no installer)

```bash
npm run package    # Creates unpacked app in out/
```

### Make Installers

```bash
npm run make       # Creates platform-specific installers in out/make/
```

| Platform | Installer | Maker |
|----------|-----------|-------|
| Windows | `.exe` (Squirrel) | @electron-forge/maker-squirrel |
| Windows | `.zip` | @electron-forge/maker-zip |
| macOS | `.zip` | @electron-forge/maker-zip |
| Linux | `.deb` | @electron-forge/maker-deb |
| Linux | `.rpm` | @electron-forge/maker-rpm |

---

## 🔁 CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/build.yml`):

| Trigger | Pipeline |
|---------|----------|
| Push to `main` / PR | **Lint** (tsc) → **Build** (Windows + macOS + Linux) |
| Push `v*` tag | Lint → Build → **Publish GitHub Release** with all artifacts |

### Creating a Release

```bash
# Bump version
npm version patch   # or minor / major

# Push with tags
git push --follow-tags

# GitHub Actions will:
# 1. Type-check the code
# 2. Build for all 3 platforms
# 3. Create a GitHub Release with .exe, .deb, .rpm, .zip
```

---

## 🔒 Privacy & Security

PrepHQ is built with a **privacy-first architecture**:

| Principle | Implementation |
|-----------|---------------|
| **RAM-Only Processing** | All audio/video streams processed in memory and immediately discarded |
| **No Telemetry** | Zero analytics, tracking, or crash reporting. `breakpad` disabled |
| **Explicit Save** | Sessions only persisted to SQLite when user clicks "Save" |
| **API Key Encryption** | Gemini key stored via Electron's `safeStorage` (OS-level keychain) |
| **Network Lockdown** | All requests blocked except Gemini API + MediaPipe CDN + localhost |
| **Header Stripping** | `Referer` and `Origin` headers removed from all requests |
| **Context Isolation** | `contextIsolation: true`, `nodeIntegration: false`, typed `contextBridge` |
| **Electron Fuses** | `RunAsNode`, `EnableNodeCliInspect` disabled via `@electron/fuses` |
| **No Temp Files** | No audio/video ever written to disk |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit with conventional commits: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Notes

- **Main process** code is in `src/main.ts` + `src/main/`
- **Renderer** code is in `src/renderer/` (React app)
- **Shared types** go in `src/shared/types/index.ts`
- **IPC channels** must be defined in `src/shared/constants/ipc-channels.ts` and bridged in `src/preload/index.ts`
- **Web Workers** use `new URL('../workers/xxx.worker.ts', import.meta.url)` for Vite compatibility
- ML workers should **never** run on the main thread — always use dedicated Web Workers

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with 💙 by <a href="https://github.com/themonstersd13">themonstersd13</a>
</p>
#   P r e p H Q  
 