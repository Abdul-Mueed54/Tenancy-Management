import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getFullTenantDetails, toggleTenantStatus } from '@/db/queries/tenants.queries';
import { CustomAlertDialog } from '@/components/ui/alert-dialog';
import { CustomDropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CustomToast } from '@/components/ui/toast';
import { ActionsRow } from '@/components/tenants-view/actions-row';
import DisplayPersonalInfoOfTenant from '@/components/tenants-view/personal-info-section';
import DisplayAgreementDetailsOfTenant from '@/components/tenants-view/agreement-details-section';
import dayjs from 'dayjs';
import { useDocumentViewer } from '@/hooks/useDocumentViewer';
import { DocumentViewerModal } from '@/components/ui/document-viewer-modal';

export default function TenantDetailsScreen() {
  const { id, isReadOnly } = useLocalSearchParams<{ id: string, isReadOnly: string }>();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Toast state
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [showEarlyRenewAlert, setShowEarlyRenewAlert] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const { openDocument, imageToView, showImageModal, closeViewer } = useDocumentViewer(showToast);

  const fetchDetails = async () => {
    setIsLoading(true);
    if (id) {
      const result = await getFullTenantDetails(id);
      if (result.success) setData(result.data);
    }
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [id])
  );

  const confirmToggleStatus = async () => {
    setShowStatusAlert(false);
    const res = await toggleTenantStatus(data.agreement.id, data.tenant.is_active, id);
    if (res.success) {
      showToast(`Tenant ${data.tenant.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');
      fetchDetails();
    } else {
      showToast('Failed to update tenant status.', 'error');
    }
  };

  const handleProceedToRenewal = () => {
    setShowEarlyRenewAlert(false);
    router.push({ pathname: '../agreements/renew', params: { agreementId: data.agreement.id }});
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (!data) return (
    <View className="flex-1 justify-center items-center bg-background">
      <Text className="text-xl font-bold">Tenant not found</Text>
    </View>
  );

  const { tenant, agreement } = data;
  const isExpired = dayjs(agreement.end_date).isBefore(dayjs(), 'day');
  const hasDocument = !!agreement.attachment_uri;
  const dynamicMenuItems: DropdownMenuItem[] = [
    {
      label: "Lease History",
      icon: "time",
      onPress: () => {
        setShowMenu(false);
        router.push({ pathname: '../agreements/history', params: { tenantId: tenant.id, tenantName: tenant.name }});
      },
    },
  ];

  if (tenant.is_active) {
  dynamicMenuItems.unshift({
    label: "Edit Tenant",
    icon: "pencil",
    onPress: () => router.push(`/tenants/edit?id=${tenant.id}`),
  });

  if (!hasDocument) {
    dynamicMenuItems.push({
      label: "Upload Agreement",
      icon: "document-attach",
      onPress: () => {
        setShowMenu(false);
        router.push({ pathname: '/agreements/upload', params: { agreementId: agreement.id, tenantId: tenant.id, tenantName: tenant.name }});
      },
    });
  } else {
    dynamicMenuItems.push({
      label: "Process Lease Renewal",
      icon: "refresh-circle",
      onPress: () => {
        setShowMenu(false);
        if (!isExpired) {
          setShowEarlyRenewAlert(true);
        } else {
          handleProceedToRenewal();
        }
      },
    });
  }
}

  dynamicMenuItems.push({
    label: tenant.is_active ? 'Vacate / Move Out' : 'Reactivate Tenant',
    icon: "power",
    isDestructive: tenant.is_active,
    onPress: () => setShowStatusAlert(true),
  });

  return (
    <View className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />

      <CustomToast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      <DocumentViewerModal visible={showImageModal} imageUri={imageToView} onClose={closeViewer} />

      <View className="flex-row justify-between items-center px-4 pt-12 pb-4 border-b border-border shadow-sm z-10">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 mr-1 -ml-2">
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-foreground">{tenant.name}</Text>
            <Text className="text-xs text-muted-foreground">Floor - {agreement.unit_number}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className={`px-2 py-1 rounded-md mr-1 ${tenant.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
            <Text className={`text-xs font-bold uppercase ${tenant.is_active ? 'text-green-700' : 'text-red-700'}`}>
              {tenant.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowMenu(true)} className="p-2 -mr-2">
            <Ionicons name="ellipsis-vertical" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-muted/10 p-4">
        {/* QUICK ACTIONS ROW */}
        <ActionsRow tenant={tenant} agreement={agreement}/>

        {/* SECTION: TENANT DETAILS */}
        <DisplayPersonalInfoOfTenant tenant={tenant} />

        {/* SECTION: AGREEMENT DETAILS */}
        <DisplayAgreementDetailsOfTenant tenant={tenant} agreement={agreement} />

        <TouchableOpacity
          disabled={!tenant.is_active}
          onPress={() => router.push(`/ledgers/${agreement.id}`)}
          className={`bg-white rounded-2xl p-5 mb-12 shadow-sm border border-border flex-row justify-between items-center ${
            !tenant.is_active ? 'opacity-50 bg-muted/50' : ''
          }`}
        >
          <View className="flex-row items-center">
            <View className={`p-2 rounded-lg mr-3 ${!tenant.is_active ? 'bg-gray-200' : 'bg-teal-100'}`}>
              <Ionicons name={!tenant.is_active ? "lock-closed" : "wallet"} size={24} color={!tenant.is_active ? "#a1a1aa" : "#0f766e"} />
            </View>
            <View>
              <Text className="font-bold text-foreground text-lg">Manage Finances</Text>
              <Text className="text-muted-foreground text-xs">
                {!tenant.is_active ? "Ledger locked, view summary PDF for history" : "View ledgers, payments & misc charges"}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
        </TouchableOpacity>
      </ScrollView>

      <CustomDropdownMenu
        visible={showMenu}
        onOpenChange={setShowMenu}
        items={dynamicMenuItems}
      />

      <CustomAlertDialog
        visible={showStatusAlert}
        onOpenChange={setShowStatusAlert}
        title={tenant.is_active ? "Deactivate Tenant" : "Activate Tenant"}
        description={`Are you sure you want to mark this tenant as ${tenant.is_active ? "inactive" : "active"}?`}
        actionText="Confirm"
        onAction={confirmToggleStatus}
        isDestructive={tenant.is_active}
      />

      <CustomAlertDialog
        visible={showEarlyRenewAlert}
        onOpenChange={setShowEarlyRenewAlert}
        title="Renew Early?"
        description="The current agreement hasn't reached its end date yet. Are you sure you want to process a renewal now?"
        actionText="Proceed to Renewal"
        onAction={handleProceedToRenewal}
      />
    </View>
  );
}