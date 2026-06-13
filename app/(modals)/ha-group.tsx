import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, FlatList, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFirewallsStore } from '@/store/firewallsStore';
import { Firewall } from '@/types';

// ────────────────────────────────────────────────────────────
// Picker de firewall (bottom sheet simple)
// ────────────────────────────────────────────────────────────
function FirewallPicker({
  label,
  selected,
  firewalls,
  onSelect,
  excludeId,
}: {
  label: string;
  selected: Firewall | undefined;
  firewalls: Firewall[];
  onSelect: (fw: Firewall) => void;
  excludeId?: string;
}) {
  const [open, setOpen] = useState(false);
  const available = firewalls.filter(f => f.id !== excludeId);

  return (
    <View style={styles.pickerBlock}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.pickerTrigger}
        onPress={() => setOpen(true)}
      >
        {selected ? (
          <View style={styles.pickerSelected}>
            <View style={[styles.dot, { backgroundColor: selected.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerName}>{selected.name}</Text>
              <Text style={styles.pickerHost}>{selected.host}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.pickerPlaceholder}>Sélectionner un firewall…</Text>
        )}
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={available}
              keyExtractor={f => f.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.sheetItem, item.id === selected?.id && styles.sheetItemActive]}
                  onPress={() => { onSelect(item); setOpen(false); }}
                >
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetItemName}>{item.name}</Text>
                    <Text style={styles.sheetItemHost}>{item.host}</Text>
                  </View>
                  {item.id === selected?.id && (
                    <Ionicons name="checkmark" size={16} color="#d97706" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Aucun autre firewall disponible.</Text>
              }
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Écran principal
// ────────────────────────────────────────────────────────────
export default function HAGroupModal() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const { firewalls, update, haGroups } = useFirewallsStore();

  // Nœuds existants du groupe édité
  const existingNodes = groupId ? (haGroups()[groupId] ?? []) : [];
  const existingPrimary   = existingNodes.find(n => n.haRole === 'primary');
  const existingSecondary = existingNodes.find(n => n.haRole === 'secondary');

  const [groupName, setGroupName] = useState(groupId ?? '');
  const [primary,   setPrimary]   = useState<Firewall | undefined>(existingPrimary);
  const [secondary, setSecondary] = useState<Firewall | undefined>(existingSecondary);
  const [saving, setSaving]       = useState(false);

  const isEdit = !!groupId;

  // Firewalls disponibles = tous les FW, plus ceux du groupe courant
  const available = firewalls.filter(f =>
    !f.haGroupId || f.haGroupId === groupId
  );

  async function handleSave() {
    const name = groupName.trim();
    if (!name) {
      Alert.alert('Champ manquant', 'Donne un nom au groupe HA.');
      return;
    }
    if (!primary) {
      Alert.alert('Champ manquant', 'Sélectionne le firewall principal.');
      return;
    }
    if (!secondary) {
      Alert.alert('Champ manquant', 'Sélectionne le firewall secondaire.');
      return;
    }
    if (primary.id === secondary.id) {
      Alert.alert('Erreur', 'Le firewall principal et secondaire doivent être différents.');
      return;
    }

    setSaving(true);
    try {
      // Si on renomme le groupe, libérer les anciens membres d'abord
      if (isEdit && groupId !== name) {
        for (const n of existingNodes) {
          await update(n.id, { haGroupId: undefined, haRole: undefined });
        }
      }

      // Libérer les firewalls qui étaient dans ce groupe mais ne sont plus sélectionnés
      const toRelease = existingNodes.filter(
        n => n.id !== primary.id && n.id !== secondary.id
      );
      for (const n of toRelease) {
        await update(n.id, { haGroupId: undefined, haRole: undefined });
      }

      // Assigner le groupe aux deux nœuds sélectionnés
      await update(primary.id,   { haGroupId: name, haRole: 'primary' });
      await update(secondary.id, { haGroupId: name, haRole: 'secondary' });

      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    Alert.alert(
      'Supprimer le groupe HA',
      `Supprimer le groupe "${groupId}" ? Les firewalls seront conservés mais dissociés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            for (const n of existingNodes) {
              await update(n.id, { haGroupId: undefined, haRole: undefined });
            }
            router.back();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Modifier le groupe HA' : 'Nouveau groupe HA'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Explication */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
          <Text style={styles.infoText}>
            Un groupe HA associe deux firewalls en paire maître/esclave. Le même identifiant de groupe est partagé entre les deux nœuds.
          </Text>
        </View>

        {/* Nom du groupe */}
        <View style={styles.field}>
          <View style={styles.fieldLabel}>
            <Ionicons name="git-branch-outline" size={13} color="#64748b" />
            <Text style={styles.fieldLabelText}>Identifiant du groupe</Text>
          </View>
          <TextInput
            style={styles.input}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="ex: ha-datacenter-1"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isEdit} // ne pas renommer via ce champ si édition
          />
          {isEdit && (
            <Text style={styles.fieldHint}>L'identifiant ne peut pas être modifié.</Text>
          )}
        </View>

        {/* Séparateur */}
        <View style={styles.separator} />

        {/* Sélection nœud principal */}
        <View style={styles.roleSection}>
          <View style={styles.roleHeader}>
            <Ionicons name="star" size={13} color="#f59e0b" />
            <Text style={[styles.roleName, { color: '#f59e0b' }]}>Nœud principal (Master)</Text>
          </View>
          <FirewallPicker
            label="Firewall principal"
            selected={primary}
            firewalls={available}
            onSelect={setPrimary}
            excludeId={secondary?.id}
          />
        </View>

        {/* Sélection nœud secondaire */}
        <View style={styles.roleSection}>
          <View style={styles.roleHeader}>
            <Ionicons name="ellipse-outline" size={13} color="#94a3b8" />
            <Text style={[styles.roleName, { color: '#94a3b8' }]}>Nœud secondaire (Slave)</Text>
          </View>
          <FirewallPicker
            label="Firewall secondaire"
            selected={secondary}
            firewalls={available}
            onSelect={setSecondary}
            excludeId={primary?.id}
          />
        </View>

        {/* Aperçu de la paire */}
        {primary && secondary && (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Aperçu de la paire</Text>
            <View style={styles.previewRow}>
              <View style={[styles.previewCard, { borderTopColor: primary.color }]}>
                <View style={[styles.dot, { backgroundColor: primary.color }]} />
                <Text style={styles.previewName}>{primary.name}</Text>
                <View style={styles.masterBadge}>
                  <Text style={styles.masterBadgeText}>★ MASTER</Text>
                </View>
              </View>
              <View style={styles.previewArrow}>
                <Ionicons name="swap-horizontal" size={20} color="#334155" />
              </View>
              <View style={[styles.previewCard, { borderTopColor: secondary.color }]}>
                <View style={[styles.dot, { backgroundColor: secondary.color }]} />
                <Text style={styles.previewName}>{secondary.name}</Text>
                <View style={styles.slaveBadge}>
                  <Text style={styles.slaveBadgeText}>○ SLAVE</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bouton enregistrer */}
        <TouchableOpacity
          style={[styles.btnSave, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnSaveText}>
            {isEdit ? 'Enregistrer les modifications' : 'Créer le groupe HA'}
          </Text>
        </TouchableOpacity>

        {/* Bouton supprimer (mode édition) */}
        {isEdit && (
          <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
            <Text style={styles.btnDeleteText}>Supprimer ce groupe HA</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  headerTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  content: { padding: 20, paddingBottom: 48 },

  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#1e3a5f', borderRadius: 10, padding: 14, marginBottom: 24,
  },
  infoText: { color: '#93c5fd', fontSize: 13, lineHeight: 19, flex: 1 },

  field: { marginBottom: 20 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  fieldLabelText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: '#1e293b', color: '#f1f5f9', borderRadius: 8,
    padding: 14, fontSize: 14, borderWidth: 1, borderColor: '#334155',
  },
  fieldHint: { color: '#475569', fontSize: 11, marginTop: 5 },

  separator: { height: 1, backgroundColor: '#1e293b', marginBottom: 24 },

  roleSection: { marginBottom: 20 },
  roleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  roleName: { fontSize: 13, fontWeight: '700' },

  // Picker
  pickerBlock: {},
  pickerLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', marginBottom: 6 },
  pickerTrigger: {
    backgroundColor: '#1e293b', borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  pickerSelected: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerName: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  pickerHost: { color: '#64748b', fontSize: 11, marginTop: 2 },
  pickerPlaceholder: { color: '#475569', fontSize: 14, flex: 1 },

  // Bottom sheet picker
  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1e293b', borderTopLeftRadius: 16,
    borderTopRightRadius: 16, padding: 20, maxHeight: '60%',
  },
  sheetTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 16 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8 },
  sheetItemActive: { backgroundColor: '#0f172a' },
  sheetItemName: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  sheetItemHost: { color: '#64748b', fontSize: 11, marginTop: 2 },
  emptyText: { color: '#475569', fontSize: 13, textAlign: 'center', padding: 16 },

  dot: { width: 8, height: 8, borderRadius: 4 },

  // Aperçu
  preview: { marginTop: 8, marginBottom: 24 },
  previewTitle: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewCard: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 10, padding: 12,
    alignItems: 'center', gap: 6, borderTopWidth: 3,
  },
  previewName: { color: '#f1f5f9', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  masterBadge: { backgroundColor: '#451a03', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  masterBadgeText: { color: '#f59e0b', fontSize: 9, fontWeight: '700' },
  slaveBadge: { backgroundColor: '#1e293b', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#334155' },
  slaveBadgeText: { color: '#94a3b8', fontSize: 9, fontWeight: '700' },
  previewArrow: { paddingHorizontal: 4 },

  // Boutons
  btnSave: {
    backgroundColor: '#d97706', borderRadius: 10, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnSaveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnDelete: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 20,
  },
  btnDeleteText: { color: '#ef4444', fontSize: 14 },
});
