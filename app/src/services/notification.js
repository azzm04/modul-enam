import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from 'expo-constants';
import { Platform } from "react-native";

// Atur tampilan notifikasi saat app sedang terbuka
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Fungsi untuk minta izin & ambil push token
// Helper: request permission + return Expo push token (safe wrapper)
export async function getExpoPushTokenAsync() {
  if (!Device.isDevice) {
    alert('Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Izin notifikasi ditolak!');
    return null;
  }

  // Newer versions of expo-notifications require a projectId when the manifest
  // can't provide it automatically (e.g. bare workflow / dev clients).
  // Try to read projectId from app config (`app.json` / `app.config.js`).
  const projectId = Constants.manifest?.projectId || Constants.expoConfig?.projectId || null;

  if (!projectId) {
    console.warn('No projectId found. Add "expo.projectId" to app.json or pass a projectId.');
    alert('Push token cannot be requested: missing projectId. See console for details.');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;
  console.log('Expo Push Token:', token);
  return token;
}

// Public: register and ensure notification channel (calls helper)
export async function registerForPushNotificationsAsync() {
  const token = await getExpoPushTokenAsync();

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}
