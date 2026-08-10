import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { processLedgerPayment } from '@/db/queries/ledgers.queries';

interface Props {
  visible: boolean;
  onClose: () => void;
  ledger: any;
  onRefresh: () => void;
}

export function PartialPaymentModal({ visible, onClose, ledger, onRefresh }: Props) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset the state every time the modal opens
  useEffect(() => {
    if (visible) {
      setAmount('');
      setError('');
    }
  }, [visible]);

  const handleConfirm = async () => {
    Keyboard.dismiss();
    const paymentAmount = parseInt(amount);

    // 1. Basic Validation
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    // 2. Overpayment Guardrail
    if (paymentAmount > ledger.amount_due) {
      setError(`Amount cannot exceed the remaining due (Rs ${ledger.amount_due}).`);
      return;
    }

    setIsSubmitting(true);

    // 3. Process with the backend logic we created earlier
    const result = await processLedgerPayment(ledger.id, paymentAmount);

    setIsSubmitting(false);

    if (result.success) {
      onRefresh(); // Triggers the screen to re-fetch the new balances
      onClose();   // Hides the modal
    } else {
      setError('Failed to process payment. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center items-center bg-black/50 px-4"
      >
        <View className="bg-white rounded-3xl w-full p-5 shadow-2xl">

          {/* HEADER */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-foreground">Record Partial Payment</Text>
            <TouchableOpacity onPress={onClose} className="p-1.5 bg-muted/20 rounded-full">
              <Ionicons name="close" size={20} color="#3f3f46" />
            </TouchableOpacity>
          </View>

          {/* INFO BANNER */}
          <View className="bg-orange-50 border border-orange-200 p-4 rounded-2xl mb-5 flex-row items-center justify-center">
            <Ionicons name="information-circle" size={20} color="#9a3412" className="mr-2" />
            <Text className="text-orange-800 text-sm font-medium">
              Remaining Balance: <Text className="font-bold">Rs {ledger?.amount_due}</Text>
            </Text>
          </View>

          {/* INPUT FIELD */}
          <Text className="text-sm font-bold text-foreground mb-1.5 ml-1">Amount Paying Now</Text>
          <View className={`flex-row items-center bg-muted/10 border rounded-2xl px-4 h-14 mb-1 ${error ? 'border-red-500 bg-red-50' : 'border-border'}`}>
            <Text className="text-muted-foreground font-bold mr-2">Rs</Text>
            <TextInput
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError(''); // Clear error as soon as they start typing
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#a1a1aa"
              className="flex-1 text-foreground font-bold text-lg h-full"
              autoFocus={true}
            />
          </View>

          {/* ERROR MESSAGE SPACE */}
          {error ? (
            <Text className="text-red-500 text-xs font-medium ml-1 mb-4">{error}</Text>
          ) : (
            <View className="h-4 mb-4" />
          )}

          {/* ACTION BUTTON */}
          <TouchableOpacity
            disabled={isSubmitting}
            onPress={handleConfirm}
            className={`p-4 rounded-2xl items-center shadow-sm ${isSubmitting ? 'bg-primary-700/70' : 'bg-primary-700'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Confirm Payment</Text>
            )}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}