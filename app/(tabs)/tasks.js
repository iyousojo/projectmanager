import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function TaskManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: "", deadline: "", description: "" });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) return;
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (parsedUser.role === 'admin' || parsedUser.role === 'super-admin') {
        await fetchStudents();
      } else {
        await fetchTasks(parsedUser._id); 
      }
    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await axios.get(`${API_URL}/users/my-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Fetch Students Error", err);
    }
  };

  const fetchTasks = async (studentId) => {
    if (!studentId) return;
    const token = await AsyncStorage.getItem("userToken");
    try {
      const res = await axios.get(`${API_URL}/tasks/user/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTasks = res.data || [];
      setTasks(allTasks.filter(t => t.status !== 'Approved'));
      setHistory(allTasks.filter(t => t.status === 'Approved'));
    } catch (err) {
      console.error("Fetch Tasks Error:", err);
    }
  };

  const handleAssignTask = async () => {
    if (!taskForm.title || !taskForm.deadline || !taskForm.description) {
      return Alert.alert("Required", "Please fill all fields.");
    }
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.post(`${API_URL}/tasks`, {
        ...taskForm,
        assignedTo: selectedStudent._id
      }, { headers: { Authorization: `Bearer ${token}` }});
      Alert.alert("Success", "Task assigned!");
      setTaskForm({ title: "", deadline: "", description: "" });
      fetchTasks(selectedStudent._id);
    } catch (err) {
      Alert.alert("Error", "Could not assign task.");
    }
  };

  const updateStatus = async (taskId, endpoint) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await axios.put(`${API_URL}/tasks/${taskId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", res.data.message || "Status Updated");
      const targetId = (user.role === 'admin' || user.role === 'super-admin') ? selectedStudent._id : user._id;
      fetchTasks(targetId);
    } catch (err) {
      Alert.alert("Failed", err.response?.data?.message || "Action failed");
    }
  };

  const TaskHistorySection = () => (
    <View className="mt-8">
      <Text className="text-xl font-bold mb-4 text-slate-800">Completed Journey</Text>
      {history.length === 0 ? (
        <Text className="text-gray-400 italic text-xs px-2">No approved tasks yet.</Text>
      ) : (
        history.map(item => (
          <Pressable 
            key={item._id} 
            onPress={() => setExpandedHistoryId(expandedHistoryId === item._id ? null : item._id)}
            className="bg-white p-6 rounded-[30px] border border-gray-100 mb-3 shadow-sm"
          >
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="font-bold text-gray-800">{item.title}</Text>
                <View className="bg-emerald-100 px-2 py-0.5 rounded-md mt-1 self-start">
                    <Text className="text-emerald-700 text-[8px] uppercase font-black">Approved</Text>
                </View>
              </View>
              <Ionicons name={expandedHistoryId === item._id ? "chevron-up" : "chevron-down"} size={16} color="#cbd5e1" />
            </View>
            {expandedHistoryId === item._id && (
              <View className="mt-4 pt-4 border-t border-gray-50">
                <Text className="text-gray-500 text-xs leading-5 italic">"{item.description}"</Text>
              </View>
            )}
          </Pressable>
        ))
      )}
    </View>
  );

  if (loading) return <View className="flex-1 justify-center bg-white"><ActivityIndicator color="#6366f1" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInitialData} />}>
        {(user?.role === 'admin' || user?.role === 'super-admin') ? (
          <View className="px-6 pt-6">
            {!selectedStudent ? (
              <>
                <Text className="text-2xl font-bold mb-6">Student Directory</Text>
                {students.map(s => (
                  <Pressable key={s._id} onPress={() => { setSelectedStudent(s); fetchTasks(s._id); }} className="bg-gray-50 p-6 rounded-[30px] flex-row items-center mb-4 border border-gray-100">
                    <View className="bg-indigo-600 w-12 h-12 rounded-full items-center justify-center mr-4">
                      <Text className="text-white font-bold">{s.fullName ? s.fullName[0] : 'S'}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="font-bold text-lg text-slate-800">{s.fullName}</Text>
                        <Text className="text-gray-400 text-xs">{s.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                  </Pressable>
                ))}
              </>
            ) : (
              <View>
                <Pressable onPress={() => { setSelectedStudent(null); setTasks([]); setHistory([]); }} className="flex-row items-center mb-4">
                  <Ionicons name="arrow-back" size={18} color="#94a3b8" />
                  <Text className="ml-2 font-bold text-gray-400 uppercase text-[10px]">Back</Text>
                </Pressable>
                <Text className="text-3xl font-black text-slate-900 mb-6">{selectedStudent.fullName}</Text>
                <View className="bg-indigo-600 p-8 rounded-[40px] mb-8">
                  <TextInput placeholder="Task Title" placeholderTextColor="#a5b4fc" className="text-white mb-2 border-b border-white/20 p-2" value={taskForm.title} onChangeText={t => setTaskForm({...taskForm, title: t})} />
                  <Pressable onPress={() => setShowPicker(true)} className="p-2"><Text className="text-white">{taskForm.deadline || "Select Deadline"}</Text></Pressable>
                  <TextInput placeholder="Description" placeholderTextColor="#a5b4fc" multiline className="text-white mt-2 p-2" value={taskForm.description} onChangeText={t => setTaskForm({...taskForm, description: t})} />
                  <Pressable onPress={handleAssignTask} className="bg-white mt-4 p-4 rounded-xl items-center"><Text className="text-indigo-600 font-bold">Assign Task</Text></Pressable>
                  {showPicker && <DateTimePicker value={new Date()} mode="date" onChange={(e, d) => { setShowPicker(false); if(d) setTaskForm({...taskForm, deadline: d.toISOString().split('T')[0]}); }} />}
                </View>
                {tasks.map(t => (
                  <View key={t._id} className="bg-gray-50 p-6 rounded-[30px] mb-4">
                    <Text className="font-bold">{t.title}</Text>
                    {t.status === 'Submitted' ? (
                      <Pressable onPress={() => updateStatus(t._id, 'approve')} className="bg-emerald-500 p-3 rounded-xl mt-2 items-center"><Text className="text-white">Approve</Text></Pressable>
                    ) : <Text className="text-amber-600 text-[10px] mt-1 italic">Pending Student...</Text>}
                  </View>
                ))}
                <TaskHistorySection />
              </View>
            )}
          </View>
        ) : (
          <View className="px-6 pt-8">
            <Text className="text-3xl font-black mb-8">My Tasks</Text>
            {tasks.map(t => (
                <View key={t._id} className="bg-slate-900 p-8 rounded-[40px] mb-6">
                  <Text className="text-white text-2xl font-bold">{t.title}</Text>
                  <Text className="text-slate-400 mb-4">{t.description}</Text>
                  {t.status === 'Pending' ? (
                    <Pressable onPress={() => updateStatus(t._id, 'submit')} className="bg-white p-4 rounded-xl items-center"><Text className="font-bold">Submit Task</Text></Pressable>
                  ) : <Text className="text-indigo-400 text-center">Under Review</Text>}
                </View>
            ))}
            <TaskHistorySection />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}