import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePokemonTypes } from '../../hooks/usePokemon';
import { useFavorites } from '../../hooks/useFavorites';
import { getPokemonDetail, getPokemonList } from '../../services/pokeapi';
import { PokemonCard } from '../../components/ui/PokemonCard';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { FavoritePokemon, PokemonListItem } from '../../types/pokemon';
import { getPokemonImage, getPokemonIdFromUrl } from '../../utils/pokemon';
import axios from 'axios';

const getPokemonByType = async (type: string): Promise<PokemonListItem[]> => {
  const { data } = await axios.get(`https://pokeapi.co/api/v2/type/${type}`);
  return data.pokemon.map((p: any) => ({
    name: p.pokemon.name,
    url: p.pokemon.url,
  }));
};

export default function PokedexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingList,
  } = useInfiniteQuery({
    queryKey: ['pokemon-list'],
    queryFn: ({ pageParam = 0 }) => getPokemonList(pageParam, 20),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
  });

  const { data: typePokemons, isLoading: isLoadingType } = useQuery({
    queryKey: ['pokemon-type', selectedType],
    queryFn: () => getPokemonByType(selectedType!),
    enabled: !!selectedType,
  });

  const { data: allPokemon } = useQuery({
    queryKey: ['all-pokemon'],
    queryFn: () => getPokemonList(0, 1000),
    staleTime: Infinity,
  });

  const { data: types } = usePokemonTypes();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  const allItems: PokemonListItem[] = data?.pages.flat() ?? [];
  const baseList = selectedType ? (typePokemons ?? []) : allItems;
  const pokemonToShow = search.trim()
    ? (allPokemon ?? []).filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : baseList;

  const isLoading = isLoadingList || (!!selectedType && isLoadingType);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['pokemon-list'] });
    if (selectedType) {
      await queryClient.invalidateQueries({ queryKey: ['pokemon-type', selectedType] });
    }
    setRefreshing(false);
  }, [selectedType]);

  const handleFavorite = useCallback(
    async (item: PokemonListItem) => {
      const id = getPokemonIdFromUrl(item.url);
      if (isFavorite(id)) {
        removeFavorite(id);
      } else {
        const detail = await getPokemonDetail(id);
        const fav: FavoritePokemon = {
          id: detail.id,
          name: detail.name,
          image: getPokemonImage(detail.id),
          types: detail.types.map((t) => t.type.name),
        };
        addFavorite(fav);
      }
    },
    [isFavorite, removeFavorite, addFavorite]
  );

  const renderItem = ({ item }: { item: PokemonListItem }) => {
    const id = getPokemonIdFromUrl(item.url);
    const favData = favorites.find((f) => f.id === id);
    const displayPokemon: FavoritePokemon = favData ?? {
      id,
      name: item.name,
      image: getPokemonImage(id),
      types: [],
    };

    return (
      <PokemonCard
        pokemon={displayPokemon}
        isFavorite={isFavorite(id)}
        onFavoritePress={() => handleFavorite(item)}
        onPress={() => router.push(`/pokemon/${id}`)}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <View style={{
        backgroundColor: '#E3350D',
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
        paddingBottom: 14,
      }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 10 }}>
          Pokédex
        </Text>

        <View style={{
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 9,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Text style={{ marginRight: 8, fontSize: 14 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar pokémon..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{ flex: 1, fontSize: 14, color: '#fff' }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => setSelectedType(null)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: selectedType === null ? '#fff' : 'rgba(255,255,255,0.18)',
              marginRight: 8,
            }}
          >
            <Text style={{ color: selectedType === null ? '#E3350D' : '#fff', fontWeight: '700', fontSize: 12 }}>
              Todos
            </Text>
          </TouchableOpacity>

          {(types ?? [])
            .filter((t) => !['unknown', 'shadow'].includes(t))
            .map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type === selectedType ? null : type)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: selectedType === type ? '#fff' : 'rgba(255,255,255,0.18)',
                  marginRight: 8,
                }}
              >
                <Text style={{
                  color: selectedType === type ? '#E3350D' : '#fff',
                  fontWeight: '700',
                  fontSize: 12,
                  textTransform: 'capitalize',
                }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <FlatList
          data={Array(10).fill(null)}
          keyExtractor={(_, i) => `skeleton-${i}`}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 8 }}
          renderItem={() => <SkeletonCard />}
        />
      ) : (
        <FlatList
          data={pokemonToShow}
          keyExtractor={(item) => item.name}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 20 }}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={() => {
            if (hasNextPage && !search && !selectedType) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#E3350D" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', marginTop: 12 }}>
                Nenhum resultado
              </Text>
              <Text style={{ color: '#999', marginTop: 4 }}>
                Tente outro nome ou tipo
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}