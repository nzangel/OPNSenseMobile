import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useBlockIp } from '@/hooks/useFirewall';

const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

export default function BlockScreen() {
  const [ip, setIp] = useState('');
  const { mutate: doBlock, isPending } = useBlockIp();

  function handleBlock() {
    const trimmed = ip.trim();
    if (!IP_REGEX.test(trimmed)) {
      Alert.alert('Invalid IP', 'Please enter a valid IPv4 address.');
      return;
    }
    Alert.alert(
      'Block IP',
      `Add ${trimmed} to the block list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () =>
            doBlock(trimmed, {
              onSuccess: () => { setIp(''); Alert.alert('Blocked', `${trimmed} has been blocked.`); },
              onError: (e: any) => Alert.alert('Error', e?.message ?? 'Could not block IP.'),
            }),
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Quick Block</Text>
      <Text style={styles.subtitle}>Add an IP address to the block alias immediately.</Text>

      <TextInput
        style={styles.input}
        value={ip}
        onChangeText={setIp}
        placeholder="192.168.1.100"
        placeholderTextColor="#64748b"
        keyboardType="decimal-pad"
        autoCorrect={false}
      />

      <TouchableOpacity style={styles.button} onPress={handleBlock} disabled={isPending}>
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Block IP</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, justifyContent: 'center' },
  title: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 14, marginBottom: 32 },
  input: {
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    borderRadius: 8,
    padding: 14,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  button: { backgroundColor: '#dc2626', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
