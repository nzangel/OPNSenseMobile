import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { Ionicons } from '@expo/vector-icons';

export default function CertificateImport() {
  const [done, setDone] = useState(false);

  async function handleOpenSettings() {
    try {
      await IntentLauncher.startActivityAsync('android.settings.SECURITY_SETTINGS');
    } catch {
      // Fallback silencieux — l'utilisateur voit les instructions
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#94a3b8" />
        <Text style={styles.title}>Certificat CA OPNsense</Text>
      </View>

      <View style={styles.steps}>
        <Text style={styles.step}>
          <Text style={styles.num}>1. </Text>
          Dans OPNsense : <Text style={styles.bold}>System → Trust → Authorities</Text> → télécharge le CA en <Text style={styles.bold}>.pem</Text> et transfère-le sur ton téléphone
        </Text>
        <Text style={styles.step}>
          <Text style={styles.num}>2. </Text>
          Appuie sur le bouton ci-dessous pour ouvrir les Paramètres
        </Text>
        <Text style={styles.step}>
          <Text style={styles.num}>3. </Text>
          <Text style={styles.bold}>Chiffrement et identifiants → Installer un certificat → Certificat CA</Text> → sélectionne ton fichier .pem
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.btn, done && styles.btnDone]}
        onPress={handleOpenSettings}
      >
        <Ionicons
          name={done ? 'checkmark-circle-outline' : 'settings-outline'}
          size={16}
          color="#fff"
        />
        <Text style={styles.btnText}>
          {done ? 'Paramètres ouverts' : 'Ouvrir les Paramètres de sécurité'}
        </Text>
      </TouchableOpacity>

      {!done && (
        <TouchableOpacity onPress={() => setDone(true)} style={styles.confirmLink}>
          <Text style={styles.confirmText}>✓ Certificat installé, ne plus afficher</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  title: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  steps: { gap: 8, marginBottom: 14 },
  step: { color: '#94a3b8', fontSize: 12, lineHeight: 18 },
  num: { color: '#d97706', fontWeight: '700' },
  bold: { color: '#f1f5f9', fontWeight: '600' },

  btn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDone: { backgroundColor: '#164e35' },
  btnText: { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },

  confirmLink: { alignItems: 'center', marginTop: 10 },
  confirmText: { color: '#4ade80', fontSize: 12 },
});
