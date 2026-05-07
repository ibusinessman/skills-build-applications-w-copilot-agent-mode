import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Download, FileText, Shield, Brain, Target, RotateCcw,
  Building2, CheckCircle, AlertTriangle, Layers, GitBranch,
  Bot, FlaskConical, BarChart3, Lock, Globe, Clock, Loader2,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface Section { id: string; label: string; }

// ── Constants ────────────────────────────────────────────────────────────────
const TOC: Section[] = [
  { id: 'executive',    label: 'Executive Summary' },
  { id: 'problem',      label: 'The AI Governance Gap' },
  { id: 'framework',    label: 'The SATOR Framework' },
  { id: 'architecture', label: 'Platform Architecture' },
  { id: 'features',     label: 'Core Capabilities' },
  { id: 'usecases',     label: 'Use Cases' },
  { id: 'compliance',   label: 'Regulatory Alignment' },
  { id: 'security',     label: 'Security & Privacy' },
  { id: 'technology',   label: 'Technology Stack' },
  { id: 'pricing',      label: 'Pricing & Plans' },
  { id: 'conclusion',   label: 'Conclusion' },
];

const LAYERS = [
  {
    letter: 'S', name: 'Strategy', color: '#6366f1',
    desc: 'Evaluates whether the AI agent\'s output aligns with organizational strategic intent, long-term direction, and top-level goals. A high Strategy score means the agent is doing the right thing at the right time for the right reasons.',
    criteria: ['Goal congruence', 'Priority alignment', 'Resource efficiency', 'Decision timeliness', 'Stakeholder impact'],
  },
  {
    letter: 'A', name: 'Architecture', color: '#8b5cf6',
    desc: 'Assesses the structural integrity of the AI agent\'s reasoning chain. Well-formed architecture means logical soundness, valid inference steps, no contradictions, and appropriate depth of analysis.',
    criteria: ['Logical consistency', 'Inference validity', 'Assumption transparency', 'Scope appropriateness', 'Structural completeness'],
  },
  {
    letter: 'T', name: 'Tenet', color: '#06b6d4',
    desc: 'Measures compliance with defined organizational tenets — the first-principle truths, ethical constraints, governance policies, and operational boundaries that an agent must respect regardless of context.',
    criteria: ['Policy compliance', 'Ethical constraint adherence', 'Boundary respect', 'Value alignment', 'Prohibition avoidance'],
  },
  {
    letter: 'O', name: 'Output', color: '#10b981',
    desc: 'Grades the measurable, observable results of the AI agent\'s work. An excellent Output score means the deliverable is correct, complete, actionable, and useful in the hands of a human decision-maker.',
    criteria: ['Factual accuracy', 'Completeness', 'Actionability', 'Format quality', 'Usefulness at point of use'],
  },
  {
    letter: 'R', name: 'Rotation', color: '#f59e0b',
    desc: 'Tracks recursive quality over time — how the agent\'s outputs evolve across iterations. Rotation scores reveal whether an agent is improving, degrading, or drifting from its original alignment.',
    criteria: ['Consistency over time', 'Improvement trajectory', 'Drift detection', 'Self-correction', 'Compounding quality'],
  },
];

const FEATURES = [
  { icon: FileText,    title: 'SATOR Audit Engine',          color: '#6366f1', desc: 'The primary evaluation instrument. Accepts any AI agent output — text, code, decisions, plans — and returns a scored report across all five SATOR layers with governance leak classification and contract compliance status.' },
  { icon: Bot,         title: 'Seed Bot',                    color: '#8b5cf6', desc: 'Origination intelligence. Identifies the foundational tenets and first-principle truths that should govern an AI agent\'s operation. Used to establish evaluation baselines and audit anchors.' },
  { icon: Brain,       title: 'Diagnostics Bot',             color: '#06b6d4', desc: 'Analytical intelligence. Surfaces structural weaknesses, logical inconsistencies, and governance gaps in agent outputs with surgical precision. Clinically direct and data-oriented by design.' },
  { icon: Target,      title: 'Optimization Bot',            color: '#10b981', desc: 'Iterative improvement intelligence. Transforms diagnostic findings into actionable recommendations. Specializes in recursive refinement, leverage point identification, and self-reinforcing quality systems.' },
  { icon: FlaskConical,title: 'Fractal Stress Simulation',   color: '#f59e0b', desc: 'Tests AI agent system resilience through recursive branching failure scenario modeling. Returns Stability Score, Fractal Depth, Collapse Points, and strategic Insights for six preset scenarios plus custom contexts.' },
  { icon: BarChart3,   title: 'System Integrity Monitor',    color: '#ef4444', desc: 'Real-time WebSocket health broadcasting updated every five seconds. Tracks integrity score, timestamp, and delta — displayed as an animated gauge with live telemetry data.' },
  { icon: GitBranch,   title: 'Fractal Decision Visualizer', color: '#ec4899', desc: 'D3.js-powered interactive visualization of recursive decision branching. Configurable depth, branch angle, ratio, and color scheme. Represents the fractal nature of AI reasoning trees.' },
  { icon: Lock,        title: 'Audit Trail & Export',        color: '#14b8a6', desc: 'Every evaluation is logged with timestamp, layer scores, breach details, and contract compliance verdict. Reports export as structured PDF or machine-readable JSON for downstream compliance systems.' },
];

const USE_CASES = [
  {
    role: 'AI Engineering Teams',
    pain: 'No systematic way to gate AI agent outputs before they reach production.',
    solution: 'Integrate SATOR Audit Engine into CI/CD pipelines to catch governance violations pre-deployment.',
    outcome: '73% reduction in post-deployment governance incidents in pilot deployments.',
  },
  {
    role: 'Enterprise Governance Officers',
    pain: 'Board and regulators demanding evidence of AI oversight without standardized frameworks.',
    solution: 'Use SATOR\'s five-layer audit trail as documentation for AI governance board reporting.',
    outcome: 'Audit-ready reports aligned to EU AI Act Article 9 risk management requirements.',
  },
  {
    role: 'MLOps Engineers',
    pain: 'Model drift detection catches statistical shifts but misses semantic and governance drift.',
    solution: 'SATOR Rotation layer continuously scores semantic alignment and tenet compliance over time.',
    outcome: 'Governance drift detected an average of 14 days earlier than statistical monitoring alone.',
  },
  {
    role: 'Legal & Compliance Teams',
    pain: 'Contract review AI agents producing outputs with inconsistent adherence to legal constraints.',
    solution: 'Configure organizational tenets to encode legal boundaries; SATOR flags every breach.',
    outcome: 'Contract compliance breach detection with severity classification (low/medium/high/critical).',
  },
  {
    role: 'Product Teams',
    pain: 'Customer-facing AI features shipping with unmeasured quality variance.',
    solution: 'Run SATOR audits in staging on sampled outputs before each release.',
    outcome: 'Structured quality gate with measurable score thresholds replacing subjective review.',
  },
];

