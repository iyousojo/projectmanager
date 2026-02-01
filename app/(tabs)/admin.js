import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Defined outside to keep the render function light
const STUDENT_DATA = [
  { id: "1", name: "Alex Rivera", progress: 20, topic: "Smart Cities IoT", status: "Submitted" },
  { id: "2", name: "Muna Chi", progress: 50, topic: "Fintech Security", status: "Working" },
];

const GROUP_DATA = [
  { id: "g1", name: "Team Alpha", topic: "Drone Delivery", progress: 45, members: "Alex, Muna", status: "Submitted" },
];

export default function AdminScreen() {
  const router = useRouter();
  const [activeView, setActiveView] = useState("Individual");

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 mt-4 mb-6">
        <Text className="text-3xl font-bold text-black italic tracking-tighter">Supervision</Text>
        
        {/* TAB SWITCHER */}
        <View className="flex-row bg-gray-100 p-1 rounded-2xl mt-6">
          <Pressable 
            onPress={() => setActiveView("Individual")}
            style={activeView === "Individual" ? { backgroundColor: 'white', elevation: 2 } : null}
            className="flex-1 py-3 rounded-xl items-center"
          >
            <Text className={`font-bold text-xs ${activeView === "Individual" ? "text-black" : "text-gray-400"}`}>INDIVIDUAL</Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveView("Group")}
            style={activeView === "Group" ? { backgroundColor: 'white', elevation: 2 } : null}
            className="flex-1 py-3 rounded-xl items-center"
          >
            <Text className={`font-bold text-xs ${activeView === "Group" ? "text-black" : "text-gray-400"}`}>GROUPS</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="px-6">
        {/* Render lists separately to avoid the CSS Interop crash */}
        {activeView === "Individual" && (
          <View>
            {STUDENT_DATA.map((student) => (
              <Pressable 
                key={student.id} 
                onPress={() => router.push(`/project/${student.id}`)}
                className={`p-6 rounded-[30px] mb-4 flex-row items-center justify-between border ${student.status === "Submitted" ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}
              >
                <View className="flex-1">
                  <Text className="text-lg font-bold text-black">{student.name}</Text>
                  <Text className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">{student.topic}</Text>
                  <View className="flex-row items-center gap-3">
                    <View className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <View style={{ width: `${student.progress}%` }} className="h-full bg-black" />
                    </View>
                    <Text className="text-[10px] font-bold text-gray-400">{student.progress}%</Text>
                  </View>
                </View>
                <View className="p-2 rounded-full bg-black">
                  <Ionicons name="chevron-forward" size={16} color="white" />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {activeView === "Group" && (
          <View>
            {GROUP_DATA.map((group) => (
              <Pressable 
                key={group.id} 
                onPress={() => router.push(`/group-project/${group.id}`)}
                className={`p-6 rounded-[30px] mb-4 flex-row items-center justify-between border ${group.status === "Submitted" ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}
              >
                <View className="flex-1">
                  <Text className="text-lg font-bold text-black">{group.name}</Text>
                  <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">{group.topic}</Text>
                  <Text className="text-[10px] text-gray-400 mb-3">Members: {group.members}</Text>
                  <View className="flex-row items-center gap-3">
                    <View className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <View style={{ width: `${group.progress}%` }} className="h-full bg-indigo-600" />
                    </View>
                    <Text className="text-[10px] font-bold text-gray-400">{group.progress}%</Text>
                  </View>
                </View>
                <View className="p-2 rounded-full bg-indigo-600">
                  <Ionicons name="chevron-forward" size={16} color="white" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}