import { create } from 'zustand';
import type { DashboardCard } from '@/lib/db';
import type { DashboardChart } from '@/lib/db';

interface UIState {
  // Card Manager Sheet
  cardManagerOpen: boolean;
  editingCard: DashboardCard | null;
  deleteCardId: string | null;
  
  // Chart Manager Sheet
  chartManagerOpen: boolean;
  editingChart: DashboardChart | null;
  deleteChartId: string | null;
  
  // Actions
  openCardManager: () => void;
  closeCardManager: () => void;
  setEditingCard: (card: DashboardCard | null) => void;
  setDeleteCardId: (cardId: string | null) => void;
  
  openChartManager: () => void;
  closeChartManager: () => void;
  setEditingChart: (chart: DashboardChart | null) => void;
  setDeleteChartId: (chartId: string | null) => void;
  
  // Reset all
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  cardManagerOpen: false,
  editingCard: null,
  deleteCardId: null,
  chartManagerOpen: false,
  editingChart: null,
  deleteChartId: null,
  
  // Card Manager actions
  openCardManager: () => set({ cardManagerOpen: true }),
  closeCardManager: () => set({ 
    cardManagerOpen: false,
    editingCard: null,
  }),
  setEditingCard: (card) => set({ 
    editingCard: card,
    cardManagerOpen: card !== null,
  }),
  setDeleteCardId: (cardId) => set({ deleteCardId: cardId }),
  
  // Chart Manager actions
  openChartManager: () => set({ chartManagerOpen: true }),
  closeChartManager: () => set({ 
    chartManagerOpen: false,
    editingChart: null,
  }),
  setEditingChart: (chart) => set({ 
    editingChart: chart,
    chartManagerOpen: chart !== null,
  }),
  setDeleteChartId: (chartId) => set({ deleteChartId: chartId }),
  
  // Reset all
  reset: () => set({
    cardManagerOpen: false,
    editingCard: null,
    deleteCardId: null,
    chartManagerOpen: false,
    editingChart: null,
    deleteChartId: null,
  }),
}));

