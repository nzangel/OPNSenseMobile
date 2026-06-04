import { Redirect } from 'expo-router';

// Route racine — redirige vers login par défaut.
// L'AuthGate dans _layout.tsx prend le relais si des credentials existent.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
