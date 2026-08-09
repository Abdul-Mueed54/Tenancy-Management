import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

interface Props {
  ledgers: any[];
  agreementId: string;
}

export function RentList({ ledgers, agreementId }: Props) {
  return (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rent Ledgers</Text>
        <TouchableOpacity className="bg-white px-3 py-1.5 rounded-lg flex-row items-center border border-primary-200">
          <Ionicons name="add" size={14} color="#0f766e" />
          <Text className="text-primary-700 font-bold ml-1 text-xs">Generate Bill</Text>
        </TouchableOpacity>
      </View>

      {ledgers.length === 0 ? (
        <Text className="text-center text-muted-foreground mt-8 text-sm">No rent ledgers found.</Text>
      ) : (
        ledgers.map((ledger) => (
          <View key={ledger.id} className="bg-white rounded-xl p-4 mb-3 border border-border flex-row justify-between items-center shadow-sm">
            <View>
              <Text className="font-bold text-foreground text-sm">
                {dayjs(ledger.billing_month).format('MMMM YYYY')}
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                Due: Rs {ledger.amount_due} / Total: Rs {ledger.total_payable_amount}
              </Text>
            </View>
            <View className={`px-2.5 py-1 rounded-md ${ledger.status === 'paid' ? 'bg-green-100' : ledger.status === 'partial' ? 'bg-orange-100' : 'bg-red-100'}`}>
              <Text className={`text-[10px] font-bold uppercase ${ledger.status === 'paid' ? 'text-green-700' : ledger.status === 'partial' ? 'text-orange-700' : 'text-red-700'}`}>
                {ledger.status}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}