import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  balanceDue: number;
  isSubmitting: boolean;
  onConfirm: (amount: number) => void;
}

export function CustomDrawer({ visible, onClose, title, balanceDue, isSubmitting, onConfirm }: Props) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // Reset the state every time the modal opens
  useEffect(() => {
    if (visible) {
      setAmount('');
      setError('');
    }
  }, [visible]);

  const handleConfirm = () => {
    Keyboard.dismiss();
    const paymentAmount = parseInt(amount);

    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (paymentAmount > balanceDue) {
      setError(`Amount cannot exceed the remaining due (Rs ${balanceDue}).`);
      return;
    }

    // Pass the valid amount back to whatever component called this drawer
    onConfirm(paymentAmount);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <KeyboardAvoidingView
        behavior={'padding'}
        className="flex-1 justify-center items-center bg-black/50 px-4"
      >
        <View className="bg-white rounded-xl w-full p-5 shadow-2xl">

          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-foreground">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-1.5 bg-muted/20 rounded-full">
              <Ionicons name="close" size={20} color="#3f3f46" />
            </TouchableOpacity>
          </View>

          <View className="bg-orange-50 border border-orange-200 p-4 rounded-2xl mb-5 flex-row items-center justify-center">
            <Ionicons name="information-circle" size={20} color="#9a3412" className="mr-2" />
            <Text className="text-orange-800 text-sm font-medium">
              Remaining Balance: <Text className="font-bold">Rs {balanceDue}</Text>
            </Text>
          </View>

          <Text className="text-sm font-bold text-foreground mb-1.5 ml-1">Amount Paying Now</Text>
          <View className={`flex-row items-center bg-muted/10 border rounded-2xl px-4 h-14 mb-1 ${error ? 'border-red-500 bg-red-50' : 'border-border'}`}>
            <Text className="text-muted-foreground font-bold mr-2">Rs</Text>
            <TextInput
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError('');
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#a1a1aa"
              className="flex-1 text-foreground font-bold text-lg h-full"
              autoFocus={true}
            />
          </View>

          {error ? (
            <Text className="text-red-500 text-xs font-medium ml-1 mb-4">{error}</Text>
          ) : (
            <View className="h-4 mb-4" />
          )}

          <TouchableOpacity
            disabled={isSubmitting}
            onPress={handleConfirm}
            className={`p-4 rounded-2xl items-center shadow-sm ${isSubmitting ? 'bg-primary-700/70' : 'bg-primary-700'}`}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Confirm Payment</Text>}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}