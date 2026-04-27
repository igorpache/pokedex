import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { usePokemonDetail } from '../../hooks/usePokemon';
import { useFavorites } from '../../hooks/useFavorites';
import { FavoritePokemon } from '../../types/pokemon';
import { getTypeStyle } from '../../constants/typeStyles';
import { getPokemonImage, formatPokemonId } from '../../utils/pokemon';
import { getPokemonSpecies, getEvolutionChain, getAbilityDetail, getTypeDetail } from '../../services/pokeapi';

const { width } = Dimensions.get('window');

const STAT_COLORS: Record<string, string> = {
  hp: '#FF5959',
  attack: '#F5AC78',
  defense: '#FAE078',
  'special-attack': '#9DB7F5',
  'special-defense': '#A7DB8D',
  speed: '#FA92B2',
};

const AnimatedStatBar = ({ value, color }: { value: number; color: string }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value / 255,
      duration: 800,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, []);

  const barWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ height: 6, backgroundColor: '#F0F0F0', borderRadius: 3 }}>
      <Animated.View style={{ height: 6, borderRadius: 3, backgroundColor: color, width: barWidth }} />
    </View>
  );
};

const parseEvolutionChain = (chain: any): { id: number; name: string }[] => {
  const evolutions: { id: number; name: string }[] = [];
  let current = chain;
  while (current) {
    const id = Number(current.species.url.split('/').filter(Boolean).pop());
    evolutions.push({ id, name: current.species.name });
    current = current.evolves_to?.[0] ?? null;
  }
  return evolutions;
};

const calculateWeaknesses = (typeData: any[]): { weak: string[]; resistant: string[]; immune: string[] } => {
  const weak: Record<string, number> = {};
  typeData.forEach((td) => {
    td.damage_relations.double_damage_from.forEach((t: any) => {
      weak[t.name] = (weak[t.name] ?? 1) * 2;
    });
    td.damage_relations.half_damage_from.forEach((t: any) => {
      weak[t.name] = (weak[t.name] ?? 1) * 0.5;
    });
    td.damage_relations.no_damage_from.forEach((t: any) => {
      weak[t.name] = 0;
    });
  });
  return {
    weak: Object.entries(weak).filter(([, v]) => v >= 2).map(([k]) => k),
    resistant: Object.entries(weak).filter(([, v]) => v > 0 && v < 1).map(([k]) => k),
    immune: Object.entries(weak).filter(([, v]) => v === 0).map(([k]) => k),
  };
};

