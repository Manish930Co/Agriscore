import { create } from 'zustand';

interface OnboardingState {
  cropFieldImage: string | null;
  setCropFieldImage: (uri: string | null) => void;
  resetOnboardingStore: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  cropFieldImage: null,
  setCropFieldImage: (uri) => set({ cropFieldImage: uri }),
  resetOnboardingStore: () => set({ cropFieldImage: null }),
}));
