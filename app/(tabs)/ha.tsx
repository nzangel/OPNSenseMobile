import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFirewallsStore } from '@/store/firewallsStore';
import { useApiClientFor } from '@/hooks/useApiClient';
import { fetchSystemStats } from '@/api/system';
import { Firewall, SystemStats } from '@/types';

// ────────────────────────────────────────────────────────────
// Carte d'un nœud HA
// ────────────────────────────────────────────────────────────
function NodeCard({ fw, isSelected }: { fw: Firewall; isSelected: boolean }) {
  const client = useApiClientFor(fw);
  const { data: stats, isLoading, isError } = useQuery<SystemStats>({
    queryKey: ['ha-stats', fw.id],
    queryFn: () => fetchSystemStats(client!),
    enabled: !!client,
    refetchInterval: 10_000,
    retry: 1,
  });

  const roleLabel = fw.haRole === 'primary' ? 'MASTER' : fw.haRole === 'secondary' ? 'SLAVE' : 'NŒUD';
  const roleIcon  = fw.haRole === 'primary' ? 'star' : fw.haRole === 'secondary' ? 'ellipse-outline' : 'server-outline';
  const roleColor = fw.haRole === 'primary' ? '#f59e0b' : '#94a3b8';

  const cpuColor = (stats?.cpu ?? 0) > 80 ? '#ef4444' : (stats?.cpu ?? 0) > 50 ? '#f59e0b' : '#34d399';
  const ramColor = (stats?.memory.pct ?? 0) > 85 ? '#ef4444' : (stats?.memory.pct ?? 0) > 65 ? '#f59e0b' : '#6366f1';

  return (
    <View style={[styles.nodeCard, isSelected && styles.nodeCardSelected, { borderTopColor: fw.color }]}>
      <View style={styles.nodeHeader}>
        <View style={[styles.dot, { backgroundColor: fw.color }]} />
        <Text style={styles.nodeName} numberOfLines={1}>{fw.name}</Text>
        {isSelected && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>actif</Text>
          </View>
        )}
      </View>

      <View style={styles.roleRow}>
        <Ionicons name={roleIcon as any} size={11} color={roleColor} />
        <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
      </View>

      <View style={styles.divider} />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={fw.color} />
        </View>
      ) : isError ? (
        <View style={styles.errorWrap}>
          <Ionicons name="warning-outline" size={16} color="#ef4444" />
          <Text style={styles.errorText}>Inaccessible</Text>
        </View>
      ) : (
        <View style={styles.metrics}>
          <MetricRow label="CPU"    value={`${stats?.cpu ?? 0}%`}           color={cpuColor} />
          <MetricRow label="RAM"    value={`${stats?.memory.pct ?? 0}%`}    color={ramColor} />
          <MetricRow label="Uptime" value={formatUptime(stats?.uptime ?? 0)} color="#f1f5f9" />
        </View>
      )}
    </View>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Section d'un groupe HA
