import { Stack } from "expo-router";
import { useEffect } from "react";
import { Alert, BackHandler } from "react-native";

export default function AdminLayout() {
  useEffect(() => {
    // Prevent Android hardware back button from leaving the admin area
    const backAction = () => {
      Alert.alert("Exit App", "Do you want to exit the application?", [
        { text: "Cancel", onPress: () => null, style: "cancel" },
        { text: "Exit", onPress: () => BackHandler.exitApp() },
      ]);
      return true; // Stops the back action
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        // ✅ DISABLES iOS Swipe-to-go-back gesture
        gestureEnabled: false, 
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}