import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationDetails() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <Pressable onPress={() => router.back()} className="mt-4 p-2">
        <Ionicons name="arrow-back" size={24} color="black" />
      </Pressable>

      <View className="mt-8 items-center">
        <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6">
          <Ionicons name="notifications" size={40} color="#3b82f6" />
        </View>
        <Text className="text-2xl font-bold text-center">New Feedback Received</Text>
        <Text className="text-gray-400 text-center mt-2 px-10">
          Your supervisor, Dr. Smith, left a comment on your recent submission.
        </Text>
      </View>

      <View className="mt-10 bg-gray-50 p-6 rounded-3xl border border-gray-100">
        <Text className="italic text-gray-600">
          "The data analysis looks solid, but please double-check the bibliography formatting before the final push."
        </Text>
      </View>

      <Pressable className="mt-10 border border-black py-4 rounded-2xl">
        <Text className="text-black text-center font-bold">Reply to Supervisor</Text>
      </Pressable>
    </SafeAreaView>
  );
}