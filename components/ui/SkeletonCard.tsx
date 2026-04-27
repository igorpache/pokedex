import React, { useEffect, useRef } from 'react';
import { Animated, View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export const SkeletonCard = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <View style={{
      width: CARD_WIDTH,
      margin: 6,
      borderRadius: 18,
      backgroundColor: '#F0F0F0',
      padding: 12,
      borderWidth: 0.5,
      borderColor: '#E8E8E8',
    }}>
      <Animated.View style={{ height: 10, width: 30, marginBottom: 6, borderRadius: 4, backgroundColor: '#D0D0D0', opacity }} />
      <Animated.View style={{ height: 90, width: '100%' as any, marginBottom: 10, borderRadius: 10, backgroundColor: '#D0D0D0', opacity }} />
      <Animated.View style={{ height: 12, width: CARD_WIDTH * 0.7, marginBottom: 8, borderRadius: 4, backgroundColor: '#D0D0D0', opacity }} />
      <Animated.View style={{ height: 22, width: 60, borderRadius: 20, backgroundColor: '#D0D0D0', opacity }} />
    </View>
  );
};