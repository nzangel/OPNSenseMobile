import { useQuery } from '@tanstack/react-query';
import { fetchSystemStats, fetchInterfaces } from '@/api';
import { useApiClient } from './useApiClient';
import { useFirewallsStore } from '@/store/firewallsStore';

export function useSystemStats() {
  const client     = useApiClient();
  const selectedId = useFirewallsStore(s => s.selectedId);

  return useQuery({
    queryKey: ['system-stats', selectedId],
    queryFn:  () => fetchSystemStats(client!),
    enabled:  !!client,
    refetchInterval: 5_000,
  });
}

export function useInterfaces() {
  const client     = useApiClient();
  const selectedId = useFirewallsStore(s => s.selectedId);

  return useQuery({
    queryKey: ['interfaces', selectedId],
    queryFn:  () => fetchInterfaces(client!),
    enabled:  !!client,
    refetchInterval: 15_000,
  });
}
