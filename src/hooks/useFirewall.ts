import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFirewallRules, toggleFirewallRule, fetchFirewallLogs, blockIp } from '@/api';
import { useApiClient } from './useApiClient';
import { useFirewallsStore } from '@/store/firewallsStore';

export function useFirewallRules() {
  const client     = useApiClient();
  const selectedId = useFirewallsStore(s => s.selectedId);

  return useQuery({
    queryKey: ['firewall-rules', selectedId],
    queryFn:  () => fetchFirewallRules(client!),
    enabled:  !!client,
  });
}

export function useToggleRule() {
  const client      = useApiClient();
  const selectedId  = useFirewallsStore(s => s.selectedId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, enable }: { uuid: string; enable: boolean }) =>
      toggleFirewallRule(client!, uuid, enable),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['firewall-rules', selectedId] }),
  });
}

export function useFirewallLogs() {
  const client     = useApiClient();
  const selectedId = useFirewallsStore(s => s.selectedId);

  return useQuery({
    queryKey: ['firewall-logs', selectedId],
    queryFn:  () => fetchFirewallLogs(client!),
    enabled:  !!client,
    refetchInterval: 5_000,
  });
}

export function useBlockIp() {
  const client = useApiClient();

  return useMutation({
    mutationFn: (ip: string) => blockIp(client!, ip),
  });
}
