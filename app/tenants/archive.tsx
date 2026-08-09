import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { router, Stack } from 'expo-router';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { getArchivedTenants } from '@/db/queries/agreements.queries';

type ArchivedAgreement = {
  id: string;
  tenantId: string;
  tenantName: string;
  buildingName: string;
  unitNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
};

export default function ArchiveScreen() {
  const [archives, setArchives] = useState<ArchivedAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchArchives = async () => {
        setIsLoading(true);
        const result = await getArchivedTenants();
        if (result.success && result.data) {
          setArchives(result.data as ArchivedAgreement[]);
        }
        setIsLoading(false);
      };
      fetchArchives();
    }, [])
  );

  const renderArchiveCard = ({ item }: { item: ArchivedAgreement }) => (
    <TouchableOpacity
    onPress={() => router.push(`/tenants/${item.tenantId}`)}
  >
    <View className="bg-white border border-border rounded-xl p-4 mb-3 shadow-sm opacity-80">
      {/* DATE EMPHASIS AT THE TOP */}
      <View className="flex-row items-center mb-2">
        <Ionicons name="time-outline" size={16} color="#71717a" className="mr-1" />
        <Text className="text-sm font-bold text-zinc-600">
          {dayjs(item.startDate).format('MMM YYYY')} — {dayjs(item.endDate).format('MMM YYYY')}
        </Text>
      </View>

      <View className="flex-row justify-between items-end">
        <View>
          <Text className="text-lg font-bold text-foreground">{item.tenantName}</Text>
          <Text className="text-muted-foreground mt-0.5">
            {item.buildingName} • Unit {item.unitNumber}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-muted-foreground text-xs">Final Rent</Text>
          <Text className="text-foreground font-bold">Rs {item.monthlyRent}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-muted/10">
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-border bg-white shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-1 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-foreground">Archived Leases</Text>
          <Text className="text-xs text-muted-foreground">Historical records of past tenants</Text>
        </View>
      </View>

      {/* LIST */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : archives.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="file-tray-outline" size={64} color="#a1a1aa" className="mb-4" />
          <Text className="text-xl font-bold text-foreground mb-2 text-center">No Archives Yet</Text>
          <Text className="text-muted-foreground text-center">
            When tenants move out, they will appear here along with their info
          </Text>
        </View>
      ) : (
        <FlatList
          data={archives}
          keyExtractor={(item) => item.id}
          renderItem={renderArchiveCard}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}