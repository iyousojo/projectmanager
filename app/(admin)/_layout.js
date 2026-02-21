import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        // This hides the default white header so our 
        // custom Tailwind headers look clean
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {/* Define the screens in this group */}
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="profile" />
      
      {/* Add this if you plan to create a user-management.js soon */}
      <Stack.Screen name="user-management" />
    </Stack>
  );
}