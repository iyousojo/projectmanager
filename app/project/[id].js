import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GroupManagementHub() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // --- STATE ---
  const [isAdmin] = useState(params.role === 'admin');
  const [isGroup, setIsGroup] = useState(params.isGroup === 'true' || false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [members, setMembers] = useState([
    { id: "m1", name: params.name || "Alex Rivera", role: "Head", topic: "AI Safety", gpa: "3.9", skill: "Research" },
  ]);

  // Mock Database for Search
  const allStudents = [
    { id: "s1", name: "Sarah Jenkins", topic: "Blockchain", gpa: "3.7", skill: "Solidity", projects: 2 },
    { id: "s2", name: "David Miller", topic: "Cybersec", gpa: "3.5", skill: "Python", projects: 1 },
    { id: "s3", name: "Muna Chi", topic: "Data Science", gpa: "3.8", skill: "R, SQL", projects: 3 },
    { id: "s4", name: "James Bond", topic: "Hardware", gpa: "3.2", skill: "C++", projects: 0 },
  ];

  const filteredCandidates = allStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !members.find(m => m.id === s.id)
  );

  // --- ACTIONS ---
  const handleMerge = (student) => {
    setMembers([...members, { ...student, role: "Member" }]);
    setIsGroup(true);
    setSelectedStudent(null);
    setSearchQuery("");
  };

  const promoteToHead = (id) => {
    setMembers(members.map(m => ({ ...m, role: m.id === id ? "Head" : "Member" })));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* SEARCH HEADER */}
      <View className="px-6 py-4 border-b border-gray-50">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} className="p-2 bg-gray-100 rounded-full">
            <Ionicons name="arrow-back" size={20} color="black" />
          </Pressable>
          <Text className="font-black text-xs uppercase tracking-widest">Team Formation</Text>
          <View className="w-10" />
        </View>
        
        {isAdmin && (
          <View className="flex-row items-center bg-gray-100 px-4 py-3 rounded-2xl">
            <Ionicons name="search" size={18} color="#999" />
            <TextInput 
              placeholder="Search students by name or skill..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-xs"
            />
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* SEARCH RESULTS DROPDOWN */}
        {searchQuery.length > 0 && (
          <View className="bg-white border border-gray-100 rounded-3xl shadow-xl p-4 mb-6">
            {filteredCandidates.map(item => (
              <Pressable 
                key={item.id} 
                onPress={() => setSelectedStudent(item)}
                className="flex-row justify-between items-center py-3 border-b border-gray-50"
              >
                <View>
                  <Text className="font-bold text-sm">{item.name}</Text>
                  <Text className="text-[10px] text-gray-400">{item.skill} • GPA: {item.gpa}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </Pressable>
            ))}
          </View>
        )}

        {/* CURRENT ACTIVE TEAM */}
        <Text className="text-[11px] font-black text-gray-400 uppercase mb-4 tracking-tighter">Current Group Members</Text>
        <View className="bg-gray-50 p-6 rounded-[40px] mb-8">
          {members.map((m) => (
            <View key={m.id} className="bg-white p-5 rounded-3xl mb-3 flex-row justify-between items-center shadow-sm">
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${m.role === 'Head' ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                  <Text className="text-white font-bold">{m.name[0]}</Text>
                </View>
                <View>
                  <Text className="font-bold text-sm">{m.name} {m.role === 'Head' && "👑"}</Text>
                  <Text className="text-[9px] text-gray-400 font-bold uppercase">{m.role}</Text>
                </View>
              </View>
              {isAdmin && m.role !== 'Head' && (
                <Pressable onPress={() => promoteToHead(m.id)} className="bg-indigo-50 px-3 py-2 rounded-xl">
                  <Text className="text-indigo-600 text-[8px] font-black">PROMOTE</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* WORKFLOW ACCESS */}
        {isGroup && (
          <Pressable 
            onPress={() => router.push('/group-workflow')}
            className="bg-black p-8 rounded-[40px] flex-row justify-between items-center"
          >
            <View>
              <Text className="text-white text-xl font-black">Open Workflow</Text>
              <Text className="text-white/50 text-[10px] font-bold uppercase">Tasks, Chat & History</Text>
            </View>
            <View className="bg-white/20 p-4 rounded-full">
              <Ionicons name="flash" size={24} color="white" />
            </View>
          </Pressable>
        )}
      </ScrollView>

      {/* VETTING MODAL */}
      <Modal visible={!!selectedStudent} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white p-10 rounded-t-[50px] shadow-2xl">
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-indigo-50 rounded-full items-center justify-center mb-4">
                <Text className="text-indigo-600 text-3xl font-black">{selectedStudent?.name[0]}</Text>
              </View>
              <Text className="text-2xl font-black">{selectedStudent?.name}</Text>
              <Text className="text-gray-400 text-xs italic">Expertise in {selectedStudent?.skill}</Text>
            </View>

            <View className="flex-row justify-between mb-10">
              <View className="bg-gray-50 flex-1 p-4 rounded-3xl mr-2 items-center">
                <Text className="text-[9px] font-black text-gray-400 uppercase">GPA Score</Text>
                <Text className="text-lg font-bold">{selectedStudent?.gpa}</Text>
              </View>
              <View className="bg-gray-50 flex-1 p-4 rounded-3xl ml-2 items-center">
                <Text className="text-[9px] font-black text-gray-400 uppercase">Prev Projects</Text>
                <Text className="text-lg font-bold">{selectedStudent?.projects}</Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <Pressable onPress={() => setSelectedStudent(null)} className="flex-1 bg-gray-100 py-5 rounded-3xl items-center">
                <Text className="font-bold text-gray-500">Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={() => handleMerge(selectedStudent)}
                className="flex-[2] bg-indigo-600 py-5 rounded-3xl items-center"
              >
                <Text className="text-white font-black uppercase text-xs">Merge into Group</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}