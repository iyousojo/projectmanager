import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

// 1. Configure how notifications appear when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ✅ GLOBAL LOCKS: These survive component re-renders
let pushInitialized = false;
let isLockActive = false; 

export default function RootLayout() {
  const router = useRouter();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    const initializePush = async () => {
      // ✅ GATE 1: Prevents double-firing
      if (pushInitialized || isLockActive) return;
      
      isLockActive = true;
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log("✅ Token secured:", token);
          await AsyncStorage.setItem("pushToken", token);
          pushInitialized = true; 
        }
      } catch (err) {
        console.log("Push Setup: Suppressed background transition error.");
      } finally {
        isLockActive = false;
      }
    };

    initializePush();

    // Listeners for notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Foreground Notification:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.projectId) {
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          router.push({ pathname: "/group-workspace", params: { id: data.projectId } });
        }, 500);
      }
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="group-workspace" />
      </Stack>
    </SafeAreaProvider>
  );
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  // Give the app 2 seconds to fully load constants
  await new Promise(resolve => setTimeout(resolve, 2000)); 

  try {
    // 1. Get the Project ID
    const projectId = 
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId ?? 
      "f83b3abe-edb4-4164-93d8-b2ec65f0da3d"; 

    // ✅ GATE 2: UUID VALIDATION
    // This stops the 400 "Invalid UUID" error before it even hits the network
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!projectId || !uuidRegex.test(projectId)) {
      console.warn("🛡️ Push Guard: Project ID missing or invalid UUID. Skipping fetch.");
      return null;
    }

    // 2. Permission Check
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    // 3. Android Setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // 4. Final Fetch
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResult.data;

  } catch (error) {
    // ✅ GATE 3: CATCH-ALL
    // Prevents the "Uncaught in promise" red screen
    console.warn("🛡️ Push Guard: Handled Expo API error:", error.message);
    return null;
  }
}