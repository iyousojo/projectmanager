import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
// Correct import to prevent deprecation warning
import { SafeAreaView } from "react-native-safe-area-context";

// TOGGLE: Set to 'true' to always see this screen during design. 
// Set to 'false' for the real one-time-only user logic.
const DEV_ALWAYS_SHOW_WELCOME = true; 

export default function Welcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      // 1. If in Dev Mode, skip the storage check
      if (DEV_ALWAYS_SHOW_WELCOME) {
        setIsLoading(false);
        return;
      }
      // 2. Real Logic: Check if user has seen this page before
      const hasSeen = await AsyncStorage.getItem("hasSeenWelcome");
      if (hasSeen === "true") {
        router.replace("/(auth)/login");
      } else {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleContinue = async () => {
    // Save the flag only if we aren't in force-show dev mode
    if (!DEV_ALWAYS_SHOW_WELCOME) {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
    }
    // Use .replace() so the user cannot click 'back' to the welcome screen
    router.replace("/(auth)/login");
  };

  if (isLoading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#000" />
    </View>
  );

  return (
    // style={{ flex: 1 }} ensures the container doesn't collapse
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <View className="flex-1 px-8 justify-between py-12">
        {/* Branding Area */}
        <View className="items-center mt-10">
          <View className="w-24 h-24 bg-gray-50 rounded-[30px] items-center justify-center mb-8 border border-gray-100 shadow-sm">
            <Ionicons name="layers" size={50} color="black" />
          </View>
          <Text className="text-5xl font-extrabold text-black tracking-tighter">Project</Text>
          <Text className="text-5xl font-extrabold text-gray-300 tracking-tighter">Manager.</Text>
          <Text className="text-gray-500 text-center text-lg mt-6 px-4">
            Manage your academic projects and tasks with complete clarity.
          </Text>
        </View>

        {/* Navigation Buttons */}
        <View className="gap-4">
          <Pressable onPress={handleContinue} className="bg-black py-5 rounded-3xl shadow-xl active:opacity-90">
            <Text className="text-white text-center font-bold text-lg">Get Started</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(auth)/register")} className="border border-gray-200 py-5 rounded-3xl active:bg-gray-50">
            <Text className="text-black text-center font-bold text-lg">Create Account</Text>
          </Pressable>
        </View>
         <Text className="text-center text-gray-400  text-sm">
            v1.0.0 — Organized for Excellence
          </Text>
      </View>
    </SafeAreaView>
  );
}