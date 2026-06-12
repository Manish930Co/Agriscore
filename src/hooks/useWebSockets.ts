import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useLoanStore } from '../store/useLoanStore';
import { webSocketService } from '../services/websocket';

// Dynamic resolver for WebSocket URL based on OS and environment
const getWsUrl = () => {
  try {
    const Constants = require('expo-constants').default;
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.packagerOpts?.hostId;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `ws://${ip}:8000`;
    }
  } catch (e) {
    // Fallback if expo-constants is unavailable
  }

  if (Platform.OS === 'android') {
    return 'ws://10.0.2.2:8000'; // Redirects Android Emulator to host computer
  }
  return 'ws://localhost:8000'; // iOS Simulator / Web fallback
};

const WS_BASE_URL = getWsUrl();

export const useWebSockets = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { handleRealTimeEvent } = useLoanStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      webSocketService.disconnect();
      return;
    }

    // Handshake Authentication token mapping
    const token = user.role === 'admin' 
      ? 'mock-token-admin' 
      : `mock-token-farmer-${user.uid}`;

    // Establish WebSocket Endpoint based on Role
    const endpoint = user.role === 'admin'
      ? `${WS_BASE_URL}/ws/bank/loans`
      : `${WS_BASE_URL}/ws/farmer/loans/${user.uid}`;

    webSocketService.connect(endpoint, token);

    // Subscribe to real-time events
    const unsubSubmitted = webSocketService.addEventListener('LOAN_SUBMITTED', (payload) => {
      console.log('[WebSocket Hook] LOAN_SUBMITTED received:', payload);
      handleRealTimeEvent('LOAN_SUBMITTED', payload);
    });

    const unsubStatus = webSocketService.addEventListener('LOAN_STATUS_UPDATED', (payload) => {
      console.log('[WebSocket Hook] LOAN_STATUS_UPDATED received:', payload);
      handleRealTimeEvent('LOAN_STATUS_UPDATED', payload);
    });

    const unsubKYC = webSocketService.addEventListener('KYC_SUBMITTED', (payload) => {
      console.log('[WebSocket Hook] KYC_SUBMITTED received:', payload);
      handleRealTimeEvent('KYC_SUBMITTED', payload);
    });

    const unsubProfileUpdate = webSocketService.addEventListener('FARMER_PROFILE_UPDATED', (payload) => {
      console.log('[WebSocket Hook] FARMER_PROFILE_UPDATED received:', payload);
      handleRealTimeEvent('FARMER_PROFILE_UPDATED', payload);
    });

    // Cleanup on unmount or authentication state shift
    return () => {
      unsubSubmitted();
      unsubStatus();
      unsubKYC();
      unsubProfileUpdate();
      webSocketService.disconnect();
    };
  }, [user, isAuthenticated]);
};
