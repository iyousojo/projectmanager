import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";

export default function TabsLayout() {
  /** * NOTE: Push notification registration has been moved to RootLayout.js
   * to prevent duplicate calls and "Invalid UUID" errors.
   */

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#94a3b8",
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
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View className="items-center">
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
              {focused && <View className="w-1 h-1 bg-black rounded-full mt-1" />}
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="projects"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View className="items-center">
              <Ionicons name={focused ? "folder" : "folder-outline"} size={24} color={color} />
              {focused && <View className="w-1 h-1 bg-black rounded-full mt-1" />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: () => (
            <View 
              style={{ top: -15 }}
              className="w-14 h-14 bg-black rounded-full items-center justify-center shadow-lg"
            >
              <Ionicons name="add" size={32} color="white" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View className="items-center">
              <Ionicons name={focused ? "checkbox" : "checkbox-outline"} size={24} color={color} />
              {focused && <View className="w-1 h-1 bg-black rounded-full mt-1" />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View className="items-center">
              <Ionicons name={focused ? "notifications" : "notifications-outline"} size={24} color={color} />
              {focused && <View className="w-1 h-1 bg-black rounded-full mt-1" />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}