# Agent E2E Testing (Detox)

## Prerequisites
- Android Studio with an emulator named `Pixel_6_API_34` (or set `DETOX_AVD_NAME` to your local emulator name).
- JDK 17 and Android SDK configured.
- Dependencies installed: `npm install`.

## Commands
```bash
npm run e2e:build:android
npm run e2e:test:android
```

If your emulator name is different:
```bash
DETOX_AVD_NAME=Pixel_9_Pro npm run e2e:android
```

One-shot:
```bash
npm run e2e:android
```

## Current E2E Cases
- Open Profile -> Settings and verify Agent controls are visible.
- Set Agent Stage to 6, send prompt injection text in Chat, verify safety block response.
- Set Agent Stage to 1, send `[E2E_MOCK_AI] /web-self-test ...`, verify WebExtract success line appears.
- Set Agent Stage to 1, send `[E2E_MOCK_AI] http://localhost:3000/docs`, verify `FAIL(BLOCKED_URL)` appears.

## Selectors Used
- `profile-settings-entry`
- `agent-enabled-switch`
- `agent-stage-label`
- `agent-stage-btn-6`
- `chat-input`
- `chat-send-button`

## Notes
- Detox build writes Gradle cache to local `.gradle-detox` via `.detoxrc.js`.
- If emulator name differs, edit `devices.emulator.device.avdName` in `.detoxrc.js`.
- For E2E only, chat messages containing `[E2E_MOCK_AI]` use an app-side mock provider in `__DEV__`, so tests do not require real API keys.
