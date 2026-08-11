import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import DateTimePicker, { useDefaultClassNames } from 'react-native-ui-datepicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onConfirm: (billingMonth: string, amount: number) => void;
}

export function GenerateBillModal({ visible, onClose, isSubmitting, onConfirm }: Props) {
  // Default to next month since the current month is auto-generated
  const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'month'));
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const defaultClassNames = useDefaultClassNames();

  useEffect(() => {
    if (visible) {
      setAmount('');
      setError('');
      setShowDatePicker(false);
      setSelectedDate(dayjs().add(1, 'month'));
    }
  }, [visible]);

  const handleConfirm = () => {
    Keyboard.dismiss();
    const finalAmount = parseInt(amount);

    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      setError('Please enter a valid rent amount.');
      return;
    }

    const formattedMonth = selectedDate.format('YYYY-MM');
    onConfirm(formattedMonth, finalAmount);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <KeyboardAvoidingView
        behavior={'padding'}
        className="flex-1 justify-center items-center bg-black/50 px-4"
      >
        <View className="bg-white rounded-3xl w-full p-5 shadow-2xl">

          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-foreground">Generate Custom Bill</Text>
            <TouchableOpacity onPress={onClose} className="p-1.5 bg-muted/20 rounded-full">
              <Ionicons name="close" size={20} color="#3f3f46" />
            </TouchableOpacity>
          </View>

          {/* DATE SELECTOR */}
          <Text className="text-sm font-bold text-foreground mb-1.5 ml-1">Billing Month</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(!showDatePicker)}
            className="flex-row items-center justify-between bg-muted/10 border border-border rounded-2xl px-4 h-14 mb-4"
          >
            <Text className="text-foreground font-bold text-base">{selectedDate.format('MMMM YYYY')}</Text>
            <Ionicons name="calendar-outline" size={20} color="#0f766e" />
          </TouchableOpacity>

          {showDatePicker && (
            <View className="bg-white border border-border rounded-xl p-2 mb-4">
              <DateTimePicker
                mode="single"
                date={selectedDate.toDate()}
                onChange={(params) => {
                  setSelectedDate(dayjs(params.date));
                  setShowDatePicker(false);
                }}
                classNames={{
                  ...defaultClassNames,
                  selected: "bg-primary-500 border-primary-700",
                  selected_label: "text-white",
                  today: "border-primary-700",
                }}
              />
            </View>
          )}

          {/* AMOUNT FIELD */}
          <Text className="text-sm font-bold text-foreground mb-1.5 ml-1">Rent Amount</Text>
          <View className={`flex-row items-center bg-muted/10 border rounded-2xl px-4 h-14 mb-1 ${error ? 'border-red-500 bg-red-50' : 'border-border'}`}>
            <Text className="text-muted-foreground font-bold mr-2">Rs</Text>
            <TextInput
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError('');
              }}
              keyboardType="numeric"
              placeholder="e.g. 50000"
              placeholderTextColor="#a1a1aa"
              className="flex-1 text-foreground font-bold text-lg h-full"
            />
          </View>

          {error ? (
            <Text className="text-red-500 text-xs font-medium ml-1 mb-4">{error}</Text>
          ) : (
            <View className="h-4 mb-4" />
          )}

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            disabled={isSubmitting}
            onPress={handleConfirm}
            className={`p-4 rounded-2xl items-center shadow-sm ${isSubmitting ? 'bg-primary-700/70' : 'bg-primary-700'}`}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Generate Ledger</Text>}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}