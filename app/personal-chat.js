import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView, Platform,
    Pressable, ScrollView, Text, TextInput, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function PersonalChat() {
    const { recipientId, recipientName } = useLocalSearchParams();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const scrollViewRef = useRef();

    const loadChat = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const storedUser = await AsyncStorage.getItem("userData");
            const userData = JSON.parse(storedUser || "{}");
            setUser(userData);

            if (!recipientId) return;

            // ✅ CHANGED: "/chat" (Singular) to match your server.js
            const res = await axios.get(`${API_URL}/chat/${recipientId}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { isProject: "false" } 
            });

            const chatHistory = res.data.chat || res.data || [];
            setMessages(chatHistory);
        } catch (e) {
            console.error("Chat Load Error:", e.response?.data || e.message);
        } finally {
            setLoading(false);
        }
    }, [recipientId]);

    useEffect(() => { loadChat(); }, [loadChat]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        try {
            const token = await AsyncStorage.getItem("userToken");
            
            // ✅ CHANGED: "/chat" (Singular) to match your server.js
            // ✅ KEY: "receiverId" to match your ChatController
            const res = await axios.post(`${API_URL}/chat`, {
                receiverId: recipientId, 
                message: newMessage.trim(),
            }, { headers: { Authorization: `Bearer ${token}` } });

            const sentMsg = res.data.chat || res.data;
            setMessages(prev => [...prev, sentMsg]);
            setNewMessage("");
            
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (e) {
            console.error("Send Error Details:", e.response?.data || e.message);
            Alert.alert("Error", "Message could not be sent.");
        }
    };

    if (loading) return (
        <View className="flex-1 justify-center items-center bg-white">
            <ActivityIndicator size="large" color="#6366f1" />
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                className="flex-1" 
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                {/* HEADER */}
                <View className="px-6 py-4 flex-row items-center border-b border-slate-50">
                    <Pressable onPress={() => router.back()} className="w-10 h-10 bg-slate-50 rounded-2xl items-center justify-center mr-4">
                        <Ionicons name="chevron-back" size={20} color="black" />
                    </Pressable>
                    <View className="flex-1">
                        <Text className="font-black text-slate-900 text-lg" numberOfLines={1}>
                            {recipientName || "Private Chat"}
                        </Text>
                        <Text className="text-indigo-500 text-[10px] font-bold uppercase tracking-widest">Secure Connection</Text>
                    </View>
                </View>

                {/* MESSAGES */}
                <ScrollView 
                    ref={scrollViewRef}
                    className="flex-1 px-6 pt-4"
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
                >
                    {messages.map((msg, idx) => {
                        const senderId = msg.sender?._id || msg.sender;
                        const isMe = String(senderId) === String(user?._id || user?.id);
                        
                        return (
                            <View key={msg._id || idx} className={`mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
                                <View className={`max-w-[80%] px-5 py-3 rounded-[22px] ${
                                    isMe ? 'bg-indigo-600 rounded-tr-none' : 'bg-slate-100 rounded-tl-none'
                                }`}>
                                    <Text className={`text-sm ${isMe ? 'text-white' : 'text-slate-700'}`}>
                                        {msg.message}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* INPUT */}
                <View className="p-4 bg-white border-t border-slate-50">
                    <View className="flex-row items-center bg-slate-50 rounded-[30px] px-4 py-2">
                        <TextInput 
                            placeholder="Type a message..." 
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                            className="flex-1 py-2 text-slate-700"
                        />
                        <Pressable 
                            onPress={handleSend}
                            disabled={!newMessage.trim()}
                            className={`w-10 h-10 rounded-full items-center justify-center ${newMessage.trim() ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                            <Ionicons name="arrow-up" size={20} color="white" />
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}