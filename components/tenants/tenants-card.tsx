import { View, Text, TouchableOpacity } from 'react-native';

type TenantCardProps = {
  name: string;
  contact: string;
  unitNumber: string;
  rentAmount: number | string;
  isActive: boolean;
  onPress: () => void;
};

export function TenantCard({ name, contact, unitNumber, rentAmount, isActive, onPress }: TenantCardProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View className="border border-border rounded-xl p-4 mb-3 flex-row bg-white items-center justify-between shadow-sm">
        <View className="flex-1 pr-4">
          <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-muted-foreground mt-1 text-sm">
            {contact || 'No Contact'} • Unit {unitNumber}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-foreground font-medium">Rs {rentAmount}</Text>
          {isActive ? (
            <View className="bg-green-100 px-2 py-1 rounded mt-1">
              <Text className="text-green-700 text-[10px] font-bold uppercase tracking-wider">Active</Text>
            </View>
          ) : (
            <View className="bg-red-100 px-2 py-1 rounded mt-1">
              <Text className="text-red-700 text-[10px] font-bold uppercase tracking-wider">Inactive</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}