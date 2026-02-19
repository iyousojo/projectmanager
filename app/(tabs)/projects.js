import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function ProjectList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Personal"); // Personal vs Group
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- FETCH DATA FROM RENDER ---
  const fetchArchive = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("userData");
      const user = JSON.parse(userData);

      // We pass the activeTab as a query param to our API
      // Example: /api/projects?type=personal or /api/projects?type=group
      const response = await axios.get(`${API_URL}/projects`, {
        params: { 
          type: activeTab.toLowerCase(),
          search: searchQuery 
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects(response.data);
      setIsAdmin(user?.role === 'admin');
    } catch (err) {
      console.error("Archive Fetch Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, [activeTab, searchQuery]); // Re-fetch when tab or search changes

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* HEADER SECTION - Kept your exact design */}
      <View className="px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">
               {isAdmin ? "SYSTEM ADMINISTRATOR" : "STUDENT PORTAL"}
            </Text>
            <Text className="text-2xl font-black text-slate-900 leading-tight">Archive</Text>
          </View>

          {/* ROLE DISPLAY (Instead of Switch, we just show the badge if Admin) */}
          {isAdmin && (
            <View className="flex-row items-center bg-indigo-100 px-4 py-2 rounded-full">
              <Ionicons name="shield-checkmark" size={14} color="#6366f1" />
              <Text className="ml-2 text-indigo-600 font-bold text-[10px]">ADMIN VIEW</Text>
            </View>
          )}
        </View>

        {/* SEARCH BAR */}
        <View className="flex-row items-center bg-slate-100 px-4 py-3 rounded-2xl">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search archive..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-3 font-bold text-slate-900 text-sm"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="px-6 mt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchArchive();}} />}
      >
        {/* TAB NAVIGATION */}
        <View className="flex-row bg-slate-100 p-1.5 rounded-2xl mb-8">
          {["Personal", "Group"].map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {setLoading(true); setActiveTab(tab);}}
              className={`flex-1 py-3 rounded-xl items-center ${activeTab === tab ? "bg-white" : ""}`}
            >
              <Text className={`font-black text-[10px] tracking-widest ${activeTab === tab ? "text-slate-900" : "text-slate-400"}`}>
                {tab.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* PROJECT LIST */}
        <View className="pb-20">
          {loading ? (
            <ActivityIndicator color="#6366f1" size="large" className="mt-10" />
          ) : projects.length > 0 ? (
            projects.map((item) => (
              <Pressable
                key={item._id}
                onPress={() => router.push(`/project/${item._id}`)}
                className={`p-8 rounded-[40px] mb-6 ${activeTab === "Personal" ? "bg-slate-900" : "bg-indigo-950"}`}
              >
                <View className="flex-row justify-between items-start mb-10">
                  <View className="flex-1 pr-4">
                    <Text className="text-[9px] font-black uppercase tracking-[3px] mb-3 text-indigo-400">
                      {item.department}
                    </Text>
                    <Text className="text-2xl font-black text-white tracking-tight">{item.title}</Text>
                  </View>
                  <View className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/10">
                    <Text className="text-white font-black text-[10px]">{item.progress}%</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full mr-2 ${item.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <Text className="font-black text-white text-[9px] uppercase tracking-widest opacity-70">
                        {item.phase || 'Ongoing'}
                    </Text>
                  </View>
                  <View className="bg-white p-2.5 rounded-full">
                    <Ionicons name="arrow-forward" size={16} color="black" />
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <View className="py-20 items-center">
              <Ionicons name="folder-open-outline" size={48} color="#e2e8f0" />
              <Text className="text-slate-400 font-bold mt-4">No projects found in this archive</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}