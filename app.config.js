const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system"/>
      <certificates src="user"/>
    </trust-anchors>
  </base-config>
</network-security-config>`;

function withNetworkSecurity(config) {
  // Étape 1 : écrit le fichier XML dans res/xml/
  config = withDangerousMod(config, [
    'android',
    (cfg) => {
      const xmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'xml',
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'network_security_config.xml'),
        NETWORK_SECURITY_XML,
        'utf8',
      );
      console.log('[plugin] network_security_config.xml écrit dans', xmlDir);
      return cfg;
    },
  ]);

  // Étape 2 : référence le fichier dans <application> du AndroidManifest
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app?.$) {
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      app.$['android:usesCleartextTraffic'] = 'true';
      console.log('[plugin] AndroidManifest mis à jour');
    }
    return cfg;
  });

  return config;
}

/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  return withNetworkSecurity({
    ...config,
    name: 'OPNsense Mobile',
    slug: 'opnsense-mobile',
    version: '1.1.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0f172a',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'fr.opnsensemobile',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0f172a',
      },
      package: 'fr.opnsensemobile',
      versionCode: 3,
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      'expo-asset',
      'expo-web-browser',
      'expo-dev-client',
    ],
    scheme: 'opnsense-mobile',
    extra: {
      router: {},
      eas: {
        projectId: '5dd3943f-6cf0-4ced-ba20-2192724eb83d',
      },
    },
  });
};
