import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react"; // Added useState
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const showBackButton = params.from === "register";

  // 1. Create state for the inputs and errors
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  // 2. Validation Function
  const handleLogin = () => {
    let newErrors = {};

    // Check if email is empty
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid school email";
    }

    // Check if password is empty
    if (!password) {
      newErrors.password = "Password is required";
    }

    // If there are errors, stop the login process
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // If no errors, clear errors and proceed
    setErrors({});
    console.log("Logging in with:", email, password);
    router.replace("/(tabs)/home");
  };

  // 3. Custom Input Component with Error Message
  const InputField = ({ placeholder, icon, secureTextEntry, value, onChangeText, error }) => (
    <View className="mb-5">
      <View className={`flex-row items-center bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-100'} rounded-2xl px-4 py-1`}>
        <Ionicons name={icon} size={20} color={error ? "#ef4444" : "#9ca3af"} />
        <TextInput
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            // Clear error while typing
            if (error) setErrors(prev => ({ ...prev, [icon.includes('mail') ? 'email' : 'password']: null }));
          }}
          className="flex-1 py-4 px-3 text-black text-[16px]"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
        />
      </View>
      {error && <Text className="text-red-500 text-xs mt-1 ml-2 font-medium">{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 pt-12">
          
          <View className="h-10 mb-8">
            {showBackButton && (
              <Pressable onPress={() => router.back()} className="w-10 h-10 items-start justify-center">
                <Ionicons name="arrow-back" size={24} color="black" />
              </Pressable>
            )}
          </View>

          <View className="mb-12">
            <Text className="text-4xl font-extrabold text-black tracking-tight">Welcome</Text>
            <Text className="text-4xl font-extrabold text-gray-300 tracking-tight">Back.</Text>
          </View>

          {/* Form Fields with passed errors */}
          <View>
            <InputField 
              icon="mail-outline" 
              placeholder="Email Address" 
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <InputField 
              icon="lock-closed-outline" 
              placeholder="Password" 
              secureTextEntry 
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
            <Text className="text-gray-400 font-medium text-right mt-1">Forgot Password?</Text>
          </View>

          <View className="mt-10 gap-6">
            {/* 4. Trigger validation on Press */}
            <Pressable onPress={handleLogin} className="bg-black py-5 rounded-3xl shadow-xl">
              <Text className="text-white text-center font-bold text-lg">Sign In</Text>
            </Pressable>
            
            <View className="flex-row items-center">
              <View className="flex-1 h-[1px] bg-gray-100" />
              <Text className="mx-4 text-gray-400 font-medium">OR</Text>
              <View className="flex-1 h-[1px] bg-gray-100" />
            </View>

            <Pressable onPress={() => router.replace("/(tabs)/home")} className="border border-gray-200 py-5 rounded-3xl">
              <Text className="text-black text-center font-bold text-lg">Continue as Demo</Text>
            </Pressable>
          </View>

          <View className="mt-auto pb-10">
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Text className="text-center text-gray-500">Don’t have an account? <Text className="text-black font-bold">Sign Up</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}