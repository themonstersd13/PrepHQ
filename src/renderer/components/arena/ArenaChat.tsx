// ============================================
// PrepHQ — Arena Chat Panel
// AI Interviewer ↔ Candidate conversation
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { PersonaProfile, ArenaStage } from '../../../shared/types';

interface ChatMessage {
  role: 'interviewer' | 'candidate' | 'system';
  content: string;
  timestamp: number;
}

interface ArenaChatProps {
  messages: ChatMessage[];
  isAiThinking: boolean;
  persona: PersonaProfile;
  stage: ArenaStage;
  onSendMessage: (message: string) => void;
  className?: string;
}

const stageLabels: Record<ArenaStage, string> = {
  INTRO: '👋 Introduction',
  PROBLEM_STATEMENT: '📋 Problem Statement',
  CLARIFICATION: '❓ Clarification',
  DEEP_DIVE: '🔍 Deep Dive',
  WRAPUP: '🤝 Wrap-up',
};

const ArenaChat: React.FC<ArenaChatProps> = ({
  messages,
  isAiThinking,
  persona,
  stage,
  onSendMessage,
  className,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isAiThinking]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isAiThinking) return;
    onSendMessage(trimmed);
    setInput('');
    inputRef.current?.focus();
  }, [input, isAiThinking, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Speech-to-Text for voice input
  const toggleVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = input;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInput(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, input]);

  return (
    <div className={clsx('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-neon-purple/20 flex items-center justify-center text-base">
            🎙️
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{persona.name}</p>
            <p className="text-[11px] text-text-muted">{stageLabels[stage]}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                'flex',
                msg.role === 'candidate' && 'justify-end',
                msg.role === 'system' && 'justify-center',
              )}
            >
              {msg.role === 'system' ? (
                <div className="rounded-lg bg-white/5 px-4 py-2 text-xs text-text-muted">
                  {msg.content}
                </div>
              ) : (
                <div
                  className={clsx(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'interviewer'
                      ? 'rounded-bl-sm bg-surface-elevated text-text-primary'
                      : 'rounded-br-sm bg-neon-blue/15 text-text-primary',
                  )}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase text-text-muted">
                    {msg.role === 'interviewer' ? persona.name : 'You'}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI Thinking indicator */}
        {isAiThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex"
          >
            <div className="rounded-2xl rounded-bl-sm bg-surface-elevated px-4 py-2">
              <motion.div
                className="flex gap-1"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
                <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
                <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
              </motion.div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? '🎙️ Listening…' : 'Type your response… (Enter to send)'}
            rows={2}
            className={clsx(
              'flex-1 resize-none rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-neon-blue/30',
              isListening ? 'bg-neon-red/5 ring-1 ring-neon-red/30' : 'bg-white/5',
            )}
          />
          <div className="flex flex-col gap-1 self-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleVoiceInput}
              className={clsx(
                'rounded-xl px-3 py-2 text-xs font-medium transition-all',
                isListening
                  ? 'bg-neon-red/20 text-neon-red animate-pulse'
                  : 'bg-white/5 text-text-muted hover:bg-white/10',
              )}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              🎤
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || isAiThinking}
              className={clsx(
                'rounded-xl px-3 py-2 text-xs font-medium transition-all',
                input.trim() && !isAiThinking
                  ? 'bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30'
                  : 'bg-white/5 text-text-muted',
              )}
            >
              Send
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArenaChat;
