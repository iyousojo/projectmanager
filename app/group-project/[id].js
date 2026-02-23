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
    const [isUpdating, setIsUpdating] = useState(false);

    const statusOptions = ["Pending", "Proposal", "Implementation", "Testing", "Completed"];

    const debugLog = (context, error) => {
        console.log(`\n🔴 --- [GROUP DETAIL DEBUG]: ${context} ---`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`, error.response.data);
        } else {
            console.error(`Error: ${error.message}`);
        }
    };

    const loadGroupDetails = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const storedUser = await AsyncStorage.getItem("userData") || await AsyncStorage.getItem("user");
            if (!token) return router.replace("/login");

            const userData = JSON.parse(storedUser);
            setUser(userData);

            const res = await axios.get(`${API_URL}/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProject(res.data.project || res.data);
        } catch (e) {
            debugLog("LOAD_PROJECT_DETAILS_FAILED", e);
            if (e.response?.status === 404) router.back();
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { if (id) loadGroupDetails(); }, [id, loadGroupDetails]);

    const isAssignedSupervisor = (user?.role === 'admin' || user?.role === 'super-admin') && 
        project?.supervisor && 
        String(project.supervisor._id || project.supervisor) === String(user._id);
        
    const isSuperAdmin = user?.role === 'super-admin';

    const performUpdate = async (payload, successMsg) => {
        try {
            setIsUpdating(true);
            const token = await AsyncStorage.getItem("userToken");
            const res = await axios.patch(`${API_URL}/projects/${id}`, 
                payload, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProject(res.data.project || { ...project, ...payload });
            Alert.alert("Success", successMsg);
        } catch (e) {
            debugLog("UPDATE_FAILED", e);
            Alert.alert("Error", e.response?.data?.message || "Update failed");
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator size="large" color="#6366f1" /></View>;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50">
                <Pressable onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
                    <Ionicons name="arrow-back" size={22} color="black" />
                </Pressable>
                <View className={`px-4 py-1.5 rounded-full ${project?.status === 'Completed' ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                    <Text className={`font-black text-[10px] uppercase ${project?.status === 'Completed' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {project?.status || 'Active'}
                    </Text>
                </View>
            </View>

            <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
                {/* Title Section */}
                <View className="mb-8">
                    <View className="bg-indigo-600 self-start px-3 py-1 rounded-lg mb-3">
                        <Text className="text-white font-black text-[9px] uppercase tracking-widest">Group Project</Text>
                    </View>
                    <Text className="text-3xl font-black text-slate-900 mb-2 leading-tight">{project?.title}</Text>
                    <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-tighter">Dept: {project?.department || 'Computer Science'}</Text>
                </View>

                {/* --- LEADERSHIP MANAGEMENT --- */}
                {(isAssignedSupervisor || isSuperAdmin) && (
                    <View className="mb-8 bg-slate-50 p-5 rounded-[30px] border border-slate-100">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Leadership Control</Text>
                            {isUpdating && <ActivityIndicator size="small" color="#6366f1" />}
                        </View>
                        {project?.members?.map((member) => {
                            const isCurrentHead = String(project?.projectHead?._id || project?.projectHead) === String(member._id);
                            return (
                                <View key={member._id} className="flex-row items-center justify-between bg-white p-3 rounded-2xl mb-2 border border-slate-100">
                                    <Pressable 
                                        onPress={() => router.push({ pathname: "/profile-details", params: { userId: member._id } })}
                                        className="flex-row items-center flex-1"
                                    >
                                        <View className="w-8 h-8 rounded-full bg-indigo-50 items-center justify-center mr-3">
                                            <Text className="text-indigo-600 font-bold">{member.fullName?.[0] || "?"}</Text>
                                        </View>
                                        <Text className="font-bold text-slate-700 text-xs">{member.fullName}</Text>
                                    </Pressable>
                                    
                                    {isCurrentHead ? (
                                        <View className="bg-amber-100 px-3 py-1 rounded-lg flex-row items-center">
                                            <Ionicons name="star" size={10} color="#d97706" />
                                            <Text className="text-amber-700 font-black text-[9px] ml-1 uppercase">Project Head</Text>
                                        </View>
                                    ) : (
                                        <Pressable 
                                            onPress={() => performUpdate({ projectHead: member._id }, `Promoted ${member.fullName} to Project Head`)}
                                            disabled={isUpdating}
                                            className="bg-indigo-600 px-3 py-1.5 rounded-lg"
                                        >
                                            <Text className="text-white font-bold text-[9px] uppercase">Assign Head</Text>
                                        </Pressable>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Status Switcher */}
                {(isAssignedSupervisor || isSuperAdmin) && (
                    <View className="mb-8">
                        <Text className="text-slate-400 font-black text-[10px] uppercase mb-4 tracking-widest">Pipeline Status</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                            {statusOptions.map((status) => (
                                <Pressable
                                    key={status}
                                    onPress={() => performUpdate({ status }, `Project moved to ${status}`)}
                                    className={`px-5 py-3 rounded-2xl border mr-3 ${project?.status === status ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-100'}`}
                                >
                                    <Text className={`font-bold text-[11px] ${project?.status === status ? 'text-white' : 'text-slate-600'}`}>{status}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Collaborators */}
                <View className="mb-8">
                    <Text className="text-slate-400 font-black text-[10px] uppercase mb-5 tracking-widest">Collaborators</Text>
                    <View className="flex-row flex-wrap">
                        {project?.members?.map((member, index) => {
                            const isHead = String(project?.projectHead?._id || project?.projectHead) === String(member._id);
                            return (
                                <Pressable 
                                    key={member._id || index} 
                                    onPress={() => router.push({ pathname: "/profile-details", params: { userId: member._id } })}
                                    className="items-center mr-6 mb-4"
                                >
                                    <View className="w-16 h-16 rounded-3xl bg-slate-50 items-center justify-center border border-slate-100 relative shadow-sm">
                                        {member.profilePic ? (
                                            <Image source={{ uri: member.profilePic }} className="w-full h-full rounded-3xl" />
                                        ) : (
                                            <View className="w-full h-full bg-indigo-50 items-center justify-center rounded-3xl">
                                                <Text className="text-indigo-600 font-black text-xl">{(member.fullName || "?")[0]}</Text>
                                            </View>
                                        )}
                                        {isHead && (
                                            <View className="absolute -top-2 -right-2 bg-amber-400 w-7 h-7 rounded-full items-center justify-center border-4 border-white">
                                                <Ionicons name="ribbon" size={14} color="white" />
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-[10px] font-bold text-slate-800 mt-2 text-center" numberOfLines={1}>{member.fullName?.split(' ')[0]}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Metadata Tiles */}
                <View className="flex-row gap-4 mb-8">
                    <View className="flex-1 bg-gray-50 p-5 rounded-[30px] border border-gray-100">
                         <Ionicons name="time-outline" size={20} color="#6366f1" />
                         <Text className="text-slate-400 font-black text-[8px] uppercase mt-2 tracking-widest">Deadline</Text>
                         <Text className="font-bold text-slate-800 mt-1">{project?.deadline ? new Date(project.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'}</Text>
                    </View>
                    <View className="flex-1 bg-gray-50 p-5 rounded-[30px] border border-gray-100">
                         <Ionicons name="layers-outline" size={20} color="#6366f1" />
                         <Text className="text-slate-400 font-black text-[8px] uppercase mt-2 tracking-widest">Composition</Text>
                         <Text className="font-bold text-slate-800 mt-1">{project?.members?.length || 0} Members</Text>
                    </View>
                </View>

                {/* Description Box */}
                <View className="bg-slate-50 p-6 rounded-[35px] border border-slate-100 mb-8">
                    <Text className="text-slate-400 font-black text-[10px] uppercase mb-3 tracking-widest">Project Brief</Text>
                    <Text className="text-slate-600 leading-6 font-medium text-sm">{project?.description || 'No description provided for this project.'}</Text>
                </View>

                {/* Supervisor Widget */}
                <View className="flex-row items-center bg-slate-900 p-6 rounded-[30px] mb-8 shadow-2xl">
                    <View className="w-12 h-12 rounded-2xl bg-indigo-500/20 items-center justify-center mr-4">
                        <Ionicons name="finger-print" size={24} color="#818cf8" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-indigo-300 font-black text-[9px] uppercase tracking-widest">Supervised By</Text>
                        <Text className="text-white font-bold text-lg leading-tight">{project?.supervisor?.fullName || 'Not Assigned'}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Button Container */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/80">
                <View className="flex-row gap-3">
                    <Pressable 
                        className="bg-indigo-50 p-5 rounded-[25px] items-center justify-center border border-indigo-100"
                        onPress={() => Alert.alert("Coming Soon", "Group chat will be available in the workspace.")}
                    >
                        <Ionicons name="chatbubbles-outline" size={24} color="#6366f1" />
                    </Pressable>
                    <Pressable 
                        onPress={() => router.push({ 
                            pathname: "/group-workspace", 
                            params: { id: id } 
                        })}
                        className="flex-1 bg-indigo-600 flex-row items-center justify-center py-5 rounded-[25px] shadow-lg shadow-indigo-300"
                    >
                        <Ionicons name="rocket-outline" size={20} color="white" />
                        <Text className="text-white font-black uppercase text-[12px] tracking-widest ml-3">Launch Workspace</Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}