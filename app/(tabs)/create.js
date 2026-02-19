import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function CreateProject() {
    const router = useRouter();

    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null); // Track the current user's ID
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [fetchingStudents, setFetchingStudents] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [formData, setFormData] = useState({
        topic: "",
        description: "",
        dept: "CS",
        projectType: "Individual",
        assignedStudent: null, // This holds the object { _id, name }
        groupMembers: [],
        deadline: new Date(),
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [selectionType, setSelectionType] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const isAdmin = userRole === 'admin' || userRole === 'super-admin';

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
            (s.name || s.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, students]);

    const handleSelectStudent = (student) => {
        if (selectionType === "assign") {
            setFormData({ ...formData, assignedStudent: student });
        } else {
            if (!formData.groupMembers.find(m => m._id === student._id)) {
                setFormData({
                    ...formData,
                    groupMembers: [...formData.groupMembers, student]
                });
            }
        }
        setModalVisible(false);
        setSearchQuery("");
    };

    const handleCreate = async () => {
        if (!formData.topic || !formData.description) {
            Alert.alert("Missing Info", "Please provide a topic and description.");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("userToken");
            
            // LOGIC: If Admin and no student selected, it's null. 
            // If Student, it's their own ID.
            const assignedId = isAdmin 
                ? (formData.assignedStudent?._id || null) 
                : userId;

            const payload = {
                title: formData.topic,
                description: formData.description,
                type: formData.projectType,
                department: formData.dept,
                // Students don't see deadline, so we provide a default (30 days)
                deadline: isAdmin ? formData.deadline.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                assignedTo: assignedId,
                members: isAdmin ? formData.groupMembers.map(m => m._id) : []
            };

            await axios.post(`${API_URL}/projects`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert("Success", "Project initialized successfully.");
            router.back();
        } catch (err) {
            console.log("Creation Error:", err.response?.data);
            Alert.alert("Error", err.response?.data?.message || "Failed to create project.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center justify-between">
                <Pressable onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
                    <Ionicons name="close" size={22} color="black" />
                </Pressable>
                <View className="bg-slate-100 px-4 py-1.5 rounded-full">
                    <Text className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                        {userRole || 'Loading...'}
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="px-6 pt-4" contentContainerStyle={{ paddingBottom: 60 }}>
                <View className="mb-8">
                    <Text className="text-3xl font-black text-black">New Entry</Text>
                    <Text className="text-gray-400 font-medium">Research Repository Registration</Text>
                </View>

                <View className="gap-6">
                    {/* ADMIN ONLY FIELDS */}
                    {isAdmin && (
                        <>
                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase mb-3 ml-2 tracking-widest">Project Deadline</Text>
                                <Pressable 
                                    onPress={() => setShowDatePicker(true)}
                                    className="bg-indigo-50 border border-indigo-100 p-5 rounded-[25px] flex-row justify-between items-center"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="calendar" size={18} color="#6366f1" />
                                        <Text className="text-indigo-600 font-bold ml-3">
                                            {formData.deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </Text>
                                    </View>
                                    <Text className="text-[10px] font-black text-indigo-400 uppercase">Change</Text>
                                </Pressable>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={formData.deadline}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(e, date) => { setShowDatePicker(false); if(date) setFormData({...formData, deadline: date})}}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </View>

                            <View className="bg-slate-900 p-6 rounded-[35px]">
                                <Text className="text-[10px] font-black text-indigo-300 uppercase mb-3 tracking-widest">
                                    {formData.projectType === "Individual" ? "Assign Lead Student" : "Add Team Members"}
                                </Text>
                                <Pressable 
                                    onPress={() => { 
                                        setSelectionType(formData.projectType === "Individual" ? "assign" : "group"); 
                                        setModalVisible(true); 
                                    }}
                                    className="bg-white/10 p-5 rounded-[20px] flex-row justify-between items-center"
                                >
                                    <Text className={`font-bold ${formData.assignedStudent ? 'text-white' : 'text-white/40'}`}>
                                        {formData.projectType === "Individual" 
                                            ? (formData.assignedStudent?.name || formData.assignedStudent?.fullName || "Not yet assigned")
                                            : `Add Members (${formData.groupMembers.length} selected)`
                                        }
                                    </Text>
                                    <Ionicons name="add" size={18} color="white" />
                                </Pressable>
                            </View>
                        </>
                    )}

                    {/* PUBLIC FIELDS */}
                    <View>
                        <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">Research Topic</Text>
                        <TextInput
                            placeholder="e.g. Urban IoT Framework"
                            className="bg-gray-50 border border-gray-100 p-5 rounded-[25px] font-medium"
                            value={formData.topic}
                            onChangeText={(txt) => setFormData({...formData, topic: txt})}
                        />
                    </View>

                    <View>
                        <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">Description</Text>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            placeholder="Provide a brief overview..."
                            className="bg-gray-50 border border-gray-100 p-5 rounded-[25px] font-medium h-32"
                            style={{ textAlignVertical: 'top' }}
                            value={formData.description}
                            onChangeText={(txt) => setFormData({...formData, description: txt})}
                        />
                    </View>

                    <Pressable 
                        onPress={handleCreate}
                        disabled={loading}
                        className={`py-6 rounded-[30px] items-center ${loading ? 'bg-gray-400' : 'bg-black'}`}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase tracking-[2px]">Initialize Project</Text>}
                    </Pressable>
                </View>
            </ScrollView>

            {/* Selection Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white h-[70%] rounded-t-[40px] p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-black">Select Student</Text>
                            <Pressable onPress={() => setModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                                <Ionicons name="close" size={20} color="black" />
                            </Pressable>
                        </View>
                        <FlatList
                            data={filteredStudents}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <Pressable 
                                    onPress={() => handleSelectStudent(item)}
                                    className="py-5 border-b border-gray-50 flex-row justify-between items-center"
                                >
                                    <View>
                                        <Text className="font-bold text-slate-900">{item.name || item.fullName}</Text>
                                        <Text className="text-[10px] text-slate-400 font-bold uppercase">{item.department || 'Student'}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                                </Pressable>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}