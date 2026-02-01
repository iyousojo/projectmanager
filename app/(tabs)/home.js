import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react"; // Added useState
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const router = useRouter();

  // --- LOGIC STATE ---
  const isAdmin = true; 
  // State to simulate a new task submission notification
  const [hasNewSubmission, setHasNewSubmission] = useState(true);

  const crispShadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4, 
  };

  const activeProjects = [
    { id: 1, title: "Thesis Research", dept: "Science", time: "2d left", progress: 75, color: "#1a1a1a" },
    { id: 2, title: "App Development", dept: "CS", time: "5d left", progress: 45, color: "#4f46e5" },
  ];

  // Logic for the Alert Action
  const handleAlertPress = () => {
    Alert.alert(
      "Task Submission",
      "Sarah Chen has submitted 'Literature Review Draft'. Would you like to review it now?",
      [
        { text: "Later", style: "cancel" },
        { 
          text: "Review Now", 
          onPress: () => {
            setHasNewSubmission(false); // Clear alert dot
            router.push("/admin"); // Navigate to review area
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <ScrollView showsVerticalScrollIndicator={false} className="px-6 pt-4">
        
        {/* HEADER AREA */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-gray-400 text-sm font-semibold uppercase tracking-tighter">Jan 2026</Text>
            <Text className="text-3xl font-bold text-black tracking-tight">Dashboard</Text>
          </View>

          <View className="flex-row items-center gap-3">
            {/* ADMIN ALERT BUTTON (Bell Icon) */}
            {isAdmin && (
              <Pressable 
                onPress={handleAlertPress}
                style={crispShadow}
                className="w-11 h-11 rounded-2xl bg-white border border-gray-100 items-center justify-center"
              >
                <Ionicons name="notifications-outline" size={22} color="black" />
                {/* Red Logic Dot: Visible only if there's a submission */}
                {hasNewSubmission && (
                  <View className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
              </Pressable>
            )}

            {/* ADMIN DIRECTORY ICON */}
            {isAdmin && (
              <Pressable 
                onPress={() => router.push("/admin")} 
                style={crispShadow}
                className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 items-center justify-center"
              >
                <Ionicons name="people-outline" size={22} color="black" />
              </Pressable>
            )}

            {/* PROFILE ICON */}
            <Pressable 
              onPress={() => router.push("/profile-details")} 
              style={crispShadow}
              className="w-11 h-11 rounded-2xl bg-white border border-gray-100 items-center justify-center"
            >
              <Ionicons name="person" size={20} color="black" />
            </Pressable>
          </View>
        </View>

        {/* HERO CARD */}
        <Pressable 
          onPress={() => router.push("/task-details")} 
          className="bg-black p-6 rounded-[30px] mb-8"
        >
          <Text className="text-white text-xl font-bold leading-7 mb-6">
            Submit Final Year Project Documentation Phase 1
          </Text>
          <View className="flex-row items-center gap-4">
            <View className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <View style={{ width: '82%' }} className="h-full bg-white rounded-full" />
            </View>
            <Text className="text-white font-bold text-xs">82%</Text>
          </View>
        </Pressable>

        {/* TRACKERS HEADER */}
        <View className="flex-row justify-between items-end mb-4">
          <Text className="text-lg font-bold text-black italic">Active Trackers</Text>
          <Pressable onPress={() => router.push("/projects")}> 
            <Text className="text-gray-400 text-xs font-bold">View all</Text>
          </Pressable>
        </View>

        {activeProjects.map((project) => (
          <Pressable 
            key={project.id} 
            onPress={() => router.push({ pathname: "/project-details", params: { id: project.id } })} 
            style={crispShadow}
            className="flex-row items-center bg-white border border-gray-100 p-4 rounded-2xl mb-3"
          >
            <View style={{ backgroundColor: project.color }} className="w-12 h-12 rounded-xl items-center justify-center mr-4">
              <Ionicons name="folder-outline" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-black font-bold text-[15px] mb-0.5">{project.title}</Text>
              <Text className="text-gray-400 text-[11px] font-medium uppercase">{project.dept} • {project.time}</Text>
            </View>
            <View className="bg-gray-100 px-2.5 py-1 rounded-lg">
              <Text className="text-black font-bold text-[10px]">{project.progress}%</Text>
            </View>
          </Pressable>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}