import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function ProjectArchive() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- ADVANCED DEBUGGER (Mirrored from Home.js) ---
  const debugLog = (context, error) => {
    console.log(`\n--- DEBUG START: ${context} ---`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("No response received. Check internet or API URL.");
    } else {
      console.error(`Error Message: ${error.message}`);
    }
    console.log(`--- DEBUG END ---\n`);
  };

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        return router.replace("/login");
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [userRes, projectRes] = await Promise.allSettled([
        axios.get(`${API_URL}/users/me`, { headers, timeout: 10000 }),
        axios.get(`${API_URL}/projects`, { headers, timeout: 10000 })
      ]);

      if (userRes.status === "fulfilled") {
        const userData = userRes.value.data.user || userRes.value.data;
        setUser(userData);
      } else {
        debugLog("User Data Fetch", userRes.reason);
      }

      if (projectRes.status === "fulfilled") {
        const pData = projectRes.value.data;
        const finalProjects = Array.isArray(pData) ? pData : (pData.projects || pData.data || []);
        setProjects(finalProjects);
      } else {
        debugLog("Project List Fetch", projectRes.reason);
      }
    } catch (err) {
      debugLog("General Archive Sync Error", err);
      Alert.alert("Sync Error", "Could not connect to the server.");
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
      <Text className="mt-4 text-gray-400 font-bold">Loading Archive...</Text>
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
        {/* --- HEADER (With Back Button) --- */}
        <View className="flex-row items-center mb-8">
          <Pressable 
            onPress={() => router.back()} 
            className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4"
          >
            <Ionicons name="arrow-back" size={20} color="black" />
          </Pressable>
          <View>
            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
              Project History
            </Text>
            <Text className="text-3xl font-black text-black">
              All Projects
            </Text>
          </View>
        </View>

        {/* --- LIST (Mirrored Logic) --- */}
        {projects.length > 0 ? (
          projects.map((p) => {
            const isGroup = p.members?.length > 1 || p.projectType?.toLowerCase() === "group";
            
            return (
              <Pressable 
                key={p._id} 
                onPress={() => {
                  // EXACT SAME NAVIGATION AS HOME.JS
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
            <Text className="text-gray-400 mt-4 font-black text-[10px] uppercase tracking-widest">Archive is empty</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}