import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import dayjs from 'dayjs';

import { CustomDrawer } from '@/components/ui/drawer';
import { processLedgerPayment } from '@/db/queries/ledgers.queries';
import { CustomAlertDialog } from '@/components/ui/alert-dialog';

interface Props {
  ledgers: any[];
  agreementId: string;
  onRefresh: () => void;
  showToast: (msg: string, type: 'success'|'error') => void; // Received from parent
}

export function RentList({ ledgers, agreementId, onRefresh, showToast }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [showFullPayAlert, setShowFullPayAlert] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<any>(null);

  const initiateFullPayment = (ledger: any) => {
    setSelectedLedger(ledger);
    setShowFullPayAlert(true);
  };

  const handleConfirmFullPayment = async () => {
    if (!selectedLedger) return;

    setShowFullPayAlert(false);
    setIsProcessing(true);

    const result = await processLedgerPayment(selectedLedger.id, selectedLedger.amount_due);

    setIsProcessing(false);

    if (result.success) {
      showToast("Rent marked as fully paid!", "success");
      onRefresh();
    } else {
      showToast("Failed to process payment.", "error");
    }
  };

  // Handles the callback from the Generic Payment Drawer
  const handlePartialPayment = async (amount: number) => {
    if (!selectedLedger) return;
    setIsProcessing(true);

    const result = await processLedgerPayment(selectedLedger.id, amount);

    setIsProcessing(false);

    if (result.success) {
      setShowPartialModal(false);
      showToast("Partial payment recorded!", "success");
      onRefresh();
    } else {
      showToast("Failed to process partial payment.", "error");
    }
  };

  return (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rent Ledgers</Text>
        <TouchableOpacity className="bg-primary-50 px-3 py-1.5 rounded-lg flex-row items-center border border-primary-200">
          <Ionicons name="add" size={14} color="#0f766e" />
          <Text className="text-primary-700 font-bold ml-1 text-xs">Generate Bill</Text>
        </TouchableOpacity>
      </View>

      {ledgers.length === 0 ? (
        <Text className="text-center text-muted-foreground mt-8 text-sm">No rent ledgers found.</Text>
      ) : (
        ledgers.map((ledger) => (
          <View key={ledger.id} className="bg-white rounded-xl p-4 mb-3 border border-border shadow-sm">

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="font-bold text-foreground text-sm">
                  {dayjs(ledger.billing_month).format('MMMM YYYY')}
                </Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  Due: Rs {ledger.amount_due} / Total: Rs {ledger.total_payable_amount}
                </Text>
              </View>
              <View className={`px-2.5 py-1 rounded-md ${ledger.status === 'paid' ? 'bg-green-100' : ledger.status === 'partial' ? 'bg-orange-100' : 'bg-red-100'}`}>
                <Text className={`text-[10px] font-bold uppercase ${ledger.status === 'paid' ? 'text-green-700' : ledger.status === 'partial' ? 'text-orange-700' : 'text-red-700'}`}>
                  {ledger.status}
                </Text>
              </View>
            </View>

            {ledger.status !== 'paid' && (
              <View className="flex-row mt-4 pt-3 border-t border-border/50">
                <TouchableOpacity
                  disabled={isProcessing}
                  onPress={() => initiateFullPayment(ledger)} // Trigger custom dialog
                  className="flex-1 bg-primary-700 py-2 rounded-lg items-center mr-2 flex-row justify-center"
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" className="mr-1" />
                  <Text className="text-white font-bold text-xs">Mark Fully Paid</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={isProcessing}
                  onPress={() => {
                    setSelectedLedger(ledger);
                    setShowPartialModal(true); // Trigger custom bottom modal
                  }}
                  className="flex-1 bg-muted/20 border border-border py-2 rounded-lg items-center flex-row justify-center"
                >
                  <Ionicons name="pie-chart-outline" size={16} color="#3f3f46" className="mr-1" />
                  <Text className="text-zinc-700 font-bold text-xs">Record Partial</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      <CustomAlertDialog
        visible={showFullPayAlert}
        onOpenChange={setShowFullPayAlert}
        title="Confirm Payment"
        description={`Mark Rs ${selectedLedger?.amount_due} as fully paid for ${dayjs(selectedLedger?.billing_month).format('MMM YYYY')}?`}
        actionText="Confirm"
        onAction={handleConfirmFullPayment}
      />

      {/* USING THE NEW GENERIC DRAWER */}
      {selectedLedger && (
        <CustomDrawer
          visible={showPartialModal}
          onClose={() => setShowPartialModal(false)}
          title="Record Partial Rent"
          balanceDue={selectedLedger.amount_due}
          isSubmitting={isProcessing}
          onConfirm={handlePartialPayment}
        />
      )}
    </View>
  );
}