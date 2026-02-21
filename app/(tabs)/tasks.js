import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  
  const [taskForm, setTaskForm] = useState({ deadline: "", description: "" });
  const [showPicker, setShowPicker] = useState(false);

  const loadInitialData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const profileRes = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const freshUser = profileRes.data;
      setUser(freshUser);

      if (freshUser.role === 'admin' || freshUser.role === 'super-admin') {
        await fetchStudents(token, freshUser.role);
      } else {
        await fetchTasks(freshUser._id, token);
      }
    } catch (err) {
      console.error("Sync Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const fetchStudents = async (token, role) => {
    try {
      const endpoint = role === 'super-admin' ? "/users/superadmin/students" : "/users/my-students";
      const res = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { setStudents([]); }
  };

  const fetchTasks = async (studentId, providedToken = null) => {
    if (!studentId) return;
    try {
      const token = providedToken || await AsyncStorage.getItem("userToken");
      console.log(`[DEBUG] Fetching tasks for studentId: ${studentId}`);
      
      const res = await axios.get(`${API_URL}/tasks/user/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("[DEBUG] API Response:", JSON.stringify(res.data, null, 2));

      let allTasks = Array.isArray(res.data) ? res.data : (res.data.tasks || res.data.data || []);

      setTasks(allTasks.filter(t => t.status !== 'Approved'));
      setHistory(allTasks.filter(t => t.status === 'Approved'));
    } catch (err) {
      console.error("[DEBUG] Fetch Error:", err.response?.data || err.message);
    }
  };

  const handleAssignPhase = async () => {
    if (!taskForm.deadline || !taskForm.description) {
      return Alert.alert("Required", "Please provide a description and deadline.");
    }

    const projectId = selectedStudent.project?._id || selectedStudent.project || selectedStudent.projectId;
    
    if (!projectId) {
      return Alert.alert("Error", "Student must have a project assigned first.");
    }

    const nextPhaseNumber = history.length + tasks.length + 1;
    const phaseTitle = `Phase ${nextPhaseNumber}`;

    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.post(`${API_URL}/tasks/project/${projectId}`, {
        title: phaseTitle, 
        description: taskForm.description,
        dueDate: taskForm.deadline, 
        assignedTo: selectedStudent._id,
        project: projectId
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      Alert.alert("Success", `${phaseTitle} deployed!`);
      setTaskForm({ deadline: "", description: "" });
      fetchTasks(selectedStudent._id); 
    } catch (err) {
      Alert.alert("Notice", err.response?.data?.message || "Check student project status.");
    }
  };

  const updateStatus = async (taskId, endpoint) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(`${API_URL}/tasks/${taskId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const targetId = (user.role === 'admin' || user.role === 'super-admin') ? selectedStudent._id : user._id;
      fetchTasks(targetId); 
    } catch (err) {
      Alert.alert("Failed", "Action could not be completed.");
    }
  };

  const TaskHistorySection = () => (
    <View className="mt-8 mb-10">
      <Text className="text-xl font-black mb-4 text-slate-900">Project History</Text>
      {history.sort((a,b) => b.title.localeCompare(a.title)).map(item => (
        <Pressable 
          key={item._id} 
          onPress={() => setExpandedHistoryId(expandedHistoryId === item._id ? null : item._id)}
          className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 mb-3"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="font-bold text-slate-800 text-lg">{item.title}</Text>
              <View className="bg-emerald-100 px-2 py-0.5 rounded-md mt-1 self-start">
                  <Text className="text-emerald-700 text-[8px] uppercase font-black">Phase Completed</Text>
              </View>
            </View>
            <Ionicons name={expandedHistoryId === item._id ? "chevron-up" : "chevron-down"} size={16} color="#cbd5e1" />
          </View>
          {expandedHistoryId === item._id && (
            <View className="mt-4 pt-4 border-t border-slate-200">
              <Text className="text-slate-500 text-xs leading-5 italic">"{item.description}"</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );

  if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInitialData} />}
        >
          {(user?.role === 'admin' || user?.role === 'super-admin') ? (
            <View className="px-6 pt-6">
              {!selectedStudent ? (
                <>
                  <Text className="text-3xl font-black text-slate-900 mb-2">Project Phases</Text>
                  <Text className="text-slate-400 text-xs mb-8">Select a student to manage their current phase.</Text>
                  {students.map(s => (
                    <Pressable key={s._id} onPress={() => { setSelectedStudent(s); fetchTasks(s._id); }} className="bg-slate-50 p-5 rounded-[30px] flex-row items-center mb-4 border border-slate-100">
                      <View className="bg-indigo-600 w-12 h-12 rounded-2xl items-center justify-center mr-4">
                        <Text className="text-white font-black text-lg">{s.fullName ? s.fullName[0] : 'S'}</Text>
                      </View>
                      <View className="flex-1">
                          <Text className="font-bold text-lg text-slate-800">{s.fullName}</Text>
                          <Text className="text-slate-400 text-[10px] uppercase font-bold">{s.department || "Student"}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </Pressable>
                  ))}
                </>
              ) : (
                <View>
                  <Pressable onPress={() => { setSelectedStudent(null); setTasks([]); setHistory([]); }} className="flex-row items-center mb-6">
                    <Ionicons name="arrow-back" size={20} color="#475569" />
                    <Text className="ml-2 font-bold text-slate-600">Back</Text>
                  </Pressable>
                  
                  <Text className="text-3xl font-black text-slate-900 mb-6">{selectedStudent.fullName}</Text>
                  
                  <View className="bg-slate-900 p-8 rounded-[40px] mb-8 shadow-2xl">
                    <View className="mb-6">
                        <Text className="text-indigo-400 font-black uppercase text-[10px] mb-1">Upcoming Milestone</Text>
                        <Text className="text-white text-2xl font-bold">Phase {history.length + tasks.length + 1}</Text>
                    </View>
                    
                    <Pressable onPress={() => setShowPicker(true)} className="bg-white/10 p-4 rounded-2xl mb-4">
                        <Text className="text-white font-bold">{taskForm.deadline ? `Deadline: ${taskForm.deadline}` : "Select Completion Date"}</Text>
                    </Pressable>
                    <TextInput placeholder="Phase requirements..." placeholderTextColor="#94a3b8" multiline className="text-white bg-white/5 p-4 rounded-2xl min-h-[80px] mb-6" value={taskForm.description} onChangeText={t => setTaskForm({...taskForm, description: t})} />
                    <Pressable onPress={handleAssignPhase} className="bg-indigo-500 p-4 rounded-2xl items-center shadow-lg"><Text className="text-white font-black uppercase">Deploy Phase</Text></Pressable>
                    {showPicker && <DateTimePicker value={new Date()} mode="date" onChange={(e, d) => { setShowPicker(false); if(d) setTaskForm({...taskForm, deadline: d.toISOString().split('T')[0]}); }} />}
                  </View>

                  <Text className="text-xl font-black mb-4 text-slate-900">Active Phase</Text>
                  {tasks.length === 0 && <Text className="text-slate-400 italic mb-4 text-xs">Waiting for next phase deployment.</Text>}
                  {tasks.map(t => (
                    <View key={t._id} className="bg-white p-6 rounded-[30px] mb-4 border border-slate-100 shadow-sm">
                      <Text className="font-bold text-slate-800 text-xl mb-1">{t.title}</Text>
                      <Text className="text-slate-500 text-xs mb-4">{t.description}</Text>
                      {t.status === 'Submitted' ? (
                        <Pressable onPress={() => updateStatus(t._id, 'approve')} className="bg-emerald-500 p-4 rounded-2xl items-center"><Text className="text-white font-black">Verify & Approve Phase</Text></Pressable>
                      ) : <View className="bg-amber-100 p-3 rounded-xl"><Text className="text-amber-700 text-center text-[10px] font-black uppercase">Awaiting Student Work</Text></View>}
                    </View>
                  ))}
                  <TaskHistorySection />
                </View>
              )}
            </View>
          ) : (
            <View className="px-6 pt-8">
              <Text className="text-3xl font-black mb-8 text-slate-900">My Project Phases</Text>
              {tasks.length === 0 && <Text className="text-slate-400 italic">No phases active. Contact your supervisor.</Text>}
              {tasks.map(t => (
                  <View key={t._id} className="bg-slate-900 p-8 rounded-[40px] mb-6 shadow-xl">
                    <Text className="text-white text-3xl font-black mb-2">{t.title}</Text>
                    <Text className="text-slate-400 mb-6 text-sm">{t.description}</Text>
                    {t.status === 'Pending' ? (
                      <Pressable onPress={() => updateStatus(t._id, 'submit')} className="bg-white p-4 rounded-2xl items-center"><Text className="font-black text-slate-900 uppercase text-xs">Submit Phase for Review</Text></Pressable>
                    ) : (
                      <View className="bg-white/10 p-4 rounded-2xl border border-white/10">
                        <Text className="text-indigo-300 text-center font-bold">Awaiting Verification</Text>
                      </View>
                    )}
                  </View>
              ))}
              <TaskHistorySection />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}