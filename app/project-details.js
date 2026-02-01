import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProjectDetails() {
  const router = useRouter();

  const roadmap = [
    { label: "Topic Proposal", status: "Approved", date: "Jan 10" },
    { label: "Literature Review", status: "Approved", date: "Jan 20" },
    { label: "Methodology", status: "Pending", date: "Active" },
    { label: "Final Submission", status: "Locked", date: "TBD" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <Pressable onPress={() => router.back()} className="mt-4"><Ionicons name="arrow-back" size={24} /></Pressable>
      
      <View className="mt-6 mb-10">
        <Text className="text-3xl font-black italic">Project Journey</Text>
        <Text className="text-gray-400">Track your milestones and approvals</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {roadmap.map((step, index) => (
          <View key={index} className="flex-row mb-10">
            {/* Timeline Line & Dots */}
            <View className="items-center mr-6">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${step.status === 'Approved' ? 'bg-black' : step.status === 'Pending' ? 'bg-blue-500' : 'bg-gray-100'}`}>
                <Ionicons 
                    name={step.status === 'Approved' ? "checkmark" : step.status === 'Pending' ? "time" : "lock-closed"} 
                    size={16} color="white" 
                />
              </View>
              {index !== roadmap.length - 1 && <View className="w-1 flex-1 bg-gray-100 my-2" />}
            </View>

            {/* Content */}
            <View className="flex-1 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <View className="flex-row justify-between mb-1">
                <Text className={`font-bold text-lg ${step.status === 'Locked' ? 'text-gray-300' : 'text-black'}`}>{step.label}</Text>
                <Text className="text-[10px] font-bold text-gray-400">{step.date}</Text>
              </View>
              <Text className={`text-xs font-bold ${step.status === 'Approved' ? 'text-green-500' : 'text-blue-500'}`}>
                {step.status}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}