import { TenantFormData } from "@/types/types";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { Text, TextInput, View } from "react-native";

export function TenantDetailsSection({
  control,
  errors,
}: {
  control: Control<TenantFormData>;
  errors: FieldErrors<TenantFormData>;
}) {
  return (
    <View className="mb-8">
      <Text className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider">
        Tenant Details
      </Text>

      <View className="mb-4">
        <Text className="text-sm mb-1 text-foreground font-medium">
          Full name
        </Text>
        <Controller
          control={control}
          name="fullName"
          rules={{ required: "Required" }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={`border rounded-lg p-3 text-foreground ${errors.fullName ? "border-red-500" : "border-border"}`}
              placeholder="e.g. Ali Raza"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.fullName && (
          <Text className="text-xs text-red-500 mt-1">
            {errors.fullName.message}
          </Text>
        )}
      </View>

      <View className="mb-4">
        <Text className="text-sm mb-1 text-foreground font-medium">
          Contact number
        </Text>
        <Controller
          control={control}
          name="contactNumber"
          rules={{
            required: "Required",
            pattern: {
              value: /^[0-9]{11}$/,
              message: "Must be exactly 11 digits",
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={`border rounded-lg p-3 text-foreground ${errors.contactNumber ? "border-red-500" : "border-border"}`}
              placeholder="03XXXXXXXXX"
              keyboardType="phone-pad"
              maxLength={11}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.contactNumber && (
          <Text className="text-xs text-red-500 mt-1">
            {errors.contactNumber.message}
          </Text>
        )}
      </View>

      <View className="mb-4">
        <Text className="text-sm mb-1 text-foreground font-medium">
          Permanent address
        </Text>
        <Controller
          control={control}
          name="presentAddress"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="border border-border rounded-lg p-3 text-foreground"
              placeholder="Street, area, city"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </View>
    </View>
  );
}
