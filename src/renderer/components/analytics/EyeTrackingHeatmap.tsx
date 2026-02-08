// ============================================
// PrepHQ — Eye Tracking Heatmap
// Renders accumulated gaze points as a
// canvas-based heatmap overlay
// ============================================

import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { GazePoint } from '../../../shared/types';

interface EyeTrackingHeatmapProps {
  gazeHistory: GazePoint[];
  width?: number;
  height?: number;
  radius?: number;
  className?: string;
}

const TARGET_COLORS: Record<string, string> = {
  camera: '#22c55e',
  screen: '#3b82f6',
  notes: '#eab308',
  other: '#ef4444',
};

const EyeTrackingHeatmap: React.FC<EyeTrackingHeatmapProps> = ({
  gazeHistory,
  width = 320,
  height = 240,
  radius = 20,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute gaze distribution stats
  const stats = useMemo(() => {
    if (gazeHistory.length === 0) {
      return { camera: 0, screen: 0, notes: 0, other: 0 };
    }
    const counts = { camera: 0, screen: 0, notes: 0, other: 0 };
    gazeHistory.forEach((p) => {
      if (p.target in counts) {
        counts[p.target as keyof typeof counts]++;
      }
    });
    const total = gazeHistory.length;
    return {
      camera: Math.round((counts.camera / total) * 100),
      screen: Math.round((counts.screen / total) * 100),
      notes: Math.round((counts.notes / total) * 100),
      other: Math.round((counts.other / total) * 100),
    };
  }, [gazeHistory]);

  // Draw heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (gazeHistory.length === 0) {
      // Draw "no data" message
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No gaze data yet', width / 2, height / 2);
      return;
    }

    // Create heatmap using radial gradients
    // Use an offscreen canvas for alpha compositing
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // Draw heat points (grayscale alpha)
    gazeHistory.forEach((point) => {
      const px = point.x * width;
      const py = point.y * height;

      const gradient = offCtx.createRadialGradient(px, py, 0, px, py, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,0.15)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      offCtx.fillStyle = gradient;
      offCtx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    });

    // Colorize heatmap
    const imageData = offCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]; // Alpha channel is our intensity
      if (alpha === 0) continue;

      const intensity = alpha / 255;

      // Blue → Green → Yellow → Red gradient
      let r: number, g: number, b: number;
      if (intensity < 0.25) {
        // Blue
        r = 0;
        g = 0;
        b = Math.round(255 * (intensity / 0.25));
      } else if (intensity < 0.5) {
        // Blue → Green
        const t = (intensity - 0.25) / 0.25;
        r = 0;
        g = Math.round(255 * t);
        b = Math.round(255 * (1 - t));
      } else if (intensity < 0.75) {
        // Green → Yellow
        const t = (intensity - 0.5) / 0.25;
        r = Math.round(255 * t);
        g = 255;
        b = 0;
      } else {
        // Yellow → Red
        const t = (intensity - 0.75) / 0.25;
        r = 255;
        g = Math.round(255 * (1 - t));
        b = 0;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = Math.min(alpha * 2, 200); // Boost visibility
    }

    offCtx.putImageData(imageData, 0, 0);

    // Draw onto main canvas
    ctx.globalAlpha = 0.8;
    ctx.drawImage(offscreen, 0, 0);
    ctx.globalAlpha = 1;

    // Draw crosshair for most recent gaze point
    const latest = gazeHistory[gazeHistory.length - 1];
    if (latest) {
      const lx = latest.x * width;
      const ly = latest.y * height;
      const color = TARGET_COLORS[latest.target] || '#ffffff';

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lx, ly, 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(lx - 10, ly);
      ctx.lineTo(lx + 10, ly);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx, ly - 10);
      ctx.lineTo(lx, ly + 10);
      ctx.stroke();
    }
  }, [gazeHistory, width, height, radius]);

  return (
    <div className={className}>
      {/* Heatmap Canvas */}
      <div className="overflow-hidden rounded-lg border border-white/5 bg-black/30">
        <canvas
          ref={canvasRef}
          style={{ width, height }}
          className="block"
        />
      </div>

      {/* Gaze Distribution Bars */}
      <div className="mt-3 space-y-2">
        {Object.entries(stats).map(([target, pct]) => (
          <div key={target} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: TARGET_COLORS[target] }}
            />
            <span className="w-14 text-[10px] capitalize text-text-muted">{target}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: TARGET_COLORS[target] }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="w-8 text-right text-[10px] text-text-muted">{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EyeTrackingHeatmap;
