import { create } from 'zustand';

export interface SlipSelection {
  outcomeId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  outcomeName: string;
  marketName: string;
  odds: number;
}

interface BetSlipState {
  selections: SlipSelection[];
  stake: number;
  isOpen: boolean;

  // Computed
  potentialWin: () => number;
  totalOdds: () => number;

  // Actions
  addSelection: (selection: SlipSelection) => void;
  removeSelection: (outcomeId: string) => void;
  toggleSelection: (selection: SlipSelection) => void;
  hasSelection: (outcomeId: string) => boolean;
  setStake: (stake: number) => void;
  clearSlip: () => void;
  openSlip: () => void;
  closeSlip: () => void;
}

export const useBetSlipStore = create<BetSlipState>((set, get) => ({
  selections: [],
  stake: 0,
  isOpen: false,

  potentialWin: () => {
    const { selections, stake } = get();
    if (selections.length === 0 || stake <= 0) return 0;
    const combined = selections.reduce((acc, s) => acc * s.odds, 1);
    return parseFloat((combined * stake).toFixed(2));
  },

  totalOdds: () => {
    const { selections } = get();
    if (selections.length === 0) return 1;
    return parseFloat(
      selections.reduce((acc, s) => acc * s.odds, 1).toFixed(2),
    );
  },

  addSelection: (selection: SlipSelection) => {
    set((state) => {
      // Prevent duplicate outcome — replace same match's selection
      const filtered = state.selections.filter(
        (s) => s.matchId !== selection.matchId,
      );
      return {
        selections: [...filtered, selection],
        isOpen: true,
      };
    });
  },

  removeSelection: (outcomeId: string) => {
    set((state) => {
      const selections = state.selections.filter(
        (s) => s.outcomeId !== outcomeId,
      );
      return {
        selections,
        isOpen: selections.length > 0 ? state.isOpen : false,
      };
    });
  },

  toggleSelection: (selection: SlipSelection) => {
    const { hasSelection, addSelection, removeSelection } = get();
    if (hasSelection(selection.outcomeId)) {
      removeSelection(selection.outcomeId);
    } else {
      addSelection(selection);
    }
  },

  hasSelection: (outcomeId: string) => {
    return get().selections.some((s) => s.outcomeId === outcomeId);
  },

  setStake: (stake: number) => set({ stake }),

  clearSlip: () => set({ selections: [], stake: 0, isOpen: false }),

  openSlip: () => set({ isOpen: true }),

  closeSlip: () => set({ isOpen: false }),
}));
