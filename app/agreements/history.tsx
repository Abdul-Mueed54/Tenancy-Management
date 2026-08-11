import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Linking, Platform } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { getTenantAgreementHistory } from '@/db/queries/agreements.queries';
import { CustomToast } from '@/components/ui/toast';
import { useDocumentViewer } from '@/hooks/useDocumentViewer';
import { DocumentViewerModal } from '@/components/ui/document-viewer-modal';

type LeaseHistoryRecord = {
  id: string;
  buildingName: string;
  unitNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  advanceAmount: number;
  isActive: boolean;
  attachmentUri: string | null;
};

export default function LeaseHistoryScreen() {
  const { tenantId, tenantName } = useLocalSearchParams<{ tenantId: string, tenantName: string }>();

  const [history, setHistory] = useState<LeaseHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success'});
  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ visible: true, message, type });
  };
  const { openDocument, imageToView, showImageModal, closeViewer } = useDocumentViewer(showToast);

  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        setIsLoading(true);
        if (tenantId) {
          const result = await getTenantAgreementHistory(tenantId);
          if (result.success && result.data) {
            setHistory(result.data as LeaseHistoryRecord[]);
          } else {
            setToast({ visible: true, message: 'Failed to load history', type: 'error' });
          }
        }
        setIsLoading(false);
      };
      fetchHistory();
    }, [tenantId])
  );

  const renderHistoryCard = ({ item }: { item: LeaseHistoryRecord }) => (
    <View className={`bg-white border rounded-xl p-4 mb-4 shadow-sm ${item.isActive ? 'border-primary-500' : 'border-border'}`}>

      {/* HEADER: Dates & Status Badge */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="#71717a" className="mr-1.5" />
          <Text className="text-sm font-bold text-zinc-600">
            {dayjs(item.startDate).format('MMM D, YYYY')} — {dayjs(item.endDate).format('MMM D, YYYY')}
          </Text>
        </View>
        <View className={`px-2 py-0.5 rounded ${item.isActive ? 'bg-teal-100' : 'bg-muted/30'}`}>
          <Text className={`text-[10px] font-bold uppercase ${item.isActive ? 'text-teal-700' : 'text-muted-foreground'}`}>
            {item.isActive ? 'Current' : 'Archived'}
          </Text>
        </View>
      </View>

      {/* BODY: Building & Financials */}
      <View className="flex-row justify-between mb-4 pb-4 border-b border-border/50">
        <View>
          <Text className="text-xs text-muted-foreground mb-0.5">Location</Text>
          <Text className="font-bold text-foreground">{item.buildingName}</Text>
          <Text className="text-sm text-foreground">Unit {item.unitNumber}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-muted-foreground mb-0.5">Monthly Rent</Text>
          <Text className="font-bold text-foreground">Rs {item.monthlyRent}</Text>
          <Text className="text-xs text-muted-foreground mt-1">Advance: Rs {item.advanceAmount}</Text>
        </View>
      </View>

      {/* FOOTER: Document Button */}
      {item.attachmentUri ? (
        <TouchableOpacity
          onPress={() => openDocument(item.attachmentUri as string)}
          className="flex-row items-center justify-center bg-muted/20 py-2 rounded-lg border border-border"
        >
          <Ionicons name="document-text-outline" size={16} color="#0f766e" className="mr-2" />
          <Text className="text-primary-700 text-sm font-medium">View Lease Agreement</Text>
        </TouchableOpacity>
      ) : (
        <View className="flex-row items-center justify-center py-2">
          <Text className="text-muted-foreground text-xs italic">No document attached</Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-muted/10">
      <Stack.Screen options={{ headerShown: false }} />
      <CustomToast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      <DocumentViewerModal
        visible={showImageModal}
        imageUri={imageToView}
        onClose={closeViewer}
      />

      {/* HEADER */}
      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-border bg-white shadow-sm z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-1 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-foreground">Lease History</Text>
          <Text className="text-xs text-muted-foreground">{tenantName}</Text>
        </View>
      </View>

      {/* LIST */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : history.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="time-outline" size={64} color="#a1a1aa" className="mb-4" />
          <Text className="text-xl font-bold text-foreground mb-2 text-center">No History Found</Text>
          <Text className="text-muted-foreground text-center">
            There are no recorded agreements for this tenant yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}