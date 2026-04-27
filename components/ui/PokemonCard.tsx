import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getPokemonDetail } from '../../services/pokeapi';
import { FavoritePokemon } from '../../types/pokemon';
import { getTypeStyle } from '../../constants/typeStyles';
import { getPokemonImage, formatPokemonId } from '../../utils/pokemon';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface PokemonCardProps {
  pokemon: FavoritePokemon;
  isFavorite: boolean;
  onFavoritePress: () => void;
  onPress: () => void;
}

export const PokemonCard = ({
  pokemon,
  isFavorite,
  onFavoritePress,
  onPress,
}: PokemonCardProps) => {
  const heartScale = useRef(new Animated.Value(1)).current;
  const hasTypes = pokemon.types.length > 0;

  const { data: detail } = useQuery({
    queryKey: ['pokemon', pokemon.id],
    queryFn: () => getPokemonDetail(pokemon.id),
    enabled: !hasTypes,
    staleTime: Infinity,
  });

  const types = hasTypes
    ? pokemon.types
    : (detail?.types.map((t) => t.type.name) ?? []);

  const mainType = types[0] ?? 'normal';
  const style = getTypeStyle(mainType);

  const handleFavoritePress = () => {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.5,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
    onFavoritePress();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        width: CARD_WIDTH,
        margin: 6,
        borderRadius: 18,
        backgroundColor: style.bg,
        padding: 12,
        borderWidth: 0.5,
        borderColor: style.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <TouchableOpacity
        onPress={handleFavoritePress}
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Animated.Text style={{ fontSize: 18, transform: [{ scale: heartScale }] }}>
          {isFavorite ? '❤️' : '🤍'}
        </Animated.Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 10, color: '#aaa', fontWeight: '600', marginBottom: 2 }}>
        {formatPokemonId(pokemon.id)}
      </Text>

      <Image
        source={{ uri: getPokemonImage(pokemon.id) }}
        style={{ width: '100%', height: 90, resizeMode: 'contain' }}
      />

      <Text
        style={{
          fontSize: 13,
          fontWeight: '800',
          textTransform: 'capitalize',
          marginTop: 8,
          marginBottom: 6,
          color: '#111',
          letterSpacing: -0.3,
        }}
        numberOfLines={1}
      >
        {pokemon.name}
      </Text>

      {mainType ? (
        <View style={{
          alignSelf: 'flex-start',
          backgroundColor: style.badge,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 20,
        }}>
          <Text style={{
            color: style.badgeText,
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'capitalize',
          }}>
            {mainType}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};