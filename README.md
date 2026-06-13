# OPNsense Mobile

> Unofficial Android client for OPNsense firewalls.

<p align="center">
  <img src="assets/icon.png" width="120" alt="OPNsense Mobile" />
</p>

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=fr.opnsensemobile">
    <img src="https://img.shields.io/badge/Google%20Play-Available-34d399?logo=google-play&logoColor=white" alt="Google Play" />
  </a>
  <img src="https://img.shields.io/badge/Platform-Android-64748b?logo=android" alt="Android" />
  <img src="https://img.shields.io/badge/Built%20with-Expo%2054-d97706?logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/License-MIT-6366f1" alt="MIT" />
</p>

---

## Features

- 📊 **Dashboard** — CPU, memory, uptime and network interfaces with live sparklines
- 📋 **Firewall logs** — real-time log viewer with action/protocol filters
- 🛡️ **Firewall rules** — grouped by interface, enable/disable with one tap
- 🚫 **Quick IP block** — block an IP address in seconds
- 🔁 **Multi-instance** — manage multiple OPNsense firewalls from a single app
- ⚡ **High Availability view** — monitor HA pairs (Master/Slave) side by side

## Screenshots

> _Coming soon_

---

## Getting Started

### Prerequisites

- An OPNsense firewall accessible over HTTPS
- An API key and secret ([setup guide](#setup-guide))

### Connection

1. Open the app and tap **Add a firewall**
2. Enter your firewall URL (e.g. `https://192.168.1.1`)
3. Enter your API Key and API Secret
4. Tap **Connect and add**

> If your OPNsense uses a self-signed certificate, you need to install the CA certificate on your Android device first. See the [setup guide](https://nzangel.github.io/opnsense-mobile-privacy/guide.html).

---

## Setup Guide

A step-by-step guide (🇫🇷 / 🇬🇧) covering:

1. Exporting the SSL certificate from OPNsense
2. Creating a dedicated user and generating API credentials
3. Installing the certificate on Android

👉 **[Open the setup guide](https://nzangel.github.io/opnsense-mobile-privacy/guide.html)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54 / React Native 0.81 |
| Navigation | [expo-router](https://expo.github.io/router) v6 (file-based) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Data fetching | [TanStack Query](https://tanstack.com/query) v5 |
| HTTP | [Axios](https://axios-http.com) |
| Storage | [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) |

---

## Architecture

```
app/
├── (auth)/
│   └── login.tsx           # First launch / add firewall
├── (tabs)/
│   ├── dashboard.tsx       # CPU / RAM / uptime / interfaces
│   ├── logs.tsx            # Firewall logs
│   ├── rules.tsx           # Firewall rules
│   ├── block.tsx           # Quick IP block
│   └── ha.tsx              # High availability view
└── (modals)/
    ├── add-firewall.tsx    # Add / edit a firewall
    └── ha-group.tsx        # Create / edit an HA group

src/
├── api/                    # OPNsense REST API calls
├── components/             # Shared UI components
├── hooks/                  # useSystemStats, useFirewall…
├── store/                  # Zustand stores (firewalls, metrics)
└── types/                  # TypeScript interfaces
```

---

## API Permissions

The dedicated OPNsense user needs the following privileges:

| Category | Privilege |
|---|---|
| Diagnostics | GUI Diagnostics |
| Firewall | Firewall: Rules |
| Firewall | Firewall: Logs |
| System | System: Firmware |

---

## Building

### Prerequisites

- Node.js 18+
- EAS CLI (`npm install -g eas-cli`)
- Android SDK (for local builds)

### Development build

```bash
npm install
npx expo start --dev-client
```

### Production AAB (for Play Store)

```bash
# In WSL with ANDROID_HOME exported
TMPDIR=~/wsl-build/tmp eas build --platform android --profile production --local
```

---

## Privacy Policy

This app does not collect, store or transmit any personal data to external servers.  
All credentials are stored locally on your device using encrypted storage.

👉 [Privacy Policy](https://nzangel.github.io/opnsense-mobile-privacy/)

---

## Disclaimer

OPNsense Mobile is an **unofficial** third-party application and is not affiliated with, endorsed by, or connected to the OPNsense project or Deciso B.V.

---

## License

MIT © [nZAngel](mailto:opnsensemobile@les-tutos-du-tof.fr)
