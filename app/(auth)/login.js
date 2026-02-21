import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

// --- Components ---
export const CustomToast = ({ visible, message, type, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 60, useNativeDriver: true, bounciness: 8 }).start();
      const timer = setTimeout(() => handleClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  const handleClose = () => {
    Animated.timing(slideAnim, { toValue: -150, duration: 300, useNativeDriver: true }).start(() => onClose());
  };
  if (!visible) return null;
  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], zIndex: 9999 }} className="absolute left-6 right-6">
      <View className="bg-slate-900 flex-row items-center p-4 rounded-[25px] border border-slate-800 shadow-2xl">
        <View className={`p-2 rounded-xl mr-3 ${type === 'success' ? 'bg-indigo-500' : 'bg-red-500'}`}>
          <Ionicons name={type === 'success' ? "checkmark-circle" : "alert-circle"} size={20} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-black text-[10px] uppercase tracking-widest">{type === 'success' ? "System" : "Security"}</Text>
          <Text className="text-slate-400 text-xs font-medium">{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

export const InputField = ({ placeholder, icon, secureTextEntry, value, onChangeText, keyboardType }) => (
  <View className="mb-5 flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-1">
    <Ionicons name={icon} size={20} color="#9ca3af" />
    <TextInput
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      className="flex-1 py-4 px-3 text-black text-[16px]"
      placeholderTextColor="#9ca3af"
      autoCapitalize="none"
    />
  </View>
);

// --- Main Screen ---
export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  useEffect(() => {
    if (params.status === 'reset' && params.token) setIsResetting(true);
  }, [params.status, params.token]);

const handleLogin = async () => {
    if (!email || !password) return setToast({ visible: true, message: "Please fill all fields", type: "error" });
    setLoading(true);
    try {
      const expoPushToken = await AsyncStorage.getItem("pushToken");
      const response = await axios.post(`${API_URL}/auth/login`, { email, password, expoPushToken });
      
      const { token, user } = response.data;

      // --- CRITICAL: MATCHING KEYS ---
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));

      // Route based on the role we just got from the DB
      if (user.role === "super-admin") {
        router.replace("/(admin)/dashboard");
      } else {
        router.replace("/(tabs)/home");
      }

    } catch (err) {
      setToast({ visible: true, message: err.response?.data?.message || "Login failed", type: "error" });
    } finally { setLoading(false); }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return setToast({ visible: true, message: "Too short", type: "error" });
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token: params.token, password: newPassword });
      setToast({ visible: true, message: "Success!", type: "success" });
      setTimeout(() => setIsResetting(false), 2000);
    } catch (err) { setToast({ visible: true, message: "Error", type: "error" }); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <CustomToast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({...toast, visible: false})} />
      
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 pt-12">
          
          <View className="mb-10">
            <Text className="text-4xl font-extrabold text-black tracking-tight">{isResetting ? "Secure" : "Welcome"}</Text>
            <Text className="text-4xl font-extrabold text-gray-300 tracking-tight">{isResetting ? "Reset." : "Back."}</Text>
          </View>

          {isResetting ? (
            <View>
              <InputField icon="lock-open-outline" placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
              <Pressable onPress={handleUpdatePassword} className="bg-black py-5 rounded-3xl mt-4 shadow-xl">
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold text-lg">Update Password</Text>}
              </Pressable>
              <Pressable onPress={() => setIsResetting(false)} className="mt-6">
                <Text className="text-gray-400 text-center font-bold">Back to Login</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <InputField icon="mail-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <InputField icon="lock-closed-outline" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
              
              {/* ✅ RESTORED: Forgot Password Button */}
              <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                <Text className="text-gray-400 font-bold text-right mt-1">Forgot Password?</Text>
              </Pressable>

              <Pressable onPress={handleLogin} className="bg-black py-5 rounded-3xl shadow-xl mt-10">
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold text-lg">Sign In</Text>}
              </Pressable>

              {/* ✅ RESTORED: Register Redirect */}
              <View className="flex-row justify-center mt-12 mb-10">
                <Text className="text-gray-400 font-medium">Don't have an account? </Text>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Text className="text-black font-black">Register</Text>
                </Pressable>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}