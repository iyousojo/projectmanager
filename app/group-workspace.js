import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, Text,
  TextInput, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function GroupWorkspace() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  const scrollViewRef = useRef();

  const loadData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const rawUser = await AsyncStorage.getItem("userData") || await AsyncStorage.getItem("user");
      const userData = JSON.parse(rawUser || "{}");
      setUser(userData);

      const [pRes, cRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/chat/${id}?isProject=true`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setProject(pRes.data.project || pRes.data);
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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      const res = await axios.post(`${API_URL}/chat`, {
        projectId: id, 
        message: newMessage.trim(),
        senderRole: user?.role // CRITICAL: This must be sent for the backend check
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.status === "success") {
        setMessages(prev => [...prev, res.data.chat]);
        setNewMessage("");
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      const errorMsg = e.response?.data?.message || "Message failed";
      Alert.alert("Error", errorMsg);
    }
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator color="#6366f1" size="large" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="px-6 py-4 border-b border-slate-100 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 bg-slate-50 rounded-full">
            <Ionicons name="arrow-back" size={20} color="black" />
          </Pressable>
          <View className="items-center">
            <Text className="font-black text-lg">Group Workspace</Text>
            <Text className="text-[10px] text-slate-400 uppercase font-bold">{project?.title}</Text>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-6" 
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <View className="py-6">
            {messages.map((msg, idx) => {
              const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
              return (
                <View key={idx} className={`mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
                  <View className={`max-w-[85%] p-4 rounded-2xl ${isMe ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                    {!isMe && <Text className="text-[9px] font-black text-indigo-500 uppercase mb-1">{msg.sender?.fullName || "Member"}</Text>}
                    <Text className={`text-sm ${isMe ? 'text-white' : 'text-slate-800'}`}>{msg.message}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="p-4 border-t border-slate-100 bg-white">
          <View className="flex-row items-center bg-slate-50 rounded-full px-4 py-2 border border-slate-200">
            <TextInput 
              placeholder={(user?.role === 'student' && !isProjectHead) ? "Read only mode" : "Type a message..."}
              value={newMessage}
              onChangeText={setNewMessage}
              editable={isAdmin || isProjectHead}
              className="flex-1 py-2 text-slate-700"
            />
            <Pressable onPress={handleSendMessage} className="bg-indigo-600 p-2 rounded-full">
              <Ionicons name="send" size={16} color="white" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}