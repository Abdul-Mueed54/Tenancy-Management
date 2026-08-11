import { View, Text, TouchableOpacity, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import dayjs from 'dayjs';

import { AddMiscDrawer } from '@/components/finances/add-misc-drawer';
import { addMiscCharge, markMiscChargePaid, deleteMiscCharge } from '@/db/queries/misc.queries'; // Assume queries are here
import { CustomAlertDialog } from '@/components/ui/alert-dialog';

interface Props {
  charges: any[];
  agreementId: string;
  onRefresh: () => void;
  showToast: (msg: string, type: 'success'|'error') => void;
}

export function MiscList({ charges, agreementId, onRefresh, showToast }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showFullPayAlert, setShowFullPayAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const [selectedCharge, setSelectedCharge] = useState<any>(null);

  const handleAddCharge = async (chargeType: string, amount: number, description: string, dateIncurred: string) => {
    setIsProcessing(true);
    const result = await addMiscCharge(agreementId, chargeType, amount, description, dateIncurred);
    setIsProcessing(false);

    if (result.success) {
      setShowAddDrawer(false);
      showToast("Charge added successfully!", "success");
      onRefresh();
    } else {
      showToast(result.message || "Failed to add charge.", "error");
    }
  };

  const handleConfirmFullPayment = async () => {
    if (!selectedCharge) return;
    setShowFullPayAlert(false);
    setIsProcessing(true);

    const result = await markMiscChargePaid(selectedCharge.id);

    setIsProcessing(false);
    if (result.success) {
      showToast("Charge marked as paid!", "success");
      onRefresh();
    } else { showToast("Payment failed.", "error"); }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCharge) return;
    setShowDeleteAlert(false);
    setIsProcessing(true);

    const result = await deleteMiscCharge(selectedCharge.id);

    setIsProcessing(false);
    if (result.success) {
      showToast("Charge deleted.", "success");
      onRefresh();
    } else { showToast("Delete failed.", "error"); }
  };

  return (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Other Charges</Text>
        <TouchableOpacity onPress={() => setShowAddDrawer(true)} className="bg-white px-3 py-1.5 rounded-lg flex-row items-center border border-primary-200">
          <Ionicons name="add" size={14} color="#0f766e" />
          <Text className="text-primary-700 font-bold ml-1 text-xs">Add Charge</Text>
        </TouchableOpacity>
      </View>

      {charges.length === 0 ? (
        <Text className="text-center text-muted-foreground mt-8 text-sm">No miscellaneous charges found.</Text>
      ) : (
        charges.map((charge) => (
          <TouchableOpacity
            key={charge.id}
            activeOpacity={0.8}
            onLongPress={() => {
              Vibration.vibrate(50);
              setSelectedCharge(charge);
              setShowDeleteAlert(true);
            }}
            delayLongPress={400}
            className="bg-white rounded-xl p-4 mb-3 border border-border shadow-sm"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
                <Text className="font-bold text-foreground text-base">{charge.charge_type}</Text>
                <Text className="text-muted-foreground text-xs mt-0.5">{dayjs(charge.date_incurred).format('DD MMM YYYY')}</Text>
                {charge.description ? (
                  <Text className="text-zinc-500 text-xs mt-1 italic leading-tight">{charge.description}</Text>
                ) : null}
              </View>
              <View className="items-end">
                <Text className="font-bold text-foreground mb-1 text-sm">Rs {charge.amount}</Text>
                <View className={`px-2 py-0.5 rounded-md ${charge.status === 'paid' ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Text className={`text-[10px] font-bold uppercase ${charge.status === 'paid' ? 'text-green-700' : 'text-red-700'}`}>
                    {charge.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* QUICK ACTION BUTTON */}
            {charge.status !== 'paid' && (
              <View className="mt-4 pt-3 border-t border-border/50">
                <TouchableOpacity
                  onPress={() => { setSelectedCharge(charge); setShowFullPayAlert(true); }}
                  className="bg-primary-700 py-2 rounded-lg items-center flex-row justify-center"
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" className="mr-1" />
                  <Text className="text-white font-bold text-xs">Mark Paid</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}

      {/* MODALS */}
      <AddMiscDrawer visible={showAddDrawer} onClose={() => setShowAddDrawer(false)} isSubmitting={isProcessing} onConfirm={handleAddCharge} />

      <CustomAlertDialog visible={showFullPayAlert} onOpenChange={setShowFullPayAlert} title="Confirm Payment" description={`Mark ${selectedCharge?.charge_type} (Rs ${selectedCharge?.amount}) as fully paid?`} actionText="Confirm" onAction={handleConfirmFullPayment} />

      <CustomAlertDialog visible={showDeleteAlert} onOpenChange={setShowDeleteAlert} title="Delete Charge" description="Are you sure you want to delete this charge? This action cannot be undone." actionText="Delete" isDestructive={true} onAction={handleConfirmDelete} />
    </View>
  );
}