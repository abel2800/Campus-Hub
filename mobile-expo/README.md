# Campus Hub — Expo Mobile (iOS & Android)

**Expo SDK 54** — works with **Expo Go 54.x** (e.g. 54.0.8 on your phone).

Run the full Campus Hub experience in **Expo Go** on iPhone or Android.

## Prerequisites

- Node.js 18+
- Backend running on your PC (`cd backend && npm run dev` → port **5000**)
- **Expo Go** installed from the App Store (iOS) or Play Store (Android)
- iPhone and PC on the **same Wi‑Fi** (or use tunnel mode below)

## Quick start

**Easiest — from project root (starts API + web + mobile together):**

```powershell
cd ..
npm run install:all   # first time only
npm start
```

**Mobile only:**

```powershell
cd mobile-expo
npm install
npx expo start --lan
```

Scan the QR code with **Expo Go** (iOS: Camera app → open link).

## iOS (iPhone)

1. Install **Expo Go** from the App Store.
2. Start the backend on your Windows/Mac PC.
3. From `mobile-expo`, run:
   ```powershell
   npx expo start --lan
   ```
4. Open Expo Go → scan QR code (same Wi‑Fi as your PC).
5. If login fails with “Network Error”:
   - Confirm backend is running: open `http://YOUR_PC_IP:5000` in Safari on your iPhone (you should get a response or 404, not a timeout).
   - Allow **Local Network** when iOS prompts (Settings → Expo Go → Local Network).
   - Use tunnel (works across networks):
     ```powershell
     npx expo start --tunnel
     ```

### API host

The app auto-detects your PC IP via Expo (`debuggerHost`). Override if needed:

Create `mobile-expo/.env`:

```
EXPO_PUBLIC_API_HOST=192.168.1.100
```

Replace with your PC’s LAN IP (`ipconfig` on Windows).

## Android

Same steps as iOS. Use Expo Go on Android and scan the QR code.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npx expo start --lan` | LAN mode (recommended on same Wi‑Fi) |
| `npx expo start --tunnel` | ngrok tunnel (iOS when LAN fails) |

## Features

- Auth, courses, social feed, chat, profile
- AI assistant, wallet, gamification, clubs
- Universal search, attendance, voice rooms (UI), video call (UI)
- Offline cache for dashboard and courses

## Building for App Store (optional)

```powershell
npx eas build --platform ios
```

Requires an Apple Developer account and EAS CLI. `app.json` includes iOS bundle ID and local-network permissions for HTTP dev servers.
