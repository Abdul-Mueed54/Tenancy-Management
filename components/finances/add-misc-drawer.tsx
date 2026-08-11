import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import DateTimePicker, { useDefaultClassNames } from 'react-native-ui-datepicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onConfirm: (chargeType: string, amount: number, description: string, dateIncurred: string) => void;
}

export function AddMiscDrawer({ visible, onClose, isSubmitting, onConfirm }: Props) {
  const [chargeType, setChargeType] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');
  const defaultClassNames = useDefaultClassNames();

  useEffect(() => {
    if (visible) {
      setChargeType('');
      setDescription('');
      setAmount('');
      setError('');
      setShowDatePicker(false);
      setSelectedDate(dayjs());
    }
  }, [visible]);

  const handleConfirm = () => {
    Keyboard.dismiss();
    const finalAmount = parseInt(amount);

    if (!chargeType.trim()) return setError('Please enter a charge type.');
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) return setError('Please enter a valid amount.');

    onConfirm(chargeType.trim(), finalAmount, description.trim(), selectedDate.format('YYYY-MM-DD'));
  };

  // Quick suggestion chips for faster data entry
  const suggestions = ['Maintenance', 'Late Fine', 'Damage', 'Cleaning'];

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <KeyboardAvoidingView behavior={'padding'} className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-[32px] w-full p-6 shadow-2xl pb-10 max-h-[90%]">

          <View className="w-12 h-1.5 bg-muted/30 rounded-full self-center mb-6" />

          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-foreground">Add Misc Charge</Text>
            <TouchableOpacity onPress={onClose} className="p-1.5 bg-muted/20 rounded-full">
              <Ionicons name="close" size={20} color="#3f3f46" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* QUICK SUGGESTIONS */}
            <View className="flex-row flex-wrap mb-4">
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => { setChargeType(s); setError(''); }}
                  className={`px-3 py-1.5 rounded-full border mr-2 mb-2 ${chargeType === s ? 'bg-primary-50 border-primary-500' : 'bg-white border-border'}`}
                >
                  <Text className={`text-xs font-medium ${chargeType === s ? 'text-primary-700' : 'text-zinc-600'}`}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* CHARGE TYPE INPUT */}
            <View className={`bg-muted/10 border rounded-2xl px-4 h-14 mb-4 justify-center ${error && !chargeType ? 'border-red-500 bg-red-50' : 'border-border'}`}>
              <TextInput value={chargeType} onChangeText={(t) => { setChargeType(t); setError(''); }} placeholder="Charge Type (e.g., Broken Lock)" placeholderTextColor="#a1a1aa" className="text-foreground font-medium text-base" />
            </View>

            {/* AMOUNT */}
            <View className={`flex-row items-center bg-muted/10 border rounded-2xl px-4 h-14 mb-4 ${error && !amount ? 'border-red-500 bg-red-50' : 'border-border'}`}>
              <Text className="text-muted-foreground font-bold mr-2">Rs</Text>
              <TextInput value={amount} onChangeText={(t) => { setAmount(t); setError(''); }} keyboardType="numeric" placeholder="Amount" placeholderTextColor="#a1a1aa" className="flex-1 text-foreground font-bold text-lg h-full" />
            </View>

            {/* DATE SELECTOR */}
            <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)} className="flex-row items-center justify-between bg-muted/10 border border-border rounded-2xl px-4 h-14 mb-4">
              <Text className="text-foreground font-medium text-base">{selectedDate.format('DD MMM YYYY')}</Text>
              <Ionicons name="calendar-outline" size={20} color="#0f766e" />
            </TouchableOpacity>

            {showDatePicker && (
              <View className="bg-white border border-border rounded-xl p-2 mb-4">
                <DateTimePicker mode="single" date={selectedDate.toDate()} onChange={(p) => { setSelectedDate(dayjs(p.date)); setShowDatePicker(false); }} classNames={{ ...defaultClassNames, selected: "bg-primary-500 border-primary-700", selected_label: "text-white", today: "border-primary-700" }} />
              </View>
            )}

            {/* DESCRIPTION (OPTIONAL) */}
            <View className="bg-muted/10 border border-border rounded-2xl px-4 py-3 min-h-[80px] mb-2">
              <TextInput value={description} onChangeText={setDescription} placeholder="Description (Optional)" placeholderTextColor="#a1a1aa" multiline={true} className="text-foreground font-medium text-sm" />
            </View>

            {error ? <Text className="text-red-500 text-xs font-medium ml-1 mb-4">{error}</Text> : <View className="h-4 mb-4" />}

            <TouchableOpacity disabled={isSubmitting} onPress={handleConfirm} className={`p-4 rounded-2xl items-center shadow-sm ${isSubmitting ? 'bg-primary-700/70' : 'bg-primary-700'}`}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Save Charge</Text>}
            </TouchableOpacity>
          </ScrollView>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}