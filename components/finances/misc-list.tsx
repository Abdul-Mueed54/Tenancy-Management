import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

interface Props {
  charges: any[];
  agreementId: string;
}

export function MiscList({ charges, agreementId }: Props) {
  return (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Other Charges</Text>
        <TouchableOpacity className="bg-white px-3 py-1.5 rounded-lg flex-row items-center border border-primary-200">
          <Ionicons name="add" size={14} color="#0f766e" />
          <Text className="text-primary-700 font-bold ml-1 text-xs">Add Charge</Text>
        </TouchableOpacity>
      </View>

      {charges.length === 0 ? (
        <Text className="text-center text-muted-foreground mt-8 text-sm">No miscellaneous charges found.</Text>
      ) : (
        charges.map((charge) => (
          <View key={charge.id} className="bg-white rounded-xl p-4 mb-3 border border-border flex-row justify-between items-center shadow-sm">
            <View>
              <Text className="font-bold text-foreground text-sm">{charge.charge_type}</Text>
              <Text className="text-muted-foreground text-xs mt-0.5">{dayjs(charge.date_incurred).format('DD MMM YYYY')}</Text>
            </View>
            <View className="items-end">
              <Text className="font-bold text-foreground mb-1 text-sm">Rs {charge.amount}</Text>
              <View className={`px-2 py-0.5 rounded-md ${charge.status === 'paid' ? 'bg-green-100' : 'bg-red-100'}`}>
                <Text className={`text-[9px] font-bold uppercase ${charge.status === 'paid' ? 'text-green-700' : 'text-red-700'}`}>
                  {charge.status}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}