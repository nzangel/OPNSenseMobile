import React, { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useCredentialsStore } from '@/store/credentialsStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5_000 } },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <StatusBar style="light" />
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { credentials, isLoading, load } = useCredentialsStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (isLoading) return;

    console.log('[AuthGate] pathname:', pathname, '| credentials:', !!credentials);

    const inAuth = pathname.startsWith('/login') || pathname === '/';

    if (!credentials && !inAuth) {
      console.log('[AuthGate] → redirect to login');
      router.replace('/(auth)/login');
    }
    if (credentials && inAuth) {
      console.log('[AuthGate] → redirect to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [credentials, isLoading, pathname]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
