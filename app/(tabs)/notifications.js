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

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data.notifications || []);
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- NEW DELETE LOGIC ---
  const deleteNotification = async (id) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to remove this notification?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              // 1. Optimistic UI update (Remove instantly from screen)
              setNotifications(prev => prev.filter(n => n.id !== id));
              
              // 2. API Call
              const token = await AsyncStorage.getItem("userToken");
              await axios.delete(`${API_URL}/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (error) {
              console.error("Delete failed:", error);
              // 3. Rollback if API fails
              fetchNotifications(); 
            }
          } 
        }
      ]
    );
  };

  const markAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const handleNotificationPress = async (item) => {
    if (item.isUnread) {
      try {
        const token = await AsyncStorage.getItem("userToken");
        await axios.put(`${API_URL}/notifications/${item.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isUnread: false } : n));
      } catch (e) { console.log("Update read status failed"); }
    }
    router.push({ pathname: "/notification-details", params: { id: item.id } });
  };

  const getIcon = (type) => {
    switch (type) {
      case "approval": return { name: "checkmark-circle", color: "#10b981" };
      case "team": return { name: "people", color: "#6366f1" };
      case "alert": return { name: "warning", color: "#f59e0b" };
      default: return { name: "notifications", color: "#64748b" };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <View>
          <Text className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Activity Center</Text>
          <Text className="text-2xl font-black text-slate-900">Notifications</Text>
        </View>
        <Pressable onPress={markAllRead} className="bg-slate-100 px-4 py-2 rounded-full active:bg-slate-200">
          <Text className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Mark all read</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="px-6 mt-6"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={["#6366f1"]} />}
        >
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <Text className="text-[11px] font-black text-slate-900 uppercase tracking-[2px]">Stream</Text>
              <View className="ml-2 bg-indigo-600 px-2 py-0.5 rounded-md">
                <Text className="text-white text-[9px] font-bold">{notifications.filter(n => n.isUnread).length}</Text>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View className="py-20 items-center">
                <Ionicons name="mail-open-outline" size={48} color="#cbd5e1" />
                <Text className="text-slate-400 text-center mt-4 font-medium">No notifications yet.</Text>
              </View>
            ) : (
              notifications.map((item) => (
                <View key={item.id} className="relative mb-4">
                  {/* DELETE BACKGROUND ACTION */}
                  <View className="absolute inset-0 bg-red-50 rounded-[30px] flex-row justify-end items-center px-8">
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                  </View>

                  {/* MAIN CARD */}
                  <Pressable
                    onPress={() => handleNotificationPress(item)}
                    onLongPress={() => deleteNotification(item.id)} // Using LongPress for deletion
                    delayLongPress={500}
                    className={`p-6 rounded-[30px] border ${item.isUnread ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-100'}`}
                    style={item.isUnread ? { elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8 } : {}}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-center">
                        <View style={{ backgroundColor: item.isUnread ? 'rgba(255,255,255,0.1)' : '#f8fafc' }} className="p-2 rounded-xl mr-3">
                          <Ionicons name={getIcon(item.type).name} size={18} color={getIcon(item.type).color} />
                        </View>
                        <Text className={`text-[10px] font-black uppercase tracking-widest ${item.isUnread ? 'text-indigo-400' : 'text-slate-400'}`}>
                          {item.category || 'SYSTEM'}
                        </Text>
                      </View>
                      <Text className={`text-[10px] font-bold ${item.isUnread ? 'text-slate-500' : 'text-slate-300'}`}>{item.time}</Text>
                    </View>

                    <Text className={`text-lg font-black mb-1 ${item.isUnread ? 'text-white' : 'text-slate-900'}`}>{item.title}</Text>
                    <Text numberOfLines={2} className={`text-xs leading-5 ${item.isUnread ? 'text-slate-400' : 'text-slate-500'}`} style={{ opacity: 0.8 }}>
                      {item.message}
                    </Text>

                    {item.isUnread && <View className="absolute top-6 right-6 w-2 h-2 rounded-full bg-indigo-500" />}
                  </Pressable>
                </View>
              ))
            )}
          </View>
          <View className="py-10 items-center">
            <Text className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">End of Activity Stream</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}