import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function NotificationDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchNotificationDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const allRes = await axios.get(`${API_URL}/notifications`, { headers });
      const allNotifs = Array.isArray(allRes.data) ? allRes.data : (allRes.data.notifications || []);
        
      const found = allNotifs.find(n => String(n._id) === String(id) || String(n.id) === String(id));

      if (found) {
        setNotification(found);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Detail Fetch Error:", err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleMarkAsRead = async () => {
    try {
      setIsProcessing(true);
      const token = await AsyncStorage.getItem("userToken");
      setNotification(prev => ({ ...prev, isUnread: false }));

      await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      setNotification(prev => ({ ...prev, isUnread: true }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete", "Remove this notification?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("userToken");
            await axios.delete(`${API_URL}/notifications/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            router.back();
          } catch (err) {
            Alert.alert("Error", "Could not delete.");
          }
        } 
      }
    ]);
  };

  useEffect(() => { if (id) fetchNotificationDetails(); }, [id]);

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  if (error || !notification) return (
    <View className="flex-1 justify-center items-center bg-white px-10">
      <Ionicons name="alert-circle-outline" size={64} color="#f43f5e" />
      <Text className="text-xl font-black text-slate-900 mt-4">Not Found</Text>
      <Pressable onPress={() => router.back()} className="mt-8 bg-slate-900 px-8 py-4 rounded-full">
        <Text className="text-white font-bold uppercase text-[10px]">Go Back</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100">
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </Pressable>
          <Text className="ml-2 text-sm font-black uppercase tracking-widest text-slate-900">Details</Text>
        </View>
        <Pressable onPress={handleDelete} className="p-2">
          <Ionicons name="trash-outline" size={20} color="#f43f5e" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-8 pt-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-4">
          <View className="bg-indigo-50 px-4 py-1.5 rounded-full">
            <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              {notification.category || 'Notification'}
            </Text>
          </View>
          {notification.isUnread && (
            <View className="bg-amber-100 px-3 py-1 rounded-full">
              <Text className="text-amber-700 text-[8px] font-black uppercase">New</Text>
            </View>
          )}
        </View>

        <Text className="text-3xl font-black text-slate-900 leading-[38px] mb-2">{notification.title}</Text>
        <Text className="text-slate-400 text-xs font-bold mb-8">Received: {notification.time || "Recently"}</Text>

        <View className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 mb-8">
          <Ionicons name="chatbubble-ellipses-sharp" size={32} color="#cbd5e1" />
          <Text className="text-slate-700 text-lg leading-7 font-medium mt-4">{notification.message}</Text>
        </View>

        {/* UPDATED ACTION BUTTONS */}
        <View className="space-y-4">
          {notification.projectId && (
            <Pressable 
              onPress={() => router.push(`/group-workspace?id=${notification.projectId}`)}
              className="bg-slate-900 flex-row items-center justify-center py-5 rounded-[25px] shadow-lg shadow-slate-200"
            >
              <Text className="text-white font-black uppercase tracking-widest text-[12px] mr-2">Open Workspace</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </Pressable>
          )}

          {/* This button now appears if it's unread OR we provide a way to mark it regardless */}
          {notification.isUnread ? (
            <Pressable 
              onPress={handleMarkAsRead}
              disabled={isProcessing}
              className="bg-indigo-600 flex-row items-center justify-center py-5 rounded-[25px] shadow-xl shadow-indigo-200"
            >
              {isProcessing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text className="text-white font-black uppercase tracking-widest text-[12px] ml-2">Confirm Read</Text>
                </>
              )}
            </Pressable>
          ) : (
            <View className="py-5 items-center justify-center border border-slate-100 rounded-[25px]">
               <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px]">✓ Message Read</Text>
            </View>
          )}
        </View>
        
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}