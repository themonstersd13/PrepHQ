// ============================================
// PrepHQ — Analytics Dashboard Page
// Session history, charts, and report generation
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { GlassButton, Badge, GlassCard } from '../components/ui';
import { downloadPdfReport, type ReportData } from '../components/analytics/PdfReport';
import EyeTrackingHeatmap from '../components/analytics/EyeTrackingHeatmap';
import type { Session, GazePoint } from '../../shared/types';

interface AnalyticsPageProps {
  onBack: () => void;
}

// Sample data generators (will be replaced with real data from DB)
const generateConfidenceData = () =>
  Array.from({ length: 10 }, (_, i) => ({
    time: `${i * 5}m`,
    confidence: 50 + Math.random() * 40,
    stress: 20 + Math.random() * 30,
  }));

const generateTopicData = () => [
  { subject: 'Data Structures', score: 75 },
  { subject: 'Algorithms', score: 85 },
  { subject: 'System Design', score: 60 },
  { subject: 'Communication', score: 90 },
  { subject: 'Problem Solving', score: 80 },
  { subject: 'Code Quality', score: 70 },
];

const generateFillerData = () => [
  { name: 'Um', count: 12 },
  { name: 'Uh', count: 8 },
  { name: 'Like', count: 15 },
  { name: 'You know', count: 5 },
  { name: 'So', count: 10 },
];

