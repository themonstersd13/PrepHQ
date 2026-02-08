// ============================================
// PrepHQ — Pixel-Diff Screen Trigger
// Detects significant screen changes using desktopCapturer
// and Canvas pixel comparison
// ============================================

const CAPTURE_INTERVAL_MS = 3000; // Check every 3 seconds
const DIFF_THRESHOLD = 0.05; // 5% pixel change triggers re-analysis
const PIXEL_SAMPLE_RATE = 10; // Sample every 10th pixel for performance

export interface ScreenDiffResult {
  /** Percentage of pixels that changed (0-1) */
  changeRatio: number;
  /** Whether the change exceeds the threshold */
  significant: boolean;
  /** Timestamp of the capture */
  timestamp: number;
}

/**
 * Screen Diff Monitor for Ghost Mode.
 * Periodically captures the screen and compares frames
 * to detect when the interviewer changes the screen content.
 */
export class ScreenDiffMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private previousImageData: ImageData | null = null;
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D | null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private onChange: ((result: ScreenDiffResult) => void) | null = null;

  constructor(private width = 320, private height = 180) {
    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Start monitoring for screen changes.
   * @param onSignificantChange - Callback when significant screen change detected
   */
  async start(onSignificantChange: (result: ScreenDiffResult) => void): Promise<void> {
    this.onChange = onSignificantChange;

    try {
      // Use getDisplayMedia for screen capture (works in Electron renderer)
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: this.width },
          height: { ideal: this.height },
          frameRate: { ideal: 1 }, // Low FPS is fine, we just need snapshots
        },
        audio: false,
      });

      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.muted = true;
      await this.video.play();

      // Start periodic capture
      this.intervalId = setInterval(() => this.captureAndCompare(), CAPTURE_INTERVAL_MS);
    } catch (err) {
      console.error('[ScreenDiff] Failed to start screen capture:', err);
      throw err;
    }
  }

  /** Stop monitoring */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
    }
    this.previousImageData = null;
    this.onChange = null;
  }

  /** Capture current frame and compare with previous */
  private captureAndCompare(): void {
    if (!this.video || !this.ctx) return;

    // Draw current frame to canvas
    this.ctx.drawImage(this.video, 0, 0, this.width, this.height);
    const currentImageData = this.ctx.getImageData(0, 0, this.width, this.height);

    if (this.previousImageData) {
      const result = this.computeDiff(this.previousImageData, currentImageData);

      if (result.significant && this.onChange) {
        this.onChange(result);
      }
    }

    this.previousImageData = currentImageData;
  }

  /** Compute pixel difference between two frames */
  private computeDiff(prev: ImageData, curr: ImageData): ScreenDiffResult {
    const prevData = prev.data;
    const currData = curr.data;
    const totalPixels = Math.floor(prevData.length / 4);
    let changedPixels = 0;
    let sampledPixels = 0;

    // Sample every Nth pixel for performance
    for (let i = 0; i < prevData.length; i += 4 * PIXEL_SAMPLE_RATE) {
      sampledPixels++;

      const dr = Math.abs(prevData[i] - currData[i]);
      const dg = Math.abs(prevData[i + 1] - currData[i + 1]);
      const db = Math.abs(prevData[i + 2] - currData[i + 2]);

      // A pixel is "changed" if RGB delta exceeds threshold
      if (dr + dg + db > 50) {
        changedPixels++;
      }
    }

    const changeRatio = sampledPixels > 0 ? changedPixels / sampledPixels : 0;

    return {
      changeRatio,
      significant: changeRatio >= DIFF_THRESHOLD,
      timestamp: Date.now(),
    };
  }
}
