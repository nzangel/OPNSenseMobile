import { useRouter } from 'expo-router';
import AddFirewallScreen from '@/screens/AddFirewallScreen';

export default function LoginScreen() {
  const router = useRouter();
  return (
    <AddFirewallScreen
      onDone={() => router.replace('/(tabs)/dashboard')}
    />
  );
}
