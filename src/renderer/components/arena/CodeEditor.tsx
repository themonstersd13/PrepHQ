// ============================================
// PrepHQ — Arena Code Editor
// Monaco Editor wrapper with language selection
// ============================================

import React, { useState, useCallback } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// Configure Monaco to use the local npm bundle instead of CDN
// This avoids CSP issues in Electron since no external scripts are loaded
loader.config({ monaco });

interface CodeEditorProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (lang: string) => void;
  onRunCode: () => void;
  runOutput: { stdout: string; stderr: string; exitCode: number } | null;
  isRunning: boolean;
  className?: string;
}

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onRunCode,
  runOutput,
  isRunning,
  className,
}) => {
  const [showOutput, setShowOutput] = useState(false);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      onCodeChange(value ?? '');
    },
    [onCodeChange],
  );

  return (
    <div className={clsx('flex flex-col', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <div className="flex items-center gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              onClick={() => onLanguageChange(lang.value)}
              className={clsx(
                'rounded-md px-2 py-1 text-[10px] font-medium transition-all',
                language === lang.value
                  ? 'bg-neon-blue/15 text-neon-blue'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowOutput(!showOutput)}
            className="rounded-md px-2 py-1 text-[10px] text-text-muted hover:text-text-secondary"
          >
            {showOutput ? '▼ Output' : '▶ Output'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRunCode}
            disabled={isRunning}
            className={clsx(
              'flex items-center gap-1 rounded-md px-3 py-1 text-[10px] font-medium transition-all',
              isRunning
                ? 'bg-white/5 text-text-muted'
                : 'bg-neon-green/15 text-neon-green hover:bg-neon-green/25',
            )}
          >
            {isRunning ? '⏳ Running…' : '▶ Run'}
          </motion.button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          loading={
            <div className="flex h-full items-center justify-center bg-black/30">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="mx-auto mb-2 h-6 w-6 rounded-full border-2 border-neon-blue/30 border-t-neon-blue"
                />
                <p className="text-xs text-text-muted">Loading editor…</p>
              </div>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            padding: { top: 12 },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 4,
            renderWhitespace: 'selection',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            contextmenu: true,
            folding: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Output Panel */}
      {showOutput && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 120 }}
          exit={{ height: 0 }}
          className="border-t border-white/5"
        >
          <div className="h-full overflow-y-auto bg-black/30 p-3">
            <p className="mb-1 text-[10px] font-medium uppercase text-text-muted">Output</p>
            {runOutput ? (
              <>
                {runOutput.stdout && (
                  <pre className="text-xs text-neon-green whitespace-pre-wrap">{runOutput.stdout}</pre>
                )}
                {runOutput.stderr && (
                  <pre className="text-xs text-neon-red whitespace-pre-wrap">{runOutput.stderr}</pre>
                )}
                <span className={clsx(
                  'mt-1 inline-block rounded px-1.5 py-0.5 text-[9px]',
                  runOutput.exitCode === 0
                    ? 'bg-neon-green/10 text-neon-green'
                    : 'bg-neon-red/10 text-neon-red',
                )}>
                  Exit code: {runOutput.exitCode}
                </span>
              </>
            ) : (
              <span className="text-xs text-text-muted">Run your code to see output</span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CodeEditor;
