import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileDetails() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="flex-row justify-between items-center mt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-black font-bold">Cancel</Text>
        </Pressable>
        <Text className="text-lg font-bold">Edit Profile</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-blue-600 font-bold">Save</Text>
        </Pressable>
      </View>

      <View className="mt-10 items-center mb-10">
        <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center">
          <Ionicons name="camera-outline" size={30} color="black" />
        </View>
        <Text className="text-blue-600 mt-2 font-bold">Change Photo</Text>
      </View>

      <View className="gap-6">
        <View>
          <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Full Name</Text>
          <TextInput className="bg-gray-50 p-4 rounded-xl border border-gray-100" value="Alex Rivera" />
        </View>
        <View>
          <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Department</Text>
          <TextInput className="bg-gray-50 p-4 rounded-xl border border-gray-100" value="Computer Science" />
        </View>
      </View>
    </SafeAreaView>
  );
}