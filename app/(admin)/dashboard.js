import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        router.replace("/login");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      // FIX: Added ?status=unassigned to satisfy the Backend Controller logic
      const studentRes = await axios.get(`${API_URL}/users/superadmin/students?status=unassigned`, { headers });
      const adminRes = await axios.get(`${API_URL}/users/superadmin/admins`, { headers });

      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setSupervisors(Array.isArray(adminRes.data) ? adminRes.data : []);
    } catch (err) {
      console.error("Fetch error details:", err.response?.data || err.message);
      // Detailed alert helps debug if it's a validation error or auth error
      Alert.alert("Sync Error", err.response?.data?.message || "Could not load data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssign = async (supervisor) => {
    if (supervisor.studentCount >= 10) {
      Alert.alert("Capacity Reached", `${supervisor.fullName} is at full capacity.`);
      return;
    }

    Alert.alert(
      "Confirm Assignment",
      `Assign ${supervisor.fullName} to ${selectedStudent.fullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("userToken");
              await axios.post(`${API_URL}/users/authorize`, {
                studentId: selectedStudent._id,
                supervisorId: supervisor._id 
              }, { headers: { Authorization: `Bearer ${token}` } });

              Alert.alert("Success", "Allocation completed.");
              setModalVisible(false);
              fetchAllData(); 
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Assignment failed.");
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-white/50 mt-4 font-bold">Syncing Records...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
      {/* HEADER - Updated navigation to use push for a better stack feel */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/10">
        <View>
          <Text className="text-[10px] font-black uppercase tracking-[3px] text-indigo-400">Master Control</Text>
          <Text className="text-2xl font-black text-white">Allocation</Text>
        </View>
        <Pressable 
          onPress={() => router.push("/profile")} 
          className="bg-indigo-500/20 p-3 rounded-2xl active:bg-indigo-500/40"
        >
          <Ionicons name="person" size={20} color="#818cf8" />
        </Pressable>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6" 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAllData(); }} tintColor="#fff" />
        }
      >
        {/* STATS */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-indigo-600 p-5 rounded-[30px] shadow-lg shadow-indigo-500/20">
            <Text className="text-white/60 text-[10px] font-black uppercase tracking-widest">Pending</Text>
            <Text className="text-white text-3xl font-black">{students.length}</Text>
          </View>
          <View className="flex-1 bg-slate-800 p-5 rounded-[30px] border border-white/5">
            <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Admins</Text>
            <Text className="text-white text-3xl font-black">{supervisors.length}</Text>
          </View>
        </View>

        {/* LIST SECTION */}
        <Text className="text-white/30 text-[10px] font-black uppercase tracking-[2px] mb-4">Student Queue</Text>

        {students.length === 0 ? (
           <View className="items-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
             <Ionicons name="sparkles-outline" size={48} color="#475569" />
             <Text className="text-slate-400 font-bold mt-4">All Clear</Text>
           </View>
        ) : (
          students.map((student) => (
            <View key={student._id} className="bg-white p-6 rounded-[35px] mb-5">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1">
                  <Text className="text-slate-900 text-xl font-black">{student.fullName}</Text>
                  <Text className="text-slate-400 text-[10px] font-black uppercase">{student.email}</Text>
                </View>
                <View className="bg-amber-100 px-3 py-1 rounded-full">
                  <Text className="text-amber-600 text-[9px] font-black uppercase">Unassigned</Text>
                </View>
              </View>
              
              <Pressable 
                onPress={() => { setSelectedStudent(student); setModalVisible(true); }}
                className="bg-slate-900 py-4 rounded-2xl items-center active:opacity-90"
              >
                <Text className="text-white font-black text-xs uppercase tracking-widest">Assign Now</Text>
              </Pressable>
            </View>
          ))
        )}
        <View className="h-10" />
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-slate-950/90 justify-end">
          <View className="bg-slate-100 h-[80%] rounded-t-[50px] overflow-hidden">
            <View className="p-8 flex-row justify-between items-center bg-white border-b border-slate-100">
              <Text className="text-xl font-black text-slate-900">Select Supervisor</Text>
              <Pressable onPress={() => setModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                <Ionicons name="close" size={20} color="black" />
              </Pressable>
            </View>

            <FlatList
              data={supervisors}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 24 }}
              renderItem={({ item }) => (
                <Pressable 
                  onPress={() => handleAssign(item)}
                  className="p-6 mb-4 rounded-[30px] bg-white border border-slate-100 shadow-sm active:bg-indigo-50"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="font-black text-lg text-slate-800">{item.fullName}</Text>
                    <Text className="text-indigo-600 font-black text-xs">{item.studentCount || 0}/10</Text>
                  </View>
                  <Text className="text-slate-400 text-xs mt-1">{item.department}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}