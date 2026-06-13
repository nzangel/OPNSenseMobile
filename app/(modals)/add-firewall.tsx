import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AddFirewallScreen from '@/screens/AddFirewallScreen';

export default function AddFirewallModal() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();

  function handleDone() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {editId ? 'Modifier le firewall' : 'Ajouter un firewall'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <AddFirewallScreen onDone={handleDone} editId={editId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: { color: '#f1f5f9', fontSize: 16, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
