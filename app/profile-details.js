import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Clipboard, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function ViewProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Matches your backend mapping: checks res.data.user, res.data.data, or the root res.data
      const userData = res.data.user || res.data.data || res.data;
      
      setUser(userData);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
    } catch (err) {
      console.error("Profile Load Error:", err.response?.data || err.message);
      Alert.alert("Connection Error", "Could not sync profile data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/login");
        } 
      }
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="p-2 bg-white rounded-full shadow-sm">
          <Ionicons name="arrow-back" size={20} color="black" />
        </Pressable>
        <Text className="text-lg font-black text-slate-900">Account Details</Text>
        <Pressable 
          onPress={() => router.push("/profile-details")} 
          className="bg-indigo-600 px-4 py-2 rounded-full"
        >
          <Text className="text-white text-[10px] font-black uppercase"></Text>
        </Pressable>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUserData(); }} />}
      >
        {/* AVATAR SECTION */}
        <View className="items-center py-8">
          <View className="w-28 h-28 bg-indigo-100 rounded-[40px] items-center justify-center border-4 border-white shadow-sm">
            <Text className="text-indigo-600 text-4xl font-black">
              {/* FIX: Changed .name to .fullName */}
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-900 mt-4">
            {/* FIX: Changed .name to .fullName */}
            {user?.fullName || "Unknown User"}
          </Text>
          <View className="bg-indigo-600/10 px-3 py-1 rounded-full mt-2">
            <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              {user?.role || "Student"}
            </Text>
          </View>
        </View>

        {/* INFO SECTION - Matches User Schema */}
        <View className="px-6 gap-4">
          <InfoCard icon="mail" label="Email Address" value={user?.email || "No email provided"} />
          <InfoCard icon="call" label="Phone" value={user?.phone || "No phone number"} />
         
          
          {/* SUPERVISOR INFO - Since your service populates this */}
          {user?.role === 'student' && (
            <InfoCard 
              icon="person" 
              label="Assigned Supervisor" 
              value={user?.assignedSupervisor?.fullName || "Not yet assigned"} 
            />
          )}

          <InfoCard 
            icon="id-card" 
            label="Account ID" 
            value={user?._id || "N/A"} 
            isCopyable 
          />
          
          <InfoCard 
            icon="calendar" 
            label="Member Since" 
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unavailable"} 
          />
        </View>

        {/* LOGOUT */}
        <View className="px-6 mt-10 mb-10">
          <Pressable 
            onPress={handleLogout}
            className="bg-red-50 border border-red-100 p-5 rounded-[30px] flex-row items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 font-black uppercase text-[10px] ml-2 tracking-widest">Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ icon, label, value, isCopyable = false }) {
  const copyToClipboard = () => {
    if (isCopyable && value) {
      Clipboard.setString(value);
      Alert.alert("Copied", "ID copied to clipboard");
    }
  };

  return (
    <Pressable 
      onPress={isCopyable ? copyToClipboard : undefined}
      className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 flex-row items-center"
    >
      <View className="w-10 h-10 bg-slate-50 rounded-2xl items-center justify-center mr-4">
        <Ionicons name={icon} size={20} color="#6366f1" />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</Text>
        <Text className="text-slate-800 font-bold text-sm">{value}</Text>
      </View>
      {isCopyable && <Ionicons name="copy-outline" size={14} color="#cbd5e1" />}
    </Pressable>
  );
}