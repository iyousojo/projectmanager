import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TaskDetails() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <Pressable onPress={() => router.back()} className="mt-4 w-10 h-10 bg-gray-50 rounded-xl items-center justify-center">
        <Ionicons name="close" size={24} color="black" />
      </Pressable>

      <View className="mt-8">
        <View className="bg-orange-100 self-start px-3 py-1 rounded-lg mb-4">
          <Text className="text-orange-600 font-bold text-xs uppercase">Priority: High</Text>
        </View>
        <Text className="text-3xl font-bold text-black leading-tight">Submit Documentation Phase 1</Text>
        
        <View className="mt-10 gap-6">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4">
              <Ionicons name="time-outline" size={20} color="black" />
            </View>
            <View>
              <Text className="text-gray-400 text-xs">Due Time</Text>
              <Text className="font-bold text-black">Today, 11:59 PM</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4">
              <Ionicons name="document-text-outline" size={20} color="black" />
            </View>
            <View>
              <Text className="text-gray-400 text-xs">Requirement</Text>
              <Text className="font-bold text-black">PDF Format only</Text>
            </View>
          </View>
        </View>

        <Pressable className="bg-black py-5 rounded-2xl mt-12 shadow-lg">
          <Text className="text-white text-center font-bold">Mark as Complete</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}