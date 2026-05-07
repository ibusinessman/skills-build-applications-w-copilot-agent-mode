import { AgentType, SATORReport, SimulationResult } from '../types';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'AI request failed');
  }
  return res.json();
}

export async function chatWithAgent(
  agentType: AgentType,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<string> {
  const data = await post<{ text: string }>('/api/ai/chat', { agentType, messages, userMessage });
  return data.text;
}

export async function runSATORSimulation(
  scenario: string,
  customContext?: string
): Promise<SimulationResult> {
  return post<SimulationResult>('/api/ai/simulate', { scenario, customContext });
}

export async function analyzeTenet(tenet: string): Promise<SATORReport> {
  return post<SATORReport>('/api/ai/audit', { tenet });
}

export async function summarizeChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const data = await post<{ text: string }>('/api/ai/summarize', { messages });
  return data.text;
}
