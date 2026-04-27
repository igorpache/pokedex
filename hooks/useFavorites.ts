import { useEffect } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';

export const useFavorites = () => {
  const store = useFavoritesStore();

  useEffect(() => {
    store.loadFavorites();
  }, []);

  return store;
};