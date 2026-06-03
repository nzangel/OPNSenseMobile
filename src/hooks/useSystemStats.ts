import { useQuery } from '@tanstack/react-query';
import { fetchSystemStats, fetchInterfaces } from '@/api';
import { useApiClient } from './useApiClient';

export function useSystemStats() {
  const client = useApiClient();

  return useQuery({
    queryKey: ['system-stats'],
    queryFn: () => fetchSystemStats(client!),
    enabled: !!client,
    refetchInterval: 5_000,  // get_activity donne CPU + uptime en temps réel
  });
}

export function useInterfaces() {
  const client = useApiClient();

  return useQuery({
    queryKey: ['interfaces'],
    queryFn: () => fetchInterfaces(client!),
    enabled: !!client,
    refetchInterval: 15_000,
  });
}
