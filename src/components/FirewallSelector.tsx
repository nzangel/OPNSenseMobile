import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFirewallsStore } from '@/store/firewallsStore';
import { Firewall } from '@/types';

export default function FirewallSelector() {
  const { firewalls, selectedId, select } = useFirewallsStore();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const selected = firewalls.find(f => f.id === selectedId);

  if (!selected) return null;

  // Un seul firewall : badge informatif non-cliquable
  if (firewalls.length <= 1) {
    return (
      <View style={[styles.trigger, styles.triggerReadonly]}>
        <View style={[styles.dot, { backgroundColor: selected.color }]} />
        <Text style={styles.triggerText} numberOfLines={1}>{selected.name}</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <View style={[styles.dot, { backgroundColor: selected?.color ?? '#64748b' }]} />
        <Text style={styles.triggerText} numberOfLines={1}>{selected?.name ?? '—'}</Text>
        <Ionicons name="chevron-down" size={14} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choisir un firewall</Text>

            <FlatList
              data={firewalls}
              keyExtractor={f => f.id}
              renderItem={({ item }: { item: Firewall }) => (
                <TouchableOpacity
                  style={[styles.item, item.id === selectedId && styles.itemActive]}
                  onPress={() => { select(item.id); setOpen(false); }}
                >
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemHost}>{item.host}</Text>
                  </View>
                  {item.id === selectedId && (
                    <Ionicons name="checkmark" size={16} color="#d97706" />
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => { setOpen(false); router.push('/(modals)/add-firewall'); }}
            >
              <Ionicons name="add-circle-outline" size={16} color="#d97706" />
              <Text style={styles.addBtnText}>Ajouter un firewall</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1e293b', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    maxWidth: 200,
    marginRight: 8,
  },
  triggerReadonly: { opacity: 0.85 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  triggerText: { color: '#f1f5f9', fontSize: 13, fontWeight: '600', flex: 1 },

  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  sheetTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 16 },

  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8 },
  itemActive: { backgroundColor: '#0f172a' },
  itemInfo: { flex: 1 },
  itemName: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  itemHost: { color: '#64748b', fontSize: 11, marginTop: 2 },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, marginTop: 8 },
  addBtnText: { color: '#d97706', fontSize: 14, fontWeight: '600' },
});