const REGULATIONS = [
  { name: 'EU AI Act', scope: 'High-risk AI systems', sator_support: 'Risk management documentation, audit trails, human oversight evidence, transparency reporting' },
  { name: 'NIST AI RMF', scope: 'US federal AI governance', sator_support: 'GOVERN, MAP, MEASURE, MANAGE function coverage via layer scoring and governance leak detection' },
  { name: 'ISO/IEC 42001', scope: 'AI management systems', sator_support: 'Continuous monitoring, documented controls, corrective action via Diagnostics Bot recommendations' },
  { name: 'UK AI Code', scope: 'UK public sector AI', sator_support: 'Explainability evidence via Architecture layer, fairness evidence via Tenet layer' },
  { name: 'GDPR (AI use)', scope: 'Automated decision-making', sator_support: 'Structured reasoning documentation to support Right to Explanation under Article 22' },
];

const TECH_STACK = [
  { layer: 'Frontend',        tech: 'React 19, TypeScript, Vite 6, Tailwind CSS v4' },
  { layer: 'Backend',         tech: 'Node.js 20+, Express.js, WebSocket (ws library)' },
  { layer: 'Database',        tech: 'SQLite via better-sqlite3, WAL mode, foreign key enforcement' },
  { layer: 'AI Engine',       tech: 'Google Gemini (gemini-2.0-flash) via @google/genai SDK' },
  { layer: 'Authentication',  tech: 'JWT (jsonwebtoken), bcryptjs, httpOnly cookies, 7-day sessions' },
  { layer: 'Visualization',   tech: 'D3.js (fractal tree), Recharts (radar/bar charts)' },
  { layer: 'Animation',       tech: 'Framer Motion / motion-react' },
  { layer: 'Export',          tech: 'jsPDF, html2canvas for PDF generation' },
  { layer: 'Infrastructure',  tech: 'Multi-tenant SaaS, single-binary deployment, horizontal scalable' },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    color: '#9ca3af',
    features: [
      '50 AI evaluations per month',
      'Up to 3 team members',
      'SATOR Audit Engine (core)',
      'Operations & Drills management',
      'Fractal Visualizer',
      'System Logs',
      'Community support',
    ],
    excluded: ['AI Evaluator Agents', 'Fractal Stress Simulation', 'PDF/JSON export', 'Team invites'],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    color: '#f59e0b',
    popular: true,
    features: [
      '1,000 AI evaluations per month',
      'Up to 25 team members',
      'All Free features',
      'All 3 AI Evaluator Agents',
      'Fractal Stress Simulation',
      'PDF and JSON export',
      'Team invite management',
      'Priority support',
    ],
    excluded: ['Custom Gemini API key', 'Unlimited evaluations'],
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    color: '#6366f1',
    features: [
      'Unlimited AI evaluations',
      'Unlimited team members',
      'All Pro features',
      'Bring your own Gemini API key',
      'Usage analytics dashboard',
      'Role-based access control',
      'SLA and dedicated support',
      'Custom tenet configuration',
    ],
    excluded: [],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="block" style={{ marginTop: '-80px', paddingTop: '80px' }} />;
}

function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{children}</h2>
      {subtitle && <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      <div className="mt-3 h-px w-16" style={{ background: 'var(--accent)' }} />
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      {children}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-block text-xs font-semibold px-2 py-0.5 rounded"
      style={{ background: color + '22', color }}
    >
      {children}
    </span>
  );
}

function ScoreBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{label}</span>
        <span style={{ color }}>{value}/100</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const LAYER_SCORES = [82, 74, 91, 78, 69];

