import { View, Text, TextInput, SectionList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { getAllTenants } from '@/db/queries/tenants.queries';
import { TenantCard } from '@/components/tenants/tenants-card';

type TenantRow = {
  tenantId: string;
  agreementId: string;
  name: string;
  contact: string;
  cnic: string;
  rentAmount: number;
  unitNumber: string;
  isActive: boolean;
  buildingName: string;
};

export default function UniversalTenantsScreen() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenants = async () => {
      const result = await getAllTenants();
      if (result.success && result.data) {
        setTenants(result.data);
      }
      setIsLoading(false);
    };
    loadTenants();
  }, []);

  // Filter and Group the data instantly on the client side
  const groupedData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // 1. Apply Search Filter
    const filtered = tenants.filter(t =>
      t.name.toLowerCase().includes(query) ||
      (t.contact && t.contact.toLowerCase().includes(query)) ||
      (t.unitNumber && t.unitNumber.toLowerCase().includes(query)) ||
      (t.cnic && t.cnic.toLowerCase().includes(query))
    );

    // 2. Group by Building Name
    const groups = filtered.reduce((acc, tenant) => {
      if (!acc[tenant.buildingName]) {
        acc[tenant.buildingName] = [];
      }
      acc[tenant.buildingName].push(tenant);
      return acc;
    }, {} as Record<string, TenantRow[]>);

    // 3. Convert object to SectionList array format
    return Object.keys(groups)
      .sort()
      .map(buildingName => ({
        title: buildingName,
        data: groups[buildingName]
      }));
  }, [tenants, searchQuery]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-muted/10">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header & Sticky Search Bar */}
      <View className="px-5 pt-12 pb-4 border-b border-border shadow-sm z-10">
        <Text className="text-2xl font-bold text-foreground mb-4">All Tenants</Text>
      </View>
        <View className="flex-row items-center bg-white mx-4 mt-5 border border-border rounded-xl px-3 py-">
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            className="flex-1 ml-2 text-sm text-foreground"
            placeholder="Search name, phone, unit or CNIC..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

      {/* Sectioned List by Building */}
      <SectionList
        sections={groupedData}
        keyExtractor={(item) => item.tenantId}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="items-center mt-10">
            <Text className="text-muted-foreground text-sm">No tenants found matching "{searchQuery}"</Text>
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View className="bg-muted/95 py-2 mb-2">
            <Text className="text-sm font-bold text-teal-800 uppercase ">
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TenantCard
            name={item.name}
            contact={item.contact}
            rentAmount={item.rentAmount}
            unitNumber={item.unitNumber}
            isActive={item.isActive}
            onPress={() => router.push({ pathname: '/tenants/[id]', params: { id: item.tenantId } })}
          />
        )}
      />
    </View>
  );
}