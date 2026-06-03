import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirewallLogs } from '@/hooks/useFirewall';
import { LogEntry } from '@/types';

// ── Ports → noms de services connus ──────────────────────────────────────────
const KNOWN_PORTS: Record<string, string> = {
  '20': 'FTP-data', '21': 'FTP', '22': 'SSH', '23': 'Telnet',
  '25': 'SMTP', '53': 'DNS', '67': 'DHCP', '68': 'DHCP',
  '80': 'HTTP', '110': 'POP3', '123': 'NTP', '143': 'IMAP',
  '161': 'SNMP', '443': 'HTTPS', '465': 'SMTPS', '514': 'Syslog',
  '587': 'SMTP', '636': 'LDAPS', '993': 'IMAPS', '995': 'POP3S',
  '1194': 'OpenVPN', '1433': 'MSSQL', '3306': 'MySQL',
  '3389': 'RDP', '5900': 'VNC', '8080': 'HTTP-alt', '8443': 'HTTPS-alt',
};

function portLabel(port: string): string {
  return KNOWN_PORTS[port] ? `${KNOWN_PORTS[port]} (${port})` : port;
}

// ── Timestamp relatif ─────────────────────────────────────────────────────────
function relativeTime(timestamp: string): string {
  if (!timestamp) return '';
  // OPNsense format : "2024-01-15T14:23:45" ou "Jan 15 14:23:45"
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5)   return 'maintenant';
  if (diff < 60)  return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

// ── Couleurs et icônes par action ─────────────────────────────────────────────
function actionStyle(action: string): { bg: string; text: string; label: string } {
  switch (action.toLowerCase()) {
    case 'block': return { bg: '#450a0a', text: '#f87171', label: 'BLOCK' };
    case 'pass':  return { bg: '#052e16', text: '#4ade80', label: 'PASS ' };
    case 'reject':return { bg: '#431407', text: '#fb923c', label: 'REJECT' };
    default:      return { bg: '#1e293b', text: '#94a3b8', label: action.toUpperCase() };
  }
}

// ── Icône protocole ───────────────────────────────────────────────────────────
function ProtoIcon({ proto }: { proto: string }) {
  const p = proto.toLowerCase();
  let name: React.ComponentProps<typeof Ionicons>['name'] = 'help-circle-outline';
  let color = '#64748b';

  if (p === 'tcp')       { name = 'git-commit-outline'; color = '#60a5fa'; }
  else if (p === 'udp')  { name = 'radio-outline';       color = '#c084fc'; }
  else if (p.includes('icmp')) { name = 'pulse-outline'; color = '#facc15'; }

  return <Ionicons name={name} size={12} color={color} />;
}

// ── Filtre type ───────────────────────────────────────────────────────────────
type Filter = 'all' | 'block' | 'pass';

// ── Composant ligne ───────────────────────────────────────────────────────────
function LogRow({ item }: { item: LogEntry }) {
  const action = actionStyle(item.action);
  const proto  = (item.protocol || '').toUpperCase();

  return (
    <View style={styles.row}>
      {/* En-tête : badge action + protocole + timestamp */}
      <View style={styles.rowHeader}>
        <View style={[styles.actionBadge, { backgroundColor: action.bg }]}>
          <Text style={[styles.actionText, { color: action.text }]}>{action.label}</Text>
        </View>
        <View style={styles.protoWrap}>
          <ProtoIcon proto={item.protocol} />
          <Text style={styles.protoText}>{proto}</Text>
        </View>
        <Text style={styles.timeText}>{relativeTime(item.timestamp)}</Text>
      </View>

      {/* Corps : src → dst */}
      <View style={styles.rowBody}>
        <Text style={styles.ipText} numberOfLines={1}>
          {item.src}
          {item.srcPort ? <Text style={styles.portText}>:{item.srcPort}</Text> : null}
        </Text>
        <View style={styles.arrowWrap}>
          <View style={styles.arrowLine} />
          <Ionicons name="arrow-down" size={10} color="#475569" />
          <Text style={styles.ifaceText}>{item.interface}</Text>
        </View>
        <Text style={styles.ipText} numberOfLines={1}>
          {item.dst}
          {item.dstPort
            ? <Text style={styles.portText}> : {portLabel(item.dstPort)}</Text>
            : null}
        </Text>
      </View>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function LogsScreen() {
  const { data: logs, isLoading, refetch } = useFirewallLogs();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (!logs) return [];
    if (filter === 'all')   return logs;
    if (filter === 'block') return logs.filter(l => l.action.toLowerCase() === 'block');
    return logs.filter(l => l.action.toLowerCase() === 'pass');
  }, [logs, filter]);

  return (
    <View style={styles.container}>
      {/* Barre de filtres */}
      <View style={styles.filterBar}>
        {(['all', 'block', 'pass'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Tous' : f === 'block' ? '🔴 Bloqués' : '🟢 Passés'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <LogRow item={item} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#d97706" />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isLoading ? 'Chargement…' : 'Aucun log disponible.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  // Filtres
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  filterBtnActive: { backgroundColor: '#d97706' },
  filterText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  // Ligne log
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  protoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  protoText: { color: '#64748b', fontSize: 11 },
  timeText: { color: '#475569', fontSize: 11, marginLeft: 'auto' },

  // Corps
  rowBody: { paddingLeft: 4, gap: 2 },
  ipText: { color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' },
  portText: { color: '#94a3b8', fontSize: 12 },
  arrowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
  },
  arrowLine: {
    width: 16,
    height: 1,
    backgroundColor: '#334155',
  },
  ifaceText: { color: '#475569', fontSize: 10 },

  empty: { color: '#64748b', textAlign: 'center', marginTop: 60, fontSize: 14 },
});
