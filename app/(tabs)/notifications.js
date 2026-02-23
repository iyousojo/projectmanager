import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function NotificationPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data.notifications || []);
      setNotifications(data);
    } catch (error) {
      console.error("Fetch Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      // Optimistic UI Update
      setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
      
      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Mark all read failed:", error);
      fetchNotifications(); // Rollback on error
    }
  };

  const deleteNotification = (id) => {
    Alert.alert(
      "Remove Activity",
      "Delete this notification permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              setNotifications(prev => prev.filter(n => (n._id || n.id) !== id));
              const token = await AsyncStorage.getItem("userToken");
              await axios.delete(`${API_URL}/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (err) {
              Alert.alert("Error", "Delete failed.");
              fetchNotifications();
            }
          } 
        }
      ]
    );
  };

  const handlePress = async (item) => {
    const id = item._id || item.id;
    if (item.isUnread) {
      setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, isUnread: false } : n));
      const token = await AsyncStorage.getItem("userToken");
      axios.put(`${API_URL}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    router.push({ pathname: "/notification-details", params: { id: id } });
  };

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 border-b border-gray-50">
        <Text className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Workspace Stream</Text>
        <Text className="text-2xl font-black text-slate-900">Notifications</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="px-6 mt-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor="#6366f1" />
        }
      >
        {notifications.length === 0 ? (
          <View className="py-20 items-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
            <Ionicons name="mail-open-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-4 font-bold uppercase text-[10px]">Inbox Clear</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <View key={item._id || item.id} className="mb-4">
              <Pressable
                onPress={() => handlePress(item)}
                onLongPress={() => deleteNotification(item._id || item.id)}
                delayLongPress={500}
                className={`p-6 rounded-[35px] border ${
                  item.isUnread ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-100'
                }`}
              >
                <View className="flex-row items-center mb-2">
                  <Text className={`text-[10px] font-black uppercase tracking-widest ${item.isUnread ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {item.category || 'System'}
                  </Text>
                </View>
                <Text className={`text-lg font-black mb-1 ${item.isUnread ? 'text-white' : 'text-slate-900'}`}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} className={`text-xs ${item.isUnread ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.message}
                </Text>
              </Pressable>
            </View>
          ))
        )}
        <View className="h-32" />
      </ScrollView>

      {/* BOTTOM ACTION BUTTON */}
      {notifications.some(n => n.isUnread) && (
        <View className="absolute bottom-8 left-0 right-0 items-center px-6">
          <Pressable 
            onPress={markAllRead}
            className="bg-indigo-600 flex-row items-center px-8 py-4 rounded-full shadow-xl shadow-indigo-300 active:scale-95 transition-all"
          >
            <Ionicons name="checkmark-done" size={20} color="white" />
            <Text className="text-white font-black uppercase tracking-widest text-[10px] ml-2">
              Mark all as read
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}