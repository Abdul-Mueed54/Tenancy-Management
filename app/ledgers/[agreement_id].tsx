import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getFinancialHistory } from '@/db/queries/ledgers.queries';
import { BalanceCard } from '@/components/finances/balance-card';
import { FinancesTabs } from '@/components/finances/finances-tabs';
import { RentList } from '@/components/finances/rent-list';
import { UtilityList } from '@/components/finances/utility-list';
import { MiscList } from '@/components/finances/misc-list';
import { CustomToast } from '@/components/ui/toast';


export default function ManageFinancesScreen() {
  const { agreement_id } = useLocalSearchParams<{ agreement_id: string }>();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ visible: true, message, type });
  const [isLoading, setIsLoading] = useState(true);
  const [finances, setFinances] = useState<{ rentLedgers: any[], utilityLedgers: any[], miscCharges: any[] }>({
    rentLedgers: [],
    utilityLedgers: [],
    miscCharges: []
  });

  const [activeTab, setActiveTab] = useState<'rent' | 'utilities' | 'misc'>('rent');

  const fetchFinances = async () => {
    setIsLoading(true);
    if (agreement_id) {
      const result = await getFinancialHistory(agreement_id);
      if (result.success && result.data) {
        // Assuming your backend query separates or we filter entry_types
        // rentLedgers where entry_type === 'rent'
        // utilityLedgers where entry_type IN ('k_electric', 'gas', 'water')
        const allLedgers = result.data.rentLedgers || [];
        setFinances({
          rentLedgers: allLedgers.filter((l: any) => l.entry_type === 'rent'),
          utilityLedgers: allLedgers.filter((l: any) => ['k_electric', 'gas', 'water'].includes(l.entry_type)),
          miscCharges: result.data.miscCharges || []
        });
      }
    }
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchFinances();
    }, [agreement_id])
  );

  // Calculations
  const totalRentDue = finances.rentLedgers.reduce((acc, curr) => acc + curr.amount_due, 0);
  const totalUtilityDue = finances.utilityLedgers.reduce((acc, curr) => acc + curr.amount_due, 0);
  const totalMiscDue = finances.miscCharges.filter(m => m.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutstanding = totalRentDue + totalUtilityDue + totalMiscDue;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />

      <CustomToast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* HEADER */}
      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-border shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-1 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Manage Finances</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-muted/10 p-4">

        {/* OUTSTANDING BALANCE CARD */}
        <BalanceCard
          totalOutstanding={totalOutstanding}
          totalRentDue={totalRentDue}
          totalUtilityDue={totalUtilityDue}
          totalMiscDue={totalMiscDue}
        />

        {/* CUSTOM 3-WAY TABS */}
        <FinancesTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* RENT TAB VIEW */}
        {activeTab === 'rent' && <RentList ledgers={finances.rentLedgers} agreementId={agreement_id} onRefresh={fetchFinances} showToast={showToast}/>}

        {/* UTILITY BILLS TAB VIEW */}
        {activeTab === 'utilities' && <UtilityList ledgers={finances.utilityLedgers} agreementId={agreement_id} onRefresh={fetchFinances} showToast={showToast}/>}

        {/* MISC CHARGES TAB VIEW */}
        {activeTab === 'misc' && <MiscList charges={finances.miscCharges} agreementId={agreement_id} />}

        <View className="h-12" />
      </ScrollView>
    </View>
  );
}