import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithAgent, summarizeChat } from '@/services/geminiService';
import { AgentType, ChatMessage } from '@/types';
import { Bot, Send, Loader2, FileText, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  accent: string;
}

const AGENTS: AgentConfig[] = [
  {
    type: 'seed',
    name: 'Seed Bot',
    description: 'Origination intelligence — foundational tenets & first principles',
    accent: '#06b6d4',
  },
  {
    type: 'diagnostics',
    name: 'Diagnostics Bot',
    description: 'Analytical intelligence — structural weaknesses & governance gaps',
    accent: '#f59e0b',
  },
  {
    type: 'optimization',
    name: 'Optimization Bot',
    description: 'Iterative intelligence — recursive refinement & leverage points',
    accent: '#10b981',
  },
];

function AgentChat({ config }: { config: AgentConfig }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await chatWithAgent(config.type, history, input);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        agentType: config.type,
      }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error communicating with the agent. Please check your API key.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (messages.length === 0) return;
    setSummarizing(true);
    try {
      const s = await summarizeChat(messages.map(m => ({ role: m.role, content: m.content })));
      setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setSummarizing(false);
    }
  };

  const exportChat = () => {
    const text = messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.type}-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border-color)`,
        height: '480px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" style={{ color: config.accent }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {config.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{config.description}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleSummarize}
            disabled={messages.length === 0 || summarizing}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10 disabled:opacity-40"
            style={{ color: 'var(--text-muted)' }}
            title="Summarize"
          >
            {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={exportChat}
            disabled={messages.length === 0}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10 disabled:opacity-40"
            style={{ color: 'var(--text-muted)' }}
            title="Export"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setMessages([]); setSummary(''); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
            title="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Start a conversation with {config.name}…
            </p>
          </div>
        )}
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className="max-w-[85%] rounded-lg px-3 py-2 text-xs"
                style={{
                  background: msg.role === 'user' ? config.accent + '22' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${msg.role === 'user' ? config.accent + '44' : 'var(--border-color)'}`,
                }}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Summary */}
      {summary && (
        <div
          className="px-3 py-2 border-t text-xs"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}
        >
          <p className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Summary</p>
          <p className="whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {/* Input */}
      <div
        className="px-3 py-2 border-t flex gap-2"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Message ${config.name}…`}
          className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="p-2 rounded-lg transition-colors disabled:opacity-40"
          style={{ background: config.accent, color: '#fff' }}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AgentsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          AI Agents
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Three specialized AI agents powered by Gemini for SATOR analysis
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {AGENTS.map(agent => (
          <AgentChat key={agent.type} config={agent} />
        ))}
      </div>
    </div>
  );
}
