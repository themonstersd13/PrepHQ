// ============================================
// PrepHQ — Excalidraw Whiteboard Component
// System design canvas with AI canvas watcher
// ============================================

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { GlassButton } from '../ui';

// Excalidraw is loaded dynamically to avoid SSR issues
let ExcalidrawComponent: any = null;
let exportToBlob: any = null;

interface WhiteboardProps {
  onSnapshot?: (imageBase64: string) => void;
  onElementSelect?: (elementId: string) => void;
  highlightedElements?: string[];
  className?: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({
  onSnapshot,
  onElementSelect,
  highlightedElements = [],
  className,
}) => {
  const excalidrawRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Excalidraw dynamically
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('@excalidraw/excalidraw');
        if (!mounted) return;
        ExcalidrawComponent = mod.Excalidraw;
        exportToBlob = mod.exportToBlob;
        setIsLoaded(true);
      } catch (err: any) {
        console.error('[Whiteboard] Failed to load Excalidraw:', err);
        setError('Failed to load whiteboard component');
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Capture canvas snapshot for AI analysis
  const handleCaptureSnapshot = useCallback(async () => {
    if (!excalidrawRef.current || !exportToBlob || !onSnapshot) return;
    setIsCapturing(true);
    try {
      const api = excalidrawRef.current;
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();

      if (elements.length === 0) {
        setIsCapturing(false);
        return;
      }

      const blob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: true,
          exportBackground: true,
        },
        files,
        getDimensions: () => ({ width: 800, height: 600, scale: 1 }),
      });

      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        onSnapshot(base64);
        setIsCapturing(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('[Whiteboard] Snapshot failed:', err);
      setIsCapturing(false);
    }
  }, [onSnapshot]);

  // Highlight elements referenced by AI
  useEffect(() => {
    if (!excalidrawRef.current || highlightedElements.length === 0) return;
    const api = excalidrawRef.current;
    const elements = api.getSceneElements();

    const updatedElements = elements.map((el: any) => {
      if (highlightedElements.includes(el.id)) {
        return { ...el, strokeColor: '#3b82f6', strokeWidth: 3 };
      }
      return el;
    });

    api.updateScene({ elements: updatedElements });
  }, [highlightedElements]);

  // Handle element selection for Canvas ↔ Chat sync
  const handleChange = useCallback(
    (elements: any[], appState: any) => {
      if (!onElementSelect) return;
      const selectedIds = appState.selectedElementIds || {};
      const selectedId = Object.keys(selectedIds).find((id) => selectedIds[id]);
      if (selectedId) {
        onElementSelect(selectedId);
      }
    },
    [onElementSelect],
  );

  if (error) {
    return (
      <div className={clsx('flex items-center justify-center', className)}>
        <div className="text-center">
          <span className="text-3xl">🎨</span>
          <p className="mt-2 text-sm text-neon-red">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={clsx('flex items-center justify-center', className)}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="h-8 w-8 rounded-full border-2 border-neon-blue/30 border-t-neon-blue"
        />
      </div>
    );
  }

  return (
    <div className={clsx('relative flex flex-col', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-primary">🎨 System Design Canvas</span>
        </div>
        <div className="flex items-center gap-2">
          {onSnapshot && (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={handleCaptureSnapshot}
              disabled={isCapturing}
            >
              {isCapturing ? '📸 Capturing…' : '📸 Send to AI'}
            </GlassButton>
          )}
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {ExcalidrawComponent && (
          <ExcalidrawComponent
            ref={(api: any) => { excalidrawRef.current = api; }}
            theme="dark"
            onChange={handleChange}
            UIOptions={{
              canvasActions: {
                export: false,
                loadScene: false,
                saveToActiveFile: false,
                toggleTheme: false,
                clearCanvas: true,
              },
              tools: { image: false },
            }}
            initialData={{
              appState: {
                viewBackgroundColor: '#0a0a0f',
                currentItemFontFamily: 1,
                gridSize: null,
              },
              elements: [],
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Whiteboard;
