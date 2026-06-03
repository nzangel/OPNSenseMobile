import { useMemo } from 'react';
import { createApiClient, ApiClient } from '@/api/client';
import { useCredentialsStore } from '@/store/credentialsStore';

export function useApiClient(): ApiClient | null {
  const credentials = useCredentialsStore((s) => s.credentials);

  return useMemo(
    () => (credentials ? createApiClient(credentials) : null),
    [credentials],
  );
}
