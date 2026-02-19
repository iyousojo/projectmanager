import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEV_ALWAYS_SHOW_WELCOME = true; 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function Welcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const registerForPushNotifications = async () => {
    // 1. Check if it's a physical device (Push doesn't work on most Emulators)
    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices.");
      return null;
    }

    try {
      // 2. Request Permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log("Failed to get push token for push notification!");
        return null;
      }

      // 3. Get Project ID (Your unique ID from EAS)
      // We try to pull it from config first, then use your hardcoded ID as a backup
      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId || 
        Constants.easConfig?.projectId || 
        "f83b3abe-edb4-4164-93d8-b2ec65f0da3d"; 

      if (!projectId) {
        throw new Error("Project ID is missing from app.json and fallback.");
      }

      // 4. Fetch the Token
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Device Push Token:", token);

      // 5. Android Channel Setup
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;

    } catch (error) {
      console.error("Error during push notification registration:", error);
      return null;
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      // Get the token and save it to storage
      const token = await registerForPushNotifications();
      if (token) {
        await AsyncStorage.setItem("pushToken", token);
      }

      if (DEV_ALWAYS_SHOW_WELCOME) {
        setIsLoading(false);
        return;
      }

      try {
        const hasSeen = await AsyncStorage.getItem("hasSeenWelcome");
        if (hasSeen === "true") {
          router.replace("/(auth)/login");
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleContinue = async () => {
    if (!DEV_ALWAYS_SHOW_WELCOME) {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
    }
    router.replace("/(auth)/login");
  };

  if (isLoading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#000" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <View className="flex-1 px-8 justify-between py-12">
        <View className="items-center mt-10">
          <View className="w-24 h-24 bg-gray-50 rounded-[30px] items-center justify-center mb-8 border border-gray-100 shadow-sm">
            <Ionicons name="layers" size={50} color="black" />
          </View>
          <Text className="text-5xl font-extrabold text-black tracking-tighter">Project</Text>
          <Text className="text-5xl font-extrabold text-gray-300 tracking-tighter">Manager.</Text>
          <Text className="text-gray-500 text-center text-lg mt-6 px-4">Manage academic projects with clarity.</Text>
        </View>

        <View className="gap-4">
          <Pressable onPress={handleContinue} className="bg-black py-5 rounded-3xl shadow-xl active:opacity-90">
            <Text className="text-white text-center font-bold text-lg">Get Started</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(auth)/register")} className="border border-gray-200 py-5 rounded-3xl active:bg-gray-50">
            <Text className="text-black text-center font-bold text-lg">Create Account</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}