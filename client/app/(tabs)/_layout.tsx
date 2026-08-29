import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [background, muted, accent, border] = useCSSVariable([
    '--color-background',
    '--color-muted',
    '--color-accent',
    '--color-border',
  ]) as string[];

  let tabBarStyle: Record<string, unknown> = {
    backgroundColor: background,
    borderTopWidth: 1,
    borderTopColor: border,
    paddingBottom: insets.bottom > 0 ? insets.bottom - 8 : 4,
  };

  if (Platform.OS === 'web') {
    tabBarStyle = { ...tabBarStyle, height: 'auto' };
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '总览',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="map-location-dot" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="route-book"
        options={{
          title: '路书',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="book-open" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="preparation"
        options={{
          title: '准备',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="suitcase" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: '开销',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="coins" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: '预定',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="ticket" size={18} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
