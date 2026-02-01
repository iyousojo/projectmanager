import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GroupWorkflow() {
  const router = useRouter();
  
  const [tasks] = useState([
    { id: 1, user: "Alex (Head)", status: "Completed", title: "Chapter 1: Proposal Draft", date: "Jan 28" },
    { id: 2, user: "Muna (Member)", status: "Pending", title: "Literature Review - Source 1-10", date: "Jan 30" },
  ]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={24} color="black" />
        </Pressable>
        <Text className="font-black text-lg">Group Workflow</Text>
        <Ionicons name="settings-outline" size={20} color="black" />
      </View>

      <ScrollView className="px-6 pt-6">
        {/* CURRENT STAGE PROGRESS */}
        <View className="bg-indigo-600 p-8 rounded-[40px] mb-8">
          <Text className="text-white/60 text-[10px] font-bold uppercase mb-2">Stage 2: Literature Review</Text>
          <Text className="text-white text-2xl font-black mb-6">45% Progress</Text>
          <View className="h-1.5 bg-white/20 rounded-full">
            <View className="h-full bg-white w-[45%] rounded-full" />
          </View>
        </View>

        {/* ACTIVITY & TASK HISTORY */}
        <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Task History</Text>
        {tasks.map(task => (
          <View key={task.id} className="bg-white p-5 rounded-3xl mb-4 border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <View className={`px-2 py-1 rounded-md ${task.status === 'Completed' ? 'bg-green-100' : 'bg-orange-100'}`}>
                <Text className={`text-[8px] font-bold ${task.status === 'Completed' ? 'text-green-600' : 'text-orange-600'}`}>
                  {task.status.toUpperCase()}
                </Text>
              </View>
              <Text className="text-[10px] text-gray-400">{task.date}</Text>
            </View>
            <Text className="font-bold text-sm text-gray-800 mb-1">{task.title}</Text>
            <Text className="text-[10px] text-gray-500">Submitted by {task.user}</Text>
          </View>
        ))}

        {/* GROUP CHAT PREVIEW */}
        <View className="bg-slate-900 p-6 rounded-[35px] mt-4 mb-20">
          <Text className="text-white font-bold mb-4">Team Updates</Text>
          <View className="bg-white/10 p-4 rounded-2xl mb-2">
             <Text className="text-white/80 text-[11px]">Admin: "Please update the bibliography by tomorrow."</Text>
          </View>
        </View>
      </ScrollView>

      {/* INPUT BAR */}
      <View className="p-6 bg-white border-t border-gray-100 flex-row gap-4">
        <TextInput placeholder="Type a message or update..." className="flex-1 bg-gray-50 p-4 rounded-2xl text-xs" />
        <Pressable className="bg-indigo-600 p-4 rounded-2xl">
          <Ionicons name="send" size={18} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}