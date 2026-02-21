import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView, Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";
const UI_PHASES = ["Pending", "Proposal", "Implementation", "Testing", "Completed"];

export default function GroupWorkspace() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Task Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");

  const scrollViewRef = useRef();

  const loadData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userData = JSON.parse(await AsyncStorage.getItem("userData") || "{}");
      setUser(userData);

      const pRes = await axios.get(`${API_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(pRes.data.project || pRes.data);

      const cRes = await axios.get(`${API_URL}/chats/${id}?isProject=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(cRes.data.chat || []);
    } catch (e) {
      console.error("Load Error:", e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const isProjectHead = String(project?.projectHead?._id || project?.projectHead) === String(user?._id);

  // Update Project Phase
  const updatePhase = async (uiPhase) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.patch(`${API_URL}/projects/${id}`, { status: uiPhase }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", `Project moved to ${uiPhase}`);
      loadData();
    } catch (e) {
      Alert.alert("Error", "Could not update phase.");
    }
  };

  // Send Chat Message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!isProjectHead && !isAdmin) {
      Alert.alert("Denied", "Only the Project Head or Supervisor can post here.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await axios.post(`${API_URL}/chats`, {
        projectId: id,
        message: newMessage
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMessages([...messages, res.data.chat]);
      setNewMessage("");
    } catch (e) {
      Alert.alert("Error", "Message failed to send");
    }
  };

  // Assign Specific Task (Milestone)
  const handleAssignTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      // Posting to your task endpoint
      await axios.post(`${API_URL}/tasks/project/${id}`, {
        title: taskTitle,
        description: taskDesc,
        project: id
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Also post a chat notification so the group sees it
      await axios.post(`${API_URL}/chats`, {
        projectId: id,
        message: `📌 NEW TASK ASSIGNED: ${taskTitle}\n\n${taskDesc}`
      }, { headers: { Authorization: `Bearer ${token}` } });

      setModalVisible(false);
      setTaskTitle("");
      setTaskDesc("");
      loadData(); // Refresh history
    } catch (e) {
      Alert.alert("Error", "Could not assign task");
    }
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator color="#6366f1" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        
        {/* --- TOP NAV & PHASE SWITCHER --- */}
        <View className="px-6 py-4 border-b border-slate-100">
            <View className="flex-row items-center justify-between mb-4">
                <Pressable onPress={() => router.back()} className="p-2 bg-slate-50 rounded-full">
                    <Ionicons name="arrow-back" size={20} color="black" />
                </Pressable>
                <Text className="font-black text-lg">Group Workspace</Text>
                {(isAdmin || isProjectHead) && (
                    <Pressable onPress={() => setModalVisible(true)} className="bg-indigo-600 px-4 py-2 rounded-xl">
                        <Text className="text-white font-bold text-[10px] uppercase">Assign Task</Text>
                    </Pressable>
                )}
            </View>

            {isAdmin && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {UI_PHASES.map((phase) => (
                        <Pressable 
                            key={phase} 
                            onPress={() => updatePhase(phase)}
                            className={`mr-2 px-4 py-2 rounded-full border ${project?.status === phase ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                        >
                            <Text className={`text-[10px] font-bold ${project?.status === phase ? 'text-white' : 'text-slate-500'}`}>{phase}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </View>

        {/* --- CHAT AREA --- */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-6" 
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <View className="py-6">
            {messages.map((msg, idx) => {
              const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
              const isAlert = msg.message.includes("📌");
              return (
                <View key={idx} className={`mb-6 ${isMe ? 'items-end' : 'items-start'}`}>
                  <View className={`max-w-[85%] p-4 rounded-[22px] ${isAlert ? 'bg-amber-50 border border-amber-100' : isMe ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                    {!isMe && <Text className="text-[9px] font-black text-indigo-500 uppercase mb-1">{msg.sender?.fullName || "Supervisor"}</Text>}
                    <Text className={`text-sm ${isMe && !isAlert ? 'text-white' : 'text-slate-800'}`}>{msg.message}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* --- INPUT --- */}
        <View className="p-4 border-t border-slate-100 bg-white">
          <View className="flex-row items-center bg-slate-50 rounded-[30px] px-4 py-2 border border-slate-200">
            <TextInput 
              placeholder="Post update..."
              value={newMessage}
              onChangeText={setNewMessage}
              className="flex-1 py-2"
            />
            <Pressable onPress={handleSendMessage} className="bg-indigo-600 w-10 h-10 rounded-full items-center justify-center ml-2">
              <Ionicons name="send" size={16} color="white" />
            </Pressable>
          </View>
        </View>

        {/* --- ASSIGN TASK MODAL --- */}
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-[40px] p-8">
              <Text className="text-xl font-black text-slate-900 mb-6">Assign New Task</Text>
              
              <Text className="text-slate-400 font-bold text-[10px] uppercase mb-2">Task Title</Text>
              <TextInput 
                value={taskTitle} 
                onChangeText={setTaskTitle} 
                placeholder="e.g. Complete Database Schema" 
                className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
              />

              <Text className="text-slate-400 font-bold text-[10px] uppercase mb-2">Description / Instructions</Text>
              <TextInput 
                value={taskDesc} 
                onChangeText={setTaskDesc} 
                placeholder="Details for the team..." 
                multiline 
                numberOfLines={4}
                className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100 h-32"
              />

              <View className="flex-row gap-3">
                <Pressable onPress={() => setModalVisible(false)} className="flex-1 bg-slate-100 py-4 rounded-2xl items-center">
                  <Text className="font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable onPress={handleAssignTask} className="flex-2 bg-indigo-600 py-4 rounded-2xl items-center">
                  <Text className="font-bold text-white">Assign Task</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}