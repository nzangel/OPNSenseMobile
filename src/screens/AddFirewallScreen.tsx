import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirewallsStore, FIREWALL_COLORS } from '@/store/firewallsStore';
import { createApiClient } from '@/api/client';
import { testConnection } from '@/api/system';
import CertificateImport from '@/components/CertificateImport';

interface Props {
  onDone?: () => void;    // appelé après ajout réussi
  editId?: string;        // si défini : mode édition
}

export default function AddFirewallScreen({ onDone, editId }: Props) {
  const { add, update, firewalls, remove } = useFirewallsStore();
  const existing = firewalls.find(f => f.id === editId);

  const [name,      setName]      = useState(existing?.name      ?? '');
  const [host,      setHost]      = useState(existing?.host      ?? 'https://');
  const [apiKey,    setApiKey]    = useState(existing?.apiKey    ?? '');
  const [apiSecret, setApiSecret] = useState(existing?.apiSecret ?? '');
  const [haGroupId, setHaGroupId] = useState(existing?.haGroupId ?? '');
  const [haRole,    setHaRole]    = useState<'primary'|'secondary'|undefined>(existing?.haRole);
  const [loading,   setLoading]   = useState(false);
  const [showHA,    setShowHA]    = useState(!!(existing?.haGroupId));

  function validate() {
    if (!name.trim())      { Alert.alert('Champ manquant', 'Donne un nom à ce firewall.'); return false; }
    if (!host.trim())      { Alert.alert('Champ manquant', 'Entre l\'URL du firewall.'); return false; }
    if (!apiKey.trim())    { Alert.alert('Champ manquant', 'Entre la clé API.'); return false; }
    if (!apiSecret.trim()) { Alert.alert('Champ manquant', 'Entre le secret API.'); return false; }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    try {
      const creds = { host: host.trim(), apiKey: apiKey.trim(), apiSecret: apiSecret.trim() };
      const client = createApiClient(creds);
      const ok = await testConnection(client);

      if (!ok) {
        Alert.alert('Connexion échouée', 'Impossible de joindre le firewall. Vérifie l\'URL et les credentials.');
        setLoading(false);
        return;
      }

      const data = {
        name: name.trim(),
        host: creds.host,
        apiKey: creds.apiKey,
        apiSecret: creds.apiSecret,
        haGroupId: showHA && haGroupId.trim() ? haGroupId.trim() : undefined,
        haRole:    showHA ? haRole : undefined,
      };

      if (editId) {
        await update(editId, data);
      } else {
        await add(data);
      }

      onDone?.();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveWithoutTest() {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        host: host.trim().replace(/\/$/, ''),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        haGroupId: showHA && haGroupId.trim() ? haGroupId.trim() : undefined,
        haRole:    showHA ? haRole : undefined,
      };
      if (editId) await update(editId, data);
      else await add(data);
      onDone?.();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!editId) return;
    Alert.alert('Supprimer', `Supprimer "${existing?.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await remove(editId);
        onDone?.();
      }},
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Field label="Nom du firewall" icon="bookmark-outline">
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="ex: FW-Principal" placeholderTextColor="#64748b"
            autoCapitalize="none" autoCorrect={false} />
        </Field>

        <Field label="URL du firewall" icon="globe-outline">
          <TextInput style={styles.input} value={host} onChangeText={setHost}
            placeholder="https://192.168.1.1" placeholderTextColor="#64748b"
            autoCapitalize="none" autoCorrect={false} keyboardType="url" />
        </Field>

        <Field label="API Key" icon="key-outline">
          <TextInput style={styles.input} value={apiKey} onChangeText={setApiKey}
            placeholder="Clé API" placeholderTextColor="#64748b"
            autoCapitalize="none" autoCorrect={false} />
        </Field>

        <Field label="API Secret" icon="lock-closed-outline">
          <TextInput style={styles.input} value={apiSecret} onChangeText={setApiSecret}
            placeholder="Secret API" placeholderTextColor="#64748b"
            autoCapitalize="none" autoCorrect={false} secureTextEntry />
        </Field>

        {/* Option Haute Disponibilité */}
        <TouchableOpacity style={styles.haToggle} onPress={() => setShowHA(v => !v)}>
          <Ionicons name={showHA ? 'chevron-down' : 'chevron-forward'} size={14} color="#d97706" />
          <Text style={styles.haToggleText}>Haute disponibilité (HA)</Text>
        </TouchableOpacity>

        {showHA && (
          <View style={styles.haSection}>
            <Text style={styles.haDesc}>
              Associe deux firewalls en paire HA. Utilise le même identifiant de groupe pour les deux nœuds.
            </Text>

            <Field label="Identifiant du groupe HA" icon="git-merge-outline">
              <TextInput style={styles.input} value={haGroupId} onChangeText={setHaGroupId}
                placeholder="ex: ha-datacenter-1" placeholderTextColor="#64748b"
                autoCapitalize="none" autoCorrect={false} />
            </Field>

            <Text style={styles.label}>Rôle</Text>
            <View style={styles.roleRow}>
              {(['primary', 'secondary'] as const).map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleBtn, haRole === role && styles.roleBtnActive]}
                  onPress={() => setHaRole(role)}
                >
                  <Text style={[styles.roleBtnText, haRole === role && styles.roleBtnTextActive]}>
                    {role === 'primary' ? '★ Principal' : '○ Secondaire'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <CertificateImport />

        <TouchableOpacity style={styles.btnPrimary} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>
                {editId ? 'Enregistrer les modifications' : 'Connexion et ajout'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleSaveWithoutTest} disabled={loading}>
          <Text style={styles.btnSecondaryText}>Sauvegarder sans tester</Text>
        </TouchableOpacity>

        {editId && (
          <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.btnDeleteText}>Supprimer ce firewall</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 16 }}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={13} color="#64748b" />
        <Text style={styles.label}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f172a' },
  container: { flexGrow: 1, padding: 24, paddingBottom: 48 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: '#1e293b', color: '#f1f5f9', borderRadius: 8,
    padding: 14, fontSize: 14, borderWidth: 1, borderColor: '#334155',
  },

  // HA
  haToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 4 },
  haToggleText: { color: '#d97706', fontSize: 13, fontWeight: '600' },
  haSection: { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#334155' },
  haDesc: { color: '#64748b', fontSize: 12, marginBottom: 12, lineHeight: 18 },
  roleRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  roleBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  roleBtnActive: { borderColor: '#d97706', backgroundColor: '#292524' },
  roleBtnText: { color: '#64748b', fontSize: 13 },
  roleBtnTextActive: { color: '#d97706', fontWeight: '600' },

  // Boutons
  btnPrimary: {
    backgroundColor: '#d97706', borderRadius: 8, padding: 16,
    alignItems: 'center', marginTop: 32, flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSecondary: { borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#334155' },
  btnSecondaryText: { color: '#94a3b8', fontSize: 14 },
  btnDelete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  btnDeleteText: { color: '#ef4444', fontSize: 14 },
});
