import axios, { AxiosInstance } from 'axios';
import { Credentials } from '@/types';

// OPNsense uses HTTP Basic Auth: API key as username, API secret as password.
// Requests go directly to the user's firewall — no backend involved.
export function createApiClient(creds: Credentials): AxiosInstance {
  return axios.create({
    baseURL: `${creds.host}/api`,
    auth: {
      username: creds.apiKey,
      password: creds.apiSecret,
    },
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
    // Self-signed certs are common on local firewalls — handled by the
    // user accepting the cert on first connection or via network config.
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;
