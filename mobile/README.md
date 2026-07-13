# Campus Hub Mobile (Flutter)

Premium Flutter app for **Campus Hub** — same Node.js API + PostgreSQL as web.

## Design — Campus 2090

- **Dark-first** glassmorphic UI (`#05070D` / `#0B0F1A`)
- **Neon gradients** (cyan → violet, emerald → teal)
- **Space Grotesk** headings + **Inter** body
- Animated hero landing, shimmer loaders, floating nav with glass blur

## Stack

| Layer | Package |
|-------|---------|
| State | Riverpod |
| Navigation | go_router (role guards) |
| HTTP | dio + JWT interceptor |
| Real-time | socket_io_client |
| Secure session | flutter_secure_storage |
| Motion | flutter_animate, shimmer |

## Screens

All 27 screens from the product spec are implemented:

- **Public:** Hero landing, login, student signup (OTP), teacher registration, forgot/reset password
- **Student:** Home, courses catalog, my courses, course detail, analytics, management, social feed, friends (3 tabs), chat, profile, settings (4 tabs), notifications, dashboard
- **Teacher:** Home, create/edit course, course detail, manage videos, analytics, students + shared social/chat/profile

OTP for signup and password reset is **terminal-only** — watch the `[API]` process for `[OTP] purpose=... code=XXXXXX`.

## API host

Edit `lib/core/config/api_config.dart`:

| Device | `host` |
|--------|--------|
| Android emulator | `10.0.2.2` |
| iOS simulator | `localhost` |
| Physical phone | Your PC LAN IP (default: `192.168.100.4`) |

## Run

```bash
# Terminal 1 — backend
cd ../backend && npm run dev

# Terminal 2 — Flutter
cd mobile
flutter pub get
flutter run
```

Or from repo root: `npm start` (backend + web + Expo). Run Flutter separately.

## Mock flags

`lib/core/constants/mock_flags.dart` — flip to `false` when backend endpoints are ready (teacher register, analytics, etc.).
