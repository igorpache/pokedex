export const getPokemonImage = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export const getPokemonSprite = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export const getPokemonIdFromUrl = (url: string): number => {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
};

export const formatPokemonId = (id: number) => `#${String(id).padStart(3, '0')}`;