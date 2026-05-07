import { cn } from '@/lib/utils';

const SATOR_WORDS = ['SATOR', 'AREPO', 'TENET', 'OPERA', 'ROTAS'];

interface SatorSquareProps {
  highlight?: number[];
  className?: string;
}

export function SatorSquare({ highlight = [], className }: SatorSquareProps) {
  return (
    <div className={cn('sator-grid w-fit', className)}>
      {SATOR_WORDS.map((word, rowIdx) =>
        word.split('').map((letter, colIdx) => {
          const idx = rowIdx * 5 + colIdx;
          const isHighlighted = highlight.includes(idx);
          return (
            <div
              key={idx}
              className={cn(
                'w-10 h-10 flex items-center justify-center text-sm font-bold rounded transition-all duration-300',
                isHighlighted ? 'glow-border' : ''
              )}
              style={{
                background: isHighlighted ? 'rgba(99,102,241,0.2)' : 'var(--bg-tertiary)',
                color: isHighlighted ? 'var(--accent)' : 'var(--text-secondary)',
                border: isHighlighted ? undefined : '1px solid var(--border-color)',
              }}
            >
              {letter}
            </div>
          );
        })
      )}
    </div>
  );
}
