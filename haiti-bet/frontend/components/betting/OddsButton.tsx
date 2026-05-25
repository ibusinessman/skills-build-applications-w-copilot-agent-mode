'use client';
import { clsx } from 'clsx';
import { useBetSlipStore } from '@/store/betSlip.store';

interface Props {
  marketId: string;
  outcomeId: string;
  outcomeName: string;
  odds: number;
  marketName: string;
  matchName: string;
  disabled?: boolean;
}

export function OddsButton({ marketId, outcomeId, outcomeName, odds, marketName, matchName, disabled }: Props) {
  const { toggleSelection, hasSelection } = useBetSlipStore();
  const selected = hasSelection(outcomeId);

  return (
    <button
      className={clsx('odds-btn', selected && 'selected', disabled && 'opacity-40 cursor-not-allowed')}
      onClick={() => {
        if (disabled) return;
        toggleSelection({ marketId, outcomeId, marketName, outcomeName, odds, matchName });
      }}
      disabled={disabled}
    >
      <span className="text-xs text-slate-400 mb-1 text-center leading-tight">{outcomeName}</span>
      <span className={clsx('font-bold text-base', selected ? 'text-haiti-gold' : 'text-white')}>
        {odds.toFixed(2)}
      </span>
    </button>
  );
}
