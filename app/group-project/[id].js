import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://projectmanagerapi-o885.onrender.com/api";

export default function GroupProjectDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [project, setProject] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Exact enum values from your schema
    const statusOptions = ["Pending", "Proposal", "Implementation", "Testing", "Completed"];

    // --- ADVANCED DEBUGGER ---
    const debugLog = (context, error) => {
        console.log(`\n🔴 --- [GROUP DETAIL DEBUG]: ${context} ---`);
        console.log(`Target Project ID: ${id}`);
        
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Backend Message:`, JSON.stringify(error.response.data, null, 2));
            if (error.response.status === 404) console.warn("TIP: The ID might not exist in the DB, or the route is wrong.");
            if (error.response.status === 401) console.warn("TIP: Your session expired. Try logging in again.");
        } else if (error.request) {
            console.error("No response from server. Render.com might be sleeping.");
        } else {
            console.error(`Error: ${error.message}`);
        }
        console.log(`--- [DEBUG END] ---\n`);
    };

    const loadGroupDetails = useCallback(async () => {
        try {
            console.log(`🔄 Fetching details for project: ${id}...`);
            const token = await AsyncStorage.getItem("userToken");
            const storedUser = await AsyncStorage.getItem("userData") || await AsyncStorage.getItem("user");
            
            if (!token) {
                console.error("❌ No token found in storage.");
                router.replace("/login");
                return;
            }

            const userData = JSON.parse(storedUser);
            setUser(userData);

            const res = await axios.get(`${API_URL}/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000 // Extended for Render free tier
            });
            
            console.log("✅ Project data received successfully.");
            setProject(res.data.project || res.data);
        } catch (e) {
            debugLog("LOAD_PROJECT_DETAILS_FAILED", e);
            Alert.alert(
                "Loading Failed", 
                e.response?.data?.message || "Could not connect to the project server."
            );
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadGroupDetails();
        } else {
            console.error("❌ Component mounted without a Project ID in params.");
        }
    }, [id, loadGroupDetails]);

    const isAssignedSupervisor = user?.role === 'admin' && 
        project?.supervisor && 
        String(project.supervisor._id || project.supervisor) === String(user._id);
        
    const isSuperAdmin = user?.role === 'super-admin';

    const updateStatus = async (newStatus) => {
        try {
            console.log(`Updating status to: ${newStatus}...`);
            const token = await AsyncStorage.getItem("userToken");
            const res = await axios.patch(`${API_URL}/projects/${id}`, 
                { status: newStatus }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProject(res.data.project || { ...project, status: newStatus });
            Alert.alert("Success", `Status updated to ${newStatus}`);
        } catch (e) {
            debugLog("UPDATE_STATUS_FAILED", e);
            const backendError = e.response?.data?.message || "Update failed";
            Alert.alert("Error", backendError);
        }
    };

    if (loading) return (
        <View className="flex-1 justify-center items-center bg-white">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-slate-400 font-bold">Connecting to workspace...</Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            {/* Top Navigation */}
            <View className="px-6 py-4 flex-row items-center justify-between">
                <Pressable onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
                    <Ionicons name="arrow-back" size={22} color="black" />
                </Pressable>
                <View className={`px-4 py-1.5 rounded-full ${project?.status === 'Completed' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <Text className={`font-black text-[10px] uppercase ${project?.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {project?.status || 'Pending'}
                    </Text>
                </View>
            </View>

            <ScrollView className="px-6 pt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
                
                <View className="bg-indigo-600 self-start px-3 py-1 rounded-lg mb-3">
                    <Text className="text-white font-black text-[9px] uppercase tracking-widest">Project Details</Text>
                </View>
                <Text className="text-3xl font-black text-slate-900 mb-2 leading-tight">{project?.title}</Text>
                <Text className="text-slate-400 font-medium mb-8">Department: {project?.department || 'Computer Science'}</Text>

                {/* Status Switcher */}
                {(isAssignedSupervisor || isSuperAdmin) && (
                    <View className="mb-8">
                        <Text className="text-slate-400 font-black text-[10px] uppercase mb-4 tracking-widest">Update Project Status</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {statusOptions.map((status) => (
                                <Pressable
                                    key={status}
                                    onPress={() => updateStatus(status)}
                                    className={`px-4 py-2.5 rounded-2xl border mr-2 ${project?.status === status ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-100'}`}
                                >
                                    <Text className={`font-bold text-[10px] ${project?.status === status ? 'text-white' : 'text-slate-600'}`}>
                                        {status}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Collaborators */}
                <View className="mb-8">
                    <Text className="text-slate-400 font-black text-[10px] uppercase mb-5 tracking-widest">Collaborators</Text>
                    <View className="flex-row flex-wrap gap-5">
                        {project?.members?.map((member, index) => (
                            <View key={index} className="items-center w-[20%]">
                                <View className="w-14 h-14 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100 shadow-sm relative">
                                    {member.profilePic ? (
                                        <Image source={{ uri: member.profilePic }} className="w-full h-full rounded-2xl" />
                                    ) : (
                                        <View className="w-full h-full bg-indigo-50 items-center justify-center rounded-2xl">
                                            <Text className="text-indigo-600 font-bold text-lg">{(member.fullName || member.name || "?")[0]}</Text>
                                        </View>
                                    )}
                                    {(project?.projectHead?._id === member._id || project?.projectHead === member._id) && (
                                        <View className="absolute -top-2 -right-2 bg-amber-400 w-6 h-6 rounded-full items-center justify-center border-2 border-white">
                                            <Ionicons name="star" size={12} color="white" />
                                        </View>
                                    )}
                                </View>
                                <Text className="text-[9px] font-bold text-slate-600 mt-2 text-center" numberOfLines={1}>
                                    {member.fullName?.split(' ')[0] || member.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Stats */}
                <View className="flex-row gap-4 mb-8">
                    <View className="flex-1 bg-gray-50 p-5 rounded-[30px] border border-gray-100">
                         <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                         <Text className="text-slate-400 font-black text-[8px] uppercase mt-2">Deadline</Text>
                         <Text className="font-bold text-slate-800">
                            {project?.deadline ? new Date(project.deadline).toLocaleDateString() : 'No Date'}
                         </Text>
                    </View>
                    <View className="flex-1 bg-gray-50 p-5 rounded-[30px] border border-gray-100">
                         <Ionicons name="apps-outline" size={20} color="#6366f1" />
                         <Text className="text-slate-400 font-black text-[8px] uppercase mt-2">Type</Text>
                         <Text className="font-bold text-slate-800">Group Project</Text>
                    </View>
                </View>

                {/* Description */}
                <View className="bg-slate-50 p-6 rounded-[35px] border border-slate-100 mb-8">
                    <Text className="text-slate-400 font-black text-[10px] uppercase mb-3 tracking-widest">Scope of Work</Text>
                    <Text className="text-slate-600 leading-6 font-medium">{project?.description}</Text>
                </View>

                {/* Supervisor Info */}
                <View className="flex-row items-center bg-slate-900 p-5 rounded-[30px] mb-8 shadow-xl">
                    <View className="w-12 h-12 rounded-2xl bg-indigo-500/20 items-center justify-center mr-4">
                        <Ionicons name="shield-checkmark" size={24} color="#818cf8" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-indigo-300 font-black text-[9px] uppercase tracking-widest">Assigned Supervisor</Text>
                        <Text className="text-white font-bold text-lg">{project?.supervisor?.fullName || 'Awaiting Assignment'}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/90">
                <Pressable 
                    onPress={() => {
                        console.log("🚀 Moving to Workspace with ID:", id);
                        router.push({ pathname: "/group-workspace", params: { id } });
                    }}
                    className="bg-indigo-600 flex-row items-center justify-center py-5 rounded-[25px] shadow-lg shadow-indigo-200"
                >
                    <Ionicons name="briefcase-outline" size={20} color="white" />
                    <Text className="text-white font-black uppercase text-[12px] tracking-widest ml-3">
                        Enter Group Workspace
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}