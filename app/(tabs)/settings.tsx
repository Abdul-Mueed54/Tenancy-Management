import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-muted/10">
      {/* HEADER */}
      <View className="px-4 pt-12 pb-4 border-b border-border bg-white shadow-sm">
        <Text className="text-xl font-bold text-foreground">Settings</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
          Data Management
        </Text>

        <View className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <TouchableOpacity
            onPress={() => router.push('/agreements/archive')}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="bg-muted/20 p-2 rounded-xl mr-3">
                <Ionicons name="archive-outline" size={20} color="#0f766e" />
              </View>
              <View>
                <Text className="text-base font-bold text-foreground">Archived Leases</Text>
                <Text className="text-xs text-muted-foreground">View past tenants and historical contracts</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}