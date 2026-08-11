import '../global.css';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { openDatabaseSync } from 'expo-sqlite';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import  { KeyboardProvider }  from "react-native-keyboard-controller";
import { db } from '@/db';
import migrations from '@/drizzle/migrations';
import { useEffect } from 'react';
import { syncMonthlyRentLedgers } from '@/db/queries/ledgers.queries';

const expoDb = openDatabaseSync('tenencyManagement.db');

export default function RootLayout() {
  useDrizzleStudio(expoDb);
  useEffect(() => {
    const runAppSync = async () => {
      await syncMonthlyRentLedgers();
    };

    runAppSync();
  }, []);

  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-red-500 font-bold">Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Building database...</Text>
      </View>
    );
  }

  return (
    <KeyboardProvider>
      <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/*  add buildings drawer */}
      <Stack.Screen
        name="buildings/add"
        options={{ presentation: 'transparentModal', headerShown: false, animation: 'slide_from_bottom' }}
        />
      {/* edit buildings drawer */}
      <Stack.Screen
        name="buildings/edit"
        options={{ presentation: 'transparentModal', headerShown: false, animation: 'slide_from_bottom' }}
        />
    </Stack>
        </KeyboardProvider>

    );
}