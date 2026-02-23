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
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
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
        assignedStudent: null,
        groupMembers: [],
        deadline: new Date(),
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const isAdmin = userRole === 'admin' || userRole === 'super-admin';
    const handleSafeBack = useCallback(() => {
        router.canGoBack() ? router.back() : router.replace("/(tabs)");
    }, [router]);
    useEffect(() => {
        const initializeData = async () => {
            try {
                const token = await AsyncStorage.getItem("userToken");
                const storedUser = await AsyncStorage.getItem("userData");
                const parsedUser = storedUser ? JSON.parse(storedUser) : null;
                setUserRole(parsedUser?.role);
                setUserId(parsedUser?._id);
                if (parsedUser?.role === 'admin' || parsedUser?.role === 'super-admin') {
                    const endpoint = parsedUser.role === 'admin' ? "/users/my-students" : "/users/superadmin/students";
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
    const handleSelectStudent = (student) => {
        if (formData.projectType === "Individual") {
            setFormData({ ...formData, assignedStudent: student, groupMembers: [] });
            setModalVisible(false);
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
                    groupMembers: [...formData.groupMembers, student],
                    assignedStudent: null
                });
            }
        }
    };
    const handleCreate = async () => {
        if (!formData.topic || !formData.description) {
            return Alert.alert("Required", "Please provide a topic and description.");
        }
        const isGroup = formData.projectType === "Group";
        const hasAssignment = isGroup ? formData.groupMembers.length > 0 : formData.assignedStudent;
        if (isAdmin && !hasAssignment) {
            return Alert.alert("Selection Required", "Please assign student(s) to this project.");
        }
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("userToken");
            const payload = {
                title: formData.topic,
                description: formData.description,
                projectType: formData.projectType,
                department: formData.dept,
                // If not admin, we might send a default deadline or the backend handles it
                deadline: formData.deadline.toISOString(),
                assignedTo: isAdmin
                    ? (isGroup ? formData.groupMembers[0]?._id : formData.assignedStudent?._id)
                    : userId,
                supervisor: isAdmin ? userId : null,
                members: isGroup ? formData.groupMembers.map(m => m._id) : [],
                status: "active"
            };
            await axios.post(`${API_URL}/projects`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert("Success", "Project initialized.", [{ text: "OK", onPress: handleSafeBack }]);
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to create project.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50">
                <Pressable onPress={handleSafeBack} className="p-2 bg-gray-50 rounded-full">
                    <Ionicons name="close" size={22} color="black" />
                </Pressable>
                <Text className="font-black uppercase text-[12px] tracking-widest text-slate-400">Initialize Project</Text>
                <View className="w-10" />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} className="px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
                {isAdmin && (
                    <View className="flex-row bg-gray-100 p-1.5 rounded-3xl mb-8">
                        {["Individual", "Group"].map((type) => (
                            <Pressable
                                key={type}
                                onPress={() => setFormData({ ...formData, projectType: type })}
                                className={`flex-1 py-3 rounded-2xl items-center ${formData.projectType === type ? 'bg-white' : ''}`}
                                style={formData.projectType === type ? styles.activeToggle : null}
                            >
                                <Text className={`font-bold ${formData.projectType === type ? 'text-indigo-600' : 'text-gray-400'}`}>{type}</Text>
                            </Pressable>
                        ))}
                    </View>
                )}
                <View className="space-y-6">
                    <View>
                        <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">Project Title</Text>
                        <TextInput
                            placeholder="e.g. AI-driven Task Management"
                            className="bg-gray-50 border border-gray-100 p-5 rounded-[25px] font-bold text-slate-800"
                            value={formData.topic}
                            onChangeText={(txt) => setFormData({ ...formData, topic: txt })}
                        />
                    </View>
                    <View>
                        <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">Research Scope</Text>
                        <TextInput
                            multiline
                            placeholder="Outline the main objectives..."
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
                                    {formData.projectType === "Individual" ? "Assign Student" : "Project Members"}
                                </Text>
                               
                                {formData.projectType === "Group" && formData.groupMembers.length > 0 && (
                                    <View className="flex-row flex-wrap gap-2 mb-3">
                                        {formData.groupMembers.map(member => (
                                            <View key={member._id} className="bg-indigo-50 px-3 py-2 rounded-full flex-row items-center border border-indigo-100">
                                                <Text className="text-indigo-700 font-bold text-[11px] mr-2">{member.fullName || member.name}</Text>
                                                <Pressable onPress={() => setFormData({...formData, groupMembers: formData.groupMembers.filter(m => m._id !== member._id)})}>
                                                    <Ionicons name="close-circle" size={16} color="#6366f1" />
                                                </Pressable>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                <Pressable
                                    onPress={() => setModalVisible(true)}
                                    className="bg-slate-900 p-5 rounded-[25px] flex-row justify-between items-center"
                                    style={styles.assignButton}
                                >
                                    <Text className="text-white font-bold flex-1">
                                        {formData.projectType === "Individual"
                                            ? (formData.assignedStudent?.fullName || "Select from directory")
                                            : `Manage Group (${formData.groupMembers.length})`}
                                    </Text>
                                    <Ionicons name={formData.projectType === "Individual" ? "person-add" : "people"} size={18} color="white" />
                                </Pressable>
                            </View>
                            {/* DEADLINE MOVED INSIDE isAdmin CHECK */}
                            <View className="mt-6">
                                <Text className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-2 tracking-widest">Expected Completion</Text>
                                <Pressable
                                    onPress={() => setShowDatePicker(true)}
                                    className="bg-indigo-50 border border-indigo-100 p-5 rounded-[25px] flex-row justify-between items-center"
                                >
                                    <Text className="text-indigo-600 font-bold">
                                        {formData.deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                    <Ionicons name="calendar-clear" size={18} color="#6366f1" />
                                </Pressable>
                            </View>
                        </>
                    )}
                    {showDatePicker && (
                        <DateTimePicker
                            value={formData.deadline}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(e, date) => { setShowDatePicker(false); if (date) setFormData({ ...formData, deadline: date }) }}
                            minimumDate={new Date()}
                        />
                    )}
                    <Pressable
                        onPress={handleCreate}
                        disabled={loading}
                        className={`py-5 rounded-[25px] items-center mt-6 ${loading ? 'bg-gray-400' : 'bg-indigo-600'}`}
                        style={styles.createButton}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase tracking-widest">Deploy Project</Text>}
                    </Pressable>
                </View>
            </ScrollView>
            {/* Selection Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white h-[85%] rounded-t-[40px] p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-2xl font-black text-slate-900">Directory</Text>
                                <Text className="text-indigo-500 font-bold text-xs">{formData.projectType} Selection</Text>
                            </View>
                            <Pressable onPress={() => setModalVisible(false)} className="bg-indigo-600 p-3 rounded-2xl" style={styles.doneButton}>
                                <Ionicons name="checkmark" size={24} color="white" />
                            </Pressable>
                        </View>
                        <TextInput
                            placeholder="Search students..."
                            className="bg-gray-100 p-4 rounded-2xl mb-4 font-bold"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <FlatList
                            data={filteredStudents}
                            keyExtractor={(item) => item._id}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const isSelected = formData.projectType === "Individual"
                                    ? formData.assignedStudent?._id === item._id
                                    : formData.groupMembers.some(m => m._id === item._id);
                                return (
                                    <Pressable
                                        onPress={() => handleSelectStudent(item)}
                                        className={`p-4 rounded-2xl mb-3 flex-row justify-between items-center border ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}
                                    >
                                        <View className="flex-1">
                                            <Text className={`font-bold text-base ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>{item.fullName || item.name}</Text>
                                            <Text className="text-[10px] text-gray-400 font-bold">{item.email}</Text>
                                        </View>
                                        <View className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                            {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                                        </View>
                                    </Pressable>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    activeToggle: Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
        android: { elevation: 1 },
    }),
    assignButton: Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
        android: { elevation: 5 },
    }),
    createButton: Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
        android: { elevation: 7 },
    }),
    doneButton: Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
        android: { elevation: 3 },
    }),
});