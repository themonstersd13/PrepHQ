// ============================================
// PrepHQ — PDF Report Generator
// Generates polished multi-page PDF session reports
// using @react-pdf/renderer
// ============================================

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import type { Session, TranscriptEntry } from '../../../shared/types';
import type { FillerAnalysis } from '../../services/filler-word-analyzer';
import type { KeywordDensityResult } from '../../services/content-auditor';

// ── Styles ──────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a2e',
    backgroundColor: '#fafafa',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #3b82f6',
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  titleAccent: {
    color: '#3b82f6',
  },
  subtitle: {
    fontSize: 11,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 16,
    marginBottom: 8,
    borderLeft: '3px solid #3b82f6',
    paddingLeft: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    borderRadius: 6,
    padding: 12,
    margin: 4,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  scoreLabel: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  gradeGood: { color: '#22c55e' },
  gradeFair: { color: '#eab308' },
  gradePoor: { color: '#ef4444' },
  fillerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderBottom: '1px solid #eee',
  },
  fillerLabel: { fontSize: 10, color: '#333' },
  fillerCount: { fontSize: 10, fontWeight: 'bold', color: '#ef4444' },
  keywordTag: {
    backgroundColor: '#e0e7ff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    margin: 2,
    fontSize: 8,
    color: '#3b5cf6',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  transcript: {
    marginVertical: 2,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderLeft: '2px solid #ddd',
  },
  transcriptSpeaker: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 1,
  },
  transcriptText: {
    fontSize: 9,
    color: '#333',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#999',
  },
  aiNote: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    borderLeft: '3px solid #22c55e',
  },
  aiNoteTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  aiNoteText: {
    fontSize: 9,
    color: '#333',
    lineHeight: 1.5,
  },
});

// ── Report Data Interface ──────────────────
export interface ReportData {
  session: Session;
  transcripts: TranscriptEntry[];
  fillerAnalysis?: FillerAnalysis | null;
  keywordData?: KeywordDensityResult | null;
  aiFeedback?: string;
  confidenceScore?: number;
  overallScore?: number;
}

// ── PDF Document Component ──────────────────
const SessionReport: React.FC<{ data: ReportData }> = ({ data }) => {
  const { session, transcripts, fillerAnalysis, keywordData, aiFeedback, confidenceScore, overallScore } = data;
  const date = new Date(session.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Document>
      {/* Page 1: Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Prep<Text style={styles.titleAccent}>HQ</Text> Session Report
          </Text>
          <Text style={styles.subtitle}>
            {session.mode === 'GHOST' ? '👻 Ghost Mode' : '⚔️ Arena Mode'} — {date}
          </Text>
        </View>

        {/* Score Cards */}
        <Text style={styles.sectionTitle}>Performance Summary</Text>
        <View style={styles.row}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreValue}>{session.scoreTechnical ?? overallScore ?? '—'}</Text>
            <Text style={styles.scoreLabel}>TECHNICAL</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreValue}>{session.scoreCommunication ?? '—'}</Text>
            <Text style={styles.scoreLabel}>COMMUNICATION</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreValue}>{confidenceScore ?? '—'}</Text>
            <Text style={styles.scoreLabel}>CONFIDENCE</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={[styles.scoreValue, fillerAnalysis?.grade === 'POOR' ? styles.gradePoor : fillerAnalysis?.grade === 'FAIR' ? styles.gradeFair : styles.gradeGood]}>
              {fillerAnalysis?.totalFillers ?? 0}
            </Text>
            <Text style={styles.scoreLabel}>FILLER WORDS</Text>
          </View>
        </View>

        {/* Filler Words Breakdown */}
        {fillerAnalysis && fillerAnalysis.fillers.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Filler Words Breakdown</Text>
            <View>
              {fillerAnalysis.fillers.slice(0, 8).map((f, i) => (
                <View key={i} style={styles.fillerRow}>
                  <Text style={styles.fillerLabel}>"{f.label}"</Text>
                  <Text style={styles.fillerCount}>{f.count}×</Text>
                </View>
              ))}
              <View style={[styles.fillerRow, { borderBottom: 'none', marginTop: 4 }]}>
                <Text style={[styles.fillerLabel, { fontWeight: 'bold' }]}>
                  Filler Ratio: {(fillerAnalysis.fillerRatio * 100).toFixed(1)}% — Grade: {fillerAnalysis.grade}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Keyword Coverage */}
        {keywordData && keywordData.totalHits > 0 && (
          <>
            <Text style={styles.sectionTitle}>Keyword Coverage ({keywordData.categoriesCovered}/7 categories)</Text>
            <View style={styles.tagRow}>
              {keywordData.topKeywords.slice(0, 20).map((kw, i) => (
                <Text key={i} style={styles.keywordTag}>
                  {kw.keyword} ×{kw.count}
                </Text>
              ))}
            </View>
          </>
        )}

        {/* AI Feedback */}
        {aiFeedback && (
          <View style={styles.aiNote}>
            <Text style={styles.aiNoteTitle}>🤖 AI Recommendations</Text>
            <Text style={styles.aiNoteText}>{aiFeedback}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>PrepHQ — Interview Intelligence Suite</Text>
          <Text>Page 1</Text>
        </View>
      </Page>

      {/* Page 2: Transcript Highlights */}
      {transcripts.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Transcript Highlights</Text>
          <Text style={{ fontSize: 8, color: '#888', marginBottom: 8 }}>
            Showing up to 40 entries from the session ({transcripts.length} total).
          </Text>
          {transcripts.slice(0, 40).map((t, i) => (
            <View key={i} style={styles.transcript}>
              <Text style={styles.transcriptSpeaker}>
                {t.speaker === 'USER' ? '🎤 You' : '🔊 Interviewer'} — {formatOffset(t.timestampOffset)}
              </Text>
              <Text style={styles.transcriptText}>{t.text}</Text>
            </View>
          ))}
          <View style={styles.footer}>
            <Text>PrepHQ — Interview Intelligence Suite</Text>
            <Text>Page 2</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

function formatOffset(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Generate a PDF blob from the report data.
 * Returns a Blob that can be downloaded.
 */
export async function generatePdfReport(data: ReportData): Promise<Blob> {
  const doc = <SessionReport data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

/**
 * Generate and trigger download of the PDF report.
 */
export async function downloadPdfReport(data: ReportData): Promise<void> {
  const blob = await generatePdfReport(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PrepHQ-Report-${data.session.mode}-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default SessionReport;
