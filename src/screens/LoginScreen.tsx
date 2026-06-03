import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useCredentialsStore } from '@/store/credentialsStore';
import { createApiClient } from '@/api/client';
import { testConnection } from '@/api/system';

export default function LoginScreen() {
  const { save, credentials } = useCredentialsStore();
  const [host, setHost] = useState('https://');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);

  // Pré-remplir les champs si des credentials existent déjà
  useEffect(() => {
    if (credentials) {
      setHost(credentials.host);
      setApiKey(credentials.apiKey);
      setApiSecret(credentials.apiSecret);
    }
  }, [credentials]);

  function buildCreds() {
    return {
      host: host.trim(),
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
    };
  }

  function validate() {
    if (!host.trim() || !apiKey.trim() || !apiSecret.trim()) {
      Alert.alert('Champs manquants', 'Remplis tous les champs.');
      return false;
    }
    return true;
  }

  // Sauvegarde immédiate sans tester la connexion
  async function handleSaveOnly() {
    if (!validate()) return;
    await save(buildCreds());
    Alert.alert('Sauvegardé', 'Credentials enregistrés. Lance "Se connecter" quand tu es prêt.');
  }

  // Sauvegarde + test de connexion
  async function handleConnect() {
    if (!validate()) return;

    const creds = buildCreds();
    console.log('[Login] handleConnect → host:', creds.host);
    setLoading(true);
    try {
      const client = createApiClient(creds);
      const ok = await testConnection(client);

      if (!ok) {
        // Sauvegarde quand même pour ne pas perdre la saisie
        await save(creds);
        Alert.alert(
          'Connexion échouée',
          'Credentials sauvegardés, mais impossible de joindre le firewall.\nVérifie l\'URL et le réseau.',
        );
        return;
      }

      // Sauvegarde uniquement si connexion OK → AuthGate redirige automatiquement
      await save(creds);
    } catch (e: any) {
      // Sauvegarde quand même pour ne pas perdre la saisie
      await save(creds);
      const msg = e?.response
        ? `HTTP ${e.response.status} — ${JSON.stringify(e.response.data)}`
        : e?.message ?? 'Unknown error';
      Alert.alert('Erreur', msg);
      console.error('Connection error:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>OPNsense Mobile</Text>
        <Text style={styles.subtitle}>Connexion à ton firewall</Text>

        <Text style={styles.label}>URL du firewall</Text>
        <TextInput
          style={styles.input}
          value={host}
          onChangeText={setHost}
          placeholder="https://192.168.1.1"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>API Key</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="API key"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>API Secret</Text>
        <TextInput
          style={styles.input}
          value={apiSecret}
          onChangeText={setApiSecret}
          placeholder="API secret"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleConnect} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonSecondary} onPress={handleSaveOnly} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>Sauvegarder sans tester</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Les credentials sont stockés localement sur ton appareil (stockage sécurisé).
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f172a' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#f1f5f9', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 40 },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonSecondary: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonSecondaryText: { color: '#94a3b8', fontSize: 14 },
  hint: { fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 24 },
});
