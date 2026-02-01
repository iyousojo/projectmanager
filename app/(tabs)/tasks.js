import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TaskManagement() {
  const [isMounted, setIsMounted] = useState(false);
  
  // --- ROLE STATE ---
  const [isAdmin, setIsAdmin] = useState(true); // true = Supervisor, false = Student

  // --- DATA STATE ---
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  
  const [tasks, setTasks] = useState([
    { id: 101, studentId: "s1", title: "Chapter 1 Draft", description: "Focus on the problem statement and research questions.", status: "pending", deadline: "2026-03-15" }
  ]);
  
  const [history, setHistory] = useState([
    { id: 1, studentId: "s1", title: "Project Proposal", description: "Initial abstract approved by the board.", status: "approved", date: "2026-01-05" }
  ]);

  // Supervisor Form State
  const [taskForm, setTaskForm] = useState({ title: "", deadline: "", description: "" });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;

  // --- SHARED ACTIONS ---
  const handleAssignTask = () => {
    if (!taskForm.title || !taskForm.deadline || !taskForm.description) {
      return Alert.alert("Required", "All fields must be filled.");
    }
    const newTask = { 
        ...taskForm, 
        id: Date.now(), 
        studentId: selectedStudent.id, 
        status: "pending" 
    };
    setTasks([newTask, ...tasks]); 
    setTaskForm({ title: "", deadline: "", description: "" });
  };

  const updateStatus = (taskId, newStatus) => {
    if (newStatus === 'approved') {
      const task = tasks.find(t => t.id === taskId);
      setTasks(tasks.filter(tk => tk.id !== taskId));
      setHistory([{ ...task, status: 'approved', date: new Date().toLocaleDateString() }, ...history]);
    } else {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  // --- SHARED HISTORY COMPONENT ---
  const TaskHistorySection = ({ studentId }) => {
    const studentHistory = history.filter(h => h.studentId === studentId);
    return (
      <View className="mt-8">
        <Text className="text-xl font-bold mb-4">Task History</Text>
        {studentHistory.length === 0 ? (
          <Text className="text-gray-400 italic">No history available.</Text>
        ) : (
          studentHistory.map(item => (
            <Pressable 
              key={item.id} 
              onPress={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
              className="bg-white p-6 rounded-[30px] border border-gray-100 mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="font-bold text-gray-800">{item.title}</Text>
                  <Text className="text-gray-400 text-[9px] uppercase font-black">Completed: {item.date}</Text>
                </View>
                <Ionicons name={expandedHistoryId === item.id ? "chevron-up" : "chevron-down"} size={16} color="#cbd5e1" />
              </View>
              {expandedHistoryId === item.id && (
                <View className="mt-4 pt-4 border-t border-gray-50">
                  <Text className="text-gray-500 text-xs leading-5 italic">"{item.description}"</Text>
                </View>
              )}
            </Pressable>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* DEBUG SWITCHER */}
      <Pressable onPress={() => {setIsAdmin(!isAdmin); setSelectedStudent(null);}} className="bg-gray-100 p-2 items-center">
        <Text className="text-[10px] font-bold text-gray-400 uppercase">Viewing as: {isAdmin ? "ADMIN" : "STUDENT"}</Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* --- ADMIN / SUPERVISOR VIEW --- */}
        {isAdmin && (
          <View className="px-6 pt-6">
            {!selectedStudent ? (
              <>
                <Text className="text-2xl font-bold mb-6">Student Directory</Text>
                {[{id: "s1", name: "Sarah Chen"}].map(s => (
                  <Pressable key={s.id} onPress={() => setSelectedStudent(s)} className="bg-gray-50 p-6 rounded-[30px] flex-row items-center mb-4 border border-gray-100">
                    <View className="bg-blue-600 w-12 h-12 rounded-full items-center justify-center mr-4">
                      <Text className="text-white font-bold">{s.name[0]}</Text>
                    </View>
                    <Text className="flex-1 font-bold text-lg">{s.name}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                  </Pressable>
                ))}
              </>
            ) : (
              <View>
                <Pressable onPress={() => setSelectedStudent(null)} className="flex-row items-center mb-4">
                  <Ionicons name="arrow-back" size={18} />
                  <Text className="ml-2 font-bold text-gray-400">Back</Text>
                </Pressable>

                {/* STUDENT NAME AT THE TOP */}
                <Text className="text-3xl font-bold mb-6">{selectedStudent.name}</Text>

                {/* SUPERVISOR ADD TASK FORM */}
                <View className="bg-blue-600 p-8 rounded-[40px] mb-8 shadow-lg">
                  <Text className="text-white font-bold text-lg mb-4">New Requirement</Text>
                  <TextInput 
                    placeholder="Title" placeholderTextColor="#94a3b8"
                    className="bg-white p-4 rounded-2xl mb-2 font-bold"
                    value={taskForm.title} onChangeText={t => setTaskForm({...taskForm, title: t})}
                  />
                  <Pressable onPress={() => setShowPicker(true)} className="bg-white p-4 rounded-2xl mb-2">
                    <Text className="text-gray-400 font-bold text-xs">{taskForm.deadline || "Select Deadline"}</Text>
                  </Pressable>
                  <TextInput 
                    placeholder="Task description..." placeholderTextColor="#94a3b8"
                    multiline className="bg-white p-4 rounded-2xl mb-4 min-h-[80px]"
                    value={taskForm.description} onChangeText={t => setTaskForm({...taskForm, description: t})}
                  />
                  <Pressable onPress={handleAssignTask} className="bg-black py-5 rounded-[25px] items-center">
                    <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Assign Task</Text>
                  </Pressable>
                  {showPicker && <DateTimePicker value={new Date()} mode="date" onChange={(e, d) => {
                    setShowPicker(false);
                    if(d) setTaskForm({...taskForm, deadline: d.toISOString().split('T')[0]});
                  }} />}
                </View>

                {/* ACTIVE TASKS LIST FOR ADMIN */}
                <Text className="text-xl font-bold mb-4">Pending Approval</Text>
                {tasks.filter(t => t.studentId === selectedStudent.id).map(t => (
                  <View key={t.id} className="bg-gray-50 p-6 rounded-[30px] border border-gray-100 mb-4">
                    <Text className="font-bold text-blue-600">{t.title}</Text>
                    {t.status === 'completed' ? (
                      <Pressable onPress={() => updateStatus(t.id, 'approved')} className="bg-green-600 py-4 rounded-2xl items-center mt-4">
                        <Text className="text-white font-bold text-xs uppercase">Approve Now</Text>
                      </Pressable>
                    ) : (
                      <Text className="text-gray-400 text-[10px] mt-2 uppercase">Waiting for student...</Text>
                    )}
                  </View>
                ))}

                <TaskHistorySection studentId={selectedStudent.id} />
              </View>
            )}
          </View>
        )}

        {/* --- STUDENT VIEW --- */}
        {!isAdmin && (
          <View className="px-6 pt-8">
            <Text className="text-3xl font-bold mb-8">My Workspace</Text>
            
            <Text className="text-xl font-bold mb-4">Assigned Tasks</Text>
            {tasks.filter(t => t.studentId === "s1").map(t => (
              <View key={t.id} className="bg-black p-8 rounded-[40px] mb-6 shadow-xl">
                <Text className="text-blue-400 font-bold text-[10px] uppercase mb-1">Due: {t.deadline}</Text>
                <Text className="text-white text-2xl font-bold mb-4">{t.title}</Text>
                <View className="bg-white/10 p-5 rounded-3xl mb-6">
                  <Text className="text-gray-300 text-xs leading-5 italic">"{t.description}"</Text>
                </View>
                {t.status === 'pending' ? (
                  <Pressable onPress={() => updateStatus(t.id, 'completed')} className="bg-white py-5 rounded-[25px] items-center">
                    <Text className="text-black font-bold text-xs uppercase tracking-widest">Mark as Completed</Text>
                  </Pressable>
                ) : (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text className="text-blue-400 ml-2 font-bold text-[10px] uppercase">Reviewing by Admin...</Text>
                  </View>
                )}
              </View>
            ))}

            <TaskHistorySection studentId="s1" />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}