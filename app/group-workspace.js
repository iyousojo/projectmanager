import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal,
  Platform, Pressable, ScrollView,
  StyleSheet,
  Text, TextInput, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function GroupWorkspace() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const scrollViewRef = useRef();

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      const storedUser = await AsyncStorage.getItem("userData") || await AsyncStorage.getItem("user");
      
      if (!token) { router.replace("/login"); return; }
      setUser(JSON.parse(storedUser || "{}"));

      const [pRes, cRes, tRes] = await Promise.allSettled([
        axios.get(`${API_URL}/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/chat/${id}?isProject=true`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/tasks/project/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (pRes.status === "fulfilled") setProject(pRes.value.data.project || pRes.value.data);
      if (cRes.status === "fulfilled") setMessages(cRes.value.data.chat || cRes.value.data || []);
      if (tRes.status === "fulfilled") setTasks(tRes.value.data.tasks || tRes.value.data || []);

    } catch (e) {
      console.error("Load Error:", e.message);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const currentUserId = String(user?._id || user?.id);
  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const isProjectHead = String(project?.projectHead?._id || project?.projectHead) === currentUserId;

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await axios.post(`${API_URL}/chat`, {
        projectId: id,
        message: newMessage.trim(),
        senderRole: user?.role
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.data.chat) {
        setMessages(prev => [...prev, res.data.chat]);
        setNewMessage("");
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) { 
      Alert.alert("Error", "Message failed to send."); 
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      const headId = project?.projectHead?._id || project?.projectHead;
      await axios.post(`${API_URL}/tasks/project/${id}`, {
        title: taskTitle,
        description: taskDesc,
        assignedTo: headId,
        status: "pending"
      }, { headers: { Authorization: `Bearer ${token}` } });
      setTaskModalVisible(false);
      setTaskTitle("");
      setTaskDesc("");
      loadData();
    } catch (e) { Alert.alert("Error", "Task creation failed."); }
  };

  const updateTaskStatus = async (taskId, action) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const ep = action === 'submit' ? 'submit' : 'approve';
      await axios.put(`${API_URL}/tasks/${taskId}/${ep}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      loadData();
    } catch (e) { Alert.alert("Error", "Update failed."); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#1e293b" />
          </Pressable>
          <View className="items-center flex-1">
            <Text className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Workspace</Text>
            <Text className="font-bold text-slate-900 text-lg" numberOfLines={1}>{project?.title}</Text>
          </View>
          <Pressable onPress={() => loadData()} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color="#6366f1" />
          </Pressable>
        </View>

        {/* TAB NAVIGATION */}
        <View className="flex-row px-6 my-4">
          <View className="flex-row flex-1 bg-slate-100 p-1.5 rounded-[20px]">
            <Pressable 
              onPress={() => setActiveTab("chat")} 
              className={`flex-1 py-3 rounded-[15px] flex-row items-center justify-center ${activeTab === 'chat' ? 'bg-white shadow-sm' : ''}`}
            >
              <Ionicons name="chatbox-ellipses" size={16} color={activeTab === 'chat' ? '#6366f1' : '#94a3b8'} />
              <Text className={`ml-2 font-black text-[11px] uppercase tracking-tighter ${activeTab === 'chat' ? 'text-indigo-600' : 'text-slate-500'}`}>Chat</Text>
            </Pressable>
            <Pressable 
              onPress={() => setActiveTab("tasks")} 
              className={`flex-1 py-3 rounded-[15px] flex-row items-center justify-center ${activeTab === 'tasks' ? 'bg-white shadow-sm' : ''}`}
            >
              <Ionicons name="list" size={16} color={activeTab === 'tasks' ? '#6366f1' : '#94a3b8'} />
              <Text className={`ml-2 font-black text-[11px] uppercase tracking-tighter ${activeTab === 'tasks' ? 'text-indigo-600' : 'text-slate-500'}`}>Tasks</Text>
            </Pressable>
          </View>
        </View>

        {activeTab === "chat" ? (
          <>
            <ScrollView 
              ref={scrollViewRef} 
              className="flex-1 px-6"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
              showsVerticalScrollIndicator={false}
            >
              {messages.length > 0 ? messages.map((msg, idx) => {
                const msgSenderId = String(msg.sender?._id || msg.sender);
                const isMe = msgSenderId === currentUserId;
                return (
                  <View key={idx} className={`mb-6 ${isMe ? 'items-end' : 'items-start'}`}>
                    <View className="flex-row items-center mb-1">
                       {!isMe && <View className="w-5 h-5 rounded-full bg-slate-200 mr-2 items-center justify-center">
                          <Text className="text-[8px] font-bold">{msg.sender?.fullName?.[0] || "M"}</Text>
                       </View>}
                       <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {isMe ? "You" : (msg.sender?.fullName || "Member")}
                      </Text>
                    </View>
                    <View className={`max-w-[80%] px-5 py-3.5 rounded-[22px] ${isMe ? 'bg-indigo-600 rounded-tr-none shadow-md shadow-indigo-200' : 'bg-slate-100 rounded-tl-none'}`}>
                      <Text className={`text-[14px] leading-5 ${isMe ? 'text-white font-medium' : 'text-slate-700'}`}>{msg.message}</Text>
                    </View>
                  </View>
                );
              }) : (
                <View className="flex-1 items-center justify-center mt-20">
                  <Ionicons name="chatbubbles-outline" size={40} color="#e2e8f0" />
                  <Text className="text-slate-400 font-bold mt-4">No messages yet.</Text>
                </View>
              )}
            </ScrollView>

            <View className="p-4 bg-white border-t border-slate-50">
              <View className="flex-row items-center bg-slate-50 rounded-[25px] px-5 py-2 border border-slate-100">
                <TextInput 
                  placeholder="Type a message..." 
                  value={newMessage} 
                  onChangeText={setNewMessage} 
                  className="flex-1 py-2 text-slate-700 font-medium" 
                  multiline
                />
                <Pressable 
                  onPress={handleSendMessage} 
                  className={`w-10 h-10 rounded-full items-center justify-center ${newMessage.trim() ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <Ionicons name="arrow-up" size={20} color="white" />
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Project Backlog</Text>
                {isAdmin && (
                  <Pressable onPress={() => setTaskModalVisible(true)} className="bg-indigo-50 px-3 py-1.5 rounded-lg">
                      <Text className="text-indigo-600 font-bold text-[10px] uppercase">+ New Task</Text>
                  </Pressable>
                )}
            </View>
            
            {tasks.length > 0 ? tasks.map((task, idx) => (
                <View key={idx} className="bg-white p-5 rounded-[25px] border border-slate-100 mb-4 shadow-sm">
                    <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-1 mr-4">
                            <Text className="font-bold text-slate-800 text-sm mb-1">{task.title}</Text>
                            <Text className="text-slate-400 text-xs" numberOfLines={2}>{task.description}</Text>
                        </View>
                        <View className={`px-2 py-1 rounded-md ${task.status === 'Approved' ? 'bg-emerald-50' : task.status === 'Submitted' ? 'bg-blue-50' : 'bg-amber-50'}`}>
                            <Text className={`text-[9px] font-black uppercase ${task.status === 'Approved' ? 'text-emerald-600' : task.status === 'Submitted' ? 'text-blue-600' : 'text-amber-600'}`}>
                                {task.status}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center pt-3 border-t border-slate-50">
                        <Ionicons name="person-circle-outline" size={14} color="#94a3b8" />
                        <Text className="text-[10px] font-bold text-slate-500 ml-1">Assigned to: {task.assignedTo?.fullName || 'Unassigned'}</Text>
                    </View>
                    <View className="flex-row justify-end gap-2 mt-4">
                      {isProjectHead && task.status === 'pending' && (
                        <Pressable onPress={() => updateTaskStatus(task._id, 'submit')} className="bg-slate-900 px-4 py-2 rounded-xl">
                          <Text className="text-white text-[10px] font-black uppercase">Submit Task</Text>
                        </Pressable>
                      )}
                      {isAdmin && task.status === 'Submitted' && (
                        <Pressable onPress={() => updateTaskStatus(task._id, 'approve')} className="bg-emerald-600 px-4 py-2 rounded-xl">
                          <Text className="text-white text-[10px] font-black uppercase">Approve</Text>
                        </Pressable>
                      )}
                    </View>
                </View>
            )) : (
                <View className="items-center justify-center mt-20">
                    <Ionicons name="list-outline" size={40} color="#e2e8f0" />
                    <Text className="text-slate-400 font-bold mt-4">No tasks found for this project.</Text>
                </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <Modal visible={taskModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text className="text-xl font-black mb-6">New Milestone</Text>
            <TextInput placeholder="Title" value={taskTitle} onChangeText={setTaskTitle} style={styles.input} />
            <TextInput placeholder="Details" value={taskDesc} onChangeText={setTaskDesc} multiline style={[styles.input, { height: 100 }]} />
            <View className="flex-row gap-4">
              <Pressable onPress={() => setTaskModalVisible(false)} className="flex-1 p-4 bg-slate-100 rounded-2xl items-center"><Text className="font-bold">Cancel</Text></Pressable>
              <Pressable onPress={handleAddTask} className="flex-1 p-4 bg-indigo-600 rounded-2xl items-center"><Text className="text-white font-black">Create</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  iconBtn: { width: 44, height: 44, backgroundColor: '#f8fafc', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', padding: 30, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  input: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' }
});