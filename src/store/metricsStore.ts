import { create } from 'zustand';

const MAX_POINTS = 60; // 60 × 5s = 5 minutes

interface MetricsState {
  cpu: number[];
  ram: number[];
  addMetric: (cpu: number, ram: number) => void;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  cpu: [],
  ram: [],

  addMetric: (cpu, ram) =>
    set((state) => ({
      cpu: [...state.cpu, cpu].slice(-MAX_POINTS),
      ram: [...state.ram, ram].slice(-MAX_POINTS),
    })),
}));
