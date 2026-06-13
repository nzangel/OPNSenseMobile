import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Firewall } from '@/types';

const STORAGE_KEY = 'opnsense_firewalls';
const SELECTED_KEY = 'opnsense_selected_id';

// Couleurs disponibles pour différencier les firewalls
export const FIREWALL_COLORS = [
  '#d97706', // amber
  '#2563eb', // blue
  '#16a34a', // green
  '#dc2626', // red
  '#9333ea', // purple
  '#0891b2', // cyan
];

interface FirewallsState {
  firewalls: Firewall[];
  selectedId: string | null;
  isLoading: boolean;
  isSwitching: boolean;

  load: () => Promise<void>;
  add: (fw: Omit<Firewall, 'id' | 'color'>) => Promise<Firewall>;
  update: (id: string, changes: Partial<Firewall>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  select: (id: string) => Promise<void>;
  clear: () => Promise<void>;

  // Helpers
  selected: () => Firewall | null;
  haGroups: () => Record<string, Firewall[]>;
}

export const useFirewallsStore = create<FirewallsState>((set, get) => ({
  firewalls: [],
  selectedId: null,
  isLoading: true,
  isSwitching: false,

  load: async () => {
    try {
      const [rawFw, selectedId] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEY),
        SecureStore.getItemAsync(SELECTED_KEY),
      ]);
      const firewalls: Firewall[] = rawFw ? JSON.parse(rawFw) : [];
      const validId = firewalls.find(f => f.id === selectedId)?.id ?? firewalls[0]?.id ?? null;
      set({ firewalls, selectedId: validId, isLoading: false });
    } catch {
      set({ firewalls: [], selectedId: null, isLoading: false });
    }
  },

  add: async (fw) => {
    const { firewalls } = get();
    const color = FIREWALL_COLORS[firewalls.length % FIREWALL_COLORS.length];
    const newFw: Firewall = {
      ...fw,
      id: Date.now().toString(),
      host: fw.host.replace(/\/$/, ''),
      color,
    };
    const updated = [...firewalls, newFw];
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
    // Sélectionne automatiquement si c'est le premier
    const selectedId = firewalls.length === 0 ? newFw.id : get().selectedId;
    if (firewalls.length === 0) {
      await SecureStore.setItemAsync(SELECTED_KEY, newFw.id);
    }
    set({ firewalls: updated, selectedId });
    return newFw;
  },

  update: async (id, changes) => {
    const updated = get().firewalls.map(f => f.id === id ? { ...f, ...changes } : f);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
    set({ firewalls: updated });
  },

  remove: async (id) => {
    const updated = get().firewalls.filter(f => f.id !== id);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
    const selectedId = get().selectedId === id ? (updated[0]?.id ?? null) : get().selectedId;
    if (selectedId) await SecureStore.setItemAsync(SELECTED_KEY, selectedId);
    set({ firewalls: updated, selectedId });
  },

  select: async (id) => {
    await SecureStore.setItemAsync(SELECTED_KEY, id);
    set({ selectedId: id, isSwitching: true });
    // L'overlay se ferme automatiquement après 1.8s max
    // (les queries auront eu le temps de se déclencher)
    setTimeout(() => set({ isSwitching: false }), 1800);
  },

  clear: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEY),
      SecureStore.deleteItemAsync(SELECTED_KEY),
    ]);
    set({ firewalls: [], selectedId: null });
  },

  selected: () => {
    const { firewalls, selectedId } = get();
    return firewalls.find(f => f.id === selectedId) ?? null;
  },

  haGroups: () => {
    const groups: Record<string, Firewall[]> = {};
    for (const fw of get().firewalls) {
      if (fw.haGroupId) {
        if (!groups[fw.haGroupId]) groups[fw.haGroupId] = [];
        groups[fw.haGroupId].push(fw);
      }
    }
    return groups;
  },
}));
