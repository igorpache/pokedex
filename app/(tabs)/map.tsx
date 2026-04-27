import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import axios from 'axios';

const POKE_IMAGE = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const POKE_SPRITE = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

const TOTAL_POKEMON = 898;
const ROTATION_INTERVAL = 30000;

const getRandomId = (excludeIds: number[]): number => {
  let id: number;
  do {
    id = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
  } while (excludeIds.includes(id));
  return id;
};

interface PinData {
  id: number;
  name: string;
  key: string;
  coordinate: { latitude: number; longitude: number };
}

const randomCoordinate = (lat: number, lng: number) => ({
  latitude: lat + (Math.random() - 0.5) * 0.05,
  longitude: lng + (Math.random() - 0.5) * 0.05,
});

const preloadImage = (uri: string): Promise<void> =>
  new Promise((resolve) => {
    Image.prefetch(uri).then(() => resolve()).catch(() => resolve());
  });

const generateMapHTML = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    @keyframes spawn {
      0% { transform: scale(0) rotate(-10deg); opacity: 0; }
      60% { transform: scale(1.3) rotate(5deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    .pokemon-marker {
      width: 48px;
      height: 48px;
      animation: spawn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .pokemon-marker img {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: none !important;
    }
    .leaflet-control-zoom-in,
    .leaflet-control-zoom-out {
      width: 40px !important;
      height: 40px !important;
      line-height: 40px !important;
      font-size: 18px !important;
      font-weight: 400 !important;
      color: #333 !important;
      background: #fff !important;
      border: none !important;
      border-radius: 50% !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
      margin-bottom: 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .leaflet-control-zoom-in:hover,
    .leaflet-control-zoom-out:hover {
      background: #f5f5f5 !important;
    }
.location-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #fff;
      border: none;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .location-btn:hover {
      background: #f5f5f5;
    }
    .leaflet-bottom.leaflet-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding-bottom: 24px;
      padding-right: 12px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const locationBtn = L.control({ position: 'bottomright' });
    locationBtn.onAdd = function() {
      const btn = L.DomUtil.create('button', 'location-btn');
      btn.innerHTML = '📍';
      L.DomEvent.on(btn, 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        map.flyTo([${lat}, ${lng}], 16, { animate: true, duration: 0.8 });
      });
      return btn;
    };
    locationBtn.addTo(map);

    const markers = {};

    L.circleMarker([${lat}, ${lng}], {
      radius: 10,
      fillColor: '#E3350D',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map).bindPopup('Você está aqui');

    window.addEventListener('updatePins', (e) => {
      Object.values(markers).forEach(m => map.removeLayer(m));
      Object.keys(markers).forEach(k => delete markers[k]);

      e.detail.forEach((pin, index) => {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'pokemon-marker';
          el.innerHTML = '<img src="' + pin.sprite + '" />';

          const icon = L.divIcon({
            html: el.outerHTML,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            className: '',
          });

          const marker = L.marker([pin.lat, pin.lng], { icon })
            .addTo(map)
            .on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: pin.id }));
            });
          markers[pin.id] = marker;
        }, index * 200);
      });
    });

    window.addEventListener('zoomTo', (e) => {
      map.flyTo([e.detail.lat, e.detail.lng], 16, { animate: true, duration: 0.8 });
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
  </script>
</body>
</html>
`;

export default function MapScreen() {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const [pins, setPins] = useState<PinData[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinData | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [mapReady, setMapReady] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  const pinsRef = useRef<PinData[]>([]);

  const fetchAndPreload = async (id: number): Promise<{ id: number; name: string } | null> => {
    try {
      const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
      await Promise.all([
        preloadImage(POKE_SPRITE(data.id)),
        preloadImage(POKE_IMAGE(data.id)),
      ]);
      return { id: data.id, name: data.name };
    } catch {
      return null;
    }
  };

  const initPins = async (lat: number, lng: number) => {
    const ids: number[] = [];
    while (ids.length < 10) {
      const id = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
      if (!ids.includes(id)) ids.push(id);
    }
    const results = await Promise.all(ids.map(fetchAndPreload));
    const newPins: PinData[] = results
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        name: p!.name,
        key: `${p!.id}-${Date.now()}`,
        coordinate: randomCoordinate(lat, lng),
      }));
    setPins(newPins);
    pinsRef.current = newPins;
  };

  const sendToMap = (action: string, payload: any) => {
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new CustomEvent('${action}', { detail: ${JSON.stringify(payload)} })); true;`
    );
  };

  const updateMapPins = (currentPins: PinData[]) => {
    sendToMap('updatePins', currentPins.map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.coordinate.latitude,
      lng: p.coordinate.longitude,
      sprite: POKE_SPRITE(p.id),
    })));
  };

  const zoomToPin = (pin: PinData) => {
    sendToMap('zoomTo', {
      lat: pin.coordinate.latitude,
      lng: pin.coordinate.longitude,
    });
  };

  const rotatePokemon = useCallback(async () => {
    const loc = locationRef.current;
    if (!loc || pinsRef.current.length === 0) return;
    const currentIds = pinsRef.current.map((p) => p.id);
    const newId = getRandomId(currentIds);
    const pokemon = await fetchAndPreload(newId);
    if (!pokemon) return;
    const removeIndex = Math.floor(Math.random() * pinsRef.current.length);
    const newPin: PinData = {
      id: pokemon.id,
      name: pokemon.name,
      key: `${pokemon.id}-${Date.now()}`,
      coordinate: randomCoordinate(loc.lat, loc.lng),
    };
    setPins((prev) => {
      const updated = [...prev];
      updated[removeIndex] = newPin;
      pinsRef.current = updated;
      return updated;
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError(true);
          setLoading(false);
          return;
        }
        let lat = -16.6869;
        let lng = -49.2648;
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        } catch {
          console.log('Usando localização padrão (Goiânia)');
        }
        locationRef.current = { lat, lng };
        setLocation({ lat, lng });
        setHtmlContent(generateMapHTML(lat, lng));
        setLoading(false);
        initPins(lat, lng);
      } catch {
        setError(true);
        setLoading(false);
      }
    })();
    const interval = setInterval(rotatePokemon, ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mapReady && pins.length > 0) {
      setTimeout(() => updateMapPins(pins), 500);
    }
  }, [pins, mapReady]);

  useFocusEffect(
    useCallback(() => {
      if (pinsRef.current.length === 0) return;
      const randomPin = pinsRef.current[Math.floor(Math.random() * pinsRef.current.length)];
      setTimeout(() => zoomToPin(randomPin), 500);
    }, [mapReady])
  );

  const showCard = async (pin: PinData) => {
    setSelectedPin(pin);
    setSelectedAddress('Buscando localização...');
    cardAnim.setValue(0);
    Animated.spring(cardAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: pin.coordinate.latitude,
        longitude: pin.coordinate.longitude,
      });
      if (result.length > 0) {
        const r = result[0];
        const parts = [r.street, r.district, r.city].filter(Boolean);
        setSelectedAddress(parts.join(', ') || 'Localização desconhecida');
      }
    } catch {
      setSelectedAddress('Localização desconhecida');
    }
  };

  const hideCard = () => {
    Animated.timing(cardAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => setSelectedPin(null));
  };

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerPress') {
        const pin = pinsRef.current.find((p) => p.id === data.id);
        if (pin) showCard(pin);
      }
      if (data.type === 'mapReady') {
        setMapReady(true);
      }
    } catch { }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E3350D" />
        <Text style={{ marginTop: 12, color: '#999' }}>Procurando pokémons...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48 }}>📍</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 12 }}>Permissão negada</Text>
        <Text style={{ color: '#999', marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }}>
          Permita o acesso à localização nas configurações do dispositivo
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {htmlContent ? (
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
          startInLoadingState
          renderLoading={() => (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
              <ActivityIndicator size="large" color="#E3350D" />
            </View>
          )}
        />
      ) : null}

      {/* Card info no topo */}
      <View style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>🗺️</Text>
        <View>
          <Text style={{ fontWeight: '700', fontSize: 14, color: '#111' }}>Pokémon por aí</Text>
          <Text style={{ color: '#999', fontSize: 11 }}>{pins.length} encontrados perto de você</Text>
        </View>
      </View>

      {/* Card do pokémon selecionado */}
      {selectedPin && (
        <Animated.View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 24,
          paddingBottom: insets.bottom + 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
          transform: [{
            translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }),
          }],
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{ uri: POKE_IMAGE(selectedPin.id) }}
              style={{ width: 100, height: 100, resizeMode: 'contain' }}
            />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 12, color: '#aaa', fontWeight: '600' }}>
                #{String(selectedPin.id).padStart(3, '0')}
              </Text>
              <Text style={{
                fontSize: 24,
                fontWeight: '800',
                textTransform: 'capitalize',
                color: '#111',
                letterSpacing: -0.5,
                marginTop: 2,
              }}>
                {selectedPin.name}
              </Text>
              <Text style={{ color: '#999', fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                📍 {selectedAddress}
              </Text>
            </View>
            <TouchableOpacity
              onPress={hideCard}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: '#F0F0F0',
                borderRadius: 20,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, color: '#999' }}>✕</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}