export default function PokemonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: pokemon, isLoading } = usePokemonDetail(id);
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [selectedAbilityUrl, setSelectedAbilityUrl] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isShiny, setIsShiny] = useState(false);
  const modalAnim = useRef(new Animated.Value(0)).current;

  const { data: species } = useQuery({
    queryKey: ['species', id],
    queryFn: () => getPokemonSpecies(Number(id)),
    enabled: !!id,
  });

  const { data: evolutionChain } = useQuery({
    queryKey: ['evolution', species?.evolution_chain?.url],
    queryFn: () => getEvolutionChain(species.evolution_chain.url),
    enabled: !!species?.evolution_chain?.url,
  });

  const { data: typeDetails } = useQuery({
    queryKey: ['type-details', pokemon?.types?.map((t) => t.type.name).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        pokemon!.types.map((t) => getTypeDetail(t.type.url))
      );
      return results;
    },
    enabled: !!pokemon?.types,
  });

  const { data: abilityDetail, isLoading: isLoadingAbility } = useQuery({
    queryKey: ['ability', selectedAbilityUrl],
    queryFn: () => getAbilityDetail(selectedAbilityUrl!),
    enabled: !!selectedAbilityUrl,
  });

  const evolutions = evolutionChain ? parseEvolutionChain(evolutionChain.chain) : [];
  const weaknesses = typeDetails ? calculateWeaknesses(typeDetails) : { weak: [], resistant: [], immune: [] };

  const pokedexEntry = species?.flavor_text_entries
    ?.find((e: any) => e.language.name === 'en')
    ?.flavor_text?.replace(/\f/g, ' ') ?? '';

  const category = species?.genera
    ?.find((g: any) => g.language.name === 'en')
    ?.genus ?? '';

  const generation = species?.generation?.name
    ? species.generation.name.replace('-', ' ').toUpperCase()
    : '';

  const imageAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!pokemon) return;
    Animated.parallel([
      Animated.spring(imageScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(imageAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }),
    ]).start();
  }, [pokemon]);

  const openAbilityModal = (url: string) => {
    setSelectedAbilityUrl(url);
    setModalVisible(true);
    modalAnim.setValue(0);
    Animated.spring(modalAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => setModalVisible(false));
  };

  if (isLoading || !pokemon) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F7F7' }}>
        <Text style={{ fontSize: 48 }}>⏳</Text>
        <Text style={{ color: '#999', marginTop: 8 }}>Carregando...</Text>
      </View>
    );
  }

  const mainType = pokemon.types[0]?.type.name ?? 'normal';
  const style = getTypeStyle(mainType);
  const image = getPokemonImage(pokemon.id);
  const shinyImage = pokemon.sprites.other['official-artwork'].front_shiny ?? image;
  const favorited = isFavorite(pokemon.id);

  const handleFavorite = () => {
    if (favorited) {
      removeFavorite(pokemon.id);
    } else {
      const fav: FavoritePokemon = {
        id: pokemon.id,
        name: pokemon.name,
        image,
        types: pokemon.types.map((t) => t.type.name),
      };
      addFavorite(fav);
    }
  };

  const abilityDescription = abilityDetail?.effect_entries?.find(
    (e: any) => e.language.name === 'en'
  )?.short_effect ?? '';

  const abilityFlavorText = abilityDetail?.flavor_text_entries?.find(
    (e: any) => e.language.name === 'en'
  )?.flavor_text ?? '';

  const SectionTitle = ({ title }: { title: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <View style={{ width: 3, height: 16, backgroundColor: style.badge, borderRadius: 2 }} />
      <Text style={{ fontSize: 16, fontWeight: '800', color: '#111' }}>{title}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: style.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 20, padding: 8 }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: '#aaa', fontWeight: '600' }}>
            {formatPokemonId(pokemon.id)}
          </Text>
          <TouchableOpacity
            onPress={handleFavorite}
            style={{ backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 20, padding: 8 }}
          >
            <Text style={{ fontSize: 18 }}>{favorited ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Categoria e geração */}
        <Animated.View style={{
          alignItems: 'center',
          paddingTop: 4,
          opacity: imageAnim,
          transform: [{ translateY: imageAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {category ? (
              <Text style={{ fontSize: 12, color: '#aaa', fontWeight: '600' }}>{category}</Text>
            ) : null}
            {generation ? (
              <Text style={{ fontSize: 12, color: '#aaa', fontWeight: '600' }}>· {generation}</Text>
            ) : null}
          </View>

          <Text style={{ fontSize: 30, fontWeight: '800', textTransform: 'capitalize', color: '#111', letterSpacing: -0.5 }}>
            {pokemon.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            {pokemon.types.map((t) => {
              const ts = getTypeStyle(t.type.name);
              return (
                <View key={t.type.name} style={{ backgroundColor: ts.badge, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                  <Text style={{ color: ts.badgeText, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
                    {t.type.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Imagem com botão shiny */}
        <Animated.View style={{ alignSelf: 'center', opacity: imageAnim, transform: [{ scale: imageScale }] }}>
          <Image
            source={{ uri: isShiny ? shinyImage : image }}
            style={{ width: width * 0.55, height: width * 0.55, resizeMode: 'contain' }}
          />
        </Animated.View>

        {/* Botão shiny fora da imagem */}
        <TouchableOpacity
          onPress={() => setIsShiny(!isShiny)}
          style={{
            alignSelf: 'center',
            marginTop: 8,
            marginBottom: 4,
            backgroundColor: isShiny ? '#FFD700' : '#fff',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 6,
            elevation: 3,
            borderWidth: 1,
            borderColor: isShiny ? '#FFD700' : '#eee',
          }}
        >
          <Text style={{ fontSize: 16 }}>✨</Text>
          <Text style={{ fontSize: 13, fontWeight: '800', color: isShiny ? '#7a5f00' : '#333' }}>
            {isShiny ? 'Modo Shiny!' : 'Ver Shiny'}
          </Text>
        </TouchableOpacity>

        {/* Descrição do Pokédex */}
        {pokedexEntry ? (
          <Animated.View style={{ marginHorizontal: 16, marginBottom: 16, opacity: contentAnim }}>
            <Text style={{ fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'center', fontStyle: 'italic' }}>
              "{pokedexEntry}"
            </Text>
          </Animated.View>
        ) : null}

        {/* Card info */}
        <Animated.View style={{
          backgroundColor: '#fff',
          borderRadius: 32,
          marginHorizontal: 16,
          padding: 24,
          marginBottom: 16,
          borderWidth: 0.5,
          borderColor: style.border,
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }}>
          {/* Altura, Peso, XP, Captura, Felicidade */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111' }}>{pokemon.height * 10} cm</Text>
              <Text style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>Altura</Text>
            </View>
            <View style={{ width: 0.5, backgroundColor: '#eee' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111' }}>{pokemon.weight / 10} kg</Text>
              <Text style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>Peso</Text>
            </View>
            <View style={{ width: 0.5, backgroundColor: '#eee' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111' }}>{pokemon.base_experience}</Text>
              <Text style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>XP base</Text>
            </View>
            {species?.capture_rate !== undefined && (
              <>
                <View style={{ width: 0.5, backgroundColor: '#eee' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#111' }}>{species.capture_rate}</Text>
                  <Text style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>Captura</Text>
                </View>
              </>
            )}
          </View>

          {/* Habilidades */}
          <SectionTitle title="Habilidades" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {pokemon.abilities.map((a) => (
              <TouchableOpacity
                key={a.ability.name}
                onPress={() => openAbilityModal(a.ability.url)}
                style={{
                  backgroundColor: style.bg,
                  borderWidth: 0.5,
                  borderColor: style.border,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'capitalize', color: '#333' }}>
                  {a.ability.name.replace(/-/g, ' ')}
                </Text>
                {a.is_hidden && <Text style={{ fontSize: 10, color: style.badge }}>✦</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Base Stats */}
          <SectionTitle title="Base Stats" />
          {pokemon.stats.map((stat) => (
            <View key={stat.stat.name} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 13, color: '#aaa', textTransform: 'capitalize', width: 140 }}>
                  {stat.stat.name.replace(/-/g, ' ')}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#111' }}>{stat.base_stat}</Text>
              </View>
              <AnimatedStatBar value={stat.base_stat} color={STAT_COLORS[stat.stat.name] ?? '#ccc'} />
            </View>
          ))}
        </Animated.View>

        {/* Fraquezas e Resistências */}
        {typeDetails && (
          <Animated.View style={{
            backgroundColor: '#fff',
            borderRadius: 32,
            marginHorizontal: 16,
            padding: 24,
            marginBottom: 16,
            borderWidth: 0.5,
            borderColor: style.border,
            opacity: contentAnim,
          }}>
            {weaknesses.weak.length > 0 && (
              <>
                <SectionTitle title="Fraquezas" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                  {weaknesses.weak.map((type) => {
                    const ts = getTypeStyle(type);
                    return (
                      <View key={type} style={{ backgroundColor: ts.badge, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                        <Text style={{ color: ts.badgeText, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{type}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
            {weaknesses.resistant.length > 0 && (
              <>
                <SectionTitle title="Resistências" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: weaknesses.immune.length > 0 ? 20 : 0 }}>
                  {weaknesses.resistant.map((type) => {
                    const ts = getTypeStyle(type);
                    return (
                      <View key={type} style={{ backgroundColor: ts.bg, borderWidth: 0.5, borderColor: ts.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                        <Text style={{ color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{type}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
            {weaknesses.immune.length > 0 && (
              <>
                <SectionTitle title="Imunidades" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {weaknesses.immune.map((type) => (
                    <View key={type} style={{ backgroundColor: '#F0F0F0', borderWidth: 0.5, borderColor: '#ddd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                      <Text style={{ color: '#888', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{type}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Animated.View>
        )}

        {/* Evoluções */}
        {evolutions.length > 1 && (
          <Animated.View style={{
            backgroundColor: '#fff',
            borderRadius: 32,
            marginHorizontal: 16,
            padding: 24,
            marginBottom: 24,
            borderWidth: 0.5,
            borderColor: style.border,
            opacity: contentAnim,
          }}>
            <SectionTitle title="Evoluções" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
              {evolutions.map((evo, index) => (
                <React.Fragment key={evo.id}>
                  <TouchableOpacity
                    onPress={() => router.replace(`/pokemon/${evo.id}`)}
                    style={{ alignItems: 'center' }}
                  >
                    <View style={{
                      width: 72, height: 72, borderRadius: 36,
                      backgroundColor: evo.id === pokemon.id ? style.bg : '#F5F5F5',
                      borderWidth: evo.id === pokemon.id ? 2 : 0.5,
                      borderColor: evo.id === pokemon.id ? style.badge : '#eee',
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Image source={{ uri: getPokemonImage(evo.id) }} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
                    </View>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: evo.id === pokemon.id ? '800' : '600',
                      color: evo.id === pokemon.id ? style.badge : '#666',
                      textTransform: 'capitalize', marginTop: 4,
                    }}>
                      {evo.name}
                    </Text>
                  </TouchableOpacity>
                  {index < evolutions.length - 1 && (
                    <Text style={{ fontSize: 20, color: '#ccc', marginBottom: 16 }}>→</Text>
                  )}
                </React.Fragment>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Modal de habilidade */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            paddingBottom: insets.bottom + 24,
            transform: [{ translateY: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
          }}>
            <View style={{
              backgroundColor: style.bg,
              borderTopLeftRadius: 32, borderTopRightRadius: 32,
              padding: 24, paddingBottom: 20,
              borderBottomWidth: 0.5, borderBottomColor: style.border,
            }}>
              <TouchableOpacity
                style={{
                  position: 'absolute', top: 16, right: 16,
                  backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 20,
                  width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
                }}
                onPress={closeModal}
              >
                <Text style={{ fontSize: 14, color: '#666' }}>✕</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 22, fontWeight: '800', textTransform: 'capitalize', color: '#111', letterSpacing: -0.5 }}>
                {abilityDetail?.name?.replace(/-/g, ' ') ?? ''}
              </Text>
              {pokemon.abilities.find((a) => a.ability.url === selectedAbilityUrl)?.is_hidden && (
                <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                  <View style={{ backgroundColor: style.badge, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: style.badgeText }}>Oculta ✦</Text>
                  </View>
                </View>
              )}
            </View>
            <View style={{ padding: 24 }}>
              {isLoadingAbility ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <ActivityIndicator color={style.badge} />
                </View>
              ) : (
                <>
                  {abilityDescription ? (
                    <View style={{ marginBottom: 20 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <View style={{ width: 3, height: 16, backgroundColor: style.badge, borderRadius: 2 }} />
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#aaa', letterSpacing: 0.5 }}>EFEITO</Text>
                      </View>
                      <Text style={{ fontSize: 15, color: '#333', lineHeight: 22 }}>{abilityDescription}</Text>
                    </View>
                  ) : null}
                  {abilityFlavorText ? (
                    <View style={{ backgroundColor: style.bg, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: style.border }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <View style={{ width: 3, height: 16, backgroundColor: style.badge, borderRadius: 2 }} />
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#aaa', letterSpacing: 0.5 }}>DESCRIÇÃO</Text>
                      </View>
                      <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, fontStyle: 'italic' }}>
                        "{abilityFlavorText}"
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}