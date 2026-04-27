import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoritePokemon } from '../types/pokemon';

const STORAGE_KEY = '@pokedex:favorites';

interface FavoritesStore {
  favorites: FavoritePokemon[];
  isLoading: boolean;
  loadFavorites: () => Promise<void>;
  addFavorite: (pokemon: FavoritePokemon) => Promise<void>;
  removeFavorite: (id: number) => Promise<void>;
  isFavorite: (id: number) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],
  isLoading: true,

  loadFavorites: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ favorites: JSON.parse(stored), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  addFavorite: async (pokemon) => {
    const updated = [...get().favorites, pokemon];
    set({ favorites: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  removeFavorite: async (id) => {
    const updated = get().favorites.filter((p) => p.id !== id);
    set({ favorites: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  isFavorite: (id) => {
    return get().favorites.some((p) => p.id === id);
  },
}));