// ────────────────────────────────────────────────────────────
function HAGroupSection({ groupId, nodes, selectedId }: {
  groupId: string;
  nodes: Firewall[];
  selectedId: string | null;
}) {
  const router    = useRouter();
  const primary   = nodes.find(n => n.haRole === 'primary')   ?? nodes[0];
  const secondary = nodes.find(n => n.haRole === 'secondary') ?? nodes[1];
  const rest      = nodes.filter(n => n !== primary && n !== secondary);

  return (
    <View style={styles.groupSection}>
      <View style={styles.groupHeader}>
        <Ionicons name="git-branch-outline" size={13} color="#64748b" />
        <Text style={styles.groupTitle} numberOfLines={1}>Groupe HA · {groupId}</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push({ pathname: '/(modals)/ha-group', params: { groupId } })}
        >
          <Ionicons name="pencil-outline" size={14} color="#d97706" />
          <Text style={styles.editBtnText}>Modifier</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pairRow}>
        {primary   && <NodeCard fw={primary}   isSelected={primary.id   === selectedId} />}
        {secondary && <NodeCard fw={secondary} isSelected={secondary.id === selectedId} />}
        {rest.map(n => <NodeCard key={n.id} fw={n} isSelected={n.id === selectedId} />)}
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Écran principal
// ────────────────────────────────────────────────────────────
export default function HAScreen() {
  const { firewalls, selectedId, haGroups } = useFirewallsStore();
  const router = useRouter();

  const groups    = haGroups();
  const ungrouped = firewalls.filter(f => !f.haGroupId);
  // Firewalls disponibles pour créer un groupe (au moins 2 non groupés)
  const canCreateGroup = ungrouped.length >= 2 || (ungrouped.length >= 1 && firewalls.length >= 2);

  if (firewalls.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="server-outline" size={48} color="#334155" />
        <Text style={styles.emptyTitle}>Aucun firewall configuré</Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/(modals)/add-firewall')}
        >
          <Text style={styles.ctaBtnText}>Ajouter un firewall</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      {/* Groupes HA existants */}
      {Object.entries(groups).map(([groupId, nodes]) => (
        <HAGroupSection key={groupId} groupId={groupId} nodes={nodes} selectedId={selectedId} />
      ))}

      {/* Firewalls sans groupe */}
      {ungrouped.length > 0 && (
        <View style={styles.groupSection}>
          {Object.keys(groups).length > 0 && (
            <View style={styles.groupHeader}>
              <Ionicons name="server-outline" size={13} color="#64748b" />
              <Text style={styles.groupTitle}>Firewalls indépendants</Text>
            </View>
          )}
          <View style={styles.pairRow}>
            {ungrouped.map(fw => (
              <NodeCard key={fw.id} fw={fw} isSelected={fw.id === selectedId} />
            ))}
          </View>
        </View>
      )}

      {/* Boutons d'action */}
      <View style={styles.actions}>
        {firewalls.length >= 2 && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(modals)/ha-group')}
          >
            <Ionicons name="git-branch-outline" size={16} color="#d97706" />
            <Text style={styles.actionBtnText}>Créer un groupe HA</Text>
          </TouchableOpacity>
        )}
        {firewalls.length < 2 && (
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={15} color="#64748b" />
            <Text style={styles.hintText}>
              Ajoute au moins 2 firewalls pour créer une paire HA.
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => router.push('/(modals)/add-firewall')}
        >
          <Ionicons name="add-circle-outline" size={16} color="#64748b" />
          <Text style={styles.actionBtnSecondaryText}>Ajouter un firewall</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
function formatUptime(seconds: number): string {
  if (!seconds) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },

  groupSection: { marginBottom: 24 },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
  },
  groupTitle: {
    color: '#64748b', fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, flex: 1,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: '#1e293b', borderRadius: 6,
    borderWidth: 1, borderColor: '#d97706',
  },
  editBtnText: { color: '#d97706', fontSize: 11, fontWeight: '600' },

  pairRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },

  nodeCard: {
    flex: 1, minWidth: 140,
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
    borderTopWidth: 3, borderTopColor: '#334155',
  },
  nodeCardSelected: { borderWidth: 1, borderColor: '#d97706', borderTopWidth: 3 },

  nodeHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nodeName: { color: '#f1f5f9', fontSize: 13, fontWeight: '700', flex: 1 },
  activeBadge: {
    backgroundColor: '#292524', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: '#d97706',
  },
  activeBadgeText: { color: '#d97706', fontSize: 9, fontWeight: '700' },

  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  roleText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: '#0f172a', marginBottom: 10 },

  loadingWrap: { alignItems: 'center', paddingVertical: 16 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  errorText: { color: '#ef4444', fontSize: 12 },

  metrics: { gap: 6 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { color: '#64748b', fontSize: 12 },
  metricValue: { fontSize: 13, fontWeight: '700' },

  // Actions
  actions: { gap: 10, marginTop: 8, marginBottom: 40 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', paddingVertical: 14,
    backgroundColor: '#1e293b', borderRadius: 10,
    borderWidth: 1, borderColor: '#d97706',
  },
  actionBtnText: { color: '#d97706', fontSize: 14, fontWeight: '600' },
  actionBtnSecondary: { borderColor: '#334155' },
  actionBtnSecondaryText: { color: '#64748b', fontSize: 14 },

  hintBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, backgroundColor: '#1e293b', borderRadius: 10,
  },
  hintText: { color: '#64748b', fontSize: 13, flex: 1 },

  // Vide
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { color: '#475569', fontSize: 16 },
  ctaBtn: {
    backgroundColor: '#d97706', borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
