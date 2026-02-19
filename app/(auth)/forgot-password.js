import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      alert("Check your email for the reset link!");
      router.back();
    } catch (err) {
      alert("Error: User not found");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-8 pt-6">
      <Pressable onPress={() => router.back()} className="mb-8"><Ionicons name="arrow-back" size={24} /></Pressable>
      <Text className="text-4xl font-black">Recover</Text>
      <Text className="text-4xl font-black text-gray-300">Access.</Text>
      <TextInput 
        placeholder="Enter your registered email" 
        value={email} 
        onChangeText={setEmail} 
        className="bg-gray-50 p-5 rounded-2xl mt-10"
      />
      <Pressable onPress={handleReset} className="bg-black py-5 rounded-3xl mt-6">
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold">Send Reset Link</Text>}
      </Pressable>
    </SafeAreaView>
  );
}