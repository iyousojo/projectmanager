import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConvertedGroupsList() {
  const router = useRouter();

  // Mock Data
  const [activeGroups] = useState([
    { id: "p1", title: "AI Ethics Research", head: "Alex Rivera", members: 3, isGroup: true, stage: "Methodology" },
    { id: "p2", title: "Smart Irrigation", head: "Sarah Jenkins", members: 2, isGroup: true, stage: "Proposal" },
  ]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Text className="text-2xl font-black">Active Groups</Text>
        <View className="bg-indigo-100 px-3 py-1 rounded-full">
            <Text className="text-indigo-600 text-[10px] font-bold">{activeGroups.length} TOTAL</Text>
        </View>
      </View>

      <ScrollView className="px-6 pt-4">
        {activeGroups.map((group) => (
          <Pressable 
            key={group.id}
            // NAVIGATE TO WORKSPACE
            onPress={() => router.push({
                pathname: "/group-workspace",
                params: { 
                    id: group.id, 
                    title: group.title, 
                    head: group.head 
                }
            })}
            className="bg-gray-50 p-6 rounded-[35px] mb-4 border border-gray-100 shadow-sm"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-lg font-black text-gray-800">{group.title}</Text>
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{group.stage}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-indigo-600 rounded-full items-center justify-center">
                  <Text className="text-white text-[10px] font-bold">{group.head[0]}</Text>
                </View>
                <Text className="ml-2 text-xs font-bold text-gray-600">{group.head} (Head)</Text>
              </View>
              <Text className="text-[10px] font-black text-indigo-600 bg-white px-3 py-1 rounded-lg">
                {group.members} MEMBERS
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}