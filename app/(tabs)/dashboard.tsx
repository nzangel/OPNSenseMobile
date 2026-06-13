import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSystemStats, useInterfaces } from '@/hooks/useSystemStats';
import { useFirewallsStore } from '@/store/firewallsStore';
import { useMetricsStore } from '@/store/metricsStore';
import SparklineChart from '@/components/SparklineChart';
import ProgressBar from '@/components/ProgressBar';
function SectionTitle({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={13} color="#64748b" />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function formatUptime(seconds: number): string {
  if (!seconds) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function DashboardScreen() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useSystemStats();
  const { data: ifaces, isLoading: ifacesLoading, refetch: refetchIfaces } = useInterfaces();
  const { clear } = useFirewallsStore();
  const { cpu: cpuHistory, ram: ramHistory, addMetric } = useMetricsStore();

  // Alimente l'historique à chaque nouveau point
  useEffect(() => {
    if (stats) {
      addMetric(stats.cpu, stats.memory.pct);
    }
  }, [stats]);

  const refreshing = statsLoading || ifacesLoading;
  function onRefresh() { refetchStats(); refetchIfaces(); }

  const cpuColor = '#f59e0b';  // amber
  const ramColor = '#6366f1';  // indigo

  async function handleDisconnect() {
    await clear();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={cpuColor} />}
    >
      {/* ── CPU ─────────────────────────────────────────────────── */}
      <SectionTitle icon="speedometer-outline" label="CPU" />
      <View style={styles.card}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricLabel}>Utilisation</Text>
          <Text style={[styles.metricValue, { color: cpuColor }]}>
            {stats ? `${stats.cpu}%` : '—'}
          </Text>
        </View>
        {!!stats?.cpuModel && (
          <Text style={styles.metricSub} numberOfLines={1}>{stats.cpuModel}</Text>
        )}
        <View style={styles.chartWrap}>
          <SparklineChart data={cpuHistory} color={cpuColor} height={48} />
        </View>
        <View style={styles.chartFooter}>
          <Text style={styles.chartLabel}>5 min</Text>
          <Text style={styles.chartLabel}>maintenant</Text>
        </View>
      </View>

      {/* ── Mémoire ─────────────────────────────────────────────── */}
      <SectionTitle icon="hardware-chip-outline" label="Mémoire" />
      <View style={styles.card}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricLabel}>
            {stats ? `${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}` : '—'}
          </Text>
          <Text style={[styles.metricValue, { color: ramColor }]}>
            {stats ? `${stats.memory.pct}%` : '—'}
          </Text>
        </View>
        <View style={{ marginTop: 10 }}>
          <ProgressBar pct={stats?.memory.pct ?? 0} color={ramColor} height={8} />
        </View>
        <View style={styles.chartWrap}>
          <SparklineChart data={ramHistory} color={ramColor} height={40} />
        </View>
        <View style={styles.chartFooter}>
          <Text style={styles.chartLabel}>5 min</Text>
          <Text style={styles.chartLabel}>maintenant</Text>
        </View>
      </View>

      {/* ── Système ─────────────────────────────────────────────── */}
      <SectionTitle icon="server-outline" label="Système" />
      <View style={styles.card}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricLabel}>Uptime</Text>
          <Text style={[styles.metricValue, { color: '#34d399' }]}>
            {stats ? formatUptime(stats.uptime) : '—'}
          </Text>
        </View>
        {stats?.datetime && (
          <Text style={styles.metricSub}>
            Relevé à {new Date(stats.datetime).toLocaleTimeString('fr-FR')}
          </Text>
        )}
      </View>

      {/* ── Interfaces ──────────────────────────────────────────── */}
      <SectionTitle icon="git-network-outline" label="Interfaces" />
      {(ifaces ?? []).map((iface) => (
        <View key={iface.name} style={styles.card}>
          <View style={styles.ifaceHeader}>
            <Text style={styles.ifaceName}>{iface.description || iface.name}</Text>
            <View style={[styles.badge, iface.status === 'up' ? styles.badgeUp : styles.badgeDown]}>
              <Text style={styles.badgeText}>{iface.status}</Text>
            </View>
          </View>
          {!!iface.ipv4 && <Text style={styles.ifaceDetail}>{iface.ipv4}</Text>}
          {!!iface.macAddr && <Text style={styles.metricSub}>{iface.macAddr}</Text>}
        </View>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleDisconnect}>
        <Ionicons name="log-out-outline" size={15} color="#ef4444" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
    marginTop: 20,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },

  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: { color: '#94a3b8', fontSize: 14 },
  metricValue: { fontSize: 24, fontWeight: '700' },
  metricSub: { color: '#475569', fontSize: 11, marginTop: 4 },

  chartWrap: { marginTop: 12, marginHorizontal: -4 },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  chartLabel: { color: '#334155', fontSize: 10 },

  ifaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ifaceName: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  badgeUp: { backgroundColor: '#064e3b' },
  badgeDown: { backgroundColor: '#450a0a' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#f1f5f9' },
  ifaceDetail: { color: '#cbd5e1', fontSize: 13, marginTop: 6 },

  logoutBtn: { marginVertical: 32, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  logoutText: { color: '#ef4444', fontSize: 14 },
});
