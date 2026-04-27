import axios from 'axios';
import { Pokemon, PokemonListItem, AbilityDetail } from '../types/pokemon';

const api = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
});

export const getPokemonList = async (offset = 0, limit = 20): Promise<PokemonListItem[]> => {
  const { data } = await api.get(`/pokemon?offset=${offset}&limit=${limit}`);
  return data.results;
};

export const getPokemonDetail = async (nameOrId: string | number): Promise<Pokemon> => {
  const { data } = await api.get(`/pokemon/${nameOrId}`);
  return data;
};

export const getPokemonTypes = async (): Promise<string[]> => {
  const { data } = await api.get('/type');
  return data.results.map((t: PokemonListItem) => t.name);
};

export const getPokemonSpecies = async (id: number) => {
  const { data } = await api.get(`/pokemon-species/${id}`);
  return data;
};

export const getEvolutionChain = async (url: string) => {
  const { data } = await axios.get(url);
  return data;
};

export const getAbilityDetail = async (url: string): Promise<AbilityDetail> => {
  const { data } = await axios.get(url);
  return data;
};

export const getTypeDetail = async (url: string) => {
  const { data } = await axios.get(url);
  return data;
};