const NEON_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#ef4444', '#eab308'];

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onBack }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [view, setView] = useState<'history' | 'dashboard'>('history');
  const [confidenceData] = useState(generateConfidenceData);
  const [topicData] = useState(generateTopicData);
  const [fillerData] = useState(generateFillerData);
  const [isExporting, setIsExporting] = useState(false);

  // Load sessions
  useEffect(() => {
    window.api.getSessions().then(setSessions).catch(console.error);
  }, []);

  const handleViewSession = useCallback((session: Session) => {
    setSelectedSession(session);
    setView('dashboard');
  }, []);

  const handleDeleteSession = useCallback(async (id: string) => {
    try {
      await window.api.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('[Analytics] Delete failed:', err);
    }
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (!selectedSession) return;
    setIsExporting(true);
    try {
      const reportData: ReportData = {
        session: selectedSession,
        transcripts: [],
        fillerAnalysis: {
          fillers: fillerData.map((f) => ({ label: f.name, count: f.count })),
          totalFillers: fillerData.reduce((s, f) => s + f.count, 0),
          totalWords: 500,
          fillerRatio: fillerData.reduce((s, f) => s + f.count, 0) / 500,
          grade: 'FAIR',
        },
        confidenceScore: 72,
        overallScore: selectedSession.scoreTechnical ?? 78,
        aiFeedback: 'Good technical depth. Focus on reducing filler words and maintaining eye contact with the camera. Consider structuring answers with the STAR method for behavioral questions.',
      };
      await downloadPdfReport(reportData);
    } catch (err) {
      console.error('[Analytics] PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [selectedSession, fillerData]);

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar */}
      <div className="glass-subtle flex items-center justify-between border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <GlassButton variant="ghost" size="sm" onClick={view === 'dashboard' ? () => setView('history') : onBack}>
            ← {view === 'dashboard' ? 'Session List' : 'Home'}
          </GlassButton>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-sm font-medium text-text-primary">📊 Analytics</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {view === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SessionHistory
                sessions={sessions}
                onView={handleViewSession}
                onDelete={handleDeleteSession}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard
                session={selectedSession}
                confidenceData={confidenceData}
                topicData={topicData}
                fillerData={fillerData}
                onExportPdf={handleExportPdf}
                isExporting={isExporting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Session History ────────────────────────────
interface SessionHistoryProps {
  sessions: Session[];
  onView: (session: Session) => void;
  onDelete: (id: string) => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions, onView, onDelete }) => (
  <div className="mx-auto max-w-4xl">
    <h2 className="mb-6 text-2xl font-bold text-text-primary">Session History</h2>

    {sessions.length === 0 ? (
      <div className="glass rounded-2xl p-14 text-center">
        <span className="text-5xl">📭</span>
        <h3 className="mt-4 text-lg font-semibold text-text-primary">No sessions yet</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Start a Ghost or Arena session to see your analytics here.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass flex items-center justify-between rounded-xl px-6 py-5 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{session.mode === 'GHOST' ? '👻' : '⚔️'}</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {session.mode === 'GHOST' ? 'Ghost Session' : 'Arena Session'}
                </p>
                <p className="text-xs text-text-muted">
                  {new Date(session.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {session.scoreTechnical !== undefined && (
                <Badge variant="info">
                  Tech: {session.scoreTechnical}
                </Badge>
              )}
              {session.scoreCommunication !== undefined && (
                <Badge variant="success">
                  Comm: {session.scoreCommunication}
                </Badge>
              )}
              <GlassButton variant="primary" size="sm" onClick={() => onView(session)}>
                📊 View
              </GlassButton>
              <GlassButton variant="danger" size="sm" onClick={() => onDelete(session.id)}>
                ✕
              </GlassButton>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

// ── Dashboard ────────────────────────────────
interface DashboardProps {
  session: Session | null;
  confidenceData: { time: string; confidence: number; stress: number }[];
  topicData: { subject: string; score: number }[];
  fillerData: { name: string; count: number }[];
  gazeHistory?: GazePoint[];
  onExportPdf?: () => void;
  isExporting?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  session,
  confidenceData,
  topicData,
  fillerData,
  gazeHistory = [],
  onExportPdf,
  isExporting,
}) => (
  <div className="mx-auto max-w-6xl space-y-8">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Session Analytics</h2>
        {session && (
          <p className="mt-1 text-sm text-text-muted">
            {session.mode === 'GHOST' ? '👻 Ghost' : '⚔️ Arena'} • {new Date(session.timestamp).toLocaleString()}
          </p>
        )}
      </div>
      {onExportPdf && (
        <GlassButton
          variant="primary"
          size="md"
          onClick={onExportPdf}
          disabled={isExporting}
        >
          {isExporting ? '⏳ Generating…' : '📄 Export PDF Report'}
        </GlassButton>
      )}
    </div>

    {/* Score Cards */}
    <div className="grid grid-cols-4 gap-6">
      {[
        { label: 'Technical', value: session?.scoreTechnical ?? 78, color: 'neon-blue', icon: '🧮' },
        { label: 'Communication', value: session?.scoreCommunication ?? 85, color: 'neon-green', icon: '💬' },
        { label: 'Confidence', value: 72, color: 'neon-purple', icon: '💪' },
        { label: 'Filler Words', value: fillerData.reduce((s, d) => s + d.count, 0), color: 'neon-red', icon: '🗣️' },
      ].map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <GlassCard className="p-6 text-center" hover>
            <span className="text-3xl">{card.icon}</span>
            <p className={`mt-3 text-3xl font-bold text-${card.color}`}>
              {card.value}{card.label !== 'Filler Words' ? '/100' : ''}
            </p>
            <p className="mt-1.5 text-xs text-text-muted">{card.label}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>

    {/* Charts Row 1 */}
    <div className="grid grid-cols-2 gap-6">
      {/* Confidence Over Time */}
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Confidence Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={confidenceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: '#777', fontSize: 10 }} />
            <YAxis tick={{ fill: '#777', fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,15,25,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="stress"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
            />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Topic Coverage Radar */}
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Topic Coverage</h3>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={topicData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#777', fontSize: 9 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#555' }} />
            <Radar
              dataKey="score"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>

    {/* Charts Row 2 */}
    <div className="grid grid-cols-2 gap-6">
      {/* Filler Words Bar Chart */}
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Filler Words Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={fillerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#777', fontSize: 10 }} />
            <YAxis tick={{ fill: '#777', fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,15,25,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {fillerData.map((_, index) => (
                <Cell key={index} fill={NEON_COLORS[index % NEON_COLORS.length]} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Eye Gaze Heatmap */}
      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Eye Gaze Heatmap</h3>
        <EyeTrackingHeatmap gazeHistory={gazeHistory} width={400} height={200} />
      </GlassCard>
    </div>
  </div>
);

export default AnalyticsPage;
