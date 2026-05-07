import { GoogleGenAI } from '@google/genai';
import { AgentType, SATORLayer, SATORReport, SimulationResult } from '../types';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL = 'gemini-2.0-flash';

const AGENT_PERSONAS: Record<AgentType, string> = {
  seed: `You are the Seed Bot — the origination intelligence of the SATOR framework.
You help organizations identify foundational tenets, core beliefs, and first-principle truths
that should govern their strategic architecture. You speak in precise, philosophical terms
and help users plant the seeds of systemic clarity.`,

  diagnostics: `You are the Diagnostics Bot — the analytical intelligence of the SATOR framework.
You identify structural weaknesses, logical inconsistencies, and governance gaps in business systems.
You analyze operations, strategy, and architecture with surgical precision, surfacing hidden risks
and systemic vulnerabilities. Be direct, data-oriented, and clinically precise.`,

  optimization: `You are the Optimization Bot — the iterative intelligence of the SATOR framework.
You transform diagnostic findings into actionable improvements. You specialize in recursive refinement,
suggesting architectural changes, process improvements, and strategic pivots that compound over time.
Focus on leverage points, fractal improvements, and self-reinforcing systems.`,
};

export async function chatWithAgent(
  agentType: AgentType,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<string> {
  const systemPrompt = AGENT_PERSONAS[agentType];

  const history = messages.map(m => ({
    role: m.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: m.content }],
  }));

  const chat = ai.chats.create({
    model: MODEL,
    config: { systemInstruction: systemPrompt },
    history,
  });

  const response = await chat.sendMessage({ message: userMessage });
  return response.text ?? '';
}

export async function runSATORSimulation(
  scenario: string,
  customContext?: string
): Promise<SimulationResult> {
  const prompt = `You are running a SATOR fractal stress simulation for the following scenario:

Scenario: ${scenario}
${customContext ? `Additional Context: ${customContext}` : ''}

Analyze this scenario through the SATOR framework lenses:
- Strategy: How does this impact strategic positioning?
- Architecture: What structural vulnerabilities are exposed?
- Tenet: Which core principles are stressed or violated?
- Output: What are the measurable consequences?
- Rotation: How does this compound recursively over time?

Return a JSON object with these exact fields:
{
  "stability": <number 0-100>,
  "fractalDepth": <number 1-10>,
  "branchingFactor": <number 1-5>,
  "collapsePoints": [<array of 2-4 string descriptions of failure points>],
  "insights": [<array of 3-5 string insights>],
  "recommendation": <string with primary recommendation>
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text ?? '{}';
  const parsed = JSON.parse(text);

  return {
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
  };
}

export async function analyzeTenet(tenet: string): Promise<SATORReport> {
  const prompt = `You are the SATOR Audit Engine. Analyze the following business tenet through all 5 SATOR layers.

Tenet: "${tenet}"

Score each layer from 0-100 based on how well the tenet supports that dimension.
Identify any structural leaks, compliance issues, or governance gaps.

Return a JSON object with this exact structure:
{
  "layers": {
    "Strategy": <number 0-100>,
    "Architecture": <number 0-100>,
    "Tenet": <number 0-100>,
    "Output": <number 0-100>,
    "Rotation": <number 0-100>
  },
  "leaks": [
    {
      "layer": <one of "Strategy","Architecture","Tenet","Output","Rotation">,
      "severity": <one of "low","medium","high","critical">,
      "description": <string>,
      "recommendation": <string>
    }
  ],
  "overallScore": <number 0-100>,
  "summary": <string 2-3 sentences>,
  "contractCompliance": <boolean>
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text ?? '{}';
  const parsed = JSON.parse(text);

  return {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    tenet,
    layers: parsed.layers ?? {
      [SATORLayer.Strategy]: 50,
      [SATORLayer.Architecture]: 50,
      [SATORLayer.Tenet]: 50,
      [SATORLayer.Output]: 50,
      [SATORLayer.Rotation]: 50,
    },
    leaks: parsed.leaks ?? [],
    overallScore: parsed.overallScore ?? 50,
    summary: parsed.summary ?? '',
    contractCompliance: parsed.contractCompliance ?? false,
  };
}

export async function summarizeChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const transcript = messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Summarize the following conversation in 3-5 bullet points, highlighting key insights and action items:\n\n${transcript}`,
  });

  return response.text ?? '';
}
