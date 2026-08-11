import { FinancialsSection } from "@/components/tenants-form/financials-details-section";
import { IdentificationSection } from "@/components/tenants-form/identification-details-section";
import { TenantDetailsSection } from "@/components/tenants-form/tenants-details-section";
import { DatePickerModal } from "@/components/ui/date-picker";
import { CustomToast } from "@/components/ui/toast";
import { getBuildings } from "@/db/queries/buildings.queries";
import { getFullTenantDetails, updateExistingTenant, } from "@/db/queries/tenants.queries";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Keyboard, Text, TouchableOpacity, View, } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { TenantFormData } from "../../types/types";

export default function EditTenantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [cnicImage, setCnicImage] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  // Agreement Document State
  const [agreementUri, setAgreementUri] = useState<string | null>(null);
  const [agreementName, setAgreementName] = useState<string | null>(null);

  // Date States
  const [cnicIssueDate, setCnicIssueDate] = useState(dayjs());
  const [cnicExpiryDate, setCnicExpiryDate] = useState(dayjs().add(10, "year"));
  const [moveInDate, setMoveInDate] = useState(dayjs());
  const [startDate, setStartDate] = useState(dayjs());

  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showMoveInPicker, setShowMoveInPicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

  const [buildingsList, setBuildingsList] = useState<{ name: string }[]>([]);
  const buildingOptions = buildingsList.map((b) => ({
    label: b.name,
    value: b.name,
  }));
  const [presetBuildingName, setPresetBuildingName] = useState<string>("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm<TenantFormData>();

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      const buildRes = await getBuildings();
      if (buildRes.success) setBuildingsList(buildRes.data);
      if (id) {
        const tenantRes = await getFullTenantDetails(id);
        if (tenantRes.success && tenantRes.data) {
          const { tenant, agreement } = tenantRes.data;

          let currentBuildingName = "";
          if (buildRes.success) {
            const matchingBuilding = buildRes.data.find(
              (b: any) => b.id === agreement.building_id,
            );
            if (matchingBuilding) {
              currentBuildingName = matchingBuilding.name;
              setPresetBuildingName(currentBuildingName);
            }
          }
          reset({
            fullName: tenant.name,
            contactNumber: tenant.contact_no,
            presentAddress: tenant.permanent_address || "",
            cnicNumber: tenant.cnic_number,
            buildingId: agreement.building_id,
            buildingName: currentBuildingName,
            unitNumber: agreement.unit_number,
            advanceAmount: agreement.advance_amount.toString(),
            monthlyRent: agreement.monthly_rent.toString(),
            rentDueDay: agreement.rent_due_day.toString(),
          });
          if (tenant.cnic_uri) setCnicImage(tenant.cnic_uri);
          if (tenant.cnic_expiry_date)
            setCnicExpiryDate(dayjs(tenant.cnic_expiry_date));
          if (agreement.move_in_date)
            setMoveInDate(dayjs(agreement.move_in_date));
          if (agreement.start_date) setStartDate(dayjs(agreement.start_date));
          if (agreement.attachment_uri) {
            setAgreementUri(agreement.attachment_uri);
            setAgreementName("Current Agreement Attached");
          }
        }
      }
      setIsLoading(false);
    };
    initializeData();
  }, [id, reset]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setCnicImage(result.assets[0].uri);
  };

  const pickAgreement = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setAgreementUri(result.assets[0].uri);
        setAgreementName(result.assets[0].name);
      }
    } catch (error) {
      showToast("An error occurred while picking the document.", "error");
    }
  };

  const onSubmit = async (data: TenantFormData) => {
    Keyboard.dismiss();
    const payload = {
      fullName: data.fullName,
      contactNumber: data.contactNumber,
      presentAddress: data.presentAddress,
      cnicNumber: data.cnicNumber,
      cnicExpiryDate: cnicExpiryDate.format("YYYY-MM-DD"),
      cnic_uri: cnicImage,
      buildingName: data.buildingName,
      unitNumber: data.unitNumber,
      advanceAmount: parseInt(data.advanceAmount) || 0,
      monthlyRent: parseInt(data.monthlyRent) || 0,
      rentDueDay: parseInt(data.rentDueDay),
      moveInDate: moveInDate.format("YYYY-MM-DD"),
      startDate: startDate.format("YYYY-MM-DD"),
      attachmentUri: agreementUri,
    };
    const result = await updateExistingTenant(id, payload);

    if (result.success) {
      router.back();
    } else {
      showToast("Could not update tenant details.", "error");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-border bg-white z-10 shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="chevron-back" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Edit Tenant</Text>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={80}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TenantDetailsSection control={control} errors={errors} />

        <IdentificationSection
          control={control}
          errors={errors}
          cnicIssueDate={cnicIssueDate}
          cnicExpiryDate={cnicExpiryDate}
          setShowIssuePicker={setShowIssuePicker}
          setShowExpiryPicker={setShowExpiryPicker}
          pickImage={pickImage}
          cnicImage={cnicImage}
        />

        <FinancialsSection
          control={control}
          errors={errors}
          getValues={getValues}
          buildingOptions={buildingOptions}
          presetBuildingName={presetBuildingName}
          moveInDate={moveInDate}
          setShowMoveInPicker={setShowMoveInPicker}
          isEdit={true}
        />

        {/* AGREEMENT & START DATE SECTION */}
        <View className="mt-6 mb-4">
          <Text className="text-lg font-bold text-foreground mb-4">
            Lease Agreement
          </Text>

          <View className="rounded-2xl p-5 mb-4 shadow-sm border border-border bg-white">
            <Text className="text-sm font-bold text-foreground mb-1">
              Contract Document
            </Text>
            <Text className="text-xs text-muted-foreground mb-4">
              Attach the signed PDF or scanned images of the lease.
            </Text>

            <TouchableOpacity
              onPress={pickAgreement}
              className={`border border-dashed rounded-xl p-8 items-center justify-center ${
                agreementUri
                  ? "border-teal-500 bg-teal-50"
                  : "border-border bg-muted/20"
              }`}
            >
              <Ionicons
                name={agreementUri ? "document-text" : "cloud-upload-outline"}
                size={32}
                color={agreementUri ? "#0f766e" : "#a1a1aa"}
              />
              <Text
                className={`mt-2 font-medium text-center ${agreementUri ? "text-teal-700" : "text-muted-foreground"}`}
              >
                {agreementName || "Tap to select document"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="rounded-2xl p-5 mb-4 shadow-sm border border-border bg-white">
            <Text className="text-sm font-bold text-foreground mb-1">
              Official Start Date
            </Text>
            <Text className="text-xs text-muted-foreground mb-4">
              The exact date the legal contract goes into effect.
            </Text>

            <TouchableOpacity
              onPress={() => setShowStartDatePicker(true)}
              className="flex-row justify-between items-center bg-muted/10 border border-border rounded-xl p-4"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#0f766e"
                  className="mr-3"
                />
                <Text className="text-foreground font-medium ml-2">
                  {startDate.format("MMMM D, YYYY")}
                </Text>
              </View>
              <Ionicons name="pencil" size={16} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-muted-foreground px-2">
            The Expiry Date (11 Months from the start date) of this agreement
            will be calculated automatically, also the app will notify you 20
            days before the actual expiry.
          </Text>
        </View>

        <View className="mt-auto pt-4">
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            className="bg-primary-700 p-4 rounded-xl items-center shadow-sm"
          >
            <Text className="text-white font-bold text-lg">Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* USING IMPORTED DATE PICKER MODAL */}
      <DatePickerModal
        visible={showIssuePicker}
        date={cnicIssueDate}
        setDate={setCnicIssueDate}
        onClose={() => setShowIssuePicker(false)}
      />
      <DatePickerModal
        visible={showExpiryPicker}
        date={cnicExpiryDate}
        setDate={setCnicExpiryDate}
        onClose={() => setShowExpiryPicker(false)}
      />
      <DatePickerModal
        visible={showMoveInPicker}
        date={moveInDate}
        setDate={setMoveInDate}
        onClose={() => setShowMoveInPicker(false)}
      />
      <DatePickerModal
        visible={showStartDatePicker}
        date={startDate}
        setDate={setStartDate}
        onClose={() => setShowStartDatePicker(false)}
      />
    </View>
  );
}
