import { FinancialsSection } from "@/components/tenants-form/financials-details-section";
import { IdentificationSection } from "@/components/tenants-form/identification-details-section";
import { TenantDetailsSection } from "@/components/tenants-form/tenants-details-section";
import { DatePickerModal } from "@/components/ui/date-picker";
import { getBuildings } from "@/db/queries/buildings.queries";
import { registerNewTenant } from "@/db/queries/tenants.queries";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import * as ImagePicker from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
    Alert,
    Keyboard,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import TenantFormData from "../../types/types";

export default function AddTenantScreen() {
  const { buildingId, buildingName: presetBuildingName } =
    useLocalSearchParams<{ buildingId: string; buildingName?: string }>();

  // Dates & Images
  const [cnicImage, setCnicImage] = useState<string | null>(null);
  const [cnicIssueDate, setCnicIssueDate] = useState(dayjs());
  const [cnicExpiryDate, setCnicExpiryDate] = useState(dayjs().add(10, "year"));
  const [moveInDate, setMoveInDate] = useState(dayjs());

  // Modals
  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showMoveInPicker, setShowMoveInPicker] = useState(false);

  // Buildings data
  const [buildingsList, setBuildingsList] = useState<
    { id: string; name: string }[]
  >([]);
  const buildingOptions = buildingsList.map((b) => ({
    label: b.name,
    value: b.name,
  }));

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<TenantFormData>({
    defaultValues: {
      fullName: "",
      contactNumber: "",
      presentAddress: "",
      cnicNumber: "",
      buildingId: "",
      buildingName: presetBuildingName || "",
      unitNumber: "",
      advanceAmount: "",
      monthlyRent: "",
      firstMonthRentCollected: "",
      rentDueDay: "",
    },
  });

  useEffect(() => {
    const fetchBuildings = async () => {
      const result = await getBuildings();
      if (result.success) setBuildingsList(result.data);
    };
    fetchBuildings();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setCnicImage(result.assets[0].uri);
  };

  const onSubmit = async (data: TenantFormData) => {
    Keyboard.dismiss();
    const finalBuildingId = buildingId || data.buildingId;

    if (!finalBuildingId) {
      Alert.alert("Error", "Please select a building.");
      return;
    }
    const payload = {
      fullName: data.fullName,
      contactNumber: data.contactNumber,
      presentAddress: data.presentAddress,
      cnicNumber: data.cnicNumber,
      cnicExpiryDate: cnicExpiryDate.format("YYYY-MM-DD"),
      cnic_uri: cnicImage,
      buildingId: finalBuildingId,
      unitNumber: data.unitNumber,
      advanceAmount: parseInt(data.advanceAmount) || 0,
      monthlyRent: parseInt(data.monthlyRent) || 0,
      firstMonthRentCollected: parseInt(data.firstMonthRentCollected) || 0,
      moveInDate: moveInDate.format("YYYY-MM-DD"),
      rentDueDay: parseInt(data.rentDueDay),
    };

    const result = await registerNewTenant(payload);

    if (result.success) {
      router.back();
    } else {
      Alert.alert("Error", "Could not register tenant. Ensure CNIC is unique.");
    }
  };

  return (
    <View className="flex-1 bg">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-border  z-10 shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Text className="text-foreground text-xl font-bold">
            <Ionicons name="chevron-back" size={24} />
          </Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">
          Register new tenant
        </Text>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={80}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* COMPONENT 1 */}
        <TenantDetailsSection control={control} errors={errors} />

        {/* COMPONENT 2 */}
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

        {/* COMPONENT 3 */}
        <FinancialsSection
          control={control}
          errors={errors}
          getValues={getValues}
          buildingOptions={buildingOptions}
          presetBuildingName={presetBuildingName}
          moveInDate={moveInDate}
          setShowMoveInPicker={setShowMoveInPicker}
          isEdit={false}
        />

        <View className="mt-auto pt-4">
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            className="bg-primary-700 p-4 rounded-xl items-center shadow-sm"
          >
            <Text className="text-white font-bold text-lg">Save tenant</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* MODALS */}
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
    </View>
  );
}
