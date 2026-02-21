import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- ADVANCED DEBUGGER ---
  const debugLog = (context, error) => {
    console.log(`\n--- DEBUG START: ${context} ---`);
    if (error.response) {
      // Server responded with a status code outside of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
      console.error(`Headers:`, error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received. Check internet or API URL.");
      console.error(`Request Details:`, error.request);
    } else {
      // Something happened in setting up the request
      console.error(`Error Message: ${error.message}`);
    }
    console.log(`--- DEBUG END ---\n`);
  };

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      console.log("🔑 Auth Token Found:", token ? "Yes (starts with " + token.substring(0, 10) + "...)" : "No");

      if (!token) {
        console.warn("No token found, redirecting to login...");
        return router.replace("/login");
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Using Promise.allSettled to see which specific request fails
      const [userRes, projectRes] = await Promise.allSettled([
        axios.get(`${API_URL}/users/me`, { headers, timeout: 10000 }),
        axios.get(`${API_URL}/projects`, { headers, timeout: 10000 })
      ]);

      // Handle User Data Result
      if (userRes.status === "fulfilled") {
        const userData = userRes.value.data.user || userRes.value.data;
        setUser(userData);
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      } else {
        debugLog("User Data Fetch", userRes.reason);
        if (userRes.reason.response?.status === 401) router.replace("/login");
      }

      // Handle Project Data Result
      if (projectRes.status === "fulfilled") {
        const pData = projectRes.value.data;
        const finalProjects = Array.isArray(pData) ? pData : (pData.projects || pData.data || []);
        console.log(`✅ Sync Successful: Found ${finalProjects.length} projects.`);
        setProjects(finalProjects);
      } else {
        debugLog("Project List Fetch", projectRes.reason);
      }

    } catch (err) {
      debugLog("General Home Sync Error", err);
      Alert.alert("Sync Error", "Could not connect to the server. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

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
              {isAdmin ? "Supervisor Access" : "Student Workspace"}
            </Text>
            <Text className="text-3xl font-black text-black">
              Hello, {user?.fullName?.split(' ')[0] || "User"}
            </Text>
          </View>
          <Pressable 
            onPress={() => router.push("/profile-details")} 
            className="w-12 h-12 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100 shadow-sm"
          >
            <Ionicons name="person-outline" size={22} color="black" />
          </Pressable>
        </View>

        {/* --- MANAGEMENT PANEL (ADMIN ONLY) --- */}
        {isAdmin && (
          <View className="bg-slate-900 p-7 rounded-[40px] mb-10 shadow-2xl">
            <View className="flex-row items-center">
              <View className="flex-1 items-center border-r border-white/10">
                <Text className="text-white text-3xl font-black">{projects.length}</Text>
                <Text className="text-indigo-400 font-black text-[8px] uppercase tracking-widest">Projects</Text>
              </View>
              <Pressable 
                onPress={() => router.push("/converted-groups")} 
                className="flex-1 items-center"
              >
                <Ionicons name="people" size={24} color="#10b981" />
                <Text className="text-emerald-400 font-black text-[8px] uppercase tracking-widest">Manage Teams</Text>
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

        {projects.length > 0 ? (
          projects.map((p) => {
            const isGroup = p.members?.length > 1 || p.projectType?.toLowerCase() === "group";
            
            return (
              <Pressable 
                key={p._id} 
                onPress={() => {
                  console.log(`🎯 Navigating to: ${isGroup ? 'Group' : 'Individual'} ID: ${p._id}`);
                  if (isGroup) {
                    router.push(`/group-project/${p._id}`);
                  } else {
                    router.push(`/project-details?id=${p._id}`);
                  }
                }} 
                className="flex-row items-center bg-gray-50 p-5 rounded-[30px] mb-4 border border-gray-100"
              >
                <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center mr-4 shadow-sm border border-gray-50">
                  <Ionicons name={isGroup ? "people" : "document-text"} size={20} color="#6366f1" />
                </View>

                <View className="flex-1">
                  <Text className="font-bold text-slate-800" numberOfLines={1}>{p.title}</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mr-2">
                      {p.status || 'Active'}
                    </Text>
                    {isGroup && (
                      <View className="bg-indigo-100 px-2 py-0.5 rounded-full">
                        <Text className="text-indigo-600 text-[8px] font-black uppercase">Team</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </Pressable>
            );
          })
        ) : (
          <View className="py-20 items-center justify-center bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
            <Ionicons name="folder-open-outline" size={48} color="#cbd5e1" />
            <Text className="text-gray-400 mt-4 font-black text-[10px] uppercase tracking-widest">No Projects Found</Text>
          </View>
        )}
        
        <View className="h-24" />
      </ScrollView>

      {!isAdmin && (
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