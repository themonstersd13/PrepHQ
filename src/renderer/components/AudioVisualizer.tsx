// ============================================
// PrepHQ — Audio Visualizer Component
// Canvas-based frequency visualizer reacting to voice
// ============================================

import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  /** Pass an active MediaStream to visualize */
  stream?: MediaStream | null;
  /** Bar count */
  bars?: number;
  /** Visualizer color (CSS color) */
  color?: string;
  /** Secondary color for gradient */
  secondaryColor?: string;
  /** Height of the canvas */
  height?: number;
  /** Style variant */
  variant?: 'bars' | 'wave';
  className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  stream,
  bars = 32,
  color = '#3b82f6',
  secondaryColor = '#8b5cf6',
  height = 60,
  variant = 'bars',
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const { width, height: h } = canvas;
    ctx.clearRect(0, 0, width, h);

    if (variant === 'bars') {
      const barWidth = width / bars;
      const step = Math.floor(dataArray.length / bars);

      for (let i = 0; i < bars; i++) {
        const value = dataArray[i * step] / 255;
        const barHeight = value * h * 0.9;

        // Gradient from primary to secondary color
        const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, secondaryColor);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(
          i * barWidth + 1,
          h - barHeight,
          barWidth - 2,
          barHeight,
          [2, 2, 0, 0],
        );
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = value * 8;
        ctx.shadowColor = color;
      }
      ctx.shadowBlur = 0;
    } else {
      // Wave variant
      ctx.beginPath();
      ctx.moveTo(0, h / 2);

      const sliceWidth = width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i] / 255;
        const y = (1 - value) * h * 0.4 + h * 0.3;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, h / 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fill beneath the wave
      ctx.lineTo(width, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [bars, color, secondaryColor, variant]);

  useEffect(() => {
    if (!stream) {
      // Draw idle state with minimal bars
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const { width, height: h } = canvas;
          ctx.clearRect(0, 0, width, h);
          const barWidth = width / bars;
          for (let i = 0; i < bars; i++) {
            const idleHeight = 2 + Math.random() * 3;
            ctx.fillStyle = color + '30';
            ctx.fillRect(i * barWidth + 1, h - idleHeight, barWidth - 2, idleHeight);
          }
        }
      }
      return;
    }

    try {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      animationRef.current = requestAnimationFrame(draw);
    } catch (err) {
      console.error('[AudioVisualizer] Setup failed:', err);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      audioCtxRef.current?.close();
      analyserRef.current = null;
      audioCtxRef.current = null;
    };
  }, [stream, draw, bars, color]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [height]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
        className="rounded-lg"
      />
    </motion.div>
  );
};

export default AudioVisualizer;
