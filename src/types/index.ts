export interface Credentials {
  host: string;       // e.g. "https://192.168.1.1"
  apiKey: string;
  apiSecret: string;
}

export interface Interface {
  name: string;
  description: string;
  status: 'up' | 'down' | 'unknown';
  ipv4: string;
  ipv6?: string;
  macAddr: string;
  media?: string;
}

export interface SystemStats {
  cpu: number;         // 0-100
  cpuModel: string;    // ex: "Intel Core i7-4770 @ 3.40GHz"
  memory: { used: number; total: number; pct: number };
  uptime: number;      // seconds
  datetime: string;
}

export interface FirewallRule {
  uuid: string;
  enabled: '0' | '1';
  sequence: number;
  interface: string;
  direction: 'in' | 'out';
  action: 'pass' | 'block' | 'reject';
  protocol: string;
  source: string;
  destination: string;
  description: string;
}

export interface LogEntry {
  timestamp: string;
  interface: string;
  action: string;
  protocol: string;
  src: string;
  srcPort: string;
  dst: string;
  dstPort: string;
  label?: string;
}
