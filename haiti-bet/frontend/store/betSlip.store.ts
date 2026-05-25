import { create } from 'zustand';

export interface BetSelection {
  marketId: string;
  outcomeId: string;
  marketName: string;
  outcomeName: string;
  odds: number;
  matchName: string;
}

interface BetSlipState {
  selections: BetSelection[];
  stake: number;
  isOpen: boolean;
  addSelection: (sel: BetSelection) => void;
  removeSelection: (outcomeId: string) => void;
  toggleSelection: (sel: BetSelection) => void;
  setStake: (amount: number) => void;
  clearSlip: () => void;
  toggleOpen: () => void;
  potentialWin: () => number;
  combinedOdds: () => number;
  hasSelection: (outcomeId: string) => boolean;
}

export const useBetSlipStore = create<BetSlipState>((set, get) => ({
  selections: [],
  stake: 100,
  isOpen: false,

  addSelection: (sel) => {
    const { selections } = get();
    // Replace if same market (can't bet on two outcomes of same market)
    const filtered = selections.filter((s) => s.marketId !== sel.marketId);
    set({ selections: [...filtered, sel], isOpen: true });
  },

  removeSelection: (outcomeId) => {
    set((state) => ({
      selections: state.selections.filter((s) => s.outcomeId !== outcomeId),
    }));
  },

  toggleSelection: (sel) => {
    const { selections } = get();
    const exists = selections.find((s) => s.outcomeId === sel.outcomeId);
    if (exists) {
      get().removeSelection(sel.outcomeId);
    } else {
      get().addSelection(sel);
    }
  },

  setStake: (amount) => set({ stake: amount }),

  clearSlip: () => set({ selections: [], stake: 100 }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  potentialWin: () => {
    const { selections, stake } = get();
    if (!selections.length) return 0;
    const combined = selections.reduce((acc, s) => acc * s.odds, 1);
    return parseFloat((stake * combined).toFixed(2));
  },

  combinedOdds: () => {
    const { selections } = get();
    return parseFloat(selections.reduce((acc, s) => acc * s.odds, 1).toFixed(4));
  },

  hasSelection: (outcomeId) => {
    return get().selections.some((s) => s.outcomeId === outcomeId);
  },
}));
