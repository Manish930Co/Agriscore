import React, { useEffect } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { useLoanStore } from '../store/useLoanStore';
import { colors } from '../theme/colors';
import { Bell, X } from 'lucide-react-native';
import { useWebSockets } from '../hooks/useWebSockets';

// Import Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import FarmerDashboard from '../screens/farmer/FarmerDashboard';
import KYCOnboardingScreen from '../screens/farmer/KYCOnboardingScreen';
import CropUploadScreen from '../screens/farmer/CropUploadScreen';
import AgriScoreReportScreen from '../screens/farmer/AgriScoreReportScreen';
import LoanMarketplaceScreen from '../screens/farmer/LoanMarketplaceScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import VerificationPipelineScreen from '../screens/admin/VerificationPipelineScreen';

// Icons
import { Home, FileText, Camera, ShieldAlert, BadgeDollarSign, BarChart3, Users } from 'lucide-react-native';

// Param Lists
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type FarmerTabParamList = {
  Dashboard: undefined;
  KYCOnboarding: undefined;
  CropUpload: undefined;
  AgriScoreReport: undefined;
  LoanMarketplace: undefined;
};

export type AdminStackParamList = {
  AdminOverview: undefined;
  VerificationPipeline: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const FarmerTab = createBottomTabNavigator<FarmerTabParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator
    initialRouteName="Splash"
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background }
    }}
  >
    <AuthStack.Screen name="Splash" component={SplashScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Farmer Navigator
const FarmerNavigator = () => (
  <FarmerTab.Navigator
    screenOptions={({ route }) => ({
      tabBarActiveTintColor: colors.primaryDark,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: {
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.borderColor,
        paddingBottom: 8,
        paddingTop: 8,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
      },
      headerStyle: {
        backgroundColor: colors.white,
      },
      headerShadowVisible: false,
      headerTitleStyle: {
        fontWeight: '700',
        color: colors.charcoal,
      },
      headerTitleAlign: 'center',
    })}
  >
    <FarmerTab.Screen
      name="Dashboard"
      component={FarmerDashboard}
      options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
      }}
    />
    <FarmerTab.Screen
      name="KYCOnboarding"
      component={KYCOnboardingScreen}
      options={{
        title: 'KYC & Farm',
        tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
      }}
    />
    <FarmerTab.Screen
      name="CropUpload"
      component={CropUploadScreen}
      options={{
        title: 'Crop AI',
        tabBarIcon: ({ color, size }) => <Camera color={color} size={size} />,
      }}
    />
    <FarmerTab.Screen
      name="AgriScoreReport"
      component={AgriScoreReportScreen}
      options={{
        title: 'AgriScore',
        tabBarIcon: ({ color, size }) => <ShieldAlert color={color} size={size} />,
      }}
    />
    <FarmerTab.Screen
      name="LoanMarketplace"
      component={LoanMarketplaceScreen}
      options={{
        title: 'Marketplace',
        tabBarIcon: ({ color, size }) => <BadgeDollarSign color={color} size={size} />,
      }}
    />
  </FarmerTab.Navigator>
);

// Admin Navigator
const AdminNavigator = () => (
  <AdminStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.white,
      },
      headerShadowVisible: false,
      headerTitleStyle: {
        fontWeight: '700',
        color: colors.charcoal,
      },
      headerTitleAlign: 'center',
    }}
  >
    <AdminStack.Screen
      name="AdminOverview"
      component={AdminDashboard}
      options={{ title: 'Lender Dashboard' }}
    />
    <AdminStack.Screen
      name="VerificationPipeline"
      component={VerificationPipelineScreen}
      options={{ title: 'Verification Pipeline' }}
    />
  </AdminStack.Navigator>
);

// Root Navigator
export const RootNavigator = () => {
  const { user, isAuthenticated, isLoading, checkSession } = useAuthStore();
  const { currentNotification, clearNotification } = useLoanStore();

  // Initialize real-time WebSocket connection
  useWebSockets();

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (currentNotification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentNotification]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        {isAuthenticated && user ? (
          user.role === 'admin' ? (
            <AdminNavigator />
          ) : (
            <FarmerNavigator />
          )
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>

      {currentNotification && (
        <View style={{
          position: 'absolute',
          top: 50,
          left: 16,
          right: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 5,
          borderWidth: 1,
          borderColor: colors.borderColor,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 9999,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primaryBg,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Bell size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.charcoal }}>{currentNotification.title}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={2}>{currentNotification.message}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearNotification} style={{ padding: 4, marginLeft: 8 }}>
            <X size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};
