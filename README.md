# Pokédex App 🔴

App desenvolvido em React Native com Expo. Conta com listagem completa de Pokémons, mapa interativo com localização real e sistema de favoritos persistente.

## 📱 Telas

| Pokédex | Mapa | Favoritos |
|--------|---------|------|-----------|
| Lista completa com busca e filtro por tipo | Informações detalhadas, evoluções, habilidades, fraquezas e modo shiny | Mapa com Pokémons ao redor da sua localização | Lista dos favoritos salvos localmente |

## ✅ Requisitos atendidos

### Aba Lista
- ✅ Lista de Pokémons consumindo a PokeAPI
- ✅ Exibe nome, imagem e tipo
- ✅ Busca por nome em tempo real
- ✅ Filtro por tipo (Fogo, Água, Grama, etc.)
- ✅ Infinite scroll (load more)
- ✅ Skeleton loading
- ✅ Tratamento de erro
- ✅ Favoritar/desfavoritar direto do card

### Aba Mapa
- ✅ Mapa interativo via OpenStreetMap
- ✅ Localização atual do usuário
- ✅ 10 Pokémons aleatórios gerados ao redor do usuário
- ✅ Zoom em pin aleatório ao focar na aba
- ✅ Pokémons rodam a cada 30 segundos (um some, outro aparece)
- ✅ Card com nome, imagem e localização ao clicar no pin

### Aba Favoritos
- ✅ Listagem dos Pokémons favoritados
- ✅ Remover dos favoritos
- ✅ Persistência local com AsyncStorage

## 🚀 Como rodar

### Pré-requisitos
- Node.js 18+
- Expo Go instalado no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Instalação

```bash
# Clone o repositório
git clone https://github.com/igorpache/pokedex.git
cd pokedex

# Instale as dependências
npm install --legacy-peer-deps

# Inicie o servidor
npx expo start
```

---

### 📲 Opção 1 — Celular físico (Android ou iPhone)

1. Inicie o servidor com `npx expo start`
2. Pressione **`s`** no terminal para usar o **Expo Go**
3. **Android:** abra o Expo Go e escaneie o QR code
4. **iPhone:** aponte a câmera nativa para o QR code e toque na notificação

> Se estiver em redes diferentes, use `npx expo start --tunnel`

---

### 💻 Opção 2 — Emulador no computador

#### Pré-requisitos adicionais
- Android Studio instalado com um emulador configurado
- Java 17+ instalado

1. Abra o emulador no Android Studio
2. Inicie o servidor com `npx expo start`
3. Pressione **`a`** no terminal para abrir no emulador

## 🛠 Stack e decisões técnicas

| Tecnologia | Motivo |
|-----------|--------|
| **Expo Router** | File-based routing moderno, padrão atual do ecossistema Expo |
| **TanStack Query** | Cache automático, loading/error states, infinite scroll sem boilerplate |
| **Zustand** | Estado global simples e eficiente para favoritos — sem a complexidade do Redux |
| **AsyncStorage** | Persistência local nativa recomendada pelo Expo para dados simples |
| **react-native-webview + Leaflet** | Mapa gratuito via OpenStreetMap — sem API key, funciona no Expo Go em qualquer dispositivo |
| **Animated API** | Animações nativas sem libs externas — skeleton, bounce no pokémon, barras de stat |
| **TypeScript** | Tipagem completa em todo o projeto |

## 📁 Estrutura do projeto

```
app/
  (tabs)/
    index.tsx       # Aba Pokédex
    map.tsx         # Aba Mapa
    favorites.tsx   # Aba Favoritos
  pokemon/
    [id].tsx        # Tela de detalhe
components/ui/      # Componentes visuais reutilizáveis
constants/          # Estilos e cores dos tipos de Pokémon
hooks/              # Hooks customizados (usePokemon, useFavorites)
services/           # Chamadas à PokeAPI
store/              # Estado global com Zustand
types/              # Tipagem TypeScript
utils/              # Funções utilitárias
```

## ✨ Extras implementados

- Tela de detalhe com cadeia de evoluções, fraquezas, resistências e habilidades
- Modo Shiny para ver a versão alternativa do Pokémon
- Descrição do Pokédex e categoria de cada Pokémon
- Pins do mapa com animação de spawn
- Geocoding reverso — mostra o endereço aproximado do pin no mapa
- Pull to refresh na lista
- Empty state animado nos favoritos
- Barras de stat animadas na tela de detalhe