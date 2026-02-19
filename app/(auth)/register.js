import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated,
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  Text, TextInput, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

const CustomToast = ({ visible, message, type, onClose }) => {
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

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [form, setForm] = useState({
    name: "", email: "", phone: "", gender: "",
    faculty: "", department: "", password: "", confirmPassword: ""
  });

  const updateForm = (key, value) => setForm({ ...form, [key]: value });

  const handleFinalSubmit = async () => {
    if (form.password !== form.confirmPassword) return setToast({ visible: true, message: "Passwords mismatch", type: "error" });
    setLoading(true);
    try {
      const expoPushToken = await AsyncStorage.getItem("pushToken");
      await axios.post(`${API_URL}/auth/register`, {
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: "student",
        gender: form.gender,
        faculty: form.faculty,
        department: form.department,
        expoPushToken 
      });
      setToast({ visible: true, message: "Verification email sent!", type: "success" });
      setTimeout(() => router.replace("/(auth)/login"), 3000);
    } catch (err) {
      setToast({ visible: true, message: err.response?.data?.message || "Registration failed", type: "error" });
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <CustomToast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({...toast, visible: false})} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView className="px-8 pt-4">
          <View className="flex-row justify-between items-center mb-8">
            <Pressable onPress={() => step > 1 ? setStep(step - 1) : router.back()}><Ionicons name="arrow-back" size={24} color="black" /></Pressable>
            <View className="flex-row items-center">
               {[1, 2, 3].map(s => <View key={s} className={`h-2 rounded-full mx-1 ${step >= s ? 'bg-black w-6' : 'bg-gray-200 w-3'}`} />)}
            </View>
          </View>
          <Text className="text-4xl font-extrabold text-black tracking-tight">{step === 1 ? "Personal" : step === 2 ? "Academic" : "Security"}</Text>
          <Text className="text-4xl font-extrabold text-gray-300 tracking-tight">Student.</Text>

          <View className="mt-10">
            {step === 1 && (
              <>
                <TextInput placeholder="Full Name" value={form.name} onChangeText={t => updateForm("name", t)} className="bg-gray-50 p-4 rounded-2xl mb-4" />
                <TextInput placeholder="Email" value={form.email} onChangeText={t => updateForm("email", t)} className="bg-gray-50 p-4 rounded-2xl mb-4" />
                <TextInput placeholder="Phone" value={form.phone} onChangeText={t => updateForm("phone", t)} className="bg-gray-50 p-4 rounded-2xl mb-4" />
              </>
            )}
            {step === 2 && (
              <>
                <TextInput placeholder="Faculty" value={form.faculty} onChangeText={t => updateForm("faculty", t)} className="bg-gray-50 p-4 rounded-2xl mb-4" />
                <TextInput placeholder="Department" value={form.department} onChangeText={t => updateForm("department", t)} className="bg-gray-50 p-4 rounded-2xl mb-4" />
              </>
            )}
            {step === 3 && (
              <>
                <TextInput placeholder="Password" secureTextEntry value={form.password} onChangeText={t => updateForm("password", t)} className="bg-gray-50 p-4 rounded-2xl mb-4" />
                <TextInput placeholder="Confirm Password" secureTextEntry value={form.confirmPassword} onChangeText={t => updateForm("confirmPassword", t)} className="bg-gray-50 p-4 rounded-2xl mb-4" />
              </>
            )}
          </View>

          <Pressable 
            onPress={() => step < 3 ? setStep(step + 1) : handleFinalSubmit()} 
            className="bg-black py-5 rounded-3xl mt-10 shadow-xl"
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-bold text-lg">{step === 3 ? "Register" : "Next"}</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}