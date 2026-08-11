import { TenantFormData } from "@/types/types";
import { Dayjs } from "dayjs";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  control: Control<TenantFormData>;
  errors: FieldErrors<TenantFormData>;
  cnicIssueDate: Dayjs;
  cnicExpiryDate: Dayjs;
  setShowIssuePicker: (show: boolean) => void;
  setShowExpiryPicker: (show: boolean) => void;
  pickImage: () => void;
  cnicImage: string | null;
};

export function IdentificationSection({
  control,
  errors,
  cnicIssueDate,
  cnicExpiryDate,
  setShowIssuePicker,
  setShowExpiryPicker,
  pickImage,
  cnicImage,
}: Props) {
  return (
    <View className="mb-8">
      <Text className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider">
        Identification
      </Text>

      <View className="mb-4">
        <Text className="text-sm mb-1 text-foreground font-medium">
          CNIC number
        </Text>
        <Controller
          control={control}
          name="cnicNumber"
          rules={{
            required: "Required",
            pattern: {
              value: /^[0-9]{13}$/,
              message: "Must be exactly 13 digits (no dashes)",
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={`border rounded-lg p-3 text-foreground ${errors.cnicNumber ? "border-red-500" : "border-border"}`}
              placeholder="42XXXXXXXXXXX"
              keyboardType="number-pad"
              maxLength={13}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.cnicNumber && (
          <Text className="text-xs text-red-500 mt-1">
            {errors.cnicNumber.message}
          </Text>
        )}
      </View>

      <View className="flex-row justify-between mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-sm mb-1 text-foreground font-medium">
            CNIC issue date
          </Text>
          <TouchableOpacity
            onPress={() => setShowIssuePicker(true)}
            className="border border-border rounded-lg p-3"
          >
            <Text className="text-foreground">
              {cnicIssueDate.format("DD MMM YYYY")}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 ml-2">
          <Text className="text-sm mb-1 text-foreground font-medium">
            CNIC expiry date
          </Text>
          <TouchableOpacity
            onPress={() => setShowExpiryPicker(true)}
            className="border border-border rounded-lg p-3"
          >
            <Text className="text-foreground">
              {cnicExpiryDate.format("DD MMM YYYY")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-4">
        <TouchableOpacity
          onPress={pickImage}
          className="border border-dashed border-border rounded-lg p-6 items-center justify-center mt-2 bg-muted/10"
        >
          {cnicImage ? (
            <Image
              source={{ uri: cnicImage }}
              className="w-full h-40 rounded-md"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-muted-foreground text-center font-medium">
              📷 Upload CNIC photo
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
