import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FirewallSelector from '@/components/FirewallSelector';
import { useFirewallsStore } from '@/store/firewallsStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IoniconsName, inactive: IoniconsName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  );
}

// ────────────────────────────────────────────────────────────
// Overlay affiché pendant le changement de firewall
// ────────────────────────────────────────────────────────────
function SwitchingOverlay() {
  const isSwitching = useFirewallsStore(s => s.isSwitching);
  const firewalls   = useFirewallsStore(s => s.firewalls);
  const selectedId  = useFirewallsStore(s => s.selectedId);
  const fw = firewalls.find(f => f.id === selectedId);

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isSwitching ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isSwitching]);

  // Ne pas monter du tout si pas de fw ni d'animation en cours
  if (!fw) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents={isSwitching ? 'auto' : 'none'}>
      <View style={[styles.pill, { borderColor: fw.color }]}>
        <View style={[styles.pillDot, { backgroundColor: fw.color }]} />
        <Text style={styles.pillText}>{fw.name}</Text>
        <View style={styles.spinnerWrap}>
          {/* Trois points pulsants en guise de spinner léger */}
          <PulsingDots color={fw.color} />
        </View>
      </View>
    </Animated.View>
  );
}

function PulsingDots({ color }: { color: string }) {
  const anims = [useRef(new Animated.Value(0.3)).current,
                 useRef(new Animated.Value(0.3)).current,
                 useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1,   duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      ).start();

    pulse(anims[0], 0);
    pulse(anims[1], 150);
    pulse(anims[2], 300);
  }, []);

  return (
    <View style={styles.dots}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { backgroundColor: color, opacity: anim }]}
        />
      ))}
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Layout principal
// ────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
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
          headerRight: () => <FirewallSelector />,
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
        <Tabs.Screen
          name="ha"
          options={{
            title: 'Haute Disponibilité',
            tabBarLabel: 'HA',
            tabBarIcon: tabIcon('git-branch', 'git-branch-outline'),
            headerRight: () => null,
          }}
        />
      </Tabs>

      {/* Overlay de transition — par-dessus les tabs, sous la tab bar */}
      <SwitchingOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172acc',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1e293b',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  pillDot: { width: 10, height: 10, borderRadius: 5 },
  pillText: { color: '#f1f5f9', fontSize: 15, fontWeight: '700' },
  spinnerWrap: { marginLeft: 4 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
