import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Credentials } from '@/types';

const STORAGE_KEY = 'opnsense_credentials';

interface CredentialsState {
  credentials: Credentials | null;
  isLoading: boolean;
  load: () => Promise<void>;
  save: (creds: Credentials) => Promise<void>;
  clear: () => Promise<void>;
}

export const useCredentialsStore = create<CredentialsState>((set) => ({
  credentials: null,
  isLoading: true,

  load: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      set({ credentials: raw ? JSON.parse(raw) : null, isLoading: false });
    } catch {
      set({ credentials: null, isLoading: false });
    }
  },

  save: async (creds: Credentials) => {
    const normalized: Credentials = {
      ...creds,
      host: creds.host.replace(/\/$/, ''),
    };
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(normalized));
    set({ credentials: normalized });
  },

  clear: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    set({ credentials: null });
  },
}));
