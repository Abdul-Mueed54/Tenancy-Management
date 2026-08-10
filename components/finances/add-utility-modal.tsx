import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import DateTimePicker, { useDefaultClassNames } from 'react-native-ui-datepicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onConfirm: (entryType: string, billingMonth: string, amount: number) => void;
}

export function AddUtilityModal({ visible, onClose, isSubmitting, onConfirm }: Props) {
  const [entryType, setEntryType] = useState<'k_electric' | 'gas' | 'water'>('k_electric');
  const [selectedDate, setSelectedDate] = useState(dayjs()); // Defaults to current month
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const defaultClassNames = useDefaultClassNames();

  useEffect(() => {
    if (visible) {
      setEntryType('k_electric');
      setAmount('');
      setError('');
      setShowDatePicker(false);
      setSelectedDate(dayjs());
    }
  }, [visible]);

  const handleConfirm = () => {
    Keyboard.dismiss();
    const finalAmount = parseInt(amount);

    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      setError('Please enter a valid bill amount.');
      return;
    }

    onConfirm(entryType, selectedDate.format('YYYY-MM'), finalAmount);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <KeyboardAvoidingView behavior={'padding'} className="flex-1 justify-center items-center bg-black/50 px-4">
        <View className="bg-white rounded-xl w-full p-5 shadow-2xl">

          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-foreground">Add Utility Bill</Text>
            <TouchableOpacity onPress={onClose} className="p-1.5 bg-muted/20 rounded-full">
              <Ionicons name="close" size={20} color="#3f3f46" />
            </TouchableOpacity>
          </View>

          {/* DUMB & SIMPLE TYPE SELECTOR */}
          <View className="flex-row justify-between mb-5">
            <TouchableOpacity onPress={() => setEntryType('k_electric')} className={`flex-1 items-center p-3 rounded-xl border ${entryType === 'k_electric' ? 'border-amber-500 bg-amber-50' : 'border-border bg-white'}`}>
              <Ionicons name="flash" size={24} color={entryType === 'k_electric' ? '#d97706' : '#a1a1aa'} />
              <Text className={`text-xs font-bold mt-1 ${entryType === 'k_electric' ? 'text-amber-700' : 'text-muted-foreground'}`}>K-Electric</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEntryType('gas')} className={`flex-1 items-center p-3 rounded-xl border mx-2 ${entryType === 'gas' ? 'border-orange-500 bg-orange-50' : 'border-border bg-white'}`}>
              <Ionicons name="flame" size={24} color={entryType === 'gas' ? '#ea580c' : '#a1a1aa'} />
              <Text className={`text-xs font-bold mt-1 ${entryType === 'gas' ? 'text-orange-700' : 'text-muted-foreground'}`}>Sui Gas</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEntryType('water')} className={`flex-1 items-center p-3 rounded-xl border ${entryType === 'water' ? 'border-blue-500 bg-blue-50' : 'border-border bg-white'}`}>
              <Ionicons name="water" size={24} color={entryType === 'water' ? '#3b82f6' : '#a1a1aa'} />
              <Text className={`text-xs font-bold mt-1 ${entryType === 'water' ? 'text-blue-700' : 'text-muted-foreground'}`}>Water</Text>
            </TouchableOpacity>
          </View>

          {/* MONTH & AMOUNT (Same as rent) */}
          <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)} className="flex-row items-center justify-between bg-muted/10 border border-border rounded-2xl px-4 h-14 mb-4">
            <Text className="text-foreground font-bold text-base">{selectedDate.format('MMMM YYYY')}</Text>
            <Ionicons name="calendar-outline" size={20} color="#0f766e" />
          </TouchableOpacity>

          {showDatePicker && (
            <View className="bg-white border border-border rounded-xl p-2 mb-4">
              <DateTimePicker mode="single" date={selectedDate.toDate()} onChange={(p) => { setSelectedDate(dayjs(p.date)); setShowDatePicker(false); }} classNames={{ ...defaultClassNames, selected: "bg-primary-500 border-primary-700", selected_label: "text-white", today: "border-primary-700" }} />
            </View>
          )}

          <View className={`flex-row items-center bg-muted/10 border rounded-2xl px-4 h-14 mb-1 ${error ? 'border-red-500 bg-red-50' : 'border-border'}`}>
            <Text className="text-muted-foreground font-bold mr-2">Rs</Text>
            <TextInput value={amount} onChangeText={(t) => { setAmount(t); setError(''); }} keyboardType="numeric" placeholder="Bill Amount" placeholderTextColor="#a1a1aa" className="flex-1 text-foreground font-bold text-lg h-full" />
          </View>

          {error ? <Text className="text-red-500 text-xs font-medium ml-1 mb-4">{error}</Text> : <View className="h-4 mb-4" />}

          <TouchableOpacity disabled={isSubmitting} onPress={handleConfirm} className={`p-4 rounded-2xl items-center shadow-sm ${isSubmitting ? 'bg-primary-700/70' : 'bg-primary-700'}`}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Save Utility Bill</Text>}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}