import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function PersonalProjectPage() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // --- STATE ---
  const [project, setProject] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  
  const [availableStudents, setAvailableStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userData = JSON.parse(await AsyncStorage.getItem("userData"));
      setIsAdmin(userData?.role === 'admin' || userData?.role === 'super-admin');

      // 1. Get Project Details
      const res = await axios.get(`${API_URL}/projects/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(res.data);

      // 2. If Admin, load students for potential grouping
      if (userData?.role === 'admin') {
        const studentRes = await axios.get(`${API_URL}/users/superadmin/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAvailableStudents(studentRes.data);
      }
    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- ACTIONS ---
  const handleAdminApproval = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(`${API_URL}/projects/${params.id}`, 
        { status: 'active' }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      Alert.alert("Success", "Project Approved.");
      loadInitialData();
    } catch (e) {
      Alert.alert("Error", "Approval failed.");
    }
  };

  const handleSubmitWork = async () => {
    if (!submissionText.trim()) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.post(`${API_URL}/tasks`, {
        projectId: params.id,
        title: `Submission for ${project.currentStage || 'Current Phase'}`,
        description: submissionText
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      Alert.alert("Sent", "Your work has been submitted for review.");
      setSubmissionText("");
    } catch (e) {
      Alert.alert("Error", "Submission failed.");
    }
  };

  const finalizeGroupConversion = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(`${API_URL}/projects/${params.id}/group`, {
        memberIds: assignedStudents.map(s => s._id)
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      setShowAssignModal(false);
      router.push("/group-workspace");
    } catch (e) {
      Alert.alert("Error", "Could not form group.");
    }
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator color="#6366f1" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView 
        className="px-6 pt-6" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInitialData} />}
      >
        {/* TITLE SECTION */}
        <View className="mb-6">
          <Text className="text-3xl font-black tracking-tighter text-gray-900 leading-tight">
            {project?.title || params.title}
          </Text>
          <View className="flex-row items-center mt-2">
            <View className={`px-2 py-1 rounded-md mr-2 ${project?.status === 'active' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              <Text className={`text-[9px] font-black uppercase ${project?.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {project?.status || 'Pending'}
              </Text>
            </View>
            <Text className="text-gray-400 font-bold text-xs">Lead: {project?.student?.name || "Assigning..."}</Text>
          </View>
        </View>

        {/* ADMIN GOVERNANCE */}
        {isAdmin && project?.status !== 'active' && (
          <View className="bg-indigo-600 p-6 rounded-[35px] mb-8 shadow-xl">
            <Text className="text-white font-black text-[10px] uppercase mb-4 tracking-widest text-center">Review Phase</Text>
            <View className="flex-row gap-3">
              <Pressable onPress={handleAdminApproval} className="flex-1 bg-white py-4 rounded-2xl items-center">
                <Text className="text-indigo-600 font-black text-[10px] uppercase">Approve Project</Text>
              </Pressable>
              <Pressable onPress={() => setShowAssignModal(true)} className="flex-1 bg-black/20 py-4 rounded-2xl items-center border border-white/20">
                <Text className="text-white font-black text-[10px] uppercase">Assign Team</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* DESCRIPTION */}
        <View className="mb-8">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Project Scope</Text>
          <View className="bg-gray-50 p-6 rounded-[35px] border border-gray-100">
            <Text className="text-gray-700 text-sm leading-6">
              {project?.description || "No description provided for this research project."}
            </Text>
          </View>
        </View>

        {/* SUBMISSION AREA */}
        <View className="mb-20">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Deliverables</Text>
          <View className="bg-gray-100 rounded-[35px] p-6 border border-gray-200">
            <TextInput 
              placeholder={project?.status === 'active' ? "Describe your current progress..." : "Locked until approval..."}
              multiline
              editable={project?.status === 'active'}
              value={submissionText}
              onChangeText={setSubmissionText}
              className="text-gray-800 text-sm mb-6 min-h-[100]"
              style={{ textAlignVertical: 'top' }}
            />
            <Pressable 
              onPress={handleSubmitWork}
              className={`py-5 rounded-2xl items-center ${project?.status === 'active' ? 'bg-indigo-600 shadow-lg' : 'bg-gray-300'}`}
              disabled={project?.status !== 'active'}
            >
              <Text className="text-white font-black uppercase text-[10px] tracking-widest">
                {project?.status === 'active' ? 'Submit Progress' : 'Workspace Locked'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* --- MODAL FOR TEAM ASSIGNMENT --- */}
      <Modal visible={showAssignModal} animationType="slide" presentationStyle="pageSheet">
        {/* Reuse your existing Modal UI but ensure toggleStudentAssignment uses _id */}
        {/* ... (Modal code remains largely the same, just ensure it uses project._id) */}
      </Modal>
    </SafeAreaView>
  );
}