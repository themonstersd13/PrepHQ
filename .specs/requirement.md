# Product Requirements Document: PrepHQ (The Ultimate Interview Intelligence Suite)

## 1. Executive Summary
PrepHQ is a dual-mode desktop intelligence platform designed to bridge the gap between interview preparation and execution. It uses local-first Machine Learning for low-latency signal processing and Cloud-based Large Language Models (LLMs) for deep reasoning.

## 2. Detailed User Modes

### Mode A: "Ghost" (The Live Copilot)
* **Usage Context:** Running alongside Zoom, Google Meet, or Teams.
* **Primary Constraint:** *Ethical Guardrails.* The system must enforce a mandatory "Compliance Check" (Checkbox + 5s timer) stating: *"I certify I am using this for educational purposes or mock interviews only."*
* **Core Features:**
    1.  **Omni-Directional Audio Capture:**
        * *Sub-detail:* Must capture `System Audio` (Interviewer) and `Microphone` (Candidate) on separate channels.
        * *Sub-sub-detail:* Implement software-based Acoustic Echo Cancellation (AEC) to prevent the AI from hearing itself.
    2.  **Context-Aware Intent Recognition (The "Brain"):**
        * Detects the *phase* of the interview: Introduction → Technical (DSA) → System Design → Behavioral → Closing.
        * *Action:* Automatically switches the UI context (e.g., opens a scratchpad during System Design).
    3.  **Real-Time "Expectation Engine":**
        * Instead of answers, it shows *rubrics*.
        * *Example:* If Interviewer says "Tell me about a time you failed," the UI shows: *"STAR Method Checklist: Situation, Task, Action, Result."*
    4.  **The "Panic Protocol":**
        * *Trigger:* User clicks a subtle "Rescue" icon or uses a global hotkey (e.g., `Ctrl+Shift+H`).
        * *Response:* The AI generates a "Stall & Structure" script: *"That's an interesting constraint. Let me take a moment to structure my thoughts around [Topic]..."* to buy time.

### Mode B: "Arena" (The Deep Practice Simulator)
* **Usage Context:** Standalone full-screen application.
* **Core Features:**
    1.  **AI Persona Engine:**
        * User selects specific personas: *"The Grumpy SysAdmin"*, *"The HR Manager"*, *"The FAANG Algorithmist."*
        * *Sub-detail:* The AI adjusts its speech pace, interruption frequency, and strictness based on the persona.
    2.  **Integrated Development Environment (IDE):**
        * Full Monaco Editor integration (VS Code engine).
        * *Sub-detail:* Language Server Protocol (LSP) support for C++, Java, Python (giving real syntax highlighting/linting).
    3.  **Multiplayer Mock (Peer-to-Peer):**
        * Invite a friend via a link.
        * *Sub-detail:* WebRTC video/audio streaming. The AI acts as a "Third Party Mediator" providing real-time critique to *both* parties.
    4.  **Whiteboard 2.0:**
        * Infinite canvas (Excalidraw fork) for System Design.
        * *Sub-detail:* The AI "watches" the canvas (Vision ML) and asks questions like: *"You drew a Load Balancer, but where is the Database replica?"*

## 3. The "Deep ML" Analytics Layer
* **Post-Session Report (The "Hiring Packet"):**
    1.  **Psychometric Analysis:**
        * *Confidence Score:* Time-series graph matching voice pitch/volume variance against standard confident speech patterns.
        * *Stress Detection:* Micro-tremor analysis in voice.
    2.  **Visual Semiotics (Webcam):**
        * *Eye Tracking (Local ML):* Heatmap of where the user looked (Camera vs Screen vs Notes).
        * *Posture Check:* Alerts if the user is slouching or moving too much.
    3.  **Content Auditing:**
        * *Keyword Density:* Did they mention "Big O", "Scalability", "Trade-offs"?
        * *Filler Word Counter:* Exact count of "Um", "Ah", "Like".

## 4. UI/UX "Top Notch" Requirements
* **Visual Language:** "Glassmorphism 3.0". Frosted glass backgrounds, neon gradients for active states, ultra-thin borders (`1px` borders with `rgba(255,255,255,0.1)`).
* **Interactivity:**
    * *Ghost Mode:* The window must be click-through (`pointer-events: none`) when not hovered, to allow coding underneath.
    * *Animations:* 60fps transitions using Framer Motion. No layout shifts.
* **Performance:** <2% CPU usage when idle. <500MB RAM usage.

## 5. Privacy & Security
* All video/audio streams are processed in RAM and discarded immediately after inference.
* Zero-persistence logs unless the user explicitly saves the session.