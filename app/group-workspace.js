import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io } from "socket.io-client";

const API_URL = "https://projectmanagerapi-o885.onrender.com"; // Notice: Base URL for sockets

export default function GroupWorkspace() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef();
  const socket = useRef(null);

  // --- STATE ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const stages = ["Proposal", "Review", "Method", "Build", "Final"];
  const [currentStage, setCurrentStage] = useState("Proposal");
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);

  // --- INITIALIZE ---
  useEffect(() => {
    loadDataAndSocket();
    return () => socket.current?.disconnect();
  }, []);

  const loadDataAndSocket = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userData = JSON.parse(await AsyncStorage.getItem("userData"));
      setCurrentUser(userData);
      setIsAdmin(userData?.role === 'admin' || userData?.role === 'super-admin');

      // 1. Fetch Project Details (Stages & Members)
      const res = await axios.get(`${API_URL}/api/projects/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(res.data.members || []);
      setCurrentStage(res.data.currentStage || "Proposal");

      // 2. Setup Socket Connection
      socket.current = io(API_URL, {
        auth: { token }
      });

      socket.current.emit("join_project", params.id);

      socket.current.on("receive_message", (msg) => {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      });

    } catch (err) {
      console.error("Initialization error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleSendMessage = () => {
    if (!inputText.trim() || !socket.current) return;

    const msgData = {
      projectId: params.id,
      senderId: currentUser._id,
      name: currentUser.name,
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.current.emit("send_message", msgData);
    setMessages(prev => [...prev, msgData]); // Optimistic UI update
    setInputText("");
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const updateStage = async (newStage) => {
    if (!isAdmin) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(`${API_URL}/api/projects/${params.id}`, 
        { currentStage: newStage },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setCurrentStage(newStage);
    } catch (e) {
      Alert.alert("Error", "Failed to update milestone.");
    }
  };

  if (loading) return <SafeAreaView className="flex-1 justify-center items-center"><ActivityIndicator color="#6366f1" /></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <Ionicons name="chevron-back" size={20} color="black" />
        </Pressable>
        <View className="items-center">
            <Text className="font-black text-xs text-gray-900">{params?.title || "Workspace"}</Text>
            <Text className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{members.length} Members</Text>
        </View>
        <Pressable onPress={() => setShowManageModal(true)} className="p-2 bg-indigo-50 rounded-full">
          <Ionicons name="settings-sharp" size={18} color="#6366f1" />
        </Pressable>
      </View>

      {/* STAGE INDICATOR */}
      <View className="px-6 py-4 bg-indigo-50/50 flex-row items-center">
        <View className="bg-indigo-600 px-4 py-2 rounded-2xl mr-4">
            <Text className="text-white font-black text-[8px] uppercase">Current Phase</Text>
            <Text className="text-white text-lg font-black">{currentStage}</Text>
        </View>
        <View className="flex-1">
            <View className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
              <View 
                style={{ width: `${((stages.indexOf(currentStage)+1)/stages.length)*100}%` }} 
                className="h-full bg-indigo-600" 
              />
            </View>
        </View>
      </View>

      {/* CHAT AREA */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1" keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView 
          ref={scrollViewRef} 
          className="flex-1 px-4 pt-4"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => {
            const isMe = msg.senderId === currentUser?._id;
            return (
              <View key={index} className={`mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && <Text className="text-[9px] font-bold text-gray-400 mb-1 ml-2">{msg.name}</Text>}
                <View className={`max-w-[80%] p-4 rounded-[30px] ${isMe ? 'bg-indigo-600 rounded-tr-none' : 'bg-gray-100 rounded-tl-none'}`}>
                  <Text className={`text-sm font-medium ${isMe ? 'text-white' : 'text-gray-800'}`}>{msg.text}</Text>
                </View>
                <Text className="text-[8px] text-gray-400 mt-1 px-2">{msg.time}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View className="p-4 bg-white border-t border-gray-50 flex-row items-center gap-3">
            <TextInput 
              className="flex-1 bg-gray-100 px-6 py-4 rounded-[30px] text-sm" 
              placeholder="Message group..." 
              value={inputText} 
              onChangeText={setInputText} 
            />
            <Pressable onPress={handleSendMessage} className="bg-indigo-600 w-12 h-12 rounded-full items-center justify-center">
              <Ionicons name="send" size={18} color="white" />
            </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* --- SETTINGS MODAL --- */}
      <Modal visible={showManageModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white p-6">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-2xl font-black">Group Management</Text>
            <Pressable onPress={() => setShowManageModal(false)} className="bg-gray-100 p-2 rounded-full">
              <Ionicons name="close" size={24} color="black" />
            </Pressable>
          </View>

          {isAdmin && (
            <>
              <Text className="text-[10px] font-black text-indigo-600 uppercase mb-3">Update Milestone</Text>
              <View className="flex-row flex-wrap gap-2 mb-8">
                {stages.map((stage) => (
                  <Pressable key={stage} onPress={() => updateStage(stage)} className={`px-4 py-2 rounded-xl border ${currentStage === stage ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}>
                    <Text className={`text-[10px] font-black ${currentStage === stage ? 'text-white' : 'text-gray-400'}`}>{stage}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Text className="text-[10px] font-black text-indigo-600 uppercase mb-3">Project Members</Text>
          <ScrollView>
            {members.map(member => (
              <View key={member._id} className="flex-row items-center justify-between p-4 bg-gray-50 rounded-2xl mb-2">
                <View>
                  <Text className="font-bold text-gray-900">{member.name}</Text>
                  <Text className="text-[9px] text-gray-400 uppercase">{member.role || 'Contributor'}</Text>
                </View>
                {isAdmin && member.role !== 'Head' && (
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                )}
              </View>
            ))}
          </ScrollView>

          <Pressable onPress={() => setShowManageModal(false)} className="bg-black py-5 rounded-[25px] mt-4 items-center">
            <Text className="text-white font-black uppercase text-[10px]">Return to Chat</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView> 
  );
}