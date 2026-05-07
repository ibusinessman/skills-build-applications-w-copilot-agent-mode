export enum SATORLayer {
  Strategy = 'Strategy',
  Architecture = 'Architecture',
  Tenet = 'Tenet',
  Output = 'Output',
  Rotation = 'Rotation',
}

export type AgentType = 'seed' | 'diagnostics' | 'optimization';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agentType?: AgentType;
}

export interface SystemStatus {
  healthScore: number;
  timestamp: string;
  delta: number;
}

export interface LeakNote {
  layer: SATORLayer;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface SATORReport {
  id: string;
  timestamp: string;
  tenet: string;
  layers: Record<SATORLayer, number>;
  leaks: LeakNote[];
  overallScore: number;
  summary: string;
  contractCompliance: boolean;
}

export interface SimulationResult {
  id: string;
  scenario: string;
  timestamp: string;
  iterations: number;
  stability: number;
  fractalDepth: number;
  branchingFactor: number;
  collapsePoints: string[];
  insights: string[];
  recommendation: string;
}
