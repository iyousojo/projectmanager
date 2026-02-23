import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRootNavigationState, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function Home() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- SUPER-ADMIN REDIRECT GUARD ---
  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (user && user.role === 'super-admin') {
      router.replace("/(admin)/dashboard");
    }
  }, [user, rootNavigationState?.key]);

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return router.replace("/login");

      const headers = { Authorization: `Bearer ${token}` };

      const [userRes, projectRes, notifRes] = await Promise.allSettled([
        axios.get(`${API_URL}/auth/profile`, { headers, timeout: 8000 }),
        axios.get(`${API_URL}/projects`, { headers, timeout: 8000 }),
        axios.get(`${API_URL}/notifications`, { headers, timeout: 8000 })
      ]);

      if (userRes.status === "fulfilled") {
        const userData = userRes.value.data;
        setUser(userData);
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
      } else if (userRes.reason.response?.status === 401) {
        router.replace("/login");
      }

      if (projectRes.status === "fulfilled") {
        const pData = projectRes.value.data;
        setProjects(Array.isArray(pData) ? pData : (pData.projects || []));
      }

      if (notifRes.status === "fulfilled") {
        setUnreadCount(notifRes.value.data.unreadCount || 0);
      }

    } catch (err) {
      console.error("Home Sync Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isSupervisor = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super-admin';

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="mt-4 text-gray-400 font-bold">Waking up server...</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} color="#6366f1" />
        }
        className="px-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* --- HEADER --- */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
              {isSupervisor ? "Supervisor Access" : "Student Workspace"}
            </Text>
            <Text className="text-3xl font-black text-black">
              Hello, {user?.fullName?.split(' ')[0] || "User"}
            </Text>
          </View>
          
          <View className="flex-row items-center space-x-3">
            <Pressable 
              onPress={() => router.push("/notifications")}
              className="w-12 h-12 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100 mr-2"
            >
              <Ionicons name="notifications-outline" size={22} color="black" />
              {unreadCount > 0 && (
                <View className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full items-center justify-center border-2 border-white">
                  <Text className="text-[8px] text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>

            <Pressable 
              onPress={() => router.push("/profile-details")} 
              className="w-12 h-12 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100 shadow-sm"
            >
              <Ionicons name="person-outline" size={22} color="black" />
            </Pressable>
          </View>
        </View>

        {/* --- MANAGEMENT PANEL (SUPERVISOR ONLY) --- */}
        {isSupervisor && (
          <View className="bg-slate-900 p-7 rounded-[40px] mb-10 shadow-2xl">
            <View className="flex-row items-center">
              <View className="flex-1 items-center border-r border-white/10">
                <Text className="text-white text-3xl font-black">{projects.length}</Text>
                <Text className="text-indigo-400 font-black text-[8px] uppercase tracking-widest mt-1">Active Projects</Text>
              </View>
              <Pressable 
                onPress={() => router.push("/projects")} // Simplified to main project list for supervisors
                className="flex-1 items-center"
              >
                <Ionicons name="people" size={24} color="#10b981" />
                <Text className="text-emerald-400 font-black text-[8px] uppercase tracking-widest mt-1">Manage Teams</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* --- WORKSPACE OVERVIEW CARD (STUDENT ONLY) --- */}
        {!isSupervisor && !isSuperAdmin && (
          <View className="bg-indigo-600 p-7 rounded-[40px] mb-8 shadow-2xl shadow-indigo-300">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 items-center border-r border-white/20">
                <Text className="text-white text-3xl font-black">{projects.length}</Text>
                <Text className="text-indigo-200 font-black text-[8px] uppercase tracking-widest mt-1">Active Projects</Text>
              </View>
              <Pressable 
                onPress={() => router.push("/notifications")}
                className="flex-1 items-center"
              >
                <View className="flex-row items-center">
                  <Text className="text-white text-3xl font-black">{unreadCount}</Text>
                  {unreadCount > 0 && <View className="w-2 h-2 bg-rose-400 rounded-full ml-1.5 mb-4" />}
                </View>
                <Text className="text-indigo-200 font-black text-[8px] uppercase tracking-widest mt-1">Unread Alerts</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* --- PROJECT LIST --- */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-black text-slate-900">Active Workstreams</Text>
          <Pressable onPress={() => router.push("/projects")}>
            <Text className="text-indigo-600 text-xs font-black uppercase">Archive</Text>
          </Pressable>
        </View>

        {projects.map((p) => {
          const isGroup = p.members?.length > 1 || p.projectType?.toLowerCase() === "group";
          return (
            <Pressable 
              key={p._id} 
              onPress={() => {
                // ✅ Correct Navigation Logic for Dynamic Routes
                if (isGroup) {
                  router.push({
                    pathname: "/group-project/[id]",
                    params: { id: p._id }
                  });
                } else {
                  router.push({
                    pathname: "/project-details",
                    params: { id: p._id }
                  });
                }
              }} 
              className="flex-row items-center bg-gray-50 p-5 rounded-[30px] mb-4 border border-gray-100"
            >
              <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center mr-4 shadow-sm border border-gray-50">
                <Ionicons name={isGroup ? "people" : "document-text"} size={20} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800" numberOfLines={1}>{p.title}</Text>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{p.status || 'Active'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </Pressable>
          );
        })}
        
        {projects.length === 0 && (
          <View className="py-20 items-center justify-center bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
            <Ionicons name="folder-open-outline" size={48} color="#cbd5e1" />
            <Text className="text-gray-400 mt-4 font-black text-[10px] uppercase tracking-widest">No Projects Found</Text>
          </View>
        )}
        
        <View className="h-24" />
      </ScrollView>

      {/* Floating Add Button */}
      {!isSupervisor && !isSuperAdmin && (
        <Pressable 
          onPress={() => router.push("/create-project")}
          className="absolute bottom-10 right-8 w-16 h-16 bg-indigo-600 rounded-full items-center justify-center shadow-2xl"
        >
          <Ionicons name="add" size={32} color="white" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}