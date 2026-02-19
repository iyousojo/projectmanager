import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      if (!token) {
        setLoading(false);
        router.replace("/login"); // Redirect if no token
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Data in Parallel for speed
      const [userRes, projectRes] = await Promise.allSettled([
        axios.get(`${API_URL}/users/me`, { headers }),
        axios.get(`${API_URL}/projects`, { headers })
      ]);

      // --- HANDLE USER DATA ---
      if (userRes.status === "fulfilled") {
        // Support both {user: {...}} and {...} structures
        const userData = userRes.value.data.user || userRes.value.data;
        setUser(userData);
        // Store for offline fallback
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
      } else {
        console.error("User Fetch Error:", userRes.reason?.response?.status);
      }

      // --- HANDLE PROJECT DATA ---
      if (projectRes.status === "fulfilled") {
        const pData = projectRes.value.data;
        // Check if data is array, or inside .projects, or inside .data
        const finalProjects = Array.isArray(pData) 
          ? pData 
          : (pData.projects || pData.data || []);
        setProjects(finalProjects);
      } else {
        // This is likely your 400 error source
        console.error("Project Fetch Error Details:", projectRes.reason?.response?.data);
      }

    } catch (err) {
      console.error("Home Critical Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const featuredProject = projects.length > 0 ? projects[0] : null;

  const crispShadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4, 
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-400 font-medium">Loading Workspace...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="px-6 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} color="#6366f1" />}
      >
        
        {/* HEADER AREA */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-gray-400 text-sm font-semibold uppercase tracking-widest">
              Welcome back,
            </Text>
            <Text className="text-3xl font-black text-black tracking-tight">
              {user?.fullName?.split(' ')[0] || user?.name || "User"}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable 
              onPress={() => router.push("/profile-details")} 
              style={crispShadow}
              className="w-12 h-12 rounded-2xl bg-white border border-gray-100 items-center justify-center"
            >
              <Ionicons name="person-circle-outline" size={26} color="black" />
            </Pressable>
          </View>
        </View>

        {/* HERO CARD */}
        {featuredProject ? (
          <Pressable 
            onPress={() => router.push({ pathname: "/project-details", params: { id: featuredProject._id } })} 
            className="bg-indigo-600 p-6 rounded-[35px] mb-8 shadow-xl shadow-indigo-200"
          >
             <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white/70 text-[10px] font-black uppercase tracking-[2px]">
                    Active Project
                </Text>
                <Ionicons name="rocket-outline" size={16} color="white" />
             </View>
            <Text className="text-white text-2xl font-bold leading-8 mb-6">
              {featuredProject.title}
            </Text>
            <View className="flex-row items-center gap-4">
              <View className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <View 
                  style={{ width: `${featuredProject.progress || 0}%` }} 
                  className="h-full bg-white rounded-full" 
                />
              </View>
              <Text className="text-white font-black text-xs">{featuredProject.progress || 0}%</Text>
            </View>
          </Pressable>
        ) : (
          <View className="bg-slate-50 p-10 rounded-[35px] mb-8 border border-dashed border-slate-200 items-center">
             <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-sm mb-4">
                <Ionicons name="briefcase-outline" size={28} color="#cbd5e1" />
             </View>
             <Text className="text-slate-400 font-bold text-center">No projects assigned to you yet.</Text>
          </View>
        )}

        {/* TRACKERS HEADER */}
        <View className="flex-row justify-between items-end mb-6 px-1">
          <Text className="text-xl font-black text-black">Your Trackers</Text>
          <Pressable onPress={() => router.push("/projects")}> 
            <Text className="text-indigo-600 text-xs font-black uppercase">See All</Text>
          </Pressable>
        </View>

        {/* PROJECT LIST */}
        <View className="pb-10">
          {projects.length > 0 ? (
            projects.map((project) => (
              <Pressable 
                key={project._id} 
                onPress={() => router.push({ pathname: "/project-details", params: { id: project._id } })} 
                style={crispShadow}
                className="flex-row items-center bg-white border border-slate-50 p-5 rounded-[25px] mb-4"
              >
                <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4 border border-slate-100">
                  <Ionicons name="layers-outline" size={20} color="#6366f1" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-bold text-[16px] mb-1">{project.title}</Text>
                  <Text className="text-slate-400 text-[11px] font-black uppercase tracking-tighter">
                    {project.status || "In Progress"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </Pressable>
            ))
          ) : (
            <View className="items-center py-10">
              <Ionicons name="file-tray-outline" size={48} color="#e2e8f0" />
              <Text className="text-center text-slate-300 mt-4 font-bold">List is empty</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}