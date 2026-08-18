import { View, Text, } from 'react-native';
import dayjs from 'dayjs';

type Props = {
  tenant: {
    cnic_number: string;
    contact_no: string;
    cnic_expiry_date: string;
    permanent_address: string;
    created_at: string
  };
  agreement: {
    monthly_rent: string;
    advance_amount: string;
    start_date: string;
    rent_due_day: string;
    move_in_date: string;
  }
};

export default function DisplayAgreementDetailsOfTenant({tenant, agreement}: Props){
  return(
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-border">
          <Text className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider">Financial & Contract Info</Text>
          <View className="flex-row justify-between mb-3 border-b border-border/50 pb-3">
            <Text className="text-muted-foreground">Monthly Rent</Text>
            <Text className="font-bold text-teal-700">Rs {agreement.monthly_rent}</Text>
          </View>
          <View className="flex-row justify-between mb-3 border-b border-border/50 pb-3">
            <Text className="text-muted-foreground">Advance Deposit</Text>
            <Text className="font-medium text-foreground">Rs {agreement.advance_amount}</Text>
          </View>
          <View className="flex-row justify-between mb-3 border-b border-border/50 pb-3">
            <Text className="text-muted-foreground">Move-in Date</Text>
            <Text className="font-medium text-foreground">{dayjs(agreement.move_in_date).format('DD MMM YYYY')}</Text>
          </View>
          <View className="flex-row justify-between mb-3 border-b border-border/50 pb-3">
            <Text className="text-muted-foreground">Rent Due Date</Text>
            <Text className="font-medium text-foreground">{agreement.rent_due_day} of every month</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">Profile Created</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">{dayjs(tenant.created_at).format('DD MMM YYYY, h:mm A')}</Text>
          </View>
        </View>
  )
}