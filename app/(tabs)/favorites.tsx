import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavorites } from '../../hooks/useFavorites';
import { FavoritePokemon } from '../../types/pokemon';
import { getTypeStyle } from '../../constants/typeStyles';
import { formatPokemonId } from '../../utils/pokemon';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, removeFavorite } = useFavorites();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (favorites.length > 0) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [favorites.length]);

  const renderItem = ({ item }: { item: FavoritePokemon }) => {
    const mainType = item.types[0] ?? 'normal';
    const style = getTypeStyle(mainType);

    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: style.bg,
        borderRadius: 18,
        marginHorizontal: 16,
        marginVertical: 5,
        padding: 12,
        borderWidth: 0.5,
        borderColor: style.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}>
        <Image
          source={{ uri: item.image }}
          style={{ width: 68, height: 68, resizeMode: 'contain' }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 10, color: '#aaa', fontWeight: '600' }}>
            {formatPokemonId(item.id)}
          </Text>
          <Text style={{
            fontSize: 16,
            fontWeight: '800',
            textTransform: 'capitalize',
            color: '#111',
            marginBottom: 6,
            letterSpacing: -0.3,
          }}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {item.types.map((type) => {
              const ts = getTypeStyle(type);
              return (
                <View key={type} style={{
                  backgroundColor: ts.badge,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 20,
                }}>
                  <Text style={{ color: ts.badgeText, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' }}>
                    {type}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => removeFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ backgroundColor: '#FFE8E8', borderRadius: 20, padding: 8 }}
        >
          <Text style={{ fontSize: 16 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (favorites.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
        <View style={{
          backgroundColor: '#E3350D',
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 20,
        }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>
            Favoritos
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
            0 pokémons salvos
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.Text style={{ fontSize: 72, transform: [{ translateY: floatAnim }] }}>
            💔
          </Animated.Text>
          <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 24, color: '#111' }}>
            Nenhum favorito ainda
          </Text>
          <Text style={{ color: '#999', marginTop: 6, textAlign: 'center', paddingHorizontal: 40, fontSize: 14 }}>
            Toque no coração de qualquer pokémon para adicioná-lo aqui
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <View style={{
        backgroundColor: '#E3350D',
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
        paddingBottom: 20,
      }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>
          Favoritos
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
          {favorites.length} pokémon{favorites.length !== 1 ? 's' : ''} salvos
        </Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
      />
    </View>
  );
}