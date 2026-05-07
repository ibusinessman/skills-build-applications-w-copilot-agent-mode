import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronDown, CheckCircle, ArrowRight, Shield, Zap, GitBranch,
  Bot, FlaskConical, BarChart3, FileCheck, Users, Globe,
  Star, ChevronRight, LogIn, UserPlus,
} from 'lucide-react';
import { SatorSquare } from '@/components/SatorSquare';
import { ThemeToggle } from '@/components/ThemeToggle';

interface LandingProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

const SATOR_LAYERS = [
  { letter: 'S', name: 'Strategy', color: '#6366f1', desc: 'Does the AI agent\'s output align with your organizational strategic intent and goals?' },
  { letter: 'A', name: 'Architecture', color: '#8b5cf6', desc: 'Is the reasoning structure internally consistent, logically sound, and well-formed?' },
  { letter: 'T', name: 'Tenet', color: '#06b6d4', desc: 'Does the output comply with defined operational principles and governance policies?' },
  { letter: 'O', name: 'Output', color: '#10b981', desc: 'Are the measurable results correct, complete, useful, and actionable?' },
  { letter: 'R', name: 'Rotation', color: '#f59e0b', desc: 'How does quality compound recursively over time? Does the agent improve or degrade?' },
];

const FEATURES = [
  {
    icon: FileCheck,
    title: 'SATOR Audit Engine',
    desc: 'Submit any AI agent output or directive. Receive scored analysis across all five SATOR layers, detected governance leaks, and contract compliance status — in seconds.',
    accent: '#6366f1',
  },
  {
    icon: Bot,
    title: 'Three Evaluator Agents',
    desc: 'Seed Bot identifies foundational tenets. Diagnostics Bot surfaces structural weaknesses. Optimization Bot converts findings into recursive improvements.',
    accent: '#8b5cf6',
  },
  {
    icon: FlaskConical,
    title: 'Fractal Stress Simulation',
    desc: 'Test AI agent resilience against market collapse, regulatory shock, competitive disruption, and custom scenarios. Outputs stability scores and collapse-point analysis.',
    accent: '#06b6d4',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Integrity Monitor',
    desc: 'Live WebSocket health scoring updated every 5 seconds. Track system integrity scores, deltas, and trends across your AI agent fleet.',
    accent: '#10b981',
  },
  {
    icon: GitBranch,
    title: 'Fractal Decision Visualizer',
    desc: 'D3.js-powered interactive visualization of recursive AI decision branching. Configurable depth, angle, and branching factor reveal structural complexity.',
    accent: '#f59e0b',
  },
  {
    icon: Shield,
    title: 'Governance & Audit Trails',
    desc: 'Every evaluation is logged with timestamp, layer scores, breach details, and export-ready PDF/JSON reports — meeting AI compliance frameworks including EU AI Act.',
    accent: '#ef4444',
  },
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    unit: '',
    cta: 'Start Free',
    popular: false,
    features: ['50 AI evaluations / month', '3 team members', 'SATOR Audit Engine', 'Operations & Drills', 'Fractal Visualizer', 'System Logs'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    unit: '/month',
    cta: 'Start Pro Trial',
    popular: true,
    features: ['1,000 AI evaluations / month', '25 team members', 'All 3 AI Evaluator Agents', 'Fractal Stress Simulation', 'PDF & JSON export', 'Team invite management', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    unit: '/month',
    cta: 'Contact Sales',
    popular: false,
    features: ['Unlimited AI evaluations', 'Unlimited team members', 'Bring your own Gemini API key', 'Usage analytics dashboard', 'Role-based access control', 'SLA & dedicated support'],
  },
];

const FAQS = [
  {
    q: 'What is SATOR?',
    a: 'SATOR (Systematic Architecture via Tenet-Oriented Recursion) is a SaaS platform built to evaluate the work and tasks of AI agents. It uses a five-layer recursive governance framework — Strategy, Architecture, Tenet, Output, Rotation — to score AI agent outputs, detect governance breaches, and determine compliance status.',
  },
  {
    q: 'What types of AI agents can SATOR evaluate?',
    a: 'SATOR evaluates any AI agent that produces text-based outputs, decisions, recommendations, or structured data — including LLM-based agents built on GPT, Claude, or Gemini, autonomous agents, RAG pipelines, multi-agent systems, and AI copilots. The framework is model-agnostic.',
  },
  {
    q: 'How is SATOR different from LLM benchmarks?',
    a: 'Standard LLM benchmarks measure model capability on fixed datasets. SATOR evaluates AI agent work in your organizational context — against your specific tenets, strategic goals, and governance frameworks. It is descriptive and contextual rather than comparative.',
  },
  {
    q: 'What is a "governance leak" in SATOR?',
    a: 'A governance leak is a detected deviation between an AI agent\'s output and the expected governance standard. Leaks are classified by severity: low, medium, high, or critical. Each leak includes a description of the violation and a specific recommendation for remediation.',
  },
  {
    q: 'What AI models power SATOR?',
    a: 'SATOR is powered by Google Gemini (gemini-2.0-flash) via the @google/genai SDK. AI calls are proxied through the SATOR server — your API keys are never exposed to the browser. Enterprise customers can supply their own Gemini API key for unlimited evaluations.',
  },
  {
    q: 'Is SATOR compliant with AI governance regulations?',
    a: 'SATOR is designed to support compliance with the EU AI Act, NIST AI RMF, and ISO/IEC 42001. It provides audit trails, scored layer evaluations, breach detection with severity levels, and contract compliance pass/fail indicators.',
  },
  {
    q: 'What is GEO and how does SATOR use it?',
    a: 'Generative Engine Optimization (GEO) is the practice of structuring content so AI-powered search engines (ChatGPT, Perplexity, Claude, Gemini) can accurately find, understand, and cite it. SATOR uses semantic HTML, JSON-LD schema.org markup, llms.txt, and factual entity definitions to ensure its content is accurately represented in AI-generated responses.',
  },
  {
    q: 'What is the SATOR magic square?',
    a: 'The SATOR square is an ancient Latin palindrome grid (SATOR / AREPO / TENET / OPERA / ROTAS) that reads identically in all four directions — forwards, backwards, top-to-bottom, and bottom-to-top. Found inscribed in Pompeii and other Roman sites, SATOR uses it as a symbol of recursive, self-referential systemic truth: the same quality sought in rigorous AI governance.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border-color)' }}
      itemScope itemType="https://schema.org/Question"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/3"
        style={{ background: 'var(--bg-card)' }}
        aria-expanded={open}
      >
        <span className="text-sm font-medium pr-4" style={{ color: 'var(--text-primary)' }} itemProp="name">
          {q}
        </span>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : undefined }}
        />
      </button>
      {open && (
        <motion.div
          initial={{ height: 0 }} animate={{ height: 'auto' }}
          className="px-5 pb-4"
          style={{ background: 'var(--bg-card)' }}
          itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer"
        >
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }} itemProp="text">
            {a}
          </p>
        </motion.div>
      )}
    </div>
  );
}

