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
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch unassigned students
      const studentRes = await axios.get(`${API_URL}/users/superadmin/students`, { headers });
      
      // 2. Fetch all supervisors (Admins)
      const adminRes = await axios.get(`${API_URL}/users/superadmin/admins`, { headers });

      // Note: Backend uses 'fullName' in schema, ensure data mapping is correct
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setSupervisors(Array.isArray(adminRes.data) ? adminRes.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      Alert.alert("Error", "Could not load allocation data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssign = async (supervisor) => {
    // Basic capacity check
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
              
              // FIX: Match the backend 'authorize' parameters (studentId, supervisorId)
              await axios.post(`${API_URL}/users/authorize`, {
                studentId: selectedStudent._id,
                supervisorId: supervisor._id 
              }, { headers: { Authorization: `Bearer ${token}` } });

              Alert.alert("Success", "Supervisor assigned successfully.");
              setModalVisible(false);
              fetchAllData(); 
            } catch (error) {
              const msg = error.response?.data?.message || "Failed to assign supervisor.";
              Alert.alert("Error", msg);
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
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/10">
        <View>
          <Text className="text-[10px] font-black uppercase tracking-[3px] text-indigo-400">Super Admin</Text>
          <Text className="text-2xl font-black text-white">Allocation Portal</Text>
        </View>
        <Pressable onPress={() => router.replace("/profile")} className="bg-white/10 p-2 rounded-full">
          <Ionicons name="person-outline" size={20} color="white" />
        </Pressable>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAllData(); }} tintColor="#fff" />}
      >
        {/* STATS ROW */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-indigo-600 p-5 rounded-[25px]">
            <Text className="text-white/70 text-[10px] font-black uppercase tracking-widest">Pending</Text>
            <Text className="text-white text-3xl font-black mt-1">{students.length}</Text>
          </View>
          <View className="flex-1 bg-white/5 border border-white/5 p-5 rounded-[25px]">
            <Text className="text-white/50 text-[10px] font-black uppercase tracking-widest">Admins</Text>
            <Text className="text-white text-3xl font-black mt-1">{supervisors.length}</Text>
          </View>
        </View>

        <Text className="text-white text-lg font-bold mb-4">Unassigned Students</Text>

        {students.length === 0 ? (
           <View className="items-center py-20 bg-white/5 rounded-[30px] border border-dashed border-white/10">
             <Ionicons name="checkmark-done-circle-outline" size={64} color="#10b981" />
             <Text className="text-white font-bold mt-4">Queue is empty</Text>
             <Text className="text-slate-400 text-xs">All students have been assigned.</Text>
           </View>
        ) : (
          students.map((student) => (
            <View key={student._id} className="bg-white p-6 rounded-[30px] mb-4 shadow-xl">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 mr-2">
                  {/* FIX: Use fullName */}
                  <Text className="text-slate-900 text-xl font-black">{student.fullName}</Text>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    {student.department || "No Dept"} • {student.email}
                  </Text>
                </View>
                <View className="bg-red-50 px-3 py-1 rounded-full">
                  <Text className="text-red-500 text-[10px] font-black uppercase">Pending</Text>
                </View>
              </View>
              
              <View className="bg-slate-50 p-4 rounded-2xl mb-6">
                <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">Proposed Topic</Text>
                <Text className="text-slate-700 font-bold text-sm">
                  {student.projectInfo?.projectDescription || "No description provided"}
                </Text>
              </View>
              
              <Pressable 
                onPress={() => { setSelectedStudent(student); setModalVisible(true); }}
                className="bg-indigo-600 py-4 rounded-2xl items-center active:opacity-80"
              >
                <Text className="text-white font-black text-xs uppercase tracking-widest">Assign Supervisor</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* SUPERVISOR SELECTION MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-slate-50 h-[75%] rounded-t-[40px] overflow-hidden">
            <View className="px-8 py-6 border-b border-gray-200 flex-row justify-between items-center bg-white">
              <View>
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigning For</Text>
                <Text className="text-xl font-black text-slate-900">{selectedStudent?.fullName}</Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <Ionicons name="close" size={24} color="black" />
              </Pressable>
            </View>

            <FlatList
              data={supervisors}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 24 }}
              renderItem={({ item }) => (
                <Pressable 
                  onPress={() => handleAssign(item)}
                  className="p-5 mb-4 rounded-3xl bg-white border border-gray-100 shadow-sm active:bg-slate-100"
                >
                  <View className="flex-row justify-between items-center mb-2">
                    {/* FIX: Use fullName */}
                    <Text className="font-black text-lg text-slate-800">{item.fullName}</Text>
                    <View className="px-2 py-1 rounded-lg bg-indigo-50">
                      <Text className="text-[10px] font-black text-indigo-600 uppercase">
                        Load: {item.studentCount || 0}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-slate-500 font-medium text-sm">
                    {item.department} • {item.faculty}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}