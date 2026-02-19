import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function TaskDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState(params.status || "Pending");

  const isCompleted = taskStatus === "Completed" || taskStatus === "Approved";

  const handleComplete = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(`${API_URL}/tasks/${params.id}/submit`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setTaskStatus("Submitted");
      Alert.alert("Success", "Task submitted!", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="p-6">
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} /></Pressable>
        <Text className="text-4xl font-black mt-8">{params.title}</Text>
        <Text className="text-slate-500 text-lg mt-4">{params.description}</Text>
        <View className="mt-10 p-6 bg-slate-50 rounded-3xl">
          <Text className="text-slate-400 uppercase text-[10px] font-bold">Deadline</Text>
          <Text className="font-bold text-lg">{params.deadline || "Not set"}</Text>
        </View>
        <Pressable 
            disabled={isCompleted || loading}
            onPress={handleComplete} 
            className={`mt-10 p-5 rounded-2xl items-center ${isCompleted ? 'bg-slate-200' : 'bg-indigo-600'}`}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">{isCompleted ? "Completed" : "Submit Progress"}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}