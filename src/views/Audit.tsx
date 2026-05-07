import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeTenet } from '@/services/geminiService';
import { SATORReport, SATORLayer, LeakNote } from '@/types';
import { ClipboardCheck, AlertTriangle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LAYER_COLORS: Record<string, string> = {
  [SATORLayer.Strategy]: '#6366f1',
  [SATORLayer.Architecture]: '#8b5cf6',
  [SATORLayer.Tenet]: '#06b6d4',
  [SATORLayer.Output]: '#10b981',
  [SATORLayer.Rotation]: '#f59e0b',
};

const SEVERITY_COLORS = {
  low: 'var(--success)',
  medium: 'var(--warning)',
  high: '#f97316',
  critical: 'var(--danger)',
};

export function AuditView() {
  const [tenet, setTenet] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SATORReport | null>(null);
  const [error, setError] = useState('');

  const runAudit = async () => {
    if (!tenet.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await analyzeTenet(tenet);
      setReport(result);
    } catch (e) {
      setError('Audit failed. Check your API key and try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sator-audit-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!report) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('SATOR Audit Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Tenet: ${report.tenet}`, 20, 35);
    doc.text(`Overall Score: ${report.overallScore}/100`, 20, 45);
    doc.text(`Contract Compliance: ${report.contractCompliance ? 'YES' : 'NO'}`, 20, 55);
    doc.text(`Timestamp: ${new Date(report.timestamp).toLocaleString()}`, 20, 65);
    doc.setFontSize(11);
    doc.text('Summary:', 20, 80);
    const lines = doc.splitTextToSize(report.summary, 170);
    doc.text(lines, 20, 90);
    doc.text('Layer Scores:', 20, 115);
    let y = 125;
    Object.entries(report.layers).forEach(([layer, score]) => {
      doc.text(`  ${layer}: ${score}/100`, 20, y);
      y += 8;
    });
    if (report.leaks.length > 0) {
      doc.text('Detected Leaks:', 20, y + 5);
      y += 15;
      report.leaks.forEach((leak: LeakNote) => {
        doc.text(`  [${leak.severity.toUpperCase()}] ${leak.layer}: ${leak.description}`, 20, y);
        y += 8;
      });
    }
    doc.save(`sator-audit-${report.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          SATOR Audit Engine
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Analyze any business tenet through the 5 SATOR governance layers
        </p>
      </div>

      {/* Input */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Enter Business Tenet
        </label>
        <textarea
          value={tenet}
          onChange={e => setTenet(e.target.value)}
          placeholder="e.g. We grow revenue by prioritizing enterprise accounts over SMB..."
          className="w-full rounded-lg p-3 text-sm resize-none outline-none"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            minHeight: '100px',
          }}
        />
        <div className="flex gap-3">
          <button
            onClick={runAudit}
            disabled={loading || !tenet.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            {loading ? 'Analyzing…' : 'Run SATOR Audit'}
          </button>
          {error && <p className="text-xs self-center" style={{ color: 'var(--danger)' }}>{error}</p>}
        </div>
      </div>

      {/* Report */}
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header */}
            <div
              className="rounded-xl p-5 flex items-center justify-between"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {report.contractCompliance
                    ? <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                    : <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                  }
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Overall Score: {report.overallScore}/100 · Contract Compliance:{' '}
                    <span style={{ color: report.contractCompliance ? 'var(--success)' : 'var(--danger)' }}>
                      {report.contractCompliance ? 'PASS' : 'FAIL'}
                    </span>
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{report.summary}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                >
                  <Download className="w-3 h-3" /> JSON
                </button>
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                >
                  <Download className="w-3 h-3" /> PDF
                </button>
              </div>
            </div>

            {/* Layer scores */}
            <div
              className="rounded-xl p-5 space-y-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                Layer Scores
              </h2>
              {Object.entries(report.layers).map(([layer, score]) => (
                <div key={layer}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>{layer}</span>
                    <span>{score}/100</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: LAYER_COLORS[layer] || 'var(--accent)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Leaks */}
            {report.leaks.length > 0 && (
              <div
                className="rounded-xl p-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Detected Leaks ({report.leaks.length})
                </h2>
                <div className="space-y-3">
                  {report.leaks.map((leak, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-3"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderLeft: `3px solid ${SEVERITY_COLORS[leak.severity]}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{
                            background: SEVERITY_COLORS[leak.severity] + '20',
                            color: SEVERITY_COLORS[leak.severity],
                          }}
                        >
                          {leak.severity}
                        </span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {leak.layer}
                        </span>
                      </div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-primary)' }}>{leak.description}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        → {leak.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
