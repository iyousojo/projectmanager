// app/(tabs)/_layout.js
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 90 : 70,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 5,
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: "center" }}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, backgroundColor: "#000", borderRadius: 2, marginTop: 4 }} />}
            </View>
          ),
        }}
      />

      {/* PROJECTS */}
      <Tabs.Screen
        name="projects"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: "center" }}>
              <Ionicons name={focused ? "folder" : "folder-outline"} size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, backgroundColor: "#000", borderRadius: 2, marginTop: 4 }} />}
            </View>
          ),
        }}
      />

      {/* CREATE */}
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: () => (
            <View style={{
              top: -18, width: 52, height: 52, borderRadius: 26,
              backgroundColor: "#000", justifyContent: "center",
              alignItems: "center", elevation: 5, shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4,
            }}>
              <Ionicons name="add" size={32} color="#fff" />
            </View>
          ),
        }}
      />

      {/* TASKS */}
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: "center" }}>
              <Ionicons name={focused ? "checkbox" : "checkbox-outline"} size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, backgroundColor: "#000", borderRadius: 2, marginTop: 4 }} />}
            </View>
          ),
        }}
      />

      {/* NOTIFICATIONS */}
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: "center" }}>
              <Ionicons name={focused ? "notifications" : "notifications-outline"} size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, backgroundColor: "#000", borderRadius: 2, marginTop: 4 }} />}
            </View>
          ),
        }}
      />

      {/* ADMIN (hidden) */}
      <Tabs.Screen
        name="admin"
        options={{
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
