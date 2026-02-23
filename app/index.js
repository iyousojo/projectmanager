import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ Set to false for production so users only see this once
const DEV_ALWAYS_SHOW_WELCOME = false; 

export default function Welcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      // In development, we might want to see this screen every time
      if (DEV_ALWAYS_SHOW_WELCOME) {
        setIsLoading(false);
        return;
      }
      
      try {
        const hasSeen = await AsyncStorage.getItem("hasSeenWelcome");
        const userToken = await AsyncStorage.getItem("userToken");

        // If they've seen the welcome screen and are already logged in, skip to Home
        if (hasSeen === "true" && userToken) {
          router.replace("/(tabs)/home");
        } 
        // If they've seen it but aren't logged in, go to Login
        else if (hasSeen === "true") {
          router.replace("/(auth)/login");
        } 
        else {
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

  const handleCreateAccount = async () => {
    if (!DEV_ALWAYS_SHOW_WELCOME) {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
    }
    router.push("/(auth)/register");
  };

  if (isLoading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#000" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <View className="flex-1 px-8 justify-between py-12">
        
        {/* Branding Section */}
        <View className="items-center mt-10">
          <View className="w-24 h-24 bg-gray-50 rounded-[30px] items-center justify-center mb-8 border border-gray-100 shadow-sm">
            <Ionicons name="layers" size={50} color="black" />
          </View>
          <Text className="text-5xl font-extrabold text-black tracking-tighter">Project</Text>
          <Text className="text-5xl font-extrabold text-gray-300 tracking-tighter">Manager.</Text>
          <Text className="text-gray-500 text-center text-lg mt-6 px-4">
            Manage academic projects with clarity and real-time updates.
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="gap-4">
          <Pressable 
            onPress={handleContinue} 
            className="bg-black py-5 rounded-3xl shadow-xl active:opacity-90"
          >
            <Text className="text-white text-center font-bold text-lg">Get Started</Text>
          </Pressable>

          <Pressable 
            onPress={handleCreateAccount} 
            className="border border-gray-200 py-5 rounded-3xl active:bg-gray-50"
          >
            <Text className="text-black text-center font-bold text-lg">Create Account</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}