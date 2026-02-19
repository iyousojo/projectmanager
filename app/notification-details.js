import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

// Configure how notifications appear when the app is FOREGROUNDED
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationManager({ children }) {
  const router = useRouter();

  useEffect(() => {
    // 1. HANDLE COLD START (App was closed, now opening via notification)
    const checkInitialNotification = async () => {
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse?.notification?.request?.content?.data?.id) {
        const notificationId = lastResponse.notification.request.content.data.id;
        
        // Small delay to ensure the navigation stack is mounted
        setTimeout(() => {
          router.push({
            pathname: "/notification-details",
            params: { id: notificationId },
          });
        }, 500);
      }
    };

    checkInitialNotification();

    // 2. HANDLE BACKGROUND/FOREGROUND TAPS (App is running)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data?.id) {
        router.push({
          pathname: "/notification-details",
          params: { id: data.id }
        });
      }
    });

    // 3. CLEANUP
    return () => {
      subscription.remove();
    };
  }, []);

  return <>{children}</>;
}