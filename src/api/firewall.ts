import { ApiClient } from './client';
import { FirewallRule, LogEntry } from '@/types';

export async function fetchFirewallRules(client: ApiClient): Promise<FirewallRule[]> {
  const res = await client.get('/firewall/filter/searchRule', {
    params: { current: 1, rowCount: 500, searchPhrase: '' },
  });

  return (res.data.rows ?? []).map((r: any): FirewallRule => ({
    uuid: r.uuid,
    enabled: r.enabled,
    sequence: Number(r.sequence),
    interface: r.interface,
    direction: r.direction,
    action: r.action,
    protocol: r.protocol,
    source: r.source_net ?? 'any',
    destination: r.destination_net ?? 'any',
    description: r.description ?? '',
  }));
}

export async function toggleFirewallRule(
  client: ApiClient,
  uuid: string,
  enable: boolean,
): Promise<void> {
  await client.post(`/firewall/filter/toggleRule/${uuid}`, { enabled: enable ? '1' : '0' });
  await client.post('/firewall/filter/apply');
}

export async function fetchFirewallLogs(client: ApiClient): Promise<LogEntry[]> {
  const res = await client.get('/diagnostics/firewall/log', {
    params: { limit: 200 },
  });

  return (res.data ?? []).map((entry: any): LogEntry => ({
    timestamp: entry.__timestamp__ ?? '',
    interface: entry.interface ?? '',
    action: entry.action ?? '',
    protocol: entry.proto ?? '',
    src: entry.src ?? '',
    srcPort: entry.srcport ?? '',
    dst: entry.dst ?? '',
    dstPort: entry.dstport ?? '',
    label: entry.label ?? undefined,
  }));
}

export async function blockIp(client: ApiClient, ip: string): Promise<void> {
  // Adds an alias entry then applies — uses the OPNsense alias API
  const aliasName = 'ClockIPBlock';

  // Ensure alias exists (create if not)
  try {
    await client.post('/firewall/alias/addHost', {
      alias: { name: aliasName, type: 'host', content: '' },
    });
  } catch {
    // alias already exists, safe to continue
  }

  await client.post(`/firewall/alias/setAliasEntry/${aliasName}`, { address: ip });
  await client.post('/firewall/alias/reconfigure');
}
