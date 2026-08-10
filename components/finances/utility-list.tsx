import { View, Text, TouchableOpacity, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import dayjs from 'dayjs';

import { CustomDrawer } from '@/components/ui/drawer';
import { AddUtilityModal } from '@/components/finances/add-utility-modal';
import { processLedgerPayment, addUtilityBill, deleteLedgerEntry } from '@/db/queries/ledgers.queries';
import { CustomAlertDialog } from '@/components/ui/alert-dialog';

interface Props {
  ledgers: any[];
  agreementId: string;
  onRefresh: () => void;
  showToast: (msg: string, type: 'success'|'error') => void;
}

export function UtilityList({ ledgers, agreementId, onRefresh, showToast }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals & Dialogs State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDrawer, setshowDrawer] = useState(false);
  const [showFullPayAlert, setShowFullPayAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const [selectedLedger, setSelectedLedger] = useState<any>(null);

  // --- HANDLERS ---
  const handleAddUtility = async (entryType: string, billingMonth: string, amount: number) => {
    setIsProcessing(true);
    const result = await addUtilityBill(agreementId, entryType, billingMonth, amount);
    setIsProcessing(false);

    if (result.success) {
      setShowAddModal(false);
      showToast(`${entryType.replace('_', ' ')} bill added!`, "success");
      onRefresh();
    } else {
      showToast(result.message || "Error adding bill.", "error");
    }
  };

  const handleConfirmFullPayment = async () => {
    if (!selectedLedger) return;
    setShowFullPayAlert(false);
    setIsProcessing(true);
    const result = await processLedgerPayment(selectedLedger.id, selectedLedger.amount_due);
    setIsProcessing(false);

    if (result.success) { showToast("Bill fully paid!", "success"); onRefresh(); }
    else { showToast("Payment failed.", "error"); }
  };

  const handlePartialPayment = async (amount: number) => {
    if (!selectedLedger) return;
    setIsProcessing(true);
    const result = await processLedgerPayment(selectedLedger.id, amount);
    setIsProcessing(false);

    if (result.success) {
      setshowDrawer(false);
      showToast("Partial payment recorded!", "success");
      onRefresh();
    } else { showToast("Payment failed.", "error"); }
  };

  const handleConfirmDelete = async () => {
    if (!selectedLedger) return;
    setShowDeleteAlert(false);
    setIsProcessing(true);
    const result = await deleteLedgerEntry(selectedLedger.id);
    setIsProcessing(false);

    if (result.success) { showToast("Bill deleted.", "success"); onRefresh(); }
    else { showToast("Delete failed.", "error"); }
  };

  // Helper for UI styling based on utility type
  const getUtilityStyle = (type: string) => {
    if (type === 'k_electric') return { icon: 'flash', color: '#d97706', bg: 'bg-amber-100', label: 'K-Electric' };
    if (type === 'gas') return { icon: 'flame', color: '#ea580c', bg: 'bg-orange-100', label: 'Sui Gas' };
    return { icon: 'water', color: '#3b82f6', bg: 'bg-blue-100', label: 'Water' };
  };

  return (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Utility Bills</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} className="bg-primary-50 px-3 py-1.5 rounded-lg flex-row items-center border border-primary-200">
          <Ionicons name="add" size={14} color="#0f766e" />
          <Text className="text-primary-700 font-bold ml-1 text-xs">Add Utility</Text>
        </TouchableOpacity>
      </View>

      {ledgers.length === 0 ? (
        <Text className="text-center text-muted-foreground mt-8 text-sm">No utility bills recorded.</Text>
      ) : (
        ledgers.map((ledger) => {
          const style = getUtilityStyle(ledger.entry_type);
          return (
            <TouchableOpacity
              key={ledger.id}
              activeOpacity={0.8}
              onLongPress={() => {
                Vibration.vibrate(50);
                setSelectedLedger(ledger);
                setShowDeleteAlert(true);
              }}
              delayLongPress={400}
              className="bg-white rounded-xl p-4 mb-3 border border-border shadow-sm"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${style.bg}`}>
                    <Ionicons name={style.icon as any} size={20} color={style.color} />
                  </View>
                  <View>
                    <Text className="font-bold text-foreground text-sm">{style.label} <Text className="font-normal text-muted-foreground">• {dayjs(ledger.billing_month).format('MMM YYYY')}</Text></Text>
                    <Text className="text-muted-foreground text-xs mt-0.5">Due: Rs {ledger.amount_due} / Total: Rs {ledger.total_payable_amount}</Text>
                  </View>
                </View>
                <View className={`px-2.5 py-1 rounded-md ${ledger.status === 'paid' ? 'bg-green-100' : ledger.status === 'partial' ? 'bg-orange-100' : 'bg-red-100'}`}>
                  <Text className={`text-[10px] font-bold uppercase ${ledger.status === 'paid' ? 'text-green-700' : ledger.status === 'partial' ? 'text-orange-700' : 'text-red-700'}`}>{ledger.status}</Text>
                </View>
              </View>

              {/* QUICK ACTION BUTTONS */}
              {ledger.status !== 'paid' && (
                <View className="flex-row mt-4 pt-3 border-t border-border/50">
                  <TouchableOpacity onPress={() => { setSelectedLedger(ledger); setShowFullPayAlert(true); }} className="flex-1 bg-primary-700 py-2 rounded-lg items-center mr-2 flex-row justify-center">
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" className="mr-1" />
                    <Text className="text-white font-bold text-xs">Mark Paid</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setSelectedLedger(ledger); setshowDrawer(true); }} className="flex-1 bg-muted/20 border border-border py-2 rounded-lg items-center flex-row justify-center">
                    <Ionicons name="pie-chart-outline" size={16} color="#3f3f46" className="mr-1" />
                    <Text className="text-zinc-700 font-bold text-xs">Partial</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}

      {/* ALL MODALS AND DIALOGS */}
      <AddUtilityModal visible={showAddModal} onClose={() => setShowAddModal(false)} isSubmitting={isProcessing} onConfirm={handleAddUtility} />

      {selectedLedger && (
        <CustomDrawer visible={showDrawer} onClose={() => setshowDrawer(false)} title={`Record Partial ${getUtilityStyle(selectedLedger.entry_type).label}`} balanceDue={selectedLedger.amount_due} isSubmitting={isProcessing} onConfirm={handlePartialPayment} />
      )}

      <CustomAlertDialog visible={showFullPayAlert} onOpenChange={setShowFullPayAlert} title="Confirm Payment" description={`Mark Rs ${selectedLedger?.amount_due} as fully paid?`} actionText="Confirm" onAction={handleConfirmFullPayment} />

      <CustomAlertDialog visible={showDeleteAlert} onOpenChange={setShowDeleteAlert} title="Delete Utility Bill" description={`Are you sure you want to delete this bill? This action cannot be undone.`} actionText="Delete" isDestructive={true} onAction={handleConfirmDelete} />
    </View>
  );
}