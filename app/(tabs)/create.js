import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function CreateProject() {
    const router = useRouter();

    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [fetchingStudents, setFetchingStudents] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [formData, setFormData] = useState({
        topic: "",
        description: "",
        dept: "CS",
        projectType: "Individual",
        assignedStudent: null, // Used for Individual
        groupMembers: [],      // Used for Group
        deadline: new Date(),
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const isAdmin = userRole === 'admin' || userRole === 'super-admin';

    const handleSafeBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)");
        }
    }, [router]);

    useEffect(() => {
        const initializeData = async () => {
            try {
                const token = await AsyncStorage.getItem("userToken");
                const storedUser = await AsyncStorage.getItem("user");
                const parsedUser = storedUser ? JSON.parse(storedUser) : null;

                setUserRole(parsedUser?.role);
                setUserId(parsedUser?._id);

                let endpoint = "";
                if (parsedUser?.role === 'admin') {
                    endpoint = "/users/my-students";
                } else if (parsedUser?.role === 'super-admin') {
                    endpoint = "/users/superadmin/students";
                }

                if (endpoint) {
                    const res = await axios.get(`${API_URL}${endpoint}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setStudents(res.data);
                }
            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                setFetchingStudents(false);
            }
        };
        initializeData();
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter(s =>
            (s.fullName || s.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, students]);

    // NEW LOGIC: Handles single select for Individual and toggle multi-select for Group
    const handleSelectStudent = (student) => {
        if (formData.projectType === "Individual") {
            setFormData({ ...formData, assignedStudent: student });
            setModalVisible(false); // Close immediately for individual
        } else {
            const isSelected = formData.groupMembers.find(m => m._id === student._id);
            if (isSelected) {
                setFormData({
                    ...formData,
                    groupMembers: formData.groupMembers.filter(m => m._id !== student._id)
                });
            } else {
                setFormData({
                    ...formData,
                    groupMembers: [...formData.groupMembers, student]
                });
            }
            // Don't close modal so user can pick more
        }
    };

    const removeMember = (id) => {
        setFormData({
            ...formData,
            groupMembers: formData.groupMembers.filter(m => m._id !== id)
        });
    };

    const handleCreate = async () => {
        if (!formData.topic || !formData.description) {
            Alert.alert("Required", "Please provide a topic and description.");
            return;
        }

        const hasIndividualAssigned = formData.projectType === "Individual" && formData.assignedStudent;
        const hasGroupAssigned = formData.projectType === "Group" && formData.groupMembers.length > 0;

        if (isAdmin && !hasIndividualAssigned && !hasGroupAssigned) {
            Alert.alert("Selection Required", "Please assign at least one student to this project.");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("userToken");

            const payload = {
                title: formData.topic,
                description: formData.description,
                projectType: formData.projectType,
                department: formData.dept,
                deadline: formData.deadline.toISOString(),
                // If Individual, use assignedStudent. If Group, use the first person in list as primary (or null based on your API)
                assignedTo: isAdmin 
                    ? (formData.projectType === "Individual" ? formData.assignedStudent?._id : formData.groupMembers[0]?._id) 
                    : userId,
                supervisor: isAdmin ? userId : null,
                members: formData.projectType === "Group" ? formData.groupMembers.map(m => m._id) : [],
                status: "active"
            };

            await axios.post(`${API_URL}/projects`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert("Success", "Project initialized successfully.", [
                { text: "OK", onPress: handleSafeBack }
            ]);
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to create project.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center justify-between">
                <Pressable onPress={handleSafeBack} className="p-2 bg-gray-50 rounded-full">
                    <Ionicons name="close" size={22} color="black" />
                </Pressable>
                <Text className="font-black uppercase text-[12px] tracking-widest text-slate-400">Initialize Project</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="px-6 pt-4" contentContainerStyle={{ paddingBottom: 60 }}>
                {isAdmin && (
                    <View className="flex-row bg-gray-100 p-1.5 rounded-[20px] mb-8">
                        {["Individual", "Group"].map((type) => (
                            <Pressable
                                key={type}
                                onPress={() => setFormData({ ...formData, projectType: type })}
                                className={`flex-1 py-3 rounded-[15px] items-center ${formData.projectType === type ? 'bg-white' : ''}`}
                                style={formData.projectType === type ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 } : {}}
                            >
                                <Text className={`font-bold ${formData.projectType === type ? 'text-indigo-600' : 'text-gray-400'}`}>{type}</Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                <View className="gap-6">
                    <View>
                        <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">Research Topic</Text>
                        <TextInput
                            placeholder="Enter project title..."
                            className="bg-gray-50 border border-gray-100 p-5 rounded-[25px] font-bold text-slate-800"
                            value={formData.topic}
                            onChangeText={(txt) => setFormData({ ...formData, topic: txt })}
                        />
                    </View>

                    <View>
                        <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">Project Scope</Text>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            placeholder="Describe the objectives..."
                            className="bg-gray-50 border border-gray-100 p-5 rounded-[25px] font-medium h-32"
                            style={{ textAlignVertical: 'top' }}
                            value={formData.description}
                            onChangeText={(txt) => setFormData({ ...formData, description: txt })}
                        />
                    </View>

                    {isAdmin && (
                        <>
                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">
                                    {formData.projectType === "Individual" ? "Assign Student" : "Group Members"}
                                </Text>
                                
                                {/* UI for Group Selection - Chips */}
                                {formData.projectType === "Group" && formData.groupMembers.length > 0 && (
                                    <View className="flex-row flex-wrap gap-2 mb-3 px-2">
                                        {formData.groupMembers.map(member => (
                                            <View key={member._id} className="bg-indigo-100 px-3 py-2 rounded-full flex-row items-center">
                                                <Text className="text-indigo-700 font-bold text-xs mr-2">{member.fullName || member.name}</Text>
                                                <Pressable onPress={() => removeMember(member._id)}>
                                                    <Ionicons name="close-circle" size={16} color="#4338ca" />
                                                </Pressable>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                <Pressable
                                    onPress={() => setModalVisible(true)}
                                    className="bg-slate-900 p-5 rounded-[25px] flex-row justify-between items-center"
                                >
                                    <View className="flex-1">
                                        <Text className="text-white font-bold">
                                            {formData.projectType === "Individual" 
                                                ? (formData.assignedStudent?.fullName || "Select from directory")
                                                : `Add Members (${formData.groupMembers.length} selected)`}
                                        </Text>
                                    </View>
                                    <Ionicons name={formData.projectType === "Individual" ? "person-add" : "people-outline"} size={18} color="white" />
                                </Pressable>
                            </View>

                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">Project Deadline</Text>
                                <Pressable
                                    onPress={() => setShowDatePicker(true)}
                                    className="bg-indigo-50 border border-indigo-100 p-5 rounded-[25px] flex-row justify-between items-center"
                                >
                                    <Text className="text-indigo-600 font-bold">
                                        {formData.deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                    <Ionicons name="calendar" size={18} color="#6366f1" />
                                </Pressable>
                            </View>
                        </>
                    )}

                    {showDatePicker && (
                        <DateTimePicker
                            value={formData.deadline}
                            mode="date"
                            display="default"
                            onChange={(e, date) => { setShowDatePicker(false); if (date) setFormData({ ...formData, deadline: date }) }}
                            minimumDate={new Date()}
                        />
                    )}

                    <Pressable
                        onPress={handleCreate}
                        disabled={loading}
                        className={`py-6 rounded-[30px] items-center mt-4 ${loading ? 'bg-gray-400' : 'bg-black'}`}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase tracking-[2px]">Initialize Project</Text>}
                    </Pressable>
                </View>
            </ScrollView>

            <Modal 
                visible={modalVisible} 
                animationType="slide" 
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View className="bg-white h-[80%] rounded-t-[40px] p-6 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-2xl font-black">Student List</Text>
                                {formData.projectType === "Group" && (
                                    <Text className="text-indigo-500 font-bold text-xs">{formData.groupMembers.length} Selected</Text>
                                )}
                            </View>
                            <Pressable onPress={() => setModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                                <Ionicons name="checkmark-done" size={24} color="#6366f1" />
                            </Pressable>
                        </View>

                        <TextInput
                            placeholder="Search by name..."
                            className="bg-gray-100 p-4 rounded-2xl mb-4 font-bold"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <FlatList
                            data={filteredStudents}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => {
                                const isSelected = formData.projectType === "Individual" 
                                    ? formData.assignedStudent?._id === item._id
                                    : formData.groupMembers.find(m => m._id === item._id);

                                return (
                                    <Pressable
                                        onPress={() => handleSelectStudent(item)}
                                        className={`py-4 px-4 rounded-2xl mb-2 flex-row justify-between items-center ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'bg-white'}`}
                                    >
                                        <View>
                                            <Text className={`font-bold text-lg ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                                                {item.fullName || item.name}
                                            </Text>
                                            <Text className="text-[10px] text-gray-400 font-bold uppercase">{item.email}</Text>
                                        </View>
                                        <View className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                            {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                                        </View>
                                    </Pressable>
                                );
                            }}
                            ListEmptyComponent={() => (
                                <View className="py-20 items-center">
                                    <Text className="text-gray-400 font-bold">No students found.</Text>
                                </View>
                            )}
                        />
                        
                        {formData.projectType === "Group" && (
                             <Pressable 
                                onPress={() => setModalVisible(false)}
                                className="bg-indigo-600 py-4 rounded-2xl items-center mt-2"
                             >
                                <Text className="text-white font-black uppercase">Done Selecting</Text>
                             </Pressable>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}