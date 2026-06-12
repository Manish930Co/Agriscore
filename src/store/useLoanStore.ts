import { create } from 'zustand';
import { apiService, LoanApplicationData, LoanProduct, MOCK_LOAN_PRODUCTS } from '../services/api';
import { useAuthStore } from './useAuthStore';
import { webSocketService } from '../services/websocket';

interface LoanState {
  applications: LoanApplicationData[];
  allApplications: LoanApplicationData[];
  loanProducts: LoanProduct[];
  lenderFarmersList: any[]; // List of registered farmers
  adminStats: {
    totalRegistered: number;
    averageCreditScore: number;
    totalLoanVolume: number;
    pendingApplications: number;
    activeLendersCount: number;
    systemRiskFlagCount: number;
  } | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchFarmerApplications: (farmerId: string) => Promise<void>;
  applyForLoan: (
    farmerId: string, 
    farmerName: string,
    amount: number, 
    tenureMonths: number, 
    interestRate: number, 
    bankName: string
  ) => Promise<void>;
  fetchAllApplications: () => Promise<void>;
  fetchLenderFarmersList: () => Promise<void>;
  fetchAdminStats: () => Promise<void>;
  adminSubmitOffer: (
    applicationId: string,
    offeredInterestRate: number,
    offeredTenureMonths: number,
    status: 'OFFERED' | 'APPROVED' | 'REJECTED',
    remarks: string
  ) => Promise<void>;
  farmerActionOffer: (applicationId: string, accept: boolean) => Promise<void>;
  resetLoanStore: () => void;
  handleRealTimeEvent: (eventType: string, payload: any) => void;
  currentNotification: { title: string; message: string } | null;
  clearNotification: () => void;
}

