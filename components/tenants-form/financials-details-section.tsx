import { CustomSelect } from "@/components/ui/select";
import TenantFormData from "@/types/types";
import { Dayjs } from "dayjs";
import {
    Control,
    Controller,
    FieldErrors,
    UseFormGetValues
} from "react-hook-form";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  control: Control<TenantFormData>;
  errors: FieldErrors<TenantFormData>;
  getValues: UseFormGetValues<TenantFormData>;
  buildingOptions: { label: string; value: string }[];
  presetBuildingName?: string;
  moveInDate: Dayjs;
  setShowMoveInPicker: (show: boolean) => void;
  isEdit: boolean;
};

export function FinancialsSection({
  control,
  errors,
  getValues,
  buildingOptions,
  presetBuildingName,
  moveInDate,
  setShowMoveInPicker,
  isEdit = false,
}: Props) {
  return (
    <View className="mb-8">
      <Text className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider">
        Move-In & Financials
      </Text>

      <View className="flex-row justify-between mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-sm mb-1 text-foreground font-medium">
            Building
          </Text>
          <Controller
            control={control}
            name="buildingName"
            rules={{ required: "Required" }}
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                value={value}
                onValueChange={onChange}
                options={buildingOptions}
                placeholder="Select building"
                disabled={!!presetBuildingName}
                error={!!errors.buildingName}
              />
            )}
          />
          {errors.buildingName && (
            <Text className="text-xs text-red-500 mt-1">
              {errors.buildingName.message}
            </Text>
          )}
        </View>

        <View className="flex-1 ml-2">
          <Text className="text-sm mb-1 text-foreground font-medium">
            Unit / Floor
          </Text>
          <Controller
            control={control}
            name="unitNumber"
            rules={{ required: "Required" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-lg p-3 text-foreground ${errors.unitNumber ? "border-red-500" : "border-border"}`}
                placeholder="e.g. Flat 3B"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>
      </View>

      <View className="flex-row justify-between mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-sm mb-1 text-foreground font-medium">
            Advance deposit
          </Text>
          <Controller
            control={control}
            name="advanceAmount"
            rules={{
              required: "Required",
              validate: (value) => parseInt(value) >= 0 || "Cannot be negative",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-lg px-3 ${errors.advanceAmount ? "border-red-500" : "border-border"}`}
              >
                <Text className="text-muted-foreground mr-2">Rs</Text>
                <TextInput
                  className="flex-1 py-3 text-foreground"
                  placeholder="0"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.advanceAmount && (
            <Text className="text-xs text-red-500 mt-1">
              {errors.advanceAmount.message}
            </Text>
          )}
        </View>
        <View className="flex-1 ml-2">
          <Text className="text-sm mb-1 text-foreground font-medium">
            Monthly rent
          </Text>
          <Controller
            control={control}
            name="monthlyRent"
            rules={{
              required: "Required",
              validate: (value) =>
                parseInt(value) > 0 || "Must be greater than 0",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-lg px-3 ${errors.monthlyRent ? "border-red-500" : "border-border"}`}
              >
                <Text className="text-muted-foreground mr-2">Rs</Text>
                <TextInput
                  className="flex-1 py-3 text-foreground"
                  placeholder="0"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.monthlyRent && (
            <Text className="text-xs text-red-500 mt-1">
              {errors.monthlyRent.message}
            </Text>
          )}
        </View>
      </View>

      {!isEdit && (
        <View className="mb-4">
          <Text className="text-sm mb-1 text-foreground font-medium">
            1st Month Rent Collected Now
          </Text>
          <Controller
            control={control}
            name="firstMonthRentCollected"
            rules={{
              deps: ["monthlyRent"],
              validate: (value) => {
                const numValue = parseInt(value) || 0;

                const currentMonthlyRent =
                  parseInt(getValues("monthlyRent")) || 0;
                if (numValue < 0) return "Cannot be negative";
                if (numValue > currentMonthlyRent)
                  return "Cannot exceed monthly rent";
                return true;
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-lg px-3 ${errors.firstMonthRentCollected ? "border-red-500" : "border-border"}`}
              >
                <Text className="text-muted-foreground mr-2">Rs</Text>
                <TextInput
                  className="flex-1 py-3 text-foreground"
                  placeholder="0"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.firstMonthRentCollected ? (
            <Text className="text-xs text-red-500 mt-1">
              {errors.firstMonthRentCollected.message}
            </Text>
          ) : (
            <Text className="text-xs text-muted-foreground mt-1">
              Automatically creates the first payment receipt.
            </Text>
          )}
        </View>
      )}

      <View className="flex-row justify-between mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-sm mb-1 text-foreground font-medium">
            Move-in date
          </Text>
          <TouchableOpacity
            onPress={() => setShowMoveInPicker(true)}
            className="border border-border rounded-lg p-3"
          >
            <Text className="text-foreground">
              {moveInDate.format("DD MMM YYYY")}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 ml-2">
          <Text className="text-sm mb-1 text-foreground font-medium">
            Rent due day
          </Text>
          <Controller
            control={control}
            name="rentDueDay"
            rules={{
              required: "Required",
              validate: (value) => {
                const num = parseInt(value);
                return (num >= 1 && num <= 31) || "Must be between 1 and 31";
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-lg p-3 text-foreground ${errors.rentDueDay ? "border-red-500" : "border-border"}`}
                placeholder="1-31"
                keyboardType="numeric"
                maxLength={2}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.rentDueDay && (
            <Text className="text-xs text-red-500 mt-1">
              {errors.rentDueDay.message}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
