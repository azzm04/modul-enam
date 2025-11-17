import 'react-native-gesture-handler';
// App.js - With Splash Screen and Gesture Navigation
import { useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { enableScreens } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from "./src/contexts/AuthContext.js";
import { MonitoringScreen } from "./src/screens/MonitoringScreen.js";
import { ControlScreen } from "./src/screens/ControlScreen.js";
import { LoginScreen } from "./src/screens/LoginScreen.js";
import { ProfileScreen } from "./src/screens/ProfileScreen.js";
import { SplashScreen } from "./src/screens/SplashScreen.js";
import { GestureWrapper } from "./src/components/GestureWrapper.js";
import { assertConfig } from "./src/services/config.js";
import { registerForPushNotificationsAsync } from './src/services/notification';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

enableScreens(true);

// Wrapper for screens with gesture navigation
function ScreenWithGesture({ component: Component, navigation, route, ...props }) {
  const handleSwipeLeft = () => {
    const state = navigation.getState();
    const routes = state.routes;
    const currentIndex = state.index;
    
    // Navigate to next tab
    if (currentIndex < routes.length - 1) {
      navigation.navigate(routes[currentIndex + 1].name);
    }
  };

  const handleSwipeRight = () => {
    const state = navigation.getState();
    const routes = state.routes;
    const currentIndex = state.index;
    
    // Navigate to previous tab
    if (currentIndex > 0) {
      navigation.navigate(routes[currentIndex - 1].name);
    }
  };

  return (
    <GestureWrapper onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
      <Component {...props} navigation={navigation} route={route} />
    </GestureWrapper>
  );
}

// Bottom Tab Navigator untuk authenticated users
function AuthenticatedTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitle: "IOTWatch",
        headerTitleAlign: "center",
        headerTintColor: "#1f2937",
        headerStyle: { backgroundColor: "#f8f9fb" },
        headerTitleStyle: { fontWeight: "600", fontSize: 18 },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Monitoring") iconName = "analytics";
          else if (route.name === "Control") iconName = "options";
          else if (route.name === "Profile") iconName = "person";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Monitoring">
        {(props) => <ScreenWithGesture component={MonitoringScreen} {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Control">
        {(props) => <ScreenWithGesture component={ControlScreen} {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {(props) => <ScreenWithGesture component={ProfileScreen} {...props} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Main Navigation Logic
function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fb' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User logged in - full access
        <Stack.Screen name="Main" component={AuthenticatedTabs} />
      ) : (
        // Guest - show login or monitoring only
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen 
            name="Guest" 
            component={MonitoringScreen}
            options={({ navigation }) => ({
              headerShown: true,
              headerTitle: "IOTWatch - Monitoring",
              headerTitleAlign: "center",
              headerTintColor: "#1f2937",
              headerStyle: { backgroundColor: "#f8f9fb" },
              headerTitleStyle: { fontWeight: "600", fontSize: 18 },
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={{ marginRight: 16 }}
                >
                  <Ionicons name="log-in-outline" size={24} color="#2563eb" />
                </TouchableOpacity>
              ),
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    assertConfig();

    // Register for push notifications and log the Expo push token (if available)
    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) console.log('Expo push token (from App):', token);
      } catch (err) {
        console.warn('Failed to register for push notifications from App:', err);
      }
    })();
  }, []);

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#f8f9fb",
    },
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={theme}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}