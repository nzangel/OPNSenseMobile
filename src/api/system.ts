import { ApiClient } from './client';
import { SystemStats, Interface } from '@/types';

// Parse "last pid: ...  up 20+16:13:49  ..." → secondes
function parseUptime(header: string): number {
  // Format: "up DD+HH:MM:SS" ou "up HH:MM:SS" ou "up X days"
  const match =
    header.match(/up\s+(\d+)\+(\d+):(\d+):(\d+)/) ??  // 20+16:13:49
    header.match(/up\s+(\d+):(\d+):(\d+)/);            // 16:13:49

  if (!match) return 0;

  if (match.length === 5) {
    // DD+HH:MM:SS
    return Number(match[1]) * 86400
         + Number(match[2]) * 3600
         + Number(match[3]) * 60
         + Number(match[4]);
  }
  // HH:MM:SS
  return Number(match[1]) * 3600
       + Number(match[2]) * 60
       + Number(match[3]);
}

// Parse "CPU:  0.6% user,  1.4% system,  98.0% idle" → % utilisé
function parseCpuFromHeader(header: string): number | null {
  const idleMatch = header.match(/(\d+\.?\d*)\s*%\s*idle/);
  if (!idleMatch) return null;
  return Math.max(0, Math.min(100, Math.round(100 - parseFloat(idleMatch[1]))));
}

export async function fetchSystemStats(client: ApiClient): Promise<SystemStats> {
  const [memResult, cpuTypeResult, activityResult] = await Promise.allSettled([
    client.get('/diagnostics/system/system_resources'),
    client.get('/diagnostics/cpu_usage/get_c_p_u_type'),
    client.get('/diagnostics/activity/get_activity'),
  ]);

  // ── Mémoire ──────────────────────────────────────────────────────────────
  let memTotal = 0, memUsed = 0;
  if (memResult.status === 'fulfilled') {
    const mem = memResult.value.data?.memory ?? memResult.value.data ?? {};
    memTotal = Number(mem.total ?? 0);
    memUsed  = Number(mem.used  ?? 0);
  }

  // ── CPU modèle ────────────────────────────────────────────────────────────
  let cpuModel = '';
  if (cpuTypeResult.status === 'fulfilled') {
    const arr = cpuTypeResult.value.data;
    cpuModel = Array.isArray(arr) ? (arr[0] ?? '') : '';
  }

  // ── CPU % + Uptime depuis get_activity ────────────────────────────────────
  // headers[0] : "last pid: 50281;  load averages: ... up 20+16:13:49 ..."
  // headers[2] : "CPU:  0.6% user,  0.0% nice,  1.4% system,  98.0% idle"
  let cpuUsed = 0, uptime = 0;
  if (activityResult.status === 'fulfilled') {
    const headers: string[] = activityResult.value.data?.headers ?? [];
    for (const line of headers) {
      if (line.includes('up ') && uptime === 0) {
        uptime = parseUptime(line);
      }
      if (line.includes('% idle') && cpuUsed === 0) {
        cpuUsed = parseCpuFromHeader(line) ?? 0;
      }
    }
  } else {
    console.warn('[API] get_activity FAILED:', activityResult.reason?.response?.status);
  }

  return {
    cpu: cpuUsed,
    cpuModel,
    memory: {
      used: memUsed,
      total: memTotal,
      pct: memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0,
    },
    uptime,
    datetime: new Date().toISOString(),
  };
}

export async function fetchInterfaces(client: ApiClient): Promise<Interface[]> {
  const res = await client.get('/diagnostics/interface/getInterfaceStatistics');
  const raw: Record<string, any> = res.data.statistics ?? res.data ?? {};

  const byIface: Record<string, {
    description: string;
    flags: number;
    macAddr: string;
    ipv4: string;
    ipv6: string;
  }> = {};

  for (const [key, data] of Object.entries(raw)) {
    const ifName: string = data.name ?? key;
    const network: string = data.network ?? '';
    const address: string = data.address ?? '';

    const descMatch = key.match(/^\[([^\]]+)\]/);
    const description = descMatch ? descMatch[1] : ifName;

    if (!byIface[ifName]) {
      byIface[ifName] = { description, flags: 0, macAddr: '', ipv4: '', ipv6: '' };
    }

    if (data.flags && byIface[ifName].flags === 0) {
      byIface[ifName].flags = parseInt(data.flags, 16);
    }

    if (network.startsWith('<Link')) {
      byIface[ifName].macAddr = address;
    } else if (address.includes(':') && !address.includes('.')) {
      byIface[ifName].ipv6 = address;
    } else if (address.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      byIface[ifName].ipv4 = address;
    }
  }

  return Object.entries(byIface).map(([ifName, info]) => {
    const isUp   = (info.flags & 0x1) !== 0 && (info.flags & 0x40) !== 0;
    const isDown = (info.flags & 0x1) === 0;
    const status: 'up' | 'down' | 'unknown' = isUp ? 'up' : isDown ? 'down' : 'unknown';

    return {
      name: ifName,
      description: info.description,
      status,
      ipv4: info.ipv4,
      ipv6: info.ipv6 || undefined,
      macAddr: info.macAddr,
    };
  });
}

export async function testConnection(client: ApiClient): Promise<boolean> {
  try {
    await client.get('/core/firmware/running');
    return true;
  } catch (e: any) {
    if (e?.response?.status) {
      console.log('testConnection: HTTP', e.response.status, '→ serveur joignable');
      return true;
    }
    console.warn('testConnection FAILED:', {
      message: e?.message,
      code: e?.code,
      baseURL: (e?.config?.baseURL ?? ''),
    });
    return false;
  }
}
