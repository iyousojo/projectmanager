import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";
const UI_PHASES = ["Pending", "Proposal", "Implementation", "Testing", "Completed"];

// --- COMPONENTS ---
const TaskItem = memo(({ task, isLast }) => {
  const isMilestone = task.title?.includes("Phase");
  const dateObj = new Date(task.createdAt);
  const formattedDate = dateObj.toDateString();
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View className="flex-row mb-10">
      <View className="mr-5 items-center">
        <View className={`w-12 h-12 rounded-[22px] items-center justify-center ${isMilestone ? 'bg-indigo-600' : 'bg-slate-100'}`}>
          <Ionicons name={isMilestone ? "ribbon" : "document-text"} size={18} color={isMilestone ? "white" : "#94a3b8"} />
        </View>
        {!isLast && <View className="w-[1px] h-12 bg-slate-100 mt-2" />}
      </View>
      <View className="flex-1 pt-1">
        <Text className={`font-bold text-sm leading-tight ${isMilestone ? 'text-indigo-600' : 'text-slate-800'}`}>{task.title}</Text>
        <View className="flex-row items-center mt-3 bg-slate-50 self-start px-2 py-1 rounded-lg">
          <Ionicons name="calendar-clear-outline" size={10} color="#94a3b8" />
          <Text className="text-slate-400 text-[9px] ml-1 font-bold uppercase tracking-tighter">{formattedDate} • {formattedTime}</Text>
        </View>
      </View>
    </View>
  );
});

const PhaseButton = memo(({ phase, index, isActive, onUpdate }) => (
  <Pressable 
    onPress={() => onUpdate(phase)}
    className={`mr-4 px-8 py-5 rounded-[35px] flex-row items-center border ${isActive ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
  >
    <View className={`w-7 h-7 rounded-full items-center justify-center mr-4 ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
      <Text className={`text-[11px] font-black ${isActive ? 'text-white' : 'text-slate-400'}`}>{index + 1}</Text>
    </View>
    <Text className={`font-black text-[13px] uppercase tracking-wide ${isActive ? 'text-white' : 'text-slate-600'}`}>{phase}</Text>
  </Pressable>
));

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  // 1. STATE
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. DERIVED STATE (Define isAdmin early!)
  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

  // 3. DATA LOADING
  const loadDetails = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const storedUser = await AsyncStorage.getItem("userData");
      if (storedUser) setUser(JSON.parse(storedUser));
      
      if (!id) return;

      const res = await axios.get(`${API_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(res.data.project || res.data);
    } catch (e) {
      console.error("Fetch Error:", e.response?.data || e.message);
    } finally { 
      setLoading(false); 
    }
  }, [id]);

  useEffect(() => { loadDetails(); }, [loadDetails]);

  // 4. ACTIONS
  const updatePhase = async (uiPhase) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      // Update Project
      await axios.patch(`${API_URL}/projects/${id}`, 
        { status: uiPhase }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Log Milestone Task (Using the correct route from your project.routes.js)
      try {
        const targetStudentId = project?.projectHead?._id || project?.members?.[0]?._id;
        await axios.post(`${API_URL}/projects/${id}/tasks`, 
          { 
            title: `Phase Milestone: ${uiPhase}`, 
            description: `Project moved to ${uiPhase} phase.`,
            assignedTo: targetStudentId || user?._id,
          }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.warn("Task log failed:", err.response?.data || err.message);
      }

      Alert.alert("Success", `Project moved to ${uiPhase}`);
      loadDetails(); 
    } catch (e) {
      Alert.alert("Error", "Could not update phase.");
    }
  };

  const handleOpenChat = () => {
    const chatPartner = isAdmin ? project?.members?.[0] : project?.supervisor;
    if (!chatPartner) {
      Alert.alert("Chat Unavailable", "The other party is not assigned yet.");
      return;
    }
    router.push({
      pathname: "/personal-chat",
      params: { recipientId: chatPartner._id, recipientName: chatPartner.fullName }
    });
  };

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-slate-50">
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View className="bg-slate-900 px-6 pt-8 pb-12 rounded-b-[50px]">
            <View className="flex-row justify-between items-center mb-6">
              <Pressable onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
                <Ionicons name="arrow-back" size={20} color="white" />
              </Pressable>
              <View className="flex-row items-center bg-white/10 px-3 py-1 rounded-full">
                <Text className="text-white text-[10px] font-bold uppercase">{project?.status}</Text>
              </View>
            </View>
            <Text className="text-white text-3xl font-black mb-2 leading-tight">{project?.title}</Text>
            <Text className="text-slate-400 text-sm">{project?.description}</Text>
          </View>

          {/* TASK HISTORY */}
          <View className="px-6 -mt-6">
            <View className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
              <Text className="text-slate-900 font-black text-xl mb-8">Task History</Text>
              {project?.tasks?.length > 0 ? (
                [...project.tasks].reverse().map((task, idx) => (
                  <TaskItem key={task._id || idx} task={task} isLast={idx === project.tasks.length - 1} />
                ))
              ) : (
                <Text className="text-slate-400 text-center py-10">No tasks recorded.</Text>
              )}
            </View>
          </View>

          {/* ADMIN TIMELINE MANAGEMENT */}
          {isAdmin && (
            <View className="mt-10 mb-28">
              <Text className="px-8 text-slate-900 font-black text-lg mb-5">Manage Timeline</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                {UI_PHASES.map((phase, index) => (
                  <PhaseButton key={phase} phase={phase} index={index} isActive={project?.status === phase} onUpdate={updatePhase} />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* FLOATING CHAT BUTTON */}
        <Pressable onPress={handleOpenChat} className="absolute bottom-10 right-8 w-16 h-16 bg-indigo-600 rounded-[25px] items-center justify-center shadow-2xl">
          <Ionicons name="chatbubble-ellipses" size={28} color="white" />
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}