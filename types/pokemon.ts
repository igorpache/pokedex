export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonSprites {
  front_default: string;
  front_shiny: string;
  other: {
    'official-artwork': {
      front_default: string;
      front_shiny: string;
    };
  };
}

export interface PokemonStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

export interface Pokemon {
  id: number;
  name: string;
  types: PokemonType[];
  sprites: PokemonSprites;
  height: number;
  weight: number;
  stats: PokemonStat[];
  base_experience: number;
  abilities: PokemonAbility[];
}

export interface FavoritePokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
}

export interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
}

export interface AbilityDetail {
  name: string;
  effect_entries: {
    effect: string;
    short_effect: string;
    language: { name: string };
  }[];
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version_group: { name: string };
  }[];
}
