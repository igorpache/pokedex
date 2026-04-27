import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getPokemonDetail, getPokemonList, getPokemonTypes } from '../services/pokeapi';
import { Pokemon } from '../types/pokemon';

export const usePokemonList = () => {
  return useInfiniteQuery({
    queryKey: ['pokemon-list'],
    queryFn: ({ pageParam = 0 }) => getPokemonList(pageParam, 20),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
  });
};

export const usePokemonDetail = (nameOrId: string | number) => {
  return useQuery({
    queryKey: ['pokemon', nameOrId],
    queryFn: () => getPokemonDetail(nameOrId),
    enabled: !!nameOrId,
  });
};

export const usePokemonTypes = () => {
  return useQuery({
    queryKey: ['pokemon-types'],
    queryFn: getPokemonTypes,
  });
};
