import { View, Text, TouchableOpacity } from 'react-native';

type TabType = 'rent' | 'utilities' | 'misc';

interface Props {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function FinancesTabs({ activeTab, setActiveTab }: Props) {
  return (
    <View className="flex-row bg-white rounded-xl p-1 mb-6 border border-border shadow-sm">
      <TouchableOpacity
        onPress={() => setActiveTab('rent')}
        className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'rent' ? 'bg-teal-50 border border-teal-200' : ''}`}
      >
        <Text className={`text-xs font-bold ${activeTab === 'rent' ? 'text-teal-800' : 'text-muted-foreground'}`}>Rent</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setActiveTab('utilities')}
        className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'utilities' ? 'bg-teal-50 border border-teal-200' : ''}`}
      >
        <Text className={`text-xs font-bold ${activeTab === 'utilities' ? 'text-teal-800' : 'text-muted-foreground'}`}>Utilities</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setActiveTab('misc')}
        className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'misc' ? 'bg-teal-50 border border-teal-200' : ''}`}
      >
        <Text className={`text-xs font-bold ${activeTab === 'misc' ? 'text-teal-800' : 'text-muted-foreground'}`}>Misc</Text>
      </TouchableOpacity>
    </View>
  );
}