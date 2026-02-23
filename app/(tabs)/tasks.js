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

      // Branching logic based on role
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
      const res = await axios.get(`${API_URL}/tasks/user/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let allTasks = Array.isArray(res.data) ? res.data : (res.data.tasks || res.data.data || []);

      // Filter tasks into Active and Completed (History)
      setTasks(allTasks.filter(t => t.status !== 'Approved'));
      setHistory(allTasks.filter(t => t.status === 'Approved'));
    } catch (err) {
      console.error("Fetch Error:", err.message);
    }
  };

  const handleAssignPhase = async () => {
    if (!taskForm.deadline || !taskForm.description) {
      return Alert.alert("Required", "Please provide a description and deadline.");
    }

    const projectId = selectedStudent.project?._id || selectedStudent.project || selectedStudent.projectId;
    
    if (!projectId) {
      return Alert.alert("Error", "Student must have an active project assigned first.");
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
      
      Alert.alert("Success", `${phaseTitle} has been deployed to the student.`);
      setTaskForm({ deadline: "", description: "" });
      fetchTasks(selectedStudent._id); 
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Check student project status.");
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
      Alert.alert("Action Failed", "Could not update task status.");
    }
  };

  // --- REFINED HISTORY COMPONENT ---
  const TaskHistorySection = () => (
    <View className="mt-8 mb-20">
      <View className="flex-row items-center mb-6">
        <View className="w-1.5 h-6 bg-slate-200 rounded-full mr-3" />
        <Text className="text-xl font-black text-slate-900">Milestone History</Text>
      </View>
      
      {history.length === 0 ? (
        <View className="bg-slate-50 p-8 rounded-[30px] border border-dashed border-slate-200 items-center">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">No completed phases</Text>
        </View>
      ) : (
        history.sort((a,b) => b.title.localeCompare(a.title)).map((item, index) => (
          <Pressable 
            key={item._id} 
            onPress={() => setExpandedHistoryId(expandedHistoryId === item._id ? null : item._id)}
            className="bg-white p-6 rounded-[30px] border border-slate-100 mb-3 shadow-sm"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center flex-1">
                <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mr-3">
                  <Ionicons name="checkmark-done" size={16} color="#10b981" />
                </View>
                <View>
                  <Text className="font-bold text-slate-800 text-base">{item.title}</Text>
                  <Text className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter">Verified Milestone</Text>
                </View>
              </View>
              <Ionicons name={expandedHistoryId === item._id ? "chevron-up" : "chevron-down"} size={16} color="#cbd5e1" />
            </View>
            {expandedHistoryId === item._id && (
              <View className="mt-4 pt-4 border-t border-slate-50">
                <Text className="text-slate-500 text-xs leading-5 italic">"{item.description}"</Text>
              </View>
            )}
          </Pressable>
        ))
      )}
    </View>
  );

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInitialData} tintColor="#6366f1" />}
        >
          {/* --- ADMIN / SUPER-ADMIN VIEW --- */}
          {(user?.role === 'admin' || user?.role === 'super-admin') ? (
            <View className="px-6 pt-6">
              {!selectedStudent ? (
                <>
                  <Text className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">Supervisor Portal</Text>
                  <Text className="text-3xl font-black text-slate-900 mb-8">Select Student</Text>
                  {students.map(s => (
                    <Pressable key={s._id} onPress={() => { setSelectedStudent(s); fetchTasks(s._id); }} className="bg-slate-50 p-5 rounded-[30px] flex-row items-center mb-4 border border-slate-100 active:bg-slate-100">
                      <View className="bg-indigo-600 w-12 h-12 rounded-2xl items-center justify-center mr-4">
                        <Text className="text-white font-black text-lg">{s.fullName ? s.fullName[0] : 'S'}</Text>
                      </View>
                      <View className="flex-1">
                          <Text className="font-bold text-lg text-slate-800">{s.fullName}</Text>
                          <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">{s.department || "Academic Student"}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </Pressable>
                  ))}
                </>
              ) : (
                <View>
                  <Pressable onPress={() => { setSelectedStudent(null); setTasks([]); setHistory([]); }} className="flex-row items-center mb-6 bg-slate-100 self-start px-4 py-2 rounded-full">
                    <Ionicons name="arrow-back" size={16} color="#475569" />
                    <Text className="ml-2 font-bold text-slate-600 text-xs">All Students</Text>
                  </Pressable>
                  
                  <Text className="text-3xl font-black text-slate-900 mb-6">{selectedStudent.fullName}</Text>
                  
                  {/* Phase Deployment Card */}
                  <View className="bg-slate-900 p-8 rounded-[40px] mb-8 shadow-2xl">
                    <View className="mb-6">
                        <Text className="text-indigo-400 font-black uppercase text-[10px] mb-1 tracking-widest">Assign Next Milestone</Text>
                        <Text className="text-white text-2xl font-bold">Phase {history.length + tasks.length + 1}</Text>
                    </View>
                    
                    <Pressable onPress={() => setShowPicker(true)} className="bg-white/10 p-4 rounded-2xl mb-4 flex-row items-center">
                        <Ionicons name="calendar-outline" size={18} color="white" className="mr-3" />
                        <Text className="text-white font-bold ml-2">
                          {taskForm.deadline ? `Due: ${taskForm.deadline}` : "Set Completion Deadline"}
                        </Text>
                    </Pressable>

                    <TextInput 
                      placeholder="Phase requirements and instructions..." 
                      placeholderTextColor="#94a3b8" 
                      multiline 
                      className="text-white bg-white/5 p-4 rounded-2xl min-h-[100px] mb-6 text-sm" 
                      value={taskForm.description} 
                      onChangeText={t => setTaskForm({...taskForm, description: t})} 
                    />

                    <Pressable onPress={handleAssignPhase} className="bg-indigo-500 p-4 rounded-2xl items-center shadow-lg active:bg-indigo-600">
                      <Text className="text-white font-black uppercase tracking-widest">Deploy Phase</Text>
                    </Pressable>

                    {showPicker && (
                      <DateTimePicker 
                        value={new Date()} 
                        mode="date" 
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(e, d) => { 
                          setShowPicker(false); 
                          if(d) setTaskForm({...taskForm, deadline: d.toISOString().split('T')[0]}); 
                        }} 
                      />
                    )}
                  </View>

                  <Text className="text-xl font-black mb-4 text-slate-900">Active Phases</Text>
                  {tasks.length === 0 && (
                    <View className="p-10 items-center">
                      <Ionicons name="hourglass-outline" size={32} color="#cbd5e1" />
                      <Text className="text-slate-400 italic mt-2 text-center text-xs">Waiting for deployment.</Text>
                    </View>
                  )}
                  {tasks.map(t => (
                    <View key={t._id} className="bg-white p-6 rounded-[30px] mb-4 border border-slate-100 shadow-sm">
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="font-black text-slate-800 text-xl">{t.title}</Text>
                        <View className={`px-2 py-1 rounded-md ${t.status === 'Submitted' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                          <Text className={`text-[8px] font-black uppercase ${t.status === 'Submitted' ? 'text-amber-700' : 'text-slate-400'}`}>
                            {t.status}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-slate-500 text-xs mb-6 leading-5">{t.description}</Text>
                      {t.status === 'Submitted' ? (
                        <Pressable onPress={() => updateStatus(t._id, 'approve')} className="bg-emerald-500 p-4 rounded-2xl items-center shadow-md">
                          <Text className="text-white font-black uppercase tracking-widest text-xs">Verify & Approve Milestone</Text>
                        </Pressable>
                      ) : (
                        <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-row items-center justify-center">
                          <ActivityIndicator size="small" color="#94a3b8" className="mr-3" />
                          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">Student Working...</Text>
                        </View>
                      )}
                    </View>
                  ))}
                  <TaskHistorySection />
                </View>
              )}
            </View>
          ) : (
            /* --- STUDENT VIEW --- */
            <View className="px-6 pt-8">
              <Text className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">My Dashboard</Text>
              <Text className="text-3xl font-black mb-8 text-slate-900">Project Timeline</Text>
              
              {tasks.length === 0 && (
                <View className="bg-indigo-50 p-10 rounded-[40px] items-center border border-indigo-100">
                  <Ionicons name="rocket-outline" size={40} color="#6366f1" />
                  <Text className="text-indigo-900 font-bold mt-4 text-center">No Active Phases</Text>
                  <Text className="text-indigo-400 text-center text-xs mt-1">Your supervisor hasn't deployed a new milestone yet.</Text>
                </View>
              )}

              {tasks.map(t => (
                  <View key={t._id} className="bg-slate-900 p-8 rounded-[40px] mb-6 shadow-xl">
                    <View className="flex-row justify-between items-start mb-4">
                      <View>
                        <Text className="text-indigo-400 font-black uppercase text-[10px] mb-1 tracking-widest">Current Action</Text>
                        <Text className="text-white text-3xl font-black">{t.title}</Text>
                      </View>
                      <Ionicons name="flash" size={24} color="#6366f1" />
                    </View>
                    
                    <Text className="text-slate-400 mb-8 text-sm leading-6">{t.description}</Text>
                    
                    {t.status === 'Pending' ? (
                      <Pressable onPress={() => updateStatus(t._id, 'submit')} className="bg-white p-5 rounded-2xl items-center shadow-lg active:bg-slate-100">
                        <Text className="font-black text-slate-900 uppercase text-xs tracking-[1px]">Submit Milestone for Review</Text>
                      </Pressable>
                    ) : (
                      <View className="bg-white/10 p-5 rounded-2xl border border-white/10 flex-row items-center justify-center">
                        <Ionicons name="time-outline" size={18} color="#a5b4fc" className="mr-3" />
                        <Text className="text-indigo-300 font-bold ml-2">Awaiting Supervisor Verification</Text>
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