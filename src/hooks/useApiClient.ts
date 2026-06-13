import { useMemo } from 'react';
import { createApiClient, ApiClient } from '@/api/client';
import { useFirewallsStore } from '@/store/firewallsStore';
import { Firewall } from '@/types';

// Client pour le firewall actuellement sélectionné
export function useApiClient(): ApiClient | null {
  const firewalls  = useFirewallsStore(s => s.firewalls);
  const selectedId = useFirewallsStore(s => s.selectedId);
  const fw = firewalls.find(f => f.id === selectedId) ?? null;

  return useMemo(
    () => fw ? createApiClient({ host: fw.host, apiKey: fw.apiKey, apiSecret: fw.apiSecret }) : null,
    [fw?.id, fw?.host, fw?.apiKey, fw?.apiSecret],
  );
}

// Client pour un firewall spécifique (utile pour la vue HA)
export function useApiClientFor(fw: Firewall | null): ApiClient | null {
  return useMemo(
    () => fw ? createApiClient({ host: fw.host, apiKey: fw.apiKey, apiSecret: fw.apiSecret }) : null,
    [fw?.id, fw?.host, fw?.apiKey, fw?.apiSecret],
  );
}