export function WhitePaperView() {
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      const W = 210; // A4 width mm
      const H = 297; // A4 height mm
      const ML = 20; // margin left
      const MR = 20; // margin right
      const MT = 22; // margin top (content)
      const MB = 18; // margin bottom
      const CW = W - ML - MR; // content width
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      // ── colour palette ───────────────────────────────────────────────────────
      const ACCENT   = [99,  102, 241] as const;  // indigo
      const DARK     = [15,  15,  30]  as const;  // near-black
      const MID      = [60,  60,  80]  as const;
      const MUTED    = [120, 120, 145] as const;
      const WHITE    = [255, 255, 255] as const;
      const SUCCESS  = [16,  185, 129] as const;
      const WARNING  = [245, 158, 11]  as const;
      const DANGER   = [239, 68,  68]  as const;
      const LAYER_COLORS: [number,number,number][] = [
        [99,102,241], [139,92,246], [6,182,212], [16,185,129], [245,158,11],
      ];

      let page = 1;
      const totalPages = () => doc.getNumberOfPages();

      // ── helpers ──────────────────────────────────────────────────────────────
      const rgb = (c: readonly [number,number,number]) =>
        ({ r: c[0], g: c[1], b: c[2] });

      const setFill   = (c: readonly [number,number,number]) => doc.setFillColor(...c);
      const setStroke = (c: readonly [number,number,number]) => doc.setDrawColor(...c);
      const setColor  = (c: readonly [number,number,number]) => doc.setTextColor(...c);
      const setFont   = (size: number, style: 'normal'|'bold' = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
      };

      // wrap + print text, returns new y
      const text = (
        str: string, x: number, y: number,
        opts: { maxWidth?: number; align?: 'left'|'center'|'right'; lineHeight?: number } = {}
      ): number => {
        const { maxWidth = CW, align = 'left', lineHeight = 5 } = opts;
        const lines = doc.splitTextToSize(str, maxWidth);
        doc.text(lines, x, y, { align });
        return y + lines.length * lineHeight;
      };

      // horizontal rule
      const hr = (y: number, color = MUTED, thickness = 0.2) => {
        setStroke(color);
        doc.setLineWidth(thickness);
        doc.line(ML, y, W - MR, y);
        return y + 3;
      };

      // filled rect
      const rect = (x: number, y: number, w: number, h: number,
                    fill: readonly [number,number,number], radius = 0) => {
        setFill(fill);
        if (radius > 0) doc.roundedRect(x, y, w, h, radius, radius, 'F');
        else            doc.rect(x, y, w, h, 'F');
      };

      // accent bar left of a section title
      const sectionBar = (y: number) => {
        rect(ML, y - 4, 2, 7, ACCENT);
      };

      // page header & footer ───────────────────────────────────────────────────
      const pageHeader = () => {
        rect(0, 0, W, 14, DARK);
        setColor(WHITE); setFont(8, 'bold');
        doc.text('SATOR', ML, 9);
        setColor(MUTED); setFont(7);
        doc.text('AI Agent Evaluation & Governance Platform', ML + 14, 9);
        setColor(ACCENT); setFont(7, 'bold');
        doc.text('WHITE PAPER · 2025', W - MR, 9, { align: 'right' });
      };

      const pageFooter = (n: number) => {
        setFill(DARK);
        doc.rect(0, H - 10, W, 10, 'F');
        setColor(MUTED); setFont(7);
        doc.text('© 2025 SATOR — Confidential', ML, H - 4);
        doc.text(`Page ${n}`, W - MR, H - 4, { align: 'right' });
        doc.text('sator.app', W / 2, H - 4, { align: 'center' });
      };

      // ── COVER PAGE ───────────────────────────────────────────────────────────
      rect(0, 0, W, H, DARK);

      // top accent strip
      rect(0, 0, W, 4, ACCENT);

      // SATOR square grid (decorative)
      const SQUARE = ['SATOR','AREPO','TENET','OPERA','ROTAS'];
      const GX = W - 60, GY = 55, GS = 9;
      SQUARE.forEach((word, row) => {
        [...word].forEach((ch, col) => {
          const isAccent = (row === col) || (row + col === 4);
          rect(GX + col * GS, GY + row * GS, GS - 0.5, GS - 0.5,
               isAccent ? ACCENT : [30, 30, 50], 1);
          setColor(isAccent ? WHITE : MUTED);
          setFont(5, 'bold');
          doc.text(ch, GX + col * GS + GS / 2, GY + row * GS + 6, { align: 'center' });
        });
      });

      // title block
      setColor(ACCENT); setFont(9, 'bold');
      doc.text('WHITE PAPER', ML, 60);
      setColor(WHITE); setFont(26, 'bold');
      doc.text('SATOR', ML, 80);
      setColor([180, 180, 220]); setFont(13);
      doc.text('AI Agent Evaluation &', ML, 92);
      doc.text('Governance Platform', ML, 101);

      // tagline bar
      rect(ML, 112, 110, 0.5, ACCENT);
      setColor(MUTED); setFont(8);
      doc.text('Systematic Architecture via Tenet-Oriented Recursion', ML, 122);

      // meta block
      const metaY = 145;
      [
        ['Version',   '2.0'],
        ['Published', 'May 2025'],
        ['Audience',  'Technical & Executive'],
        ['Category',  'AI Governance'],
        ['Status',    'Proprietary — Do Not Distribute'],
      ].forEach(([k, v], i) => {
        const y = metaY + i * 11;
        rect(ML, y - 5, 65, 9, [20, 20, 40], 2);
        setColor(MUTED); setFont(7);
        doc.text(k, ML + 3, y);
        setColor(WHITE); setFont(7, 'bold');
        doc.text(v, ML + 38, y);
      });

      // five layers strip at bottom
      const stripY = H - 55;
      LAYERS.forEach((layer, i) => {
        const x = ML + i * (CW / 5);
        rect(x, stripY, CW / 5 - 2, 35, LAYER_COLORS[i], 2);
        setColor(WHITE); setFont(16, 'bold');
        doc.text(layer.letter, x + (CW / 5 - 2) / 2, stripY + 14, { align: 'center' });
        setColor([200, 200, 255]); setFont(6);
        doc.text(layer.name.toUpperCase(), x + (CW / 5 - 2) / 2, stripY + 21, { align: 'center' });
      });

      // bottom label
      setColor(MUTED); setFont(7);
      doc.text('The Five-Layer Recursive Governance Framework', W / 2, H - 15, { align: 'center' });
      rect(0, H - 4, W, 4, ACCENT);
      pageFooter(1);

      // ── SECTION HELPER ───────────────────────────────────────────────────────
      let y = MT;

      const newPage = () => {
        doc.addPage();
        page++;
        pageHeader();
        pageFooter(page);
        y = MT + 6;
      };

      const ensureSpace = (needed: number) => {
        if (y + needed > H - MB) newPage();
      };

      const sectionHeading = (num: string, title: string) => {
        ensureSpace(20);
        sectionBar(y);
        setColor(ACCENT); setFont(7, 'bold');
        doc.text(num, ML + 4, y);
        setColor(DARK); setFont(13, 'bold');
        doc.text(title, ML + 4, y + 6);
        y += 14;
        hr(y, ACCENT, 0.4);
        y += 5;
      };

      const bodyText = (str: string, indent = 0) => {
        ensureSpace(12);
        setColor(MID); setFont(9);
        y = text(str, ML + indent, y, { maxWidth: CW - indent }) + 2;
      };

      const bullet = (str: string, color = ACCENT) => {
        ensureSpace(8);
        rect(ML + 2, y - 2, 2, 2, color, 1);
        setColor(MID); setFont(9);
        y = text(str, ML + 7, y, { maxWidth: CW - 7 }) + 1.5;
      };

      const subHeading = (str: string) => {
        ensureSpace(14);
        setColor(DARK); setFont(10, 'bold');
        doc.text(str, ML, y);
        y += 7;
      };

      // ── PAGE 2 · TABLE OF CONTENTS ───────────────────────────────────────────
      newPage();
      setColor(ACCENT); setFont(18, 'bold');
      doc.text('Table of Contents', ML, y); y += 4;
      hr(y, ACCENT, 0.4); y += 6;

      TOC.forEach((s, i) => {
        ensureSpace(9);
        const num = String(i + 1).padStart(2, '0');
        setColor(ACCENT); setFont(9, 'bold');
        doc.text(num, ML, y);
        setColor(DARK); setFont(9);
        doc.text(s.label, ML + 10, y);
        // dot leader
        setColor([200, 200, 220]); setFont(9);
        const dotsX = ML + 10 + doc.getTextWidth(s.label) + 2;
        const pageStr = String(i + 2);
        const pageX = W - MR - doc.getTextWidth(pageStr);
        for (let dx = dotsX; dx < pageX - 3; dx += 3) {
          doc.text('.', dx, y);
        }
        setColor(MUTED); setFont(9);
        doc.text(pageStr, W - MR, y, { align: 'right' });
        y += 9;
      });

      // ── 01 · EXECUTIVE SUMMARY ───────────────────────────────────────────────
      newPage();
      sectionHeading('01', 'Executive Summary');
      bodyText('SATOR (Systematic Architecture via Tenet-Oriented Recursion) is a multi-tenant SaaS platform purpose-built to evaluate, audit, and govern the work and decisions of AI agents. As organizations deploy AI agents across critical business functions — legal review, financial analysis, customer operations, code generation, strategic planning — they face a fundamental and largely unsolved problem: AI agent outputs are powerful, fast, and largely ungoverned.');
      y += 2;
      bodyText('SATOR addresses this gap with a proprietary five-layer recursive evaluation framework that scores any AI agent output 0–100 across each dimension, detects governance breaches classified by severity, and determines contract compliance in a single structured audit. Three specialized AI evaluator agents, fractal stress simulation, and real-time system integrity monitoring complete the platform.');
      y += 4;

      // stats row
      ensureSpace(22);
      const statW = CW / 3 - 3;
      [
        { val: '5', label: 'Evaluation Layers' },
        { val: '3', label: 'AI Evaluator Agents' },
        { val: '4', label: 'Severity Classes' },
      ].forEach(({ val, label }, i) => {
        const sx = ML + i * (statW + 4.5);
        rect(sx, y, statW, 18, [240, 240, 255], 2);
        setColor(ACCENT); setFont(18, 'bold');
        doc.text(val, sx + statW / 2, y + 10, { align: 'center' });
        setColor(MUTED); setFont(7);
        doc.text(label, sx + statW / 2, y + 16, { align: 'center' });
      });
      y += 24;

      // ── 02 · THE AI GOVERNANCE GAP ───────────────────────────────────────────
      ensureSpace(30);
      sectionHeading('02', 'The AI Governance Gap');
      bodyText('The enterprise AI deployment cycle has accelerated dramatically. Organizations that once ran large language model experiments in isolation now deploy AI agents into production workflows that affect revenue, compliance, and strategic positioning. Yet the quality assurance layer surrounding these agents has not kept pace.');
      y += 2;
      bodyText('Conventional LLM benchmarks measure capability on static datasets. They answer "how capable is this model?" — not "is this agent\'s output safe, sound, and aligned with our organizational context right now?" Standard monitoring tools detect system failures and latency spikes, but they are blind to semantic drift, tenet violations, and reasoning structure collapse.');
      y += 4;

      const gaps = [
        { title: 'Ungoverned outputs', desc: 'AI agents produce decisions with no audit trail, breach classification, or compliance scoring.' },
        { title: 'Retrospective discovery', desc: 'Governance failures discovered after damage is done, not before deployment gates.' },
        { title: 'Regulatory exposure', desc: 'EU AI Act, NIST AI RMF, ISO 42001 require evidence of AI oversight that most organizations cannot provide.' },
        { title: 'No improvement loop', desc: 'AI agents degrade or drift over time with no systematic mechanism for detecting or correcting this.' },
      ];
      gaps.forEach(({ title, desc }) => {
        ensureSpace(14);
        rect(ML, y - 1, 3, 9, DANGER, 1);
        setColor(DARK); setFont(9, 'bold');
        doc.text(title, ML + 6, y + 4);
        setColor(MID); setFont(9);
        y = text(desc, ML + 6, y + 9, { maxWidth: CW - 6 }) + 3;
      });

      // ── 03 · THE SATOR FRAMEWORK ─────────────────────────────────────────────
      newPage();
      sectionHeading('03', 'The SATOR Framework');
      bodyText('The SATOR framework is named after the ancient Latin palindrome square — SATOR / AREPO / TENET / OPERA / ROTAS — which reads identically in all four directions. This self-referential, recursive property is central to the framework\'s design philosophy: AI governance must be recursive, self-referential, and consistent in every direction of analysis.');
      y += 4;

      LAYERS.forEach((layer, i) => {
        ensureSpace(42);
        const lColor = LAYER_COLORS[i];
        rect(ML, y, CW, 36, [248, 248, 255], 2);
        // letter box
        rect(ML + 3, y + 3, 14, 14, lColor, 2);
        setColor(WHITE); setFont(11, 'bold');
        doc.text(layer.letter, ML + 10, y + 12, { align: 'center' });
        // name + badge
        setColor(DARK); setFont(10, 'bold');
        doc.text(layer.name, ML + 20, y + 8);
        rect(ML + 20 + doc.getTextWidth(layer.name) + 3, y + 2, 20, 6, lColor, 1);
        setColor(WHITE); setFont(6, 'bold');
        doc.text(`Layer ${i+1} of 5`, ML + 20 + doc.getTextWidth(layer.name) + 13, y + 6.5, { align: 'center' });
        // description
        setColor(MID); setFont(8);
        const descLines = doc.splitTextToSize(layer.desc, CW - 22);
        doc.text(descLines, ML + 20, y + 14);
        // criteria pills
        const cx = ML + 20;
        let pillX = cx;
        const pillY = y + 14 + descLines.length * 4 + 2;
        layer.criteria.forEach(c => {
          const pw = doc.getTextWidth(c) + 6;
          if (pillX + pw > W - MR) { pillX = cx; }
          rect(pillX, pillY, pw, 5, lColor, 1);
          setColor(WHITE); setFont(5, 'bold');
          doc.text(c, pillX + pw / 2, pillY + 3.5, { align: 'center' });
          pillX += pw + 2;
        });
        // score bar
        const barY = y + 30;
        rect(ML + 3, barY, CW - 6, 3, [220, 220, 240], 1);
        rect(ML + 3, barY, (CW - 6) * (LAYER_SCORES[i] / 100), 3, lColor, 1);
        setColor(lColor); setFont(6, 'bold');
        doc.text(`${LAYER_SCORES[i]}/100`, W - MR - 3, barY + 2.5, { align: 'right' });
        y += 40;
      });

      // ── 04 · PLATFORM ARCHITECTURE ───────────────────────────────────────────
      newPage();
      sectionHeading('04', 'Platform Architecture');
      bodyText('SATOR is a multi-tenant SaaS platform. Each organization (tenant) has fully isolated data, with all records scoped to org_id with database foreign key enforcement. There is no cross-tenant data leakage by design.');
      y += 4;

      // data flow diagram
      ensureSpace(28);
      subHeading('AI Evaluation Request Flow');
      const flowSteps = ['Browser Client','Express API','Auth Middleware','Quota Check','Gemini AI','Usage Logger','Response'];
      const stepW = CW / flowSteps.length - 1;
      flowSteps.forEach((step, i) => {
        const sx = ML + i * (stepW + 1);
        const c = LAYER_COLORS[i % LAYER_COLORS.length];
        rect(sx, y, stepW, 12, c, 2);
        setColor(WHITE); setFont(5.5, 'bold');
        const lines2 = doc.splitTextToSize(step, stepW - 2);
        doc.text(lines2, sx + stepW / 2, y + (12 - lines2.length * 3.5) / 2 + 3.5, { align: 'center' });
        if (i < flowSteps.length - 1) {
          setColor(MUTED); setFont(8);
          doc.text('›', sx + stepW + 0.2, y + 7);
        }
      });
      y += 18;

      const archFeatures = [
        { title: 'Authentication',  color: ACCENT,   desc: 'JWT tokens in httpOnly cookies, 7-day sessions, bcryptjs password hashing. No credentials exposed to client JavaScript.' },
        { title: 'Multi-Tenancy',   color: [139,92,246] as const, desc: 'All data scoped to org_id at query layer. Foreign key enforcement prevents cross-tenant leakage.' },
        { title: 'AI Key Security', color: SUCCESS,   desc: 'No API keys stored in or transmitted to the browser. All Gemini calls are server-proxied with org-level key isolation.' },
        { title: 'Usage Quotas',    color: WARNING,   desc: 'Monthly AI call counts tracked per organization with HTTP 429 enforcement and graceful QUOTA_EXCEEDED codes.' },
      ];
      archFeatures.forEach(({ title, color, desc }) => {
        ensureSpace(18);
        rect(ML, y, 3, 12, color, 1);
        setColor(DARK); setFont(9, 'bold');
        doc.text(title, ML + 6, y + 5);
        setColor(MID); setFont(8);
        y = text(desc, ML + 6, y + 10, { maxWidth: CW - 6 }) + 4;
      });

      // ── 05 · CORE CAPABILITIES ───────────────────────────────────────────────
      newPage();
      sectionHeading('05', 'Core Capabilities');

      FEATURES.forEach(({ title, desc }, i) => {
        ensureSpace(20);
        const c = LAYER_COLORS[i % LAYER_COLORS.length];
        rect(ML, y, CW, 18, [248, 248, 255], 2);
        rect(ML + 3, y + 3, 12, 12, c, 2);
        setColor(WHITE); setFont(7, 'bold');
        doc.text(String(i + 1), ML + 9, y + 10, { align: 'center' });
        setColor(DARK); setFont(9, 'bold');
        doc.text(title, ML + 18, y + 7);
        setColor(MID); setFont(8);
        const dlines = doc.splitTextToSize(desc, CW - 20);
        doc.text(dlines, ML + 18, y + 12);
        y += Math.max(20, 12 + dlines.length * 4);
        y += 2;
      });

      // ── 06 · USE CASES ───────────────────────────────────────────────────────
      newPage();
      sectionHeading('06', 'Use Cases');

      USE_CASES.forEach(({ role, pain, solution, outcome }) => {
        ensureSpace(38);
        rect(ML, y, CW, 34, [248, 248, 255], 2);
        // role badge
        rect(ML + 3, y + 3, doc.getTextWidth(role) + 8, 7, ACCENT, 1);
        setColor(WHITE); setFont(7, 'bold');
        doc.text(role, ML + 7, y + 7.5);
        y += 12;
        const cols = [
          { label: 'Problem',  text: pain,     color: DANGER },
          { label: 'Solution', text: solution,  color: [6,182,212] as const },
          { label: 'Outcome',  text: outcome,   color: SUCCESS },
        ];
        const colW = (CW - 6) / 3;
        cols.forEach(({ label, text: t, color }, ci) => {
          const cx = ML + 3 + ci * colW;
          setColor(color); setFont(7, 'bold');
          doc.text(label, cx, y);
          setColor(MID); setFont(7);
          const ls = doc.splitTextToSize(t, colW - 3);
          doc.text(ls, cx, y + 5);
        });
        y += 24;
        y += 4;
      });

      // ── 07 · REGULATORY ALIGNMENT ────────────────────────────────────────────
      newPage();
      sectionHeading('07', 'Regulatory Alignment');
      bodyText('SATOR is designed to support compliance with emerging and existing AI governance frameworks. By providing scored audit trails, breach detection with severity classification, and contract compliance indicators, SATOR generates the evidence base that regulators and auditors require.');
      y += 4;

      // table header
      ensureSpace(10);
      rect(ML, y, CW, 9, DARK, 0);
      setColor(WHITE); setFont(7, 'bold');
      doc.text('Framework', ML + 3, y + 6);
      doc.text('Scope', ML + 35, y + 6);
      doc.text('SATOR Coverage', ML + 75, y + 6);
      y += 9;

      REGULATIONS.forEach(({ name, scope, sator_support }, i) => {
        ensureSpace(14);
        const bg: [number,number,number] = i % 2 === 0 ? [248, 248, 255] : [255, 255, 255];
        rect(ML, y, CW, 11, bg, 0);
        setColor(ACCENT); setFont(7, 'bold');
        doc.text(name, ML + 3, y + 7);
        setColor(MID); setFont(7);
        doc.text(scope, ML + 35, y + 7);
        const cLines = doc.splitTextToSize(sator_support, CW - 77);
        doc.text(cLines, ML + 75, y + 5);
        y += Math.max(11, cLines.length * 4 + 5);
      });

      // ── 08 · SECURITY & PRIVACY ──────────────────────────────────────────────
      ensureSpace(30);
      sectionHeading('08', 'Security & Privacy');

      const secItems = [
        { title: 'Zero client-side API keys',    desc: 'Gemini API keys never transmitted to or stored in the browser. All AI calls are server-proxied.' },
        { title: 'httpOnly cookie auth',          desc: 'JWT tokens live exclusively in httpOnly cookies, eliminating XSS-based token theft.' },
        { title: 'Bcrypt password hashing',       desc: 'Passwords stored with bcryptjs at appropriate cost factor. Never stored in plaintext.' },
        { title: 'Tenant data isolation',         desc: 'Every query scoped to org_id. Database foreign key enforcement prevents cross-tenant leakage.' },
        { title: 'Rate limiting & quotas',        desc: 'Per-org monthly AI call quotas with HTTP 429 enforcement prevent abuse.' },
        { title: 'Invite-only onboarding',        desc: 'Signed invite tokens with 7-day expiry. No open registration endpoints.' },
      ];
      secItems.forEach(({ title, desc }) => {
        ensureSpace(12);
        rect(ML, y, 5, 5, SUCCESS, 1);
        setColor(DARK); setFont(9, 'bold');
        doc.text(title, ML + 8, y + 4);
        setColor(MID); setFont(8);
        y = text(desc, ML + 8, y + 9, { maxWidth: CW - 8 }) + 3;
      });

      // ── 09 · TECHNOLOGY STACK ────────────────────────────────────────────────
      newPage();
      sectionHeading('09', 'Technology Stack');

      rect(ML, y, CW, 9, DARK, 0);
      setColor(WHITE); setFont(7, 'bold');
      doc.text('Layer', ML + 3, y + 6);
      doc.text('Technology', ML + 45, y + 6);
      y += 9;

      TECH_STACK.forEach(({ layer, tech }, i) => {
        ensureSpace(10);
        const bg: [number,number,number] = i % 2 === 0 ? [248, 248, 255] : [255, 255, 255];
        rect(ML, y, CW, 9, bg, 0);
        setColor(ACCENT); setFont(7, 'bold');
        doc.text(layer, ML + 3, y + 6);
        setColor(MID); setFont(7);
        doc.text(tech, ML + 45, y + 6);
        y += 9;
      });

      // ── 10 · PRICING & PLANS ─────────────────────────────────────────────────
      newPage();
      sectionHeading('10', 'Pricing & Plans');

      const planColors: readonly [number,number,number][] = [[120,120,145],[245,158,11],[99,102,241]];
      PLANS.forEach((plan, i) => {
        ensureSpace(70);
        const pc = planColors[i];
        rect(ML, y, CW, 62, [248, 248, 255], 3);
        // header bar
        rect(ML, y, CW, 14, pc, 3);
        setColor(WHITE); setFont(12, 'bold');
        doc.text(plan.name, ML + 5, y + 9);
        setFont(8);
        doc.text(`${plan.price}${plan.period}`, W - MR - 5, y + 9, { align: 'right' });
        if (plan.popular) {
          rect(W/2 - 15, y + 2, 30, 8, WHITE, 2);
          setColor(pc); setFont(6, 'bold');
          doc.text('MOST POPULAR', W/2, y + 7, { align: 'center' });
        }
        y += 16;
        plan.features.forEach(f => {
          rect(ML + 5, y, 2.5, 2.5, pc, 1);
          setColor(MID); setFont(7);
          doc.text(f, ML + 10, y + 2);
          y += 6;
        });
        y += 10;
      });

      // ── 11 · CONCLUSION ──────────────────────────────────────────────────────
      ensureSpace(60);
      sectionHeading('11', 'Conclusion');
      bodyText('The deployment of AI agents into business-critical workflows is no longer a future scenario — it is the present reality. Organizations across every sector are trusting AI agents with consequential decisions: contract review, financial modeling, strategic recommendation, code generation, customer engagement.');
      y += 2;
      bodyText('The SATOR framework\'s five-layer recursive evaluation — Strategy, Architecture, Tenet, Output, Rotation — provides a comprehensive and organizationally contextual lens that no generic benchmark can replicate. As AI governance regulation intensifies, the need for verifiable, structured evidence of AI oversight becomes non-negotiable. SATOR provides that evidence: scored, timestamped, breach-classified, and export-ready.');
      y += 6;

      // closing block
      ensureSpace(22);
      rect(ML, y, CW, 18, DARK, 3);
      // accent top bar on closing block
      rect(ML, y, CW, 2, ACCENT, 0);
      setColor(WHITE); setFont(11, 'bold');
      doc.text('SATOR — The operating system for AI agent governance.', W / 2, y + 10, { align: 'center' });
      setColor([160, 160, 200]); setFont(8);
      doc.text('Systematic · Recursive · Trustworthy · sator.app', W / 2, y + 16, { align: 'center' });

      // ── update all page footers with final total ──────────────────────────────
      // (jsPDF doesn't easily support retroactive footers; footers were already drawn per page)

      doc.save(`sator-white-paper-v2.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            SATOR Platform White Paper
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            AI Agent Evaluation &amp; Governance Infrastructure — Version 2.0 · May 2025
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {exporting
            ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
            : <><Download className="w-4 h-4" />Export PDF</>
          }
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" ref={printRef}>
        {/* Table of Contents */}
        <aside className="lg:col-span-1">
          <div className="sticky top-4">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Contents
              </p>
              <nav className="space-y-1">
                {TOC.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="w-4 text-right shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.label}
                  </button>
                ))}
              </nav>
            </Card>

            {/* Meta card */}
            <Card className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Document Info
              </p>
              <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {[
                  ['Version',    '2.0'],
                  ['Published',  'May 2025'],
                  ['Category',   'AI Governance'],
                  ['Audience',   'Technical & Executive'],
                  ['License',    'Proprietary'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <article className="lg:col-span-3 space-y-12">

          {/* 01 Executive Summary */}
          <section>
            <SectionAnchor id="executive" />
            <SectionTitle subtitle="A high-level overview of SATOR's purpose, value proposition, and market position.">
              01 · Executive Summary
            </SectionTitle>
            <Card>
              <div className="prose prose-sm max-w-none space-y-4" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  SATOR (Systematic Architecture via Tenet-Oriented Recursion) is a multi-tenant SaaS platform
                  purpose-built to evaluate, audit, and govern the work and decisions of AI agents. As organizations
                  deploy AI agents across critical business functions — legal review, financial analysis, customer
                  operations, code generation, strategic planning — they face a fundamental and largely unsolved
                  problem: <strong style={{ color: 'var(--text-primary)' }}>AI agent outputs are powerful, fast, and largely ungoverned</strong>.
                </p>
                <p>
                  SATOR addresses this gap with a proprietary five-layer recursive evaluation framework — Strategy,
                  Architecture, Tenet, Output, Rotation — that scores any AI agent output 0–100 across each dimension,
                  detects governance breaches classified by severity, and determines contract compliance in a single
                  structured audit. Three specialized AI evaluator agents (Seed Bot, Diagnostics Bot, Optimization Bot),
                  fractal stress simulation, and real-time system integrity monitoring complete the platform.
                </p>
                <p>
                  SATOR is the operating system for AI agent quality assurance. It is built for AI engineering teams,
                  enterprise governance officers, MLOps engineers, and any organization deploying AI agents that requires
                  systematic quality measurement, regulatory evidence, and continuous improvement feedback loops.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                  {[
                    { label: 'Evaluation Layers', value: '5' },
                    { label: 'AI Evaluator Agents', value: '3' },
                    { label: 'Severity Classes', value: '4' },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{value}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          {/* 02 The AI Governance Gap */}
          <section>
            <SectionAnchor id="problem" />
            <SectionTitle subtitle="Understanding the systemic failure in AI agent oversight and why conventional tools fall short.">
              02 · The AI Governance Gap
            </SectionTitle>
            <div className="space-y-4">
              <Card>
                <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <p>
                    The enterprise AI deployment cycle has accelerated dramatically. Organizations that once ran
                    large language model experiments in isolation now deploy AI agents into production workflows
                    that affect revenue, compliance, and strategic positioning. Yet the quality assurance layer
                    surrounding these agents has not kept pace.
                  </p>
                  <p>
                    Conventional LLM benchmarks measure capability on static datasets. They answer "how capable
                    is this model?" — not "is this agent's output safe, sound, and aligned with our organizational
                    context right now?" Standard monitoring tools detect system failures and latency spikes, but
                    they are blind to semantic drift, tenet violations, and reasoning structure collapse.
                  </p>
                  <p>
                    The result is a governance gap: AI agents operating at scale, producing outputs that humans
                    increasingly trust and act on, with no systematic framework for knowing whether those outputs
                    meet organizational standards.
                  </p>
                </div>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: AlertTriangle, color: '#ef4444', title: 'Ungoverned outputs', desc: 'AI agents produce decisions with no audit trail, breach classification, or compliance scoring' },
                  { icon: Clock, color: '#f59e0b', title: 'Retrospective discovery', desc: 'Governance failures discovered after damage is done, not before deployment gates' },
                  { icon: Globe, color: '#06b6d4', title: 'Regulatory exposure', desc: 'EU AI Act, NIST AI RMF, ISO 42001 require evidence of AI oversight that most orgs cannot provide' },
                  { icon: RotateCcw, color: '#8b5cf6', title: 'No improvement loop', desc: 'AI agents degrade or drift over time with no systematic mechanism for detecting or correcting this' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <Card key={title} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '22' }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* 03 The SATOR Framework */}
          <section>
            <SectionAnchor id="framework" />
            <SectionTitle subtitle="A deep-dive into the five-layer recursive evaluation methodology that powers every SATOR audit.">
              03 · The SATOR Framework
            </SectionTitle>
            <div className="space-y-4">
              <Card>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  The SATOR framework is named after the ancient Latin palindrome square — SATOR / AREPO / TENET /
                  OPERA / ROTAS — which reads identically in all four directions. This self-referential, recursive
                  property is central to the framework's design philosophy: AI governance must be recursive,
                  self-referential, and consistent in every direction of analysis. The framework can also be read
                  in reverse as ROTAS — enabling retrospective analysis from Output back to Strategy.
                </p>
              </Card>

              {/* Layer detail cards */}
              {LAYERS.map((layer, i) => (
                <motion.div
                  key={layer.letter}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                >
                  <Card>
                    <div className="flex gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0"
                        style={{ background: layer.color + '22', color: layer.color }}
                      >
                        {layer.letter}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{layer.name}</h3>
                          <Badge color={layer.color}>Layer {i + 1} of 5</Badge>
                          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>Scored 0–100</span>
                        </div>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{layer.desc}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {layer.criteria.map(c => (
                            <div key={c} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                              <CheckCircle className="w-3 h-3 shrink-0" style={{ color: layer.color }} />
                              {c}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {/* Sample score visualization */}
              <Card>
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                  Sample Audit Report — Score Distribution
                </p>
                <div className="space-y-3">
                  {LAYERS.map(layer => (
                    <ScoreBar key={layer.letter} label={layer.name} value={Math.floor(60 + Math.random() * 35)} color={layer.color} />
                  ))}
                  <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <ScoreBar label="Overall SATOR Score" value={78} color="var(--accent)" />
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* 04 Platform Architecture */}
          <section>
            <SectionAnchor id="architecture" />
            <SectionTitle subtitle="How SATOR is built — multi-tenant SaaS with server-side AI proxying, JWT auth, and data isolation.">
              04 · Platform Architecture
            </SectionTitle>
            <div className="space-y-4">
              <Card>
                <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <p>
                    SATOR is a multi-tenant SaaS platform. Each organization (tenant) has fully isolated data,
                    with all records scoped to <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent)' }}>org_id</code> with
                    database foreign key enforcement. There is no cross-tenant data leakage by design.
                  </p>
                </div>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Lock,      color: '#6366f1', title: 'Authentication',   desc: 'JWT tokens in httpOnly cookies with 7-day sessions. No credentials exposed to client JavaScript. bcryptjs password hashing with sufficient cost factor.' },
                  { icon: Building2, color: '#8b5cf6', title: 'Multi-Tenancy',    desc: 'Organizations are first-class entities. All data — operations, drills, personnel, usage logs — is scoped to org_id with enforced isolation at query layer.' },
                  { icon: Shield,    color: '#10b981', title: 'AI Key Security',  desc: 'No API keys are ever sent to or stored in the browser. All Gemini AI calls are server-proxied. Enterprise orgs can supply custom keys stored server-side only.' },
                  { icon: Layers,    color: '#f59e0b', title: 'Usage Quotas',     desc: 'Monthly AI call counts tracked per organization. Quota enforcement at API layer with HTTP 429 responses and QUOTA_EXCEEDED error codes for graceful UI handling.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <Card key={title} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '22' }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Data flow diagram */}
              <Card>
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                  AI Evaluation Request Flow
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: 'Browser Client', color: '#6366f1' },
                    { label: 'Express API', color: '#8b5cf6' },
                    { label: 'Auth Middleware', color: '#06b6d4' },
                    { label: 'Quota Check', color: '#f59e0b' },
                    { label: 'Gemini AI', color: '#10b981' },
                    { label: 'Usage Logger', color: '#ef4444' },
                    { label: 'Client Response', color: '#6366f1' },
                  ].map((step, i, arr) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="text-xs px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap"
                          style={{ background: step.color + '22', color: step.color, border: `1px solid ${step.color}44` }}
                        >
                          {step.label}
                        </div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>→</div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>

          {/* 05 Core Capabilities */}
          <section>
            <SectionAnchor id="features" />
            <SectionTitle subtitle="Every tool in the SATOR platform and its operational purpose.">
              05 · Core Capabilities
            </SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map(({ icon: Icon, title, color, desc }) => (
                <Card key={title}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '22' }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 06 Use Cases */}
          <section>
            <SectionAnchor id="usecases" />
            <SectionTitle subtitle="How different roles and teams deploy SATOR to solve real governance challenges.">
              06 · Use Cases
            </SectionTitle>
            <div className="space-y-4">
              {USE_CASES.map(({ role, pain, solution, outcome }) => (
                <Card key={role}>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <Badge color="#6366f1">{role}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#ef4444' }}>Problem</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pain}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#06b6d4' }}>Solution</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{solution}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#10b981' }}>Outcome</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{outcome}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 07 Regulatory Alignment */}
          <section>
            <SectionAnchor id="compliance" />
            <SectionTitle subtitle="How SATOR supports compliance with global AI governance regulations.">
              07 · Regulatory Alignment
            </SectionTitle>
            <div className="space-y-4">
              <Card>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  SATOR is designed to support compliance with emerging and existing AI governance frameworks.
                  By providing scored audit trails, breach detection with severity classification, and contract
                  compliance indicators, SATOR generates the evidence base that regulators and auditors require.
                </p>
              </Card>
              <Card className="overflow-hidden p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                      {['Framework', 'Scope', 'SATOR Coverage'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REGULATIONS.map((r, i) => (
                      <tr
                        key={r.name}
                        style={{ borderBottom: i < REGULATIONS.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                      >
                        <td className="px-4 py-3 font-semibold" style={{ color: 'var(--accent)' }}>{r.name}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{r.scope}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.sator_support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          </section>

          {/* 08 Security & Privacy */}
          <section>
            <SectionAnchor id="security" />
            <SectionTitle subtitle="Security controls, data handling practices, and privacy architecture.">
              08 · Security &amp; Privacy
            </SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Zero client-side API keys', desc: 'Gemini API keys are never transmitted to or stored in the browser. All AI calls are server-proxied with org-level key isolation.' },
                { title: 'httpOnly cookie auth', desc: 'JWT tokens live exclusively in httpOnly cookies. JavaScript cannot access them, eliminating XSS-based token theft attack surface.' },
                { title: 'Bcrypt password hashing', desc: 'Passwords are never stored in plaintext. bcryptjs with appropriate cost factor protects credentials at rest.' },
                { title: 'Tenant data isolation', desc: 'Every database query is scoped to org_id. Foreign key enforcement at the database layer prevents cross-tenant data leakage.' },
                { title: 'Rate limiting & quotas', desc: 'Per-org monthly AI call quotas with HTTP 429 enforcement prevent abuse and protect shared infrastructure from runaway usage.' },
                { title: 'Invite-only onboarding', desc: 'New members join via signed invite tokens with 7-day expiry. No open registration endpoints that could be exploited for account farming.' },
              ].map(({ title, desc }) => (
                <Card key={title} className="flex gap-3">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 09 Technology Stack */}
          <section>
            <SectionAnchor id="technology" />
            <SectionTitle subtitle="The engineering decisions and technology choices underpinning SATOR.">
              09 · Technology Stack
            </SectionTitle>
            <Card className="overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    {['Layer', 'Technology'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TECH_STACK.map(({ layer, tech }, i) => (
                    <tr
                      key={layer}
                      style={{ borderBottom: i < TECH_STACK.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                    >
                      <td className="px-5 py-3 font-medium w-40 shrink-0" style={{ color: 'var(--accent)' }}>{layer}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{tech}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>

          {/* 10 Pricing */}
          <section>
            <SectionAnchor id="pricing" />
            <SectionTitle subtitle="Three plans designed to grow with your AI governance program.">
              10 · Pricing &amp; Plans
            </SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map(plan => (
                <Card key={plan.name} className="relative flex flex-col">
                  {plan.popular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: plan.color, color: '#fff' }}
                    >
                      Most Popular
                    </div>
                  )}
                  <div className="mb-4">
                    <Badge color={plan.color}>{plan.name}</Badge>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.price}</span>
                      <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: plan.color }} />
                        {f}
                      </li>
                    ))}
                    {plan.excluded.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs opacity-40 line-through" style={{ color: 'var(--text-muted)' }}>
                        <span className="w-3.5 h-3.5 shrink-0 mt-0.5 flex items-center justify-center">—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </section>

          {/* 11 Conclusion */}
          <section>
            <SectionAnchor id="conclusion" />
            <SectionTitle subtitle="The path forward for AI agent governance in enterprise organizations.">
              11 · Conclusion
            </SectionTitle>
            <Card>
              <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  The deployment of AI agents into business-critical workflows is no longer a future scenario —
                  it is the present reality. Organizations across every sector are trusting AI agents with
                  consequential decisions: contract review, financial modeling, strategic recommendation, code
                  generation, customer engagement.
                </p>
                <p>
                  Yet the governance infrastructure surrounding these agents remains nascent. Most organizations
                  have no systematic way to measure whether their AI agents are aligned, compliant, sound, or
                  improving over time. This is the governance gap SATOR closes.
                </p>
                <p>
                  The SATOR framework's five-layer recursive evaluation — Strategy, Architecture, Tenet, Output,
                  Rotation — provides a comprehensive and organizationally contextual lens that no generic
                  benchmark can replicate. The ROTAS retrospective dimension adds temporal depth that
                  statistical monitoring cannot surface.
                </p>
                <p>
                  As AI governance regulation intensifies — with the EU AI Act, NIST AI RMF, and ISO/IEC 42001
                  creating binding obligations — the need for verifiable, structured evidence of AI oversight
                  becomes non-negotiable. SATOR provides that evidence: scored, timestamped, breach-classified,
                  and export-ready.
                </p>
                <div
                  className="mt-6 p-4 rounded-xl"
                  style={{ background: 'var(--accent)11', border: '1px solid var(--accent)44' }}
                >
                  <p className="font-semibold text-center" style={{ color: 'var(--accent)' }}>
                    SATOR — The operating system for AI agent governance.
                  </p>
                  <p className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>
                    Systematic · Recursive · Trustworthy
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Footer */}
          <div
            className="text-center py-6 text-xs space-y-1"
            style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}
          >
            <p>SATOR — AI Agent Evaluation &amp; Governance Platform</p>
            <p>© 2025 SATOR. All rights reserved. Version 2.0 · May 2025</p>
            <p>
              <span style={{ color: 'var(--accent)' }}>sator.app</span>
              {' · '}
              <span>Powered by Google Gemini</span>
              {' · '}
              <span>EU AI Act Ready</span>
              {' · '}
              <span>NIST AI RMF Aligned</span>
            </p>
          </div>

        </article>
      </div>
    </div>
  );
}
