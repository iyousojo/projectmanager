import { Stack } from "expo-router";
// ✅ Changed SafeAreaView to SafeAreaProvider in the import below
import { SafeAreaProvider } from "react-native-safe-area-context"; 
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}