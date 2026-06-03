import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFirewallRules, toggleFirewallRule, fetchFirewallLogs, blockIp } from '@/api';
import { useApiClient } from './useApiClient';

export function useFirewallRules() {
  const client = useApiClient();

  return useQuery({
    queryKey: ['firewall-rules'],
    queryFn: () => fetchFirewallRules(client!),
    enabled: !!client,
  });
}

export function useToggleRule() {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, enable }: { uuid: string; enable: boolean }) =>
      toggleFirewallRule(client!, uuid, enable),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['firewall-rules'] }),
  });
}

export function useFirewallLogs() {
  const client = useApiClient();

  return useQuery({
    queryKey: ['firewall-logs'],
    queryFn: () => fetchFirewallLogs(client!),
    enabled: !!client,
    refetchInterval: 5_000,
  });
}

export function useBlockIp() {
  const client = useApiClient();

  return useMutation({
    mutationFn: (ip: string) => blockIp(client!, ip),
  });
}
