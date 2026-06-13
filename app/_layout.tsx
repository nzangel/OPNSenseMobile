import React, { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useFirewallsStore } from '@/store/firewallsStore';

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
  const { firewalls, isLoading, load } = useFirewallsStore();
  const pathname = usePathname();
  const router   = useRouter();
  const hasFirewalls = firewalls.length > 0;

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (isLoading) return;

    console.log('[AuthGate] pathname:', pathname, '| firewalls:', firewalls.length);

    const inAuth = pathname.startsWith('/login') || pathname === '/';

    if (!hasFirewalls && !inAuth) {
      console.log('[AuthGate] → redirect to login');
      router.replace('/(auth)/login');
    }
    if (hasFirewalls && inAuth) {
      console.log('[AuthGate] → redirect to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [hasFirewalls, isLoading, pathname]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="(modals)/add-firewall"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="(modals)/ha-group"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
