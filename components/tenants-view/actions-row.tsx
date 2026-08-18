
import { View, Text, TouchableOpacity,  Image, Modal } from 'react-native';
import { router, } from 'expo-router';
import { useState, } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { useDocumentViewer } from '@/hooks/useDocumentViewer';
import { DocumentViewerModal } from '../ui/document-viewer-modal';

type Props = {
  tenant: {
    id: string;
    name: string;
    cnic_number: string;
    cnic_uri: string;
    contact_no: string;
    cnic_expiry_date: string;
    permanent_address: string;
  };
  agreement: {
    id: string;
    attachment_uri: string;
  }
};

export function ActionsRow({tenant, agreement}: Props){
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>
                                    ({ visible: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const { openDocument, imageToView, showImageModal, closeViewer } = useDocumentViewer(showToast);

  const handleGenerateHistoryPDF = () => {
    router.push({
      pathname: '/tenants/summary',
        params: {
          tenantId: tenant.id,
          agreementId: agreement.id,
          name: tenant.name
        }
      });
    };

  return(
    <View className="flex-row justify-between mb-6">
      <TouchableOpacity onPress={handleGenerateHistoryPDF} className="flex-1 bg-white p-3 rounded-xl border border-border items-center mr-2 shadow-sm">
        <Ionicons name="document-text" size={20} color="#0f766e" />
        <Text className="text-primary-700 text-xs font-bold mt-1">Summary PDF</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => openDocument(tenant.cnic_uri)} className="flex-1 bg-white border border-border p-3 rounded-xl items-center mr-2 shadow-sm">
        <Ionicons name="id-card" size={20} color="#0f766e" />
        <Text className="text-primary-700 text-xs font-bold mt-1">View CNIC</Text>
      </TouchableOpacity>

      {/* AGREEMENT BUTTON */}
      <TouchableOpacity onPress={() => openDocument(agreement.attachment_uri)} className="flex-1 bg-white border border-border p-3 rounded-xl items-center shadow-sm">
        <Ionicons name="contract" size={20} color="#0f766e" />
        <Text className="text-primary-700 text-xs font-bold mt-1">Agreement</Text>
      </TouchableOpacity>

      <DocumentViewerModal
        visible={showImageModal}
        imageUri={imageToView}
        onClose={closeViewer}
      />
    </View>
  )
}