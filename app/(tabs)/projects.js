import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// HARDCORE DATA DEFINED OUTSIDE THE COMPONENT
const PERSONAL_DATA = [
  { id: "p1", title: "Smart Cities IoT", dept: "Engineering", pc: "20%", phase: "Proposal" },
  { id: "p2", title: "Fintech Security", dept: "CS", pc: "60%", phase: "Methodology" },
];

const GROUP_DATA = [
  { id: "g1", title: "Drone Delivery", dept: "Robotics", pc: "45%", phase: "Design" },
  { id: "g2", title: "AI Health App", dept: "Medical", pc: "10%", phase: "Proposal" },
];

export default function ProjectList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Personal");

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50">
        <Pressable onPress={() => router.back()} className="p-2 bg-gray-100 rounded-full">
          <Ionicons name="arrow-back" size={20} color="black" />
        </Pressable>
        <Text className="text-lg font-bold italic">Archive (Admin View)</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 mt-8 mb-6">
          <Text className="text-4xl font-black text-black tracking-tighter">
            {activeTab}
          </Text>
         
          {/* TAB SWITCHER */}
          <View className="flex-row bg-gray-100 p-1.5 rounded-2xl mt-6">
            <Pressable
              onPress={() => setActiveTab("Personal")}
              style={activeTab === "Personal" ? { backgroundColor: 'white', elevation: 2, shadowOpacity: 0.1 } : null}
              className={`flex-1 py-3 rounded-xl items-center`}
            >
              <Text className={`font-bold text-xs ${activeTab === "Personal" ? "text-black" : "text-gray-400"}`}>PERSONAL</Text>
            </Pressable>
            
            <Pressable
              onPress={() => setActiveTab("Group")}
              style={activeTab === "Group" ? { backgroundColor: 'white', elevation: 2, shadowOpacity: 0.1 } : null}
              className={`flex-1 py-3 rounded-xl items-center`}
            >
              <Text className={`font-bold text-xs ${activeTab === "Group" ? "text-black" : "text-gray-400"}`}>GROUP</Text>
            </Pressable>
          </View>
        </View>

        {/* LIST SECTION */}
        <View className="px-6">
          {activeTab === "Personal" && (
            <View>
              {PERSONAL_DATA.map((item) => (
                <Pressable
                  key={item.id}
                  // NAVIGATING WITH ADMIN ROLE
                  onPress={() => router.push({
                    pathname: `/project/${item.id}`,
                    params: { role: 'admin', topic: item.title }
                  })}
                  className="p-8 rounded-[40px] mb-6 bg-black"
                >
                  <View className="flex-row justify-between items-start mb-8">
                    <View className="flex-1 pr-4">
                      <Text className="text-[10px] font-black uppercase tracking-widest mb-2 text-blue-400">{item.dept}</Text>
                      <Text className="text-2xl font-bold text-white">{item.title}</Text>
                    </View>
                    <View className="w-12 h-12 rounded-xl items-center justify-center bg-white/10">
                      <Text className="font-bold text-white">{item.pc}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-white">{item.phase}</Text>
                    <View className="p-3 rounded-full bg-white">
                      <Ionicons name="arrow-forward" size={16} color="black" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {activeTab === "Group" && (
            <View>
              {GROUP_DATA.map((item) => (
                <Pressable
                  key={item.id}
                  // NAVIGATING WITH ADMIN ROLE
                  onPress={() => router.push({
                    pathname: `/group-project/${item.id}`,
                    params: { role: 'admin', topic: item.title }
                  })}
                  className="p-8 rounded-[40px] mb-6 bg-slate-900"
                >
                  <View className="flex-row justify-between items-start mb-8">
                    <View className="flex-1 pr-4">
                      <Text className="text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-400">Team Project</Text>
                      <Text className="text-2xl font-bold text-white">{item.title}</Text>
                    </View>
                    <View className="w-12 h-12 rounded-xl items-center justify-center bg-white/10">
                      <Text className="font-bold text-white">{item.pc}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-white">{item.phase}</Text>
                    <View className="p-3 rounded-full bg-indigo-500">
                      <Ionicons name="arrow-forward" size={16} color="white" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}