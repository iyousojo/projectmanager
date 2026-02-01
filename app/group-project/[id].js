import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdvancedManagementHub() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // --- STATE ---
  const [isAdmin] = useState(params.role === 'admin');
  const [isGroup, setIsGroup] = useState(params.isGroup === 'true' || false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0); // 0 = Proposal
  const [proposalApproved, setProposalApproved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [members, setMembers] = useState([
    { id: "m1", name: params.name || "Alex Rivera", role: "Head", topic: "AI Safety", gpa: "3.9" },
  ]);

  const allStudents = [
    { id: "s1", name: "Sarah Jenkins", gpa: "3.7", skill: "Solidity", projects: 2 },
    { id: "s2", name: "David Miller", gpa: "3.5", skill: "Python", projects: 1 },
  ];

  // --- LOGIC ---
  const canMerge = isAdmin && (proposalApproved || isGroup);

  const handleApproveProposal = () => {
    setProposalApproved(true);
    Alert.alert("Proposal Approved", "You can now merge students into this project.");
  };

  const handleAdminForceConvert = () => {
    setIsGroup(true);
    Alert.alert("Group Mode Enabled", "Please add at least one member to initialize the group workflow.");
  };

  const handleMerge = (student) => {
    setMembers([...members, { ...student, role: "Member" }]);
    setSelectedStudent(null);
    setSearchQuery("");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50">
        <Pressable onPress={() => router.back()} className="p-2 bg-gray-100 rounded-full">
          <Ionicons name="arrow-back" size={20} color="black" />
        </Pressable>
        <View className="items-center">
            <Text className="font-black text-[10px] uppercase tracking-tighter">Project Status</Text>
            <Text className={`text-[9px] font-bold ${proposalApproved ? 'text-green-500' : 'text-orange-500'}`}>
                {proposalApproved ? "PROPOSAL APPROVED" : "PROPOSAL PENDING"}
            </Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView className="px-6 pt-6">
        {/* ADMIN ACTION: APPROVAL & CONVERSION */}
        {isAdmin && (
          <View className="flex-row gap-2 mb-8">
            {!proposalApproved && (
                <Pressable onPress={handleApproveProposal} className="flex-1 bg-green-500 py-4 rounded-3xl items-center">
                    <Text className="text-white font-black text-[10px] uppercase">Approve Proposal</Text>
                </Pressable>
            )}
            {!isGroup && (
                <Pressable onPress={handleAdminForceConvert} className="flex-1 bg-indigo-600 py-4 rounded-3xl items-center">
                    <Text className="text-white font-black text-[10px] uppercase">Force Group Mode</Text>
                </Pressable>
            )}
          </View>
        )}

        {/* SEARCH BAR (LOCKED LOGIC) */}
        <Text className="text-[11px] font-black text-gray-400 uppercase mb-4 px-2">Add Team Members</Text>
        <View className={`flex-row items-center px-4 py-4 rounded-[30px] mb-8 ${canMerge ? 'bg-gray-100' : 'bg-gray-50 opacity-50'}`}>
          <Ionicons name="search" size={18} color={canMerge ? "#000" : "#ccc"} />
          <TextInput 
            placeholder={canMerge ? "Search for students..." : "Approve proposal to unlock search"} 
            editable={canMerge}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-xs"
          />
        </View>

        {/* SEARCH RESULTS */}
        {searchQuery.length > 0 && (
          <View className="bg-white border border-gray-100 rounded-3xl p-4 mb-6 shadow-xl">
            {allStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
              <Pressable key={item.id} onPress={() => setSelectedStudent(item)} className="py-3 border-b border-gray-50 flex-row justify-between">
                <Text className="font-bold">{item.name}</Text>
                <Text className="text-blue-600 font-bold text-[10px]">VIEW PROFILE</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* TEAM LIST */}
        <View className="bg-gray-50 p-6 rounded-[40px] mb-8">
          <Text className="text-[10px] font-black text-gray-400 uppercase mb-4">Current Formation</Text>
          {members.map((m) => (
            <View key={m.id} className="bg-white p-5 rounded-3xl mb-3 flex-row justify-between items-center shadow-sm">
              <View>
                <Text className="font-bold text-sm">{m.name} {m.role === 'Head' && "👑"}</Text>
                <Text className="text-[9px] text-gray-400 font-bold uppercase">{m.role}</Text>
              </View>
            </View>
          ))}
          {isGroup && members.length === 1 && (
              <View className="mt-2 items-center">
                  <Text className="text-red-400 text-[9px] font-bold">Group incomplete. Add members to start workflow.</Text>
              </View>
          )}
        </View>

        {/* WORKFLOW ACCESS (Only if members added) */}
        {members.length > 1 && (
            <Pressable 
                onPress={() => router.push('/group-workflow')}
                className="bg-black p-8 rounded-[40px] flex-row justify-between items-center mb-10"
            >
                <Text className="text-white text-xl font-black">Group Workflow</Text>
                <Ionicons name="arrow-forward-circle" size={32} color="white" />
            </Pressable>
        )}
      </ScrollView>

      {/* VETTING MODAL */}
      <Modal visible={!!selectedStudent} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white p-10 rounded-t-[50px]">
            <Text className="text-center text-2xl font-black mb-2">{selectedStudent?.name}</Text>
            <Text className="text-center text-gray-400 text-xs mb-8">Candidate Profile</Text>
            
            <View className="bg-gray-50 p-6 rounded-3xl mb-8">
              <Text className="text-[10px] font-black text-gray-400 uppercase mb-2">Academic Performance</Text>
              <Text className="font-bold">GPA: {selectedStudent?.gpa}</Text>
              <Text className="font-bold">Specialty: {selectedStudent?.skill}</Text>
            </View>

            <View className="flex-row gap-4">
              <Pressable onPress={() => setSelectedStudent(null)} className="flex-1 bg-gray-100 py-5 rounded-3xl items-center">
                <Text className="font-bold text-gray-500">Back</Text>
              </Pressable>
              <Pressable onPress={() => handleMerge(selectedStudent)} className="flex-[2] bg-indigo-600 py-5 rounded-3xl items-center">
                <Text className="text-white font-black uppercase text-xs">Merge to Team</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}