export function LandingPage({ onSignIn, onGetStarted }: LandingProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'rgba(10,10,15,0.85)', borderColor: 'var(--border-color)', backdropFilter: 'blur(12px)' }}
        role="banner"
      >
        <a href="/" className="flex items-center gap-2" aria-label="SATOR home">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent)', color: '#fff' }}>S</div>
          <span className="font-bold text-sm tracking-widest" style={{ color: 'var(--text-primary)' }}>SATOR</span>
          <span className="text-xs px-1.5 py-0.5 rounded font-medium hidden sm:inline" style={{ background: 'var(--accent)22', color: 'var(--accent)' }}>AI Agent Evaluation</span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Main navigation">
          {[['#features', 'Features'], ['#sator-framework', 'Framework'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={href} href={href} style={{ color: 'var(--text-secondary)' }} className="hover:text-white transition-colors">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={onSignIn} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/10" style={{ color: 'var(--text-secondary)' }}>
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button onClick={onGetStarted} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
            <UserPlus className="w-3.5 h-3.5" /> Get Started Free
          </button>
        </div>
      </header>

      <main>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section
          className="relative px-6 pt-24 pb-20 text-center overflow-hidden"
          aria-label="Hero"
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6" style={{ background: 'var(--accent)15', border: '1px solid var(--accent)33', color: 'var(--accent)' }}>
              <Zap className="w-3 h-3" /> Powered by Google Gemini · Built for AI Governance
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6" style={{ color: 'var(--text-primary)' }}>
              The Platform Built to<br />
              <span style={{ color: 'var(--accent)' }}>Evaluate AI Agent Work</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              SATOR audits, scores, and governs the outputs of AI agents using a five-layer recursive governance framework.
              Detect governance leaks. Enforce organizational tenets. Ensure AI work meets the standard your organization demands.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <button onClick={onGetStarted} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: 'var(--accent)', color: '#fff' }}>
                Start Evaluating Free <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={onSignIn} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                Sign In
              </button>
            </div>
            <div className="flex justify-center">
              <SatorSquare highlight={[0, 6, 12, 18, 24]} />
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              SATOR · AREPO · TENET · OPERA · ROTAS — reads identically in all directions. A symbol of recursive systemic truth.
            </p>
          </motion.div>
        </section>

        {/* ── Trust bar ───────────────────────────────────────────────────── */}
        <section className="border-y px-6 py-5" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }} aria-label="Trust signals">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 text-xs" style={{ color: 'var(--text-muted)' }}>
            {[
              { icon: Shield, label: 'EU AI Act Ready' },
              { icon: Globe, label: 'NIST AI RMF Aligned' },
              { icon: Zap, label: 'Gemini-Powered Evaluation' },
              { icon: Users, label: 'Multi-Tenant Architecture' },
              { icon: FileCheck, label: 'Full Audit Trails' },
              { icon: Star, label: 'GEO Optimized' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Problem statement ───────────────────────────────────────────── */}
        <section className="px-6 py-20 max-w-4xl mx-auto text-center" aria-label="Problem statement">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            AI agents are powerful. But who evaluates them?
          </h2>
          <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Organizations deploy AI agents to write code, draft decisions, analyze data, and execute workflows.
            But without systematic governance, AI agent outputs are evaluated by instinct — not framework.
            Governance leaks go undetected. Strategic misalignment accumulates. Compliance risk grows silently.
          </p>
          <p className="text-base leading-relaxed max-w-2xl mx-auto mt-4" style={{ color: 'var(--text-secondary)' }}>
            SATOR is the answer: a structured, recursive framework for evaluating AI agent work against the standards your organization actually holds.
          </p>
        </section>

        {/* ── SATOR Framework ─────────────────────────────────────────────── */}
        <section
          id="sator-framework"
          className="px-6 py-20"
          style={{ background: 'var(--bg-secondary)' }}
          aria-labelledby="framework-heading"
          itemScope itemType="https://schema.org/HowTo"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 id="framework-heading" className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }} itemProp="name">
                The SATOR Framework — Five Layers of AI Evaluation
              </h2>
              <p className="text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }} itemProp="description">
                Every AI agent output is scored across five recursive dimensions. Each dimension is independently rated 0–100 and combined into an Overall Score. Detected breaches are classified by severity: low, medium, high, or critical.
              </p>
            </div>
            <div className="space-y-4" itemProp="step" itemScope itemType="https://schema.org/HowToStep">
              {SATOR_LAYERS.map((layer, i) => (
                <motion.div
                  key={layer.letter}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-5 rounded-xl p-5"
                  style={{ background: 'var(--bg-card)', border: `1px solid ${layer.color}33` }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ background: layer.color + '20', color: layer.color, border: `1px solid ${layer.color}44` }}
                  >
                    {layer.letter}
                  </div>
                  <div>
                    <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }} itemProp="name">
                      {layer.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }} itemProp="text">
                      {layer.desc}
                    </p>
                  </div>
                  <div className="ml-auto shrink-0 text-2xl font-bold hidden sm:block" style={{ color: layer.color + '44' }}>
                    {(i + 1)}/5
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
              The framework also reads in reverse as <strong style={{ color: 'var(--text-secondary)' }}>ROTAS</strong> (Rotation → Output → Tenet → Architecture → Strategy), providing a retrospective evaluation perspective.
            </p>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section id="features" className="px-6 py-20 max-w-6xl mx-auto" aria-labelledby="features-heading">
          <div className="text-center mb-14">
            <h2 id="features-heading" className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Everything You Need to Govern AI Agent Work
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              From real-time monitoring to stress simulation — SATOR covers the full AI governance lifecycle.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl p-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                aria-label={f.title}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: f.accent + '20' }}>
                  <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="px-6 py-20"
          style={{ background: 'var(--bg-secondary)' }}
          aria-labelledby="how-heading"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="how-heading" className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              How SATOR Evaluates AI Agent Work
            </h2>
            <p className="text-sm mb-12" style={{ color: 'var(--text-muted)' }}>Three steps from submission to insight.</p>
            <div className="space-y-6 text-left">
              {[
                {
                  step: '01',
                  title: 'Submit an AI Agent Directive or Output',
                  body: 'Paste any AI agent task description, directive, output, or decision into the SATOR Audit Engine. This can be a prompt, a generated response, a code artifact, a recommendation, or any structured output your AI agent produces.',
                  color: '#6366f1',
                },
                {
                  step: '02',
                  title: 'SATOR Scores Across Five Governance Layers',
                  body: 'The Audit Engine — powered by three specialized Gemini-based evaluator agents — scores the submission across Strategy, Architecture, Tenet, Output, and Rotation. Each layer receives an independent score (0–100). Governance leaks are detected and classified by severity.',
                  color: '#06b6d4',
                },
                {
                  step: '03',
                  title: 'Receive Actionable Governance Report',
                  body: 'SATOR returns an overall score, contract compliance status (pass/fail), specific breach descriptions with remediation recommendations, and a strategic summary. Export as PDF or JSON for audit trails, compliance documentation, or team review.',
                  color: '#10b981',
                },
              ].map(s => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="flex gap-5 items-start rounded-xl p-5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                >
                  <div className="text-3xl font-bold shrink-0" style={{ color: s.color + '44' }}>{s.step}</div>
                  <div>
                    <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────────── */}
        <section id="pricing" className="px-6 py-20 max-w-5xl mx-auto" aria-labelledby="pricing-heading">
          <div className="text-center mb-12">
            <h2 id="pricing-heading" className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Start free. Scale as your AI agent fleet grows.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl p-6 flex flex-col relative"
                style={{
                  background: plan.popular ? 'rgba(99,102,241,0.06)' : 'var(--bg-card)',
                  border: `1px solid ${plan.popular ? 'var(--accent)' : 'var(--border-color)'}`,
                  boxShadow: plan.popular ? '0 0 30px rgba(99,102,241,0.15)' : undefined,
                }}
                itemScope itemType="https://schema.org/Offer"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }} itemProp="name">{plan.name}</h3>
                <div className="mb-5">
                  <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }} itemProp="price">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.unit && <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{plan.unit}</span>}
                  <meta itemProp="priceCurrency" content="USD" />
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGetStarted}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: plan.popular ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: plan.popular ? '#fff' : 'var(--text-primary)',
                    border: plan.popular ? undefined : '1px solid var(--border-color)',
                  }}
                >
                  {plan.cta} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section
          id="faq"
          className="px-6 py-20"
          style={{ background: 'var(--bg-secondary)' }}
          aria-labelledby="faq-heading"
          itemScope itemType="https://schema.org/FAQPage"
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                Frequently Asked Questions
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Everything you need to know about SATOR and AI agent evaluation.
              </p>
            </div>
            <div className="space-y-3">
              {FAQS.map(item => <FAQItem key={item.q} {...item} />)}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="px-6 py-24 text-center" aria-label="Call to action">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Start governing your AI agents today
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              50 free AI evaluations monthly. No credit card required. Set up in under 2 minutes.
            </p>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              Demo: demo@sator.ai / demo1234
            </p>
          </motion.div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="border-t px-6 py-10"
        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
        role="contentinfo"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-8 mb-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent)', color: '#fff' }}>S</div>
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>SATOR</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                The AI agent evaluation and governance platform. Systematic Architecture via Tenet-Oriented Recursion.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Product</p>
              <ul className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {[['#features', 'Features'], ['#sator-framework', 'Framework'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']].map(([href, label]) => (
                  <li key={href}><a href={href} className="hover:underline">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Compliance</p>
              <ul className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {['EU AI Act', 'NIST AI RMF', 'ISO/IEC 42001', 'AI Audit Trails'].map(l => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Resources</p>
              <ul className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {[['llms.txt', '/llms.txt'], ['Sitemap', '/sitemap.xml'], ['robots.txt', '/robots.txt']].map(([label, href]) => (
                  <li key={href}><a href={href} className="hover:underline">{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            <p>© 2025 SATOR. AI Agent Evaluation & Governance Platform.</p>
            <p>Powered by Google Gemini · GEO Optimized · <a href="/llms.txt" className="hover:underline" style={{ color: 'var(--accent)' }}>llms.txt</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
