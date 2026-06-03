import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IoniconsName, inactive: IoniconsName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#d97706',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f1f5f9',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: tabIcon('speedometer', 'speedometer-outline'),
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarLabel: 'Logs',
          tabBarIcon: tabIcon('list', 'list-outline'),
        }}
      />
      <Tabs.Screen
        name="rules"
        options={{
          title: 'Règles firewall',
          tabBarLabel: 'Règles',
          tabBarIcon: tabIcon('shield', 'shield-outline'),
        }}
      />
      <Tabs.Screen
        name="block"
        options={{
          title: 'Bloquer une IP',
          tabBarLabel: 'Bloquer',
          tabBarIcon: tabIcon('ban', 'ban-outline'),
        }}
      />
    </Tabs>
  );
}
