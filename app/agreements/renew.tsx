import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import * as DocumentPicker from 'expo-document-picker';
import { getAgreementForRenewal, processLeaseRenewal } from '@/db/queries/agreements.queries';
import { getBuildings } from '@/db/queries/buildings.queries';
import { CustomToast } from '@/components/ui/toast';
import { DatePickerModal } from '@/components/ui/date-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { CoreRenewalSection } from '@/components/agreements-renewal-form/core-renewal-section';
import { RelocationSection } from '@/components/agreements-renewal-form/relocation-section';

type FormData = {
  newMonthlyRent: string;
  buildingId: string;
  unitNumber: string;
  advanceAmount: string;
  rentDueDay: string;
};

export default function RenewAgreementScreen() {
  const { agreementId } = useLocalSearchParams<{ agreementId: string }>();

  const [oldData, setOldData] = useState<any>(null);
  const [buildings, setBuildings] = useState<{ id: string, name: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [isRelocating, setIsRelocating] = useState(false);
  const [renewalDate, setRenewalDate] = useState(dayjs());
  const [newMoveInDate, setNewMoveInDate] = useState(dayjs());

  const [showRenewalPicker, setShowRenewalPicker] = useState(false);
  const [showMoveInPicker, setShowMoveInPicker] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { newMonthlyRent: '', buildingId: '', unitNumber: '', advanceAmount: '', rentDueDay: '' }
  });

  const showToast = (message: string, type: 'success' | 'error') => setToast({ visible: true, message, type });

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setFileUri(result.assets[0].uri);
        setFileName(result.assets[0].name);
      }
    } catch (error) {
      showToast("An error occurred while picking the document.", "error");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [agreementRes, buildingsRes] = await Promise.all([
        getAgreementForRenewal(agreementId),
        getBuildings()
      ]);

      if (buildingsRes.success) setBuildings(buildingsRes.data);

      if (agreementRes.success && agreementRes.data) {
        const data = agreementRes.data;
        setOldData(data);
        setValue('newMonthlyRent', data.monthlyRent.toString());
        setValue('buildingId', data.buildingId);
        setValue('unitNumber', data.unitNumber);
        setValue('advanceAmount', data.advanceAmount.toString());
        setValue('rentDueDay', data.rentDueDay?.toString() || '5');
      } else {
        showToast("Could not load agreement details.", "error");
      }
      setIsLoading(false);
    };

    if (agreementId) fetchData();
  }, [agreementId, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!fileUri) {
      showToast("Please attach the new rental agreement.", "error");
      return;
    }
    setIsSubmitting(true);

    const payload = {
      oldAgreementId: agreementId,
      tenantId: oldData.tenantId,
      attachmentUri: fileUri,

      buildingId: isRelocating ? data.buildingId : oldData.buildingId,
      unitNumber: isRelocating ? data.unitNumber : oldData.unitNumber,
      advanceAmount: isRelocating ? parseInt(data.advanceAmount) || 0 : oldData.advanceAmount,
      moveInDate: isRelocating ? newMoveInDate.format('YYYY-MM-DD') : oldData.moveInDate,
      rentDueDay: isRelocating ? parseInt(data.rentDueDay) || 5 : oldData.rentDueDay,

      newMonthlyRent: parseInt(data.newMonthlyRent) || 0,
      newStartDate: renewalDate.format('YYYY-MM-DD'),
    };

    const result = await processLeaseRenewal(payload);
    setIsSubmitting(false);

    if (result.success) {
      router.back();
    } else {
      showToast("Failed to process renewal.", "error");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-muted/10">
      <Stack.Screen options={{ headerShown: false }} />
      <CustomToast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* HEADER */}
      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-border shadow-sm z-10 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-1 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-foreground">Renew Lease</Text>
          <Text className="text-xs text-muted-foreground">{oldData?.tenantName} • Floor {oldData?.unitNumber}</Text>
        </View>
      </View>

      <KeyboardAwareScrollView bottomOffset={80} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
       <Text className="text-xs text-red-500 mb-4">NOTE: Uploading the new document will not override the previously uploaded agreement, but old one might be seen in the history of specific tenants.</Text>

        <CoreRenewalSection
          control={control}
          errors={errors}
          renewalDate={renewalDate}
          setShowRenewalPicker={setShowRenewalPicker}
          fileUri={fileUri}
          fileName={fileName}
          handlePickDocument={handlePickDocument}
        />

        <RelocationSection
          control={control}
          errors={errors}
          isRelocating={isRelocating}
          setIsRelocating={setIsRelocating}
          newMoveInDate={newMoveInDate}
          setShowMoveInPicker={setShowMoveInPicker}
          buildings={buildings}
        />

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className={`rounded-xl p-4 items-center mb-10 shadow-sm ${isSubmitting ? 'bg-primary-700/70' : 'bg-primary-700'}`}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Confirm Renewal</Text>}
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* DATE PICKERS */}
      <DatePickerModal visible={showRenewalPicker} date={renewalDate} setDate={setRenewalDate} onClose={() => setShowRenewalPicker(false)} />
      <DatePickerModal visible={showMoveInPicker} date={newMoveInDate} setDate={setNewMoveInDate} onClose={() => setShowMoveInPicker(false)} />
    </View>
  );
}