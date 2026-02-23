import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function TaskDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [taskStatus, setTaskStatus] = useState(params.status || "Pending");

  // Load user data to determine role
  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await AsyncStorage.getItem("userData");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    fetchUser();
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const isCompleted = taskStatus === "Completed" || taskStatus === "Approved";
  const isSubmitted = taskStatus === "Submitted";

  // --- STUDENT LOGIC: SUBMIT ---
  const handleComplete = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(`${API_URL}/tasks/${params.id}/submit`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setTaskStatus("Submitted");
      Alert.alert("Success", "Task submitted for review!", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  // --- ADMIN LOGIC: APPROVE/REJECT ---
  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      // Adjust this endpoint based on your backend (usually a PATCH or PUT to /tasks/:id)
      await axios.patch(`${API_URL}/tasks/${params.id}`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTaskStatus(newStatus);
      Alert.alert("Success", `Task ${newStatus}`, [{ text: "OK", onPress: () => router.back() }]);
    } catch (err) {
      Alert.alert("Error", "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="p-6">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full">
          <Ionicons name="chevron-back" size={24} color="black" />
        </Pressable>

        <View className="mt-8">
          <View className="bg-indigo-100 self-start px-3 py-1 rounded-full mb-4">
            <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">{taskStatus}</Text>
          </View>
          <Text className="text-4xl font-black text-slate-900">{params.title}</Text>
          <Text className="text-slate-500 text-lg mt-4 leading-relaxed">{params.description}</Text>
        </View>

        <View className="mt-10 p-6 bg-slate-50 rounded-[30px] border border-slate-100">
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={20} color="#6366f1" />
            <View className="ml-4">
              <Text className="text-slate-400 uppercase text-[10px] font-bold tracking-tighter">Due Date</Text>
              <Text className="font-bold text-slate-800 text-lg">{params.deadline || "Flexible"}</Text>
            </View>
          </View>
        </View>

        <View className="mt-12">
          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" />
          ) : isAdmin ? (
            /* ADMIN CONTROLS */
            <View className="flex-row justify-between">
              <Pressable 
                onPress={() => handleStatusUpdate("Approved")}
                className="flex-1 bg-emerald-500 h-16 rounded-2xl items-center justify-center mr-2 shadow-lg shadow-emerald-200"
              >
                <Text className="text-white font-black uppercase tracking-widest">Approve</Text>
              </Pressable>
              <Pressable 
                onPress={() => handleStatusUpdate("Rejected")}
                className="flex-1 bg-red-500 h-16 rounded-2xl items-center justify-center ml-2 shadow-lg shadow-red-200"
              >
                <Text className="text-white font-black uppercase tracking-widest">Reject</Text>
              </Pressable>
            </View>
          ) : (
            /* STUDENT CONTROLS */
            <Pressable 
              disabled={isCompleted || isSubmitted || loading}
              onPress={handleComplete} 
              className={`h-16 rounded-2xl items-center justify-center shadow-xl ${
                isCompleted ? 'bg-emerald-500' : isSubmitted ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
            >
              <Text className="text-white font-black uppercase tracking-widest">
                {isCompleted ? "Task Approved" : isSubmitted ? "Awaiting Review" : "Submit Progress"}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}