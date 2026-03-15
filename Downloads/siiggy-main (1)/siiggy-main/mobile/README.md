# SIIGGY Mobile App

React Native mobile application for SIIGGY - Visual Signals for Township Commerce.

## Features

✅ **Visual Signal Feed**
- 2-column thumbnail grid layout
- Real-time updates with pull-to-refresh
- Offline caching (last 50 signals)
- Distance and time indicators

✅ **Video Playback**
- Full-screen video player for signal videos
- Tap-to-play/pause controls
- Auto-looping videos
- Smooth playback with expo-av

✅ **Signal Posting**
- 3-step flow (context → media → details)
- Camera integration (photo & video up to 8 seconds)
- Gallery picker
- GPS auto-capture

✅ **Context Subscriptions**
- Grouped context picker (Food, Services, Goods)
- Visual selection with emojis
- Up to 15 subscriptions per user
- Notification toggle per context

✅ **Authentication**
- Register & Login
- Token-based auth with Laravel Sanctum
- Auto-login from stored credentials
- Profile management

## Tech Stack

- **Framework:** React Native with Expo 54
- **Navigation:** React Navigation 7 (Native Stack + Bottom Tabs)
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query
- **UI Components:** React Native Paper (Material Design 3)
- **Video:** Expo AV
- **Camera:** Expo Camera + Image Picker
- **Location:** Expo Location
- **Storage:** AsyncStorage

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for emulator)
- Physical device with Expo Go app (optional)

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set your backend API URL:

```env
# For physical device testing, use your computer's LAN IP
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api

# For emulator/simulator
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

**Finding your LAN IP:**
- **Windows:** `ipconfig` (look for IPv4 Address)
- **Mac/Linux:** `ifconfig` or `ip addr`

### 3. Start the App

```bash
npm start
```

Choose your platform:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app for physical device

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable components
│   │   ├── ContextPicker.tsx
│   │   ├── SignalCard.tsx
│   │   └── index.ts
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/         # Screen components
│   │   ├── FeedScreen.tsx
│   │   ├── SignalDetailScreen.tsx  # ✨ Video playback here
│   │   ├── PostSignalScreen.tsx
│   │   ├── SubscriptionsScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── index.ts
│   ├── services/        # API & storage
│   │   ├── api.ts
│   │   ├── storage.ts
│   │   └── index.ts
│   ├── store/           # State management (Zustand)
│   │   └── index.ts
│   ├── theme/           # Theming & styles
│   │   ├── theme.ts
│   │   ├── paperTheme.ts
│   │   └── index.ts
│   └── types/           # TypeScript types
│       └── index.ts
├── App.tsx              # Root component
├── index.ts             # Entry point
└── package.json
```

## Key Features Implementation

### Video Playback (SignalDetailScreen)

The video player includes:
- **Tap-to-play/pause controls** - Simple interaction
- **Play overlay** - Shows play button when paused
- **Auto-looping** - Videos loop continuously
- **No native controls** - Custom UI for consistency
- **Proper aspect ratio** - Videos display correctly

```typescript
<Video
  ref={videoRef}
  source={{ uri: signal.media_url }}
  style={styles.media}
  resizeMode={ResizeMode.CONTAIN}
  shouldPlay={false}
  isLooping
  onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
  useNativeControls={false}
/>
```

### Offline Support

Signals are automatically cached locally:
- Last 50 signals saved to AsyncStorage
- Feed loads from cache when offline
- Seamless transition between online/offline

### Feed Scoring

The feed algorithm prioritizes signals based on:
- **Distance** (closer = higher priority)
- **Subscriptions** (5x boost for subscribed contexts)
- **Visual content** (3x for video, 2x for photo)
- **Freshness** (newer signals ranked higher)

## Permissions Required

The app requires these permissions:
- **Camera** - For taking photos/videos
- **Photo Library** - For selecting media
- **Location** - For nearby signals and posting

Permissions are requested at runtime when needed.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API endpoint | `http://192.168.1.100:8000/api` |

## Development Tips

### Testing on Physical Device

1. Ensure device and computer are on same WiFi network
2. Use your computer's LAN IP in `EXPO_PUBLIC_API_URL`
3. Make sure backend is running and accessible
4. Firewall should allow connections on port 8000

### Debug Menu

- **iOS Simulator:** Cmd + D
- **Android Emulator:** Cmd/Ctrl + M
- **Physical Device:** Shake the device

### Clear Cache

```bash
npm start -- --clear
```

## API Integration

The app talks to the Laravel backend via REST API:

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/register` | User registration |
| `POST /auth/login` | User login |
| `GET /signals` | Get personalized feed |
| `POST /signals` | Create new signal |
| `GET /contexts` | Get all contexts |
| `POST /subscriptions` | Subscribe to context |
| `POST /signals/{id}/view` | Track signal view |
| `POST /signals/{id}/tap` | Track signal interaction |

API client is in `src/services/api.ts` with automatic token handling.

## Troubleshooting

**Video not playing:**
- Check media_url is accessible from your device
- Ensure backend storage is properly configured
- Backend must run `php artisan storage:link`

**Can't connect to API:**
- Verify API_URL in .env matches backend address
- Check firewall isn't blocking port 8000
- Use LAN IP (not localhost) for physical devices

**Location not working:**
- Grant location permissions when prompted
- Check device location services are enabled
- iOS Simulator: Features → Location → Custom Location

**Build errors:**
- Clear cache: `npm start -- --clear`
- Reinstall deps: `rm -rf node_modules && npm install`
- Reset metro: `npx react-native start --reset-cache`

## Theme Customization

Colors are defined in `src/theme/theme.ts`:

```typescript
export const colors = {
  primary: '#435977',      // Blue-gray
  secondary: '#d17a0d',    // Orange
  // ... more colors
};
```

Update these to match your brand.

## Building for Production

### Android

```bash
eas build --platform android
```

### iOS

```bash
eas build --platform ios
```

Requires Expo EAS account. See [Expo documentation](https://docs.expo.dev/build/introduction/) for details.

## Contributing

See main project README.md for contribution guidelines.

## License

Proprietary software. All rights reserved.

---

**SIIGGY Mobile** - Visual proof of what's available right now. 📱
