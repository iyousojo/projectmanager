import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SuperAdminProfile() {
  const router = useRouter();
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await AsyncStorage.getItem("userData");
    if (data) setAdminData(JSON.parse(data));
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Confirm you want to exit the control panel?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          await AsyncStorage.clear();
          // replace ensures they can't 'back' into the admin panel
          router.replace("/login");
        } 
      }
    ]);
  };

  const StatItem = ({ label, value, icon, color }) => (
    <View className="bg-slate-900 border border-white/5 p-4 rounded-3xl flex-1 items-center">
      <View className={`p-2 rounded-xl mb-2 ${color}`}>
        <Ionicons name={icon} size={18} color="white" />
      </View>
      <Text className="text-white text-lg font-black">{value}</Text>
      <Text className="text-slate-500 text-[9px] font-black uppercase tracking-tighter">{label}</Text>
    </View>
  );

  const MenuButton = ({ title, subtitle, icon, onPress }) => (
    <Pressable 
      onPress={onPress}
      className="bg-slate-900 p-5 rounded-[30px] flex-row items-center mb-4 border border-white/5 active:bg-slate-800"
    >
      <View className="bg-white/5 p-3 rounded-2xl mr-4">
        <Ionicons name={icon} size={22} color="white" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-bold text-base">{title}</Text>
        <Text className="text-slate-500 text-xs">{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#475569" />
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* HEADER & LOGOUT */}
        <View className="flex-row justify-between items-center mt-4 mb-8">
          <Pressable 
            onPress={() => router.back()} // Leaves profile, returns to Dashboard
            className="bg-slate-900 p-3 rounded-2xl active:opacity-70"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </Pressable>
          <Text className="text-white font-black uppercase tracking-widest text-xs">System Profile</Text>
          <Pressable onPress={handleLogout} className="bg-red-500/10 p-3 rounded-2xl">
            <Ionicons name="power" size={20} color="#ef4444" />
          </Pressable>
        </View>

        {/* PROFILE CARD */}
        <View className="items-center mb-8">
          <View className="relative">
            <View className="w-32 h-32 rounded-[45px] bg-indigo-600 items-center justify-center border-4 border-slate-900 shadow-2xl">
              <Text className="text-white text-4xl font-black">
                {adminData?.fullName?.charAt(0) || "A"}
              </Text>
            </View>
            <View className="absolute bottom-0 right-0 bg-green-500 w-8 h-8 rounded-full border-4 border-slate-950" />
          </View>
          <Text className="text-white text-2xl font-black mt-4">{adminData?.fullName || "Super Admin"}</Text>
          <View className="bg-indigo-500/10 px-4 py-1.5 rounded-full mt-2 border border-indigo-500/20">
            <Text className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">Master Access</Text>
          </View>
        </View>

        {/* SYSTEM STATS */}
        <View className="flex-row gap-3 mb-10">
          <StatItem label="Node" value="Active" icon="server-outline" color="bg-blue-500" />
          <StatItem label="Security" value="SSL" icon="shield-checkmark-outline" color="bg-green-500" />
          <StatItem label="DB State" value="Sync" icon="cloud-done-outline" color="bg-purple-500" />
        </View>

        {/* SETTINGS MENU */}
        <Text className="text-white/30 text-[10px] font-black uppercase tracking-widest ml-2 mb-4">Administration</Text>
        
        <MenuButton 
          title="User Management" 
          subtitle="Add or remove supervisors" 
          icon="people-outline" 
          onPress={() => router.push("/(admin)/user-management")} 
        />
        
        <MenuButton 
          title="System Logs" 
          subtitle="Review recent API activities" 
          icon="list-outline" 
          onPress={() => router.push("/(admin)/logs")} 
        />

        <MenuButton 
          title="Global Settings" 
          subtitle="Update university metadata" 
          icon="settings-outline" 
          onPress={() => router.push("/(admin)/settings")} 
        />

        <View className="bg-indigo-600/10 p-6 rounded-[35px] mt-4 border border-indigo-600/20 mb-10">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={20} color="#818cf8" />
            <Text className="text-indigo-400 font-bold ml-2">Endpoint Information</Text>
          </View>
          <Text className="text-slate-400 text-xs leading-5">
            Logged in as {adminData?.email}. All administrative actions are logged for security audits.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}