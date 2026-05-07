import { useState } from 'react';
import { motion } from 'motion/react';
import { FractalTree } from '@/components/FractalTree';
import { Sliders } from 'lucide-react';

type ColorScheme = 'indigo' | 'emerald' | 'amber' | 'rose';

export function VisualizerView() {
  const [depth, setDepth] = useState(7);
  const [branchAngle, setBranchAngle] = useState(30);
  const [branchRatio, setBranchRatio] = useState(0.7);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('indigo');

  const colorOptions: { value: ColorScheme; label: string; color: string }[] = [
    { value: 'indigo', label: 'Indigo', color: '#6366f1' },
    { value: 'emerald', label: 'Emerald', color: '#10b981' },
    { value: 'amber', label: 'Amber', color: '#f59e0b' },
    { value: 'rose', label: 'Rose', color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Fractal Visualizer
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Recursive branching architecture — the visual language of SATOR
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl p-5 space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sliders className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Parameters
            </h2>
          </div>

          <div>
            <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Depth: {depth}
            </label>
            <input
              type="range" min={3} max={10} value={depth}
              onChange={e => setDepth(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Branch Angle: {branchAngle}°
            </label>
            <input
              type="range" min={10} max={60} value={branchAngle}
              onChange={e => setBranchAngle(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Branch Ratio: {branchRatio.toFixed(2)}
            </label>
            <input
              type="range" min={40} max={85} value={Math.round(branchRatio * 100)}
              onChange={e => setBranchRatio(Number(e.target.value) / 100)}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Color Scheme
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setColorScheme(opt.value)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: opt.color,
                    outline: colorScheme === opt.value ? `2px solid ${opt.color}` : 'none',
                    outlineOffset: '2px',
                  }}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="pt-2 border-t space-y-1" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Scale Legend
            </p>
            {['Trunk', 'Primary', 'Secondary', 'Tertiary', 'Terminal'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="rounded-full" style={{
                  width: `${Math.max(3, 12 - i * 2)}px`,
                  height: `${Math.max(3, 12 - i * 2)}px`,
                  background: colorOptions.find(c => c.value === colorScheme)?.color || '#6366f1',
                  opacity: 1 - i * 0.15,
                }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tree */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 rounded-xl p-4 flex items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', minHeight: '520px' }}
        >
          <FractalTree
            key={`${depth}-${branchAngle}-${branchRatio}-${colorScheme}`}
            depth={depth}
            branchAngle={branchAngle}
            branchRatio={branchRatio}
            colorScheme={colorScheme}
            width={560}
            height={480}
          />
        </motion.div>
      </div>
    </div>
  );
}
