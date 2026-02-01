import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateProject() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    studentName: "",
    topic: "",
    description: "",
    dept: "Computer Science",
  });

  const handleCreate = () => {
    if (!formData.studentName || !formData.topic || !formData.description) {
      Alert.alert("Required", "Please fill in the name, topic, and description.");
      return;
    }
    Alert.alert("Success", "Project initialized into Phase 1.");
    router.back();
  };

  // Using useMemo for static styles to prevent Reanimated from 
  // flagging "render-time" style calculations if using interop
  const inputStyle = "bg-gray-50 border border-gray-100 p-5 rounded-[25px] text-black font-medium";

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <Ionicons name="close" size={22} color="black" />
        </Pressable>
        <Text className="text-lg font-bold italic tracking-tighter">New Registration</Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mb-8">
          <Text className="text-3xl font-bold text-black tracking-tight">Setup Project</Text>
          <Text className="text-gray-400">Define the scope for the supervisor roadmap.</Text>
        </View>

        {/* INPUT FIELDS */}
        <View className="gap-6 mb-8">
          <View>
            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-2 tracking-widest">Student Name</Text>
            <TextInput
              placeholder="Enter full name"
              placeholderTextColor="#aaa"
              value={formData.studentName}
              onChangeText={(txt) => setFormData({...formData, studentName: txt})}
              className={inputStyle}
            />
          </View>

          <View>
            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-2 tracking-widest">Research Topic</Text>
            <TextInput
              placeholder="e.g. Urban IoT Framework"
              placeholderTextColor="#aaa"
              value={formData.topic}
              onChangeText={(txt) => setFormData({...formData, topic: txt})}
              className={inputStyle}
            />
          </View>

          {/* PROJECT DESCRIPTION */}
          <View>
            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-2 tracking-widest">Project Description</Text>
            <TextInput
              placeholder="Describe the research goals, problem statement, and expected outcomes..."
              placeholderTextColor="#aaa"
              value={formData.description}
              onChangeText={(txt) => setFormData({...formData, description: txt})}
              multiline
              numberOfLines={4}
              className={`${inputStyle} h-32 pt-5`}
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          <View>
            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-2 tracking-widest">Department</Text>
            <View className="flex-row gap-2">
              {["Science", "CS", "Engineering"].map((dept) => (
                <Pressable 
                  key={dept}
                  onPress={() => setFormData({...formData, dept})}
                  className={`px-6 py-3 rounded-full border ${formData.dept === dept ? 'bg-black border-black' : 'bg-white border-gray-100'}`}
                >
                  <Text className={`text-[10px] font-bold ${formData.dept === dept ? 'text-white' : 'text-gray-400'}`}>
                    {dept}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* GUIDELINES INFO */}
        <View className="bg-blue-50 p-6 rounded-[35px] border border-blue-100 mb-8">
          <View className="flex-row items-center gap-2 mb-2">
             <Ionicons name="information-circle" size={18} color="#2563eb" />
             <Text className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">Admin Note</Text>
          </View>
          <Text className="text-blue-900 text-xs leading-5">
            The description provided will be visible to the student as their primary brief. Please ensure it contains clear objectives.
          </Text>
        </View>

        {/* CREATE BUTTON */}
        <Pressable 
          onPress={handleCreate}
          className="bg-black py-6 rounded-[30px] items-center shadow-xl shadow-black/10 active:opacity-90"
        >
          <Text className="text-white font-bold uppercase tracking-widest">Initialize Project</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}