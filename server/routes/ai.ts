import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db, canMakeAICall, trackUsage } from '../db.js';
import { requireAuth } from '../auth.js';
import { SATORLayer } from '../../src/types/index.js';

const router = Router();
router.use(requireAuth);

const MODEL = 'gemini-2.0-flash';

function getAI(orgId: string): GoogleGenAI {
  const org = db.prepare('SELECT gemini_api_key FROM orgs WHERE id = ?').get(orgId) as any;
  const apiKey = org?.gemini_api_key || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
}

function checkLimit(orgId: string, res: any): boolean {
  if (!canMakeAICall(orgId)) {
    res.status(429).json({
      error: 'Monthly AI call limit reached. Upgrade your plan to continue.',
      code: 'QUOTA_EXCEEDED',
    });
    return false;
  }
  return true;
}

const AGENT_PERSONAS: Record<string, string> = {
  seed: `You are the Seed Bot — origination intelligence of the SATOR framework. Help identify foundational tenets, core beliefs, and first-principle truths governing strategic architecture. Speak with philosophical precision.`,
  diagnostics: `You are the Diagnostics Bot — analytical intelligence of the SATOR framework. Identify structural weaknesses, logical inconsistencies, and governance gaps with surgical precision. Be direct and data-oriented.`,
  optimization: `You are the Optimization Bot — iterative intelligence of the SATOR framework. Transform diagnostic findings into actionable improvements. Focus on leverage points, fractal improvements, and self-reinforcing systems.`,
};

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  if (!checkLimit(req.user.orgId, res)) return;
  const { agentType, messages = [], userMessage } = req.body;
  if (!userMessage) { res.status(400).json({ error: 'userMessage required' }); return; }

  try {
    const ai = getAI(req.user.orgId);
    const systemInstruction = AGENT_PERSONAS[agentType] ?? AGENT_PERSONAS.seed;
    const history = (messages as Array<{ role: string; content: string }>).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }));
    const chat = ai.chats.create({ model: MODEL, config: { systemInstruction }, history });
    const response = await chat.sendMessage({ message: userMessage });
    trackUsage(req.user.orgId, req.user.userId, 'chat');
    res.json({ text: response.text ?? '' });
  } catch (e: any) {
    res.status(502).json({ error: e.message ?? 'AI request failed' });
  }
});

// POST /api/ai/audit
router.post('/audit', async (req, res) => {
  if (!checkLimit(req.user.orgId, res)) return;
  const { tenet } = req.body;
  if (!tenet) { res.status(400).json({ error: 'tenet required' }); return; }

  const prompt = `You are the SATOR Audit Engine. Analyze this business tenet through 5 SATOR layers.

Tenet: "${tenet}"

Score each layer 0-100 and identify structural leaks.

Return ONLY valid JSON:
{
  "layers": { "Strategy": 0-100, "Architecture": 0-100, "Tenet": 0-100, "Output": 0-100, "Rotation": 0-100 },
  "leaks": [{ "layer": "Strategy|Architecture|Tenet|Output|Rotation", "severity": "low|medium|high|critical", "description": "string", "recommendation": "string" }],
  "overallScore": 0-100,
  "summary": "2-3 sentence summary",
  "contractCompliance": true|false
}`;

  try {
    const ai = getAI(req.user.orgId);
    const response = await ai.models.generateContent({
      model: MODEL, contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(response.text ?? '{}');
    trackUsage(req.user.orgId, req.user.userId, 'audit');
    res.json({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      tenet,
      layers: parsed.layers ?? { [SATORLayer.Strategy]: 50, [SATORLayer.Architecture]: 50, [SATORLayer.Tenet]: 50, [SATORLayer.Output]: 50, [SATORLayer.Rotation]: 50 },
      leaks: parsed.leaks ?? [],
      overallScore: parsed.overallScore ?? 50,
      summary: parsed.summary ?? '',
      contractCompliance: parsed.contractCompliance ?? false,
    });
  } catch (e: any) {
    res.status(502).json({ error: e.message ?? 'Audit failed' });
  }
});

// POST /api/ai/simulate
router.post('/simulate', async (req, res) => {
  if (!checkLimit(req.user.orgId, res)) return;
  const { scenario, customContext } = req.body;
  if (!scenario) { res.status(400).json({ error: 'scenario required' }); return; }

  const prompt = `SATOR fractal stress simulation.
Scenario: ${scenario}
${customContext ? `Context: ${customContext}` : ''}

Analyze through Strategy, Architecture, Tenet, Output, Rotation lenses.

Return ONLY valid JSON:
{
  "stability": 0-100,
  "fractalDepth": 1-10,
  "branchingFactor": 1-5,
  "collapsePoints": ["string x2-4"],
  "insights": ["string x3-5"],
  "recommendation": "string"
}`;

  try {
    const ai = getAI(req.user.orgId);
    const response = await ai.models.generateContent({
      model: MODEL, contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(response.text ?? '{}');
    trackUsage(req.user.orgId, req.user.userId, 'simulation');
    res.json({
      id: Date.now().toString(),
      scenario,
      timestamp: new Date().toISOString(),
      iterations: Math.floor(100 + Math.random() * 900),
      stability: parsed.stability ?? 50,
      fractalDepth: parsed.fractalDepth ?? 5,
      branchingFactor: parsed.branchingFactor ?? 2,
      collapsePoints: parsed.collapsePoints ?? [],
      insights: parsed.insights ?? [],
      recommendation: parsed.recommendation ?? '',
    });
  } catch (e: any) {
    res.status(502).json({ error: e.message ?? 'Simulation failed' });
  }
});

// POST /api/ai/summarize
router.post('/summarize', async (req, res) => {
  if (!checkLimit(req.user.orgId, res)) return;
  const { messages } = req.body;
  if (!messages?.length) { res.status(400).json({ error: 'messages required' }); return; }

  const transcript = (messages as Array<{ role: string; content: string }>)
    .map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

  try {
    const ai = getAI(req.user.orgId);
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Summarize this conversation in 3-5 bullet points with key insights and action items:\n\n${transcript}`,
    });
    trackUsage(req.user.orgId, req.user.userId, 'summarize');
    res.json({ text: response.text ?? '' });
  } catch (e: any) {
    res.status(502).json({ error: e.message ?? 'Summarize failed' });
  }
});

export default router;
