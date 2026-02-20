import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform, Pressable, ScrollView, Text, TextInput, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", 
    faculty: "", department: "", 
    password: "", confirmPassword: ""
  });

  const updateForm = (key, value) => setForm({ ...form, [key]: value });

  const handleRegister = async () => {
    // Basic Validation
    if (!form.name || !form.email || !form.password) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const expoPushToken = await AsyncStorage.getItem("pushToken");
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: "student",
        faculty: form.faculty,
        department: form.department,
        expoPushToken 
      });

      // SUCCESS: Since verification is removed, we go straight to login
      Alert.alert(
        "Success", 
        "Account created successfully! You can now log in.",
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
      
    } catch (err) {
      Alert.alert("Registration Failed", err.response?.data?.message || "Something went wrong");
    } finally { 
      setLoading(false); 
    }
  };

  const inputStyle = "bg-gray-100 p-5 rounded-2xl mb-4 text-slate-900 border border-gray-200";

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView className="px-8 pt-4">
          
          {/* Progress Header - Updated for 3 Steps */}
          <View className="flex-row items-center mb-8">
            <Pressable onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
               <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <View className="flex-row ml-4">
               {[1, 2, 3].map(s => (
                 <View key={s} className={`h-1.5 rounded-full mx-1 ${step >= s ? 'bg-black w-6' : 'bg-gray-200 w-3'}`} />
               ))}
            </View>
          </View>

          <Text className="text-4xl font-black text-black">
            {step === 1 ? "Personal" : step === 2 ? "Academic" : "Security"}
          </Text>
          <Text className="text-slate-400 font-medium mb-10">Step {step} of 3</Text>
          
          <View>
            {/* STEP 1: PERSONAL */}
            {step === 1 && (
              <View>
                <TextInput placeholder="Full Name" value={form.name} onChangeText={t => updateForm("name", t)} className={inputStyle} placeholderTextColor="#94a3b8" />
                <TextInput placeholder="Email Address" value={form.email} onChangeText={t => updateForm("email", t)} className={inputStyle} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94a3b8" />
                <TextInput placeholder="Phone Number" value={form.phone} onChangeText={t => updateForm("phone", t)} className={inputStyle} keyboardType="phone-pad" placeholderTextColor="#94a3b8" />
              </View>
            )}

            {/* STEP 2: ACADEMIC */}
            {step === 2 && (
              <View>
                <TextInput placeholder="Faculty" value={form.faculty} onChangeText={t => updateForm("faculty", t)} className={inputStyle} placeholderTextColor="#94a3b8" />
                <TextInput placeholder="Department" value={form.department} onChangeText={t => updateForm("department", t)} className={inputStyle} placeholderTextColor="#94a3b8" />
              </View>
            )}

            {/* STEP 3: SECURITY */}
            {step === 3 && (
              <View>
                <TextInput placeholder="Password" secureTextEntry value={form.password} onChangeText={t => updateForm("password", t)} className={inputStyle} placeholderTextColor="#94a3b8" />
                <TextInput placeholder="Confirm Password" secureTextEntry value={form.confirmPassword} onChangeText={t => updateForm("confirmPassword", t)} className={inputStyle} placeholderTextColor="#94a3b8" />
              </View>
            )}
          </View>

          <Pressable 
            onPress={() => {
              if (step < 3) setStep(step + 1);
              else handleRegister();
            }} 
            disabled={loading}
            className={`bg-black py-5 rounded-3xl mt-6 shadow-lg ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <Text className="text-white text-center font-bold text-lg">
                {step === 3 ? "Create Account" : "Continue"}
              </Text>
            )}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}