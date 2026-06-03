import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  Switch,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirewallRules, useToggleRule } from '@/hooks/useFirewall';
import { FirewallRule } from '@/types';

// ── Couleur par action ────────────────────────────────────────────────────────
function actionColor(action: string): string {
  switch (action.toLowerCase()) {
    case 'pass':   return '#4ade80';
    case 'block':  return '#f87171';
    case 'reject': return '#fb923c';
    default:       return '#94a3b8';
  }
}

// ── Badge action ──────────────────────────────────────────────────────────────
function ActionBadge({ action }: { action: string }) {
  const color = actionColor(action);
  return (
    <View style={[styles.actionBadge, { borderColor: color }]}>
      <Text style={[styles.actionText, { color }]}>{action.toUpperCase()}</Text>
    </View>
  );
}

// ── En-tête de groupe (interface) ─────────────────────────────────────────────
function GroupHeader({
  title,
  total,
  active,
  collapsed,
  onToggle,
}: {
  title: string;
  total: number;
  active: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.groupHeader} onPress={onToggle} activeOpacity={0.7}>
      <Ionicons
        name={collapsed ? 'chevron-forward' : 'chevron-down'}
        size={14}
        color="#64748b"
      />
      <Ionicons name="git-network-outline" size={14} color="#94a3b8" style={{ marginLeft: 6 }} />
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupBadges}>
        <View style={styles.groupCount}>
          <Text style={styles.groupCountText}>{active} actives</Text>
        </View>
        <View style={[styles.groupCount, { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.groupCountText, { color: '#64748b' }]}>{total} total</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Ligne règle ───────────────────────────────────────────────────────────────
function RuleRow({
  item,
  onToggle,
}: {
  item: FirewallRule;
  onToggle: (rule: FirewallRule) => void;
}) {
  const isEnabled = item.enabled === '1';
  const proto = item.protocol === 'any' ? '*' : item.protocol.toUpperCase();

  return (
    <View style={[styles.row, !isEnabled && styles.rowDisabled]}>
      <View style={styles.rowLeft}>
        <ActionBadge action={item.action} />
        <View style={styles.rowInfo}>
          <Text style={[styles.rowTitle, !isEnabled && styles.rowTitleDisabled]} numberOfLines={1}>
            {item.description || `Règle #${item.sequence}`}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {proto}  ·  {item.source} → {item.destination}
          </Text>
        </View>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={() => onToggle(item)}
        trackColor={{ false: '#334155', true: '#d97706' }}
        thumbColor={isEnabled ? '#fff' : '#94a3b8'}
      />
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function RulesScreen() {
  const { data: rules, isLoading, refetch } = useFirewallRules();
  const { mutate: toggleRule } = useToggleRule();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function handleToggle(rule: FirewallRule) {
    const enable = rule.enabled !== '1';
    Alert.alert(
      `${enable ? 'Activer' : 'Désactiver'} la règle`,
      rule.description || `Règle #${rule.sequence}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => toggleRule({ uuid: rule.uuid, enable }) },
      ],
    );
  }

  function toggleGroup(iface: string) {
    setCollapsed(prev => ({ ...prev, [iface]: !prev[iface] }));
  }

  // Regroupement par interface, trié par sequence
  const sections = useMemo(() => {
    if (!rules) return [];

    const groups: Record<string, FirewallRule[]> = {};
    for (const rule of [...rules].sort((a, b) => a.sequence - b.sequence)) {
      const iface = rule.interface || 'Toutes interfaces';
      if (!groups[iface]) groups[iface] = [];
      groups[iface].push(rule);
    }

    return Object.entries(groups).map(([iface, items]) => ({
      title: iface,
      data: collapsed[iface] ? [] : items,
      total: items.length,
      active: items.filter(r => r.enabled === '1').length,
    }));
  }, [rules, collapsed]);

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.uuid}
      renderItem={({ item }) => (
        <RuleRow item={item} onToggle={handleToggle} />
      )}
      renderSectionHeader={({ section }) => (
        <GroupHeader
          title={section.title}
          total={section.total}
          active={section.active}
          collapsed={!!collapsed[section.title]}
          onToggle={() => toggleGroup(section.title)}
        />
      )}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#d97706" />
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {isLoading ? 'Chargement…' : 'Aucune règle trouvée.'}
        </Text>
      }
      stickySectionHeadersEnabled
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  // En-tête groupe
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f1e35',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  groupTitle: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  groupBadges: { flexDirection: 'row', gap: 6 },
  groupCount: {
    backgroundColor: '#052e16',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  groupCountText: { color: '#4ade80', fontSize: 10, fontWeight: '600' },

  // Ligne règle
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  rowDisabled: { opacity: 0.45 },
  rowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 8 },
  rowInfo: { flex: 1 },
  rowTitle: { color: '#f1f5f9', fontSize: 13, fontWeight: '500' },
  rowTitleDisabled: { color: '#64748b' },
  rowMeta: { color: '#475569', fontSize: 11, marginTop: 2 },

  // Badge action
  actionBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 44,
    alignItems: 'center',
  },
  actionText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  empty: { color: '#64748b', textAlign: 'center', marginTop: 60, fontSize: 14 },
});
