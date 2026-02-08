# System Architecture & Design: PrepHQ

## 1. High-Level Technology Stack

### A. The "Shell" (Electron + Rust)
* **Framework:** Electron (Main Process).
* **Performance Optimization:** Use Rust Native Modules (Neon or NAPI-RS) for heavy compute tasks like Audio Buffering and Image Resizing. This prevents the JS thread from blocking.

### B. The Frontend (React + Fiber)
* **Core:** React 19 (Concurrent Mode).
* **State Management:** Zustand (for transient UI state) + TanStack Query (for API sync).
* **Styling:** Tailwind CSS + Radix UI Primitives + Framer Motion (Complex orchestrations).
* **Code Editor:** `@monaco-editor/react`.
* **Whiteboard:** `@excalidraw/excalidraw`.

### C. The Intelligence Pipeline (Hybrid)
* **Layer 1: Local Edge (On-Device ML)**
    * *Library:* MediaPipe (Google) or ONNX Runtime (WebAssembly).
    * *Tasks:* Face Mesh (Eye tracking), Pose Detection (Posture), VAD (Voice Activity Detection).
    * *Why Local?* Zero latency, privacy, free.
* **Layer 2: Cloud Inference (The "Brain")**
    * *Primary Model:* Gemini 1.5 Flash (Video/Audio/Text Multimodal).
    * *Why?* Massive context window (1M tokens) allows it to "remember" the entire 45-minute interview.
    * *Backup Model:* Deepgram Nova-2 (for ultra-fast STT if Gemini is slow).

## 2. Detailed Data Flow

### Scenario: "Ghost Mode" Active
1.  **Input Capture:**
    * `desktopCapturer` (Electron) grabs screen stream → Sent to **VideoBuffer**.
    * `system-audio` (Loopback) + `mic` → Mixed into **AudioBuffer**.
2.  **Pre-Processing (Local Rust Module):**
    * Audio is denoised (RNNoise algorithm).
    * Video is cropped to "Region of Interest" (e.g., just the code editor).
3.  **Trigger Logic:**
    * *Continuous:* Is someone speaking? (VAD).
    * *Discrete:* Did the screen change significantly? (Pixel Diff).
4.  **Inference Dispatch:**
    * If `User_Speaking`: Analyze sentiment locally.
    * If `Interviewer_Speaking`: Transcribe → Send to Gemini → "What are they asking?".
5.  **Rendering:**
    * Gemini returns JSON `{"intent": "hard_question", "hints": [...]}`.
    * React updates the Floating Pill with a smooth animation.

## 3. Database Schema (Local SQLite / PouchDB)
We need a local-first DB for offline capability.

```sql
Table Sessions {
    id: UUID
    mode: "GHOST" | "ARENA"
    timestamp: DateTime
    video_path: String (Local File)
    score_technical: Float
    score_communication: Float
}

Table Transcripts {
    session_id: UUID
    timestamp_offset: Int (ms)
    speaker: "USER" | "INTERVIEWER"
    text: String
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE"
}

Table Metrics {
    session_id: UUID
    timestamp_offset: Int (ms)
    heart_rate_proxy: Float (Visual estimation)
    filler_word_detected: Boolean
}