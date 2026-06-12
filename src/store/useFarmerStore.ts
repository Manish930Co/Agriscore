import { create } from 'zustand';
import { apiService, KYCFlowData, CreditScoreBreakdown, CropDiagnostic } from '../services/api';
import { webSocketService } from '../services/websocket';
import { useOnboardingStore } from './useOnboardingStore';

interface FarmerState {
  kycDetails: KYCFlowData | null;
  creditScore: CreditScoreBreakdown | null;
  diagnostics: CropDiagnostic[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchKYC: (farmerId: string) => Promise<void>;
  submitKYC: (farmerId: string, data: KYCFlowData) => Promise<void>;
  fetchCreditScore: (farmerId: string) => Promise<void>;
  uploadCropImage: (farmerId: string, imageUri: string) => Promise<CropDiagnostic>;
  fetchDiagnostics: (farmerId: string) => Promise<void>;
  resetFarmerStore: () => void;
}

export const useFarmerStore = create<FarmerState>((set, get) => ({
  kycDetails: null,
  creditScore: null,
  diagnostics: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchKYC: async (farmerId) => {
    set({ isLoading: true, error: null });
    try {
      const details = await apiService.getKYCDetails(farmerId);
      set({ kycDetails: details, isLoading: false });
      if (details) {
        // Automatically fetch credit score if onboarded
        await get().fetchCreditScore(farmerId);
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch KYC details', isLoading: false });
    }
  },

  submitKYC: async (farmerId, data) => {
    set({ isSaving: true, error: null });
    try {
      const cropFieldImage = useOnboardingStore.getState().cropFieldImage;
      const updated = await apiService.submitKYC(farmerId, data, cropFieldImage);
      set({ kycDetails: updated, isSaving: false });
      // Recalculate credit score after changes
      await get().fetchCreditScore(farmerId);

      // Notify the lender in real-time via WebSocket
      webSocketService.send('KYC_SUBMITTED', {
        farmerId,
        farmerName: data.fullName,
        details: updated
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to submit KYC details', isSaving: false });
      throw err;
    }
  },

  fetchCreditScore: async (farmerId) => {
    try {
      const score = await apiService.fetchCreditScore(farmerId);
      set({ creditScore: score });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch credit score' });
    }
  },

  uploadCropImage: async (farmerId, imageUri) => {
    set({ isSaving: true, error: null });
    try {
      const result = await apiService.uploadCropImage(farmerId, imageUri);
      // Prepend the diagnostic
      set((state) => ({
        diagnostics: [result, ...state.diagnostics],
        isSaving: false
      }));
      return result;
    } catch (err: any) {
      set({ error: err.message || 'Failed to upload crop image', isSaving: false });
      throw err;
    }
  },

  fetchDiagnostics: async (farmerId) => {
    set({ isLoading: true, error: null });
    try {
      const history = await apiService.getCropDiagnostics(farmerId);
      set({ diagnostics: history, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch diagnostics', isLoading: false });
    }
  },

  resetFarmerStore: () => {
    set({
      kycDetails: null,
      creditScore: null,
      diagnostics: [],
      error: null,
      isLoading: false,
      isSaving: false,
    });
  }
}));