export const useLoanStore = create<LoanState>((set, get) => ({
  applications: [],
  allApplications: [],
  loanProducts: MOCK_LOAN_PRODUCTS,
  lenderFarmersList: [],
  adminStats: null,
  isLoading: false,
  isSaving: false,
  error: null,
  currentNotification: null,

  clearNotification: () => set({ currentNotification: null }),

  fetchFarmerApplications: async (farmerId) => {
    set({ isLoading: true, error: null });
    try {
      const list = await apiService.getFarmerLoanApplications(farmerId);
      set({ applications: list, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch loan applications', isLoading: false });
    }
  },

  applyForLoan: async (farmerId, farmerName, amount, tenureMonths, interestRate, bankName) => {
    set({ isSaving: true, error: null });
    try {
      const newApp = await apiService.submitLoanApplication(
        farmerId, 
        farmerName,
        amount, 
        tenureMonths, 
        interestRate, 
        bankName
      );
      set((state) => ({
        applications: [newApp, ...state.applications],
        isSaving: false
      }));

      // Broadcast the loan application via WebSocket
      webSocketService.send('LOAN_SUBMITTED', newApp);
    } catch (err: any) {
      set({ error: err.message || 'Failed to apply for loan', isSaving: false });
      throw err;
    }
  },

  fetchAllApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await apiService.getAllLoanApplications();
      set({ allApplications: list, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch all applications', isLoading: false });
    }
  },

  fetchLenderFarmersList: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await apiService.getAllFarmers();
      set({ lenderFarmersList: list, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch registered farmers', isLoading: false });
    }
  },

  fetchAdminStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await apiService.getAdminStats() as any;
      set({ adminStats: stats, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch admin stats', isLoading: false });
    }
  },

  adminSubmitOffer: async (applicationId, offeredInterestRate, offeredTenureMonths, status, remarks) => {
    set({ isSaving: true, error: null });
    try {
      const updated = await apiService.adminSubmitOffer(
        applicationId, 
        offeredInterestRate, 
        offeredTenureMonths, 
        status, 
        remarks
      );
      
      // Update locally in allApplications
      set((state) => ({
        allApplications: state.allApplications.map(app => app.id === applicationId ? updated : app),
        isSaving: false
      }));
      
      // Notify the farmer via WebSocket
      webSocketService.send('LOAN_STATUS_UPDATED', {
        id: applicationId,
        farmerId: updated.farmerId,
        bankName: updated.bankName,
        status: updated.status,
        offeredInterestRate: updated.offeredInterestRate,
        offeredTenureMonths: updated.offeredTenureMonths,
        adminRemarks: updated.adminRemarks,
        updatedAt: updated.updatedAt
      });

      // Fetch stats again to make sure everything matches
      await get().fetchAdminStats();
    } catch (err: any) {
      set({ error: err.message || 'Failed to update loan terms', isSaving: false });
      throw err;
    }
  },

  farmerActionOffer: async (applicationId, accept) => {
    set({ isSaving: true, error: null });
    try {
      const updated = await apiService.farmerActionOffer(applicationId, accept);
      
      // Update locally in applications
      set((state) => ({
        applications: state.applications.map(app => app.id === applicationId ? updated : app),
        isSaving: false
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to respond to loan terms', isSaving: false });
      throw err;
    }
  },

  resetLoanStore: () => {
    set({
      applications: [],
      allApplications: [],
      lenderFarmersList: [],
      adminStats: null,
      error: null,
      isLoading: false,
      isSaving: false,
    });
  },

  handleRealTimeEvent: (eventType, payload) => {
    console.log(`[Zustand LoanStore] Handling real-time event ${eventType}`);
    if (eventType === 'KYC_SUBMITTED') {
      // Sync the in-memory database on the receiving client
      apiService.syncKYCData(payload.farmerId, payload.details);

      set((state) => {
        const title = "New Onboarding Details";
        const message = `${payload.farmerName} has completed their KYC form.`;

        // Update or append to lenderFarmersList
        const exists = state.lenderFarmersList.some(f => (f.farmerId || f.farmer_id) === payload.farmerId);
        const updatedList = exists
          ? state.lenderFarmersList.map(f => (f.farmerId || f.farmer_id) === payload.farmerId ? payload.details : f)
          : [payload.details, ...state.lenderFarmersList];
        
        // Increment total registered count if admin stats are loaded
        const updatedStats = state.adminStats ? {
          ...state.adminStats,
          totalRegistered: state.adminStats.totalRegistered + 1
        } : null;

        return {
          adminStats: updatedStats,
          lenderFarmersList: updatedList,
          currentNotification: { title, message }
        };
      });
      // Refresh admin dashboard stats in background
      get().fetchAdminStats().catch(() => {});
    } else if (eventType === 'LOAN_SUBMITTED') {
      // Sync the in-memory database on the receiving client
      apiService.syncLoanApplication(payload);

      set((state) => {
        const exists = state.allApplications.some(app => app.id === payload.id);
        if (exists) return {};
        
        const updatedAll = [payload, ...state.allApplications];
        const currentFarmerId = useAuthStore.getState().user?.uid;
        const updatedApps = payload.farmerId === currentFarmerId 
          ? [payload, ...state.applications] 
          : state.applications;
        
        const title = "New Loan Request";
        const message = `${payload.farmerName} applied for ₹${payload.amount.toLocaleString()}.`;
          
        return {
          allApplications: updatedAll,
          applications: updatedApps,
          currentNotification: { title, message }
        };
      });
      // Refresh admin dashboard stats in background
      get().fetchAdminStats().catch(() => {});
    } else if (eventType === 'LOAN_STATUS_UPDATED') {
      // Sync the in-memory database on the receiving client
      apiService.syncLoanApplication(payload);

      set((state) => {
        const updateApp = (app: any) => {
          if (app.id === payload.id) {
            return {
              ...app,
              status: payload.status,
              offeredInterestRate: payload.offeredInterestRate,
              offeredTenureMonths: payload.offeredTenureMonths,
              adminRemarks: payload.adminRemarks,
              updatedAt: payload.updatedAt
            };
          }
          return app;
        };
        
        const title = "Loan Status Update";
        const message = `Your request at ${payload.bankName} is now ${payload.status}.`;
        
        return {
          applications: state.applications.map(updateApp),
          allApplications: state.allApplications.map(updateApp),
          currentNotification: { title, message }
        };
      });
    } else if (eventType === 'FARMER_PROFILE_UPDATED') {
      // Sync the in-memory database on the receiving client
      apiService.syncKYCData(payload.farmerId, payload.details);

      set((state) => {
        const exists = state.lenderFarmersList.some(f => (f.farmerId || f.farmer_id || f.id) === payload.farmerId);
        const updatedList = exists
          ? state.lenderFarmersList.map(farmer =>
              (farmer.farmerId || farmer.farmer_id || farmer.id) === payload.farmerId ? { ...farmer, ...payload.details } : farmer
            )
          : [{ farmerId: payload.farmerId, ...payload.details }, ...state.lenderFarmersList];

        const updateAppName = (app: any) => {
          if (app.farmerId === payload.farmerId) {
            return {
              ...app,
              farmerName: payload.details.fullName || app.farmerName
            };
          }
          return app;
        };

        const title = "Farmer Profile Updated";
        const message = `${payload.details?.fullName || 'A farmer'} has updated their details.`;

        return {
          lenderFarmersList: updatedList,
          applications: state.applications.map(updateAppName),
          allApplications: state.allApplications.map(updateAppName),
          currentNotification: { title, message }
        };
      });
    }
  }
}));
