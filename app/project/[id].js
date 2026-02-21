import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const userData = JSON.parse(await AsyncStorage.getItem("userData"));
        setUser(userData);

        const res = await axios.get(`${API_URL}/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProject(res.data.project || res.data);
      } catch (e) {
        console.error("Load Error:", e.response?.data || e.message);
        Alert.alert("Error", "Could not load project details.");
      } finally { setLoading(false); }
    };
    loadDetails();
  }, [id]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

  const updateStatus = async (newStatus) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await axios.patch(`${API_URL}/projects/${id}`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProject(res.data.project || { ...project, status: newStatus });
      Alert.alert("Success", `Project status updated to ${newStatus}`);
    } catch (e) {
      // ✅ LOGGING ACTUAL ERROR FOR DEBUGGING
      console.error("Update Error:", e.response?.data || e.message);
      const errorMsg = e.response?.data?.message || "Update failed.";
      Alert.alert("Denied", errorMsg);
    }
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase tracking-[2px] text-indigo-600 mb-1">
              {project?.status || 'Pending'} Project
            </Text>
            <Text className="text-3xl font-black text-slate-900 leading-tight">{project?.title}</Text>
          </View>
        </View>

        {/* Quick Info Chips */}
        <View className="flex-row gap-2 mb-8">
           <View className="bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
             <Text className="text-[10px] font-black text-slate-500 uppercase">Supervisor: {project?.supervisor?.fullName || 'N/A'}</Text>
           </View>
           <View className="bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
             <Text className="text-[10px] font-black text-indigo-600 uppercase">Lead: {project?.projectHead?.fullName?.split(' ')[0] || 'N/A'}</Text>
           </View>
        </View>

        {/* Description */}
        <View className="mb-8">
          <Text className="text-slate-400 font-black text-[10px] uppercase mb-3 tracking-widest">About Project</Text>
          <View className="bg-gray-50 p-6 rounded-[35px] border border-gray-100">
            <Text className="text-slate-600 leading-6 text-[15px]">{project?.description}</Text>
          </View>
        </View>

        {/* Task History / Timeline Section */}
        <View className="mb-10">
          <Text className="text-slate-400 font-black text-[10px] uppercase mb-5 tracking-widest">Task History & Updates</Text>
          
          {project?.tasks?.length > 0 ? (
            project.tasks.map((task, idx) => (
              <View key={idx} className="flex-row mb-6">
                <View className="items-center mr-4">
                  <View className="w-3 h-3 rounded-full bg-indigo-600 mt-1" />
                  <View className="w-[1px] flex-1 bg-indigo-100 my-1" />
                </View>
                <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Text className="font-bold text-slate-800 text-sm">{task.title}</Text>
                  <Text className="text-slate-500 text-xs mt-1">{task.description || 'No description provided'}</Text>
                  <Text className="text-[9px] font-black text-slate-400 uppercase mt-2">{new Date(task.createdAt || Date.now()).toLocaleDateString()}</Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-gray-50 py-8 rounded-[30px] items-center border border-dashed border-gray-200">
              <Ionicons name="list-outline" size={24} color="#cbd5e1" />
              <Text className="text-slate-400 font-bold text-xs mt-2">No tasks logged yet.</Text>
            </View>
          )}
        </View>

        {/* ADMIN ONLY ACTIONS */}
        {isAdmin && (
          <View className="bg-slate-900 p-7 rounded-[40px] mb-10 shadow-xl">
            <View className="flex-row items-center mb-5">
               <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
               <Text className="text-white font-black text-[10px] uppercase tracking-widest">Control Panel</Text>
            </View>
            
            <View className="flex-row gap-3">
              <Pressable 
                onPress={() => updateStatus('active')} 
                className="flex-1 bg-indigo-600 py-5 rounded-2xl items-center shadow-sm"
              >
                <Text className="text-white font-black text-[10px] uppercase tracking-widest">Approve</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => updateStatus('completed')} 
                className="flex-1 bg-emerald-600 py-5 rounded-2xl items-center shadow-sm"
              >
                <Text className="text-white font-black text-[10px] uppercase tracking-widest">Mark Done</Text>
              </Pressable>
            </View>
            
            <Pressable 
               onPress={() => updateStatus('rejected')}
               className="mt-4 py-3 items-center border border-white/10 rounded-xl"
            >
               <Text className="text-rose-400 font-black text-[9px] uppercase tracking-[2px]">Reject Project</Text>
            </Pressable>
          </View>
        )}

        {/* Footer padding */}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}