import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Personal, 2: School, 3: Security, 4: Verification
  
  // State for all form fields
  const [form, setForm] = useState({
    name: "",
    email: "",
    gender: "",
    faculty: "",
    department: "",
    password: "",
    verificationCode: "", // Added for step 4
  });

  // Helper to update form state
  const updateForm = (key, value) => setForm({ ...form, [key]: value });

  // Custom Input Component
  const InputField = ({ placeholder, icon, secureTextEntry, value, onChangeText, keyboardType, maxLength }) => (
    <View className="mb-5 flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-1">
      <Ionicons name={icon} size={20} color="#9ca3af" />
      <TextInput 
        placeholder={placeholder} 
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry} 
        keyboardType={keyboardType}
        maxLength={maxLength}
        className="flex-1 py-4 px-3 text-black text-[16px]" 
        placeholderTextColor="#9ca3af" 
      />
    </View>
  );

  // Custom Chip Selection for Gender
  const SelectField = ({ icon, options, currentSelection, onSelect }) => (
    <View className="mb-5 flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
      <Ionicons name={icon} size={20} color="#9ca3af" />
      <View className="flex-1 flex-row flex-wrap px-3 gap-2">
        {options.map((opt) => (
          <Pressable 
            key={opt} 
            onPress={() => onSelect(opt)}
            className={`px-4 py-2 rounded-xl border ${currentSelection === opt ? 'bg-black border-black' : 'bg-white border-gray-200'}`}
          >
            <Text className={`text-sm font-semibold ${currentSelection === opt ? 'text-white' : 'text-gray-500'}`}>
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 pt-4">
          
          {/* Header Bar: Back & Progress */}
          <View className="flex-row justify-between items-center mb-8">
            <Pressable onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <View className="flex-row items-center">
              {[1, 2, 3, 4].map((s) => (
                <View key={s} className={`h-2 rounded-full mx-1 ${step >= s ? 'bg-black w-6' : 'bg-gray-200 w-3'}`} />
              ))}
            </View>
            <View className="w-6" />
          </View>

          {/* Title Logic */}
          <View className="mb-10">
            <Text className="text-4xl font-extrabold text-black tracking-tight">
              {step === 1 ? "Personal" : step === 2 ? "Academic" : step === 3 ? "Security" : "Verify"}
            </Text>
            <Text className="text-4xl font-extrabold text-gray-300 tracking-tight">
              {step === 4 ? "Email." : "Details."}
            </Text>
          </View>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <View>
              <InputField icon="person-outline" placeholder="Full Name" value={form.name} onChangeText={(t) => updateForm("name", t)} />
              <InputField icon="mail-outline" placeholder="School Email" keyboardType="email-address" value={form.email} onChangeText={(t) => updateForm("email", t)} />
              <SelectField icon="transgender-outline" options={["Male", "Female", "Other"]} currentSelection={form.gender} onSelect={(val) => updateForm("gender", val)} />
            </View>
          )}

          {/* Step 2: School Info */}
          {step === 2 && (
            <View>
              <InputField icon="school-outline" placeholder="Faculty" value={form.faculty} onChangeText={(t) => updateForm("faculty", t)} />
              <InputField icon="business-outline" placeholder="Department" value={form.department} onChangeText={(t) => updateForm("department", t)} />
            </View>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <View>
              <InputField icon="lock-closed-outline" placeholder="Create Password" secureTextEntry value={form.password} onChangeText={(t) => updateForm("password", t)} />
              <Text className="text-gray-400 text-sm px-2 mb-4">You will receive a code to {form.email || 'your email'} in the next step.</Text>
            </View>
          )}

          {/* Step 4: Email Verification */}
          {step === 4 && (
            <View>
              <Text className="text-gray-500 mb-6 text-lg leading-6">
                We've sent a 6-digit verification code to <Text className="text-black font-bold">{form.email}</Text>. Please enter it below.
              </Text>
              
              <InputField 
                icon="shield-checkmark-outline" 
                placeholder="Enter 6-digit code" 
                keyboardType="number-pad"
                maxLength={6}
                value={form.verificationCode} 
                onChangeText={(t) => updateForm("verificationCode", t)} 
              />

              <Pressable className="mt-2">
                <Text className="text-gray-400 font-semibold">Didn't receive code? <Text className="text-black">Resend</Text></Text>
              </Pressable>
            </View>
          )}

          {/* Bottom Actions */}
          <View className="mt-auto pb-10">
            <Pressable 
              onPress={() => step < 4 ? setStep(step + 1) : router.replace("/(tabs)/home")} 
              className="bg-black py-5 rounded-3xl shadow-xl active:opacity-90"
            >
              <Text className="text-white text-center font-bold text-lg">
                {step === 4 ? "Verify & Finish" : "Next Step"}
              </Text>
            </Pressable>
            
            {step === 1 && (
              <Pressable 
                onPress={() => router.push({ pathname: "/(auth)/login", params: { from: "register" } })}
                className="mt-6"
              >
                <Text className="text-center text-gray-500">
                  Already have an account? <Text className="text-black font-bold">Sign In</Text>
                </Text>
              </Pressable>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}