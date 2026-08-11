import { View, Text } from 'react-native';

interface Props {
  totalOutstanding: number;
  totalRentDue: number;
  totalUtilityDue: number;
  totalMiscDue: number;
}

export function BalanceCard({ totalOutstanding, totalRentDue, totalUtilityDue, totalMiscDue }: Props) {
  return (
    <View className="bg-primary-700 rounded-2xl p-6 mb-6 shadow-sm">
      <Text className="text-slate-300 text-xs font-medium mb-1 uppercase tracking-wider">Total Outstanding Due</Text>
      <Text className="text-white text-3xl font-bold mb-4">Rs {totalOutstanding}</Text>

      <View className="flex-row justify-between border-t border-slate-600 pt-4 mt-2">
        <View>
          <Text className="text-slate-300 text-[11px]">Rent</Text>
          <Text className="text-white font-semibold text-sm mt-0.5">Rs {totalRentDue}</Text>
        </View>
        <View>
          <Text className="text-slate-300 text-[11px]">Utilities</Text>
          <Text className="text-white font-semibold text-sm mt-0.5">Rs {totalUtilityDue}</Text>
        </View>
        <View className="items-end">
          <Text className="text-slate-300 text-[11px]">Misc</Text>
          <Text className="text-white font-semibold text-sm mt-0.5">Rs {totalMiscDue}</Text>
        </View>
      </View>
    </View>
  );
}