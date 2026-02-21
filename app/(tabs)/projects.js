import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        router.replace("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Get fresh data from Database
      const [userRes, projectRes] = await Promise.allSettled([
        axios.get(`${API_URL}/users/me`, { headers }),
        axios.get(`${API_URL}/projects`, { headers })
      ]);

      if (userRes.status === "fulfilled") {
        const userData = userRes.value.data.user || userRes.value.data;
        setUser(userData);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      }

      if (projectRes.status === "fulfilled") {
        const pData = projectRes.value.data;
        const finalProjects = Array.isArray(pData) ? pData : (pData.projects || pData.data || []);
        setProjects(finalProjects);
      }
    } catch (err) {
      console.error("Home Data Sync Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const featuredProject = projects.length > 0 ? projects[0] : null;

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <ScrollView 
        className="px-6 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} color="#6366f1" />}
      >
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-gray-400 text-sm font-semibold uppercase tracking-widest">
              {isAdmin ? "Administrator" : "Student"} Workspace
            </Text>
            <Text className="text-3xl font-black text-black tracking-tight">
              {user?.fullName?.split(' ')[0] || "User"}
            </Text>
          </View>
          <Pressable onPress={() => router.push("/profile-details")} className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100">
            <Ionicons name="person" size={20} color="black" />
          </Pressable>
        </View>

        {isAdmin && (
          <View className="flex-row gap-3 mb-8">
            <Pressable onPress={() => router.push("/converted-groups")} className="flex-1 bg-indigo-600 p-5 rounded-[30px] items-center">
              <Ionicons name="people" size={24} color="white" />
              <Text className="text-white font-black text-[10px] uppercase mt-2">Manage Teams</Text>
            </Pressable>
            <Pressable className="flex-1 bg-slate-900 p-5 rounded-[30px] items-center">
              <Text className="text-white font-black text-xl">{projects.length}</Text>
              <Text className="text-slate-400 font-black text-[10px] uppercase">Active Projects</Text>
            </Pressable>
          </View>
        )}

        {featuredProject && (
          <Pressable 
            onPress={() => router.push({ pathname: "/project-details", params: { id: featuredProject._id } })}
            className="bg-slate-900 p-8 rounded-[40px] mb-8"
          >
            <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">Primary Project</Text>
            <Text className="text-white text-2xl font-bold mb-6">{featuredProject.title}</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-white/50 text-xs font-bold">{featuredProject.status || 'Active'}</Text>
              <Ionicons name="arrow-forward-circle" size={32} color="#6366f1" />
            </View>
          </Pressable>
        )}

        <View className="flex-row justify-between items-end mb-6">
          <Text className="text-xl font-black text-black">Project Trackers</Text>
          <Pressable onPress={() => router.push("/projects")}>
            <Text className="text-indigo-600 text-xs font-black uppercase">Archive</Text>
          </Pressable>
        </View>

        {projects.map((p) => (
          <Pressable 
            key={p._id} 
            onPress={() => router.push({ pathname: "/project-details", params: { id: p._id } })}
            className="flex-row items-center bg-gray-50 p-5 rounded-[25px] mb-4 border border-gray-100"
          >
            <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-4">
              <Ionicons name="layers" size={18} color="#6366f1" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-800">{p.title}</Text>
              <Text className="text-[10px] font-black text-slate-400 uppercase">{p.status}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}