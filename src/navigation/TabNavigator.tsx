import React from 'react';
import { Tabs } from 'expo-router';

export default function TabNavigator() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
        tabBarActiveTintColor: '#d97706',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f1f5f9',
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="logs" options={{ title: 'Logs' }} />
      <Tabs.Screen name="rules" options={{ title: 'Rules' }} />
      <Tabs.Screen name="block" options={{ title: 'Block IP' }} />
    </Tabs>
  );
}
