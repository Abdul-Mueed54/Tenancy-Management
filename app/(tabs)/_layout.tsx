import { Stack, Tabs } from 'expo-router';
import { Ionicons,  } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#737373',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e5e5',
          height: 60,
          marginBottom: 16,
          marginHorizontal: 18,
          padding: 3,
          borderRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen name="index" options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => ( <Ionicons name="home" color={color} size={24} /> ),
        }}
      />

      <Tabs.Screen name="buildings" options={{
          title: 'Buildings',
          tabBarIcon: ({ color, size }) => ( <Ionicons name="business" color={color} size={26} /> ),
        }}
      />

      <Tabs.Screen name="tenants" options={{
          title: 'Tenants',
          tabBarIcon: ({ color, size }) => ( <Ionicons name="people" color={color} size={24} /> ),
        }}
      />

      <Tabs.Screen name="settings" options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => ( <Ionicons name="settings" color={color} size={24} /> ),
        }}
      />

    </Tabs>
  );
}