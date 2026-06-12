export interface KYCFlowData {
  farmerId?: string;
  cropFieldImage?: string;
  // Personal
  fullName: string;
  mobile: string;
  dob: string;
  gender: string;
  address: string;
  kycIdType: string;
  kycIdNumber: string;
  
  // Farm
  sizeAcres: number;
  ownershipType: 'OWNED' | 'LEASED' | 'SHARED';
  cropType: string;
  sowingDate: string;
  harvestDate: string;
  soilType: string;
  irrigationType: string;

  // Financial
  annualIncome: number;
  existingLoans: boolean;
  outstandingDebt: number;
  bankName: string;
  bankAccountNumber: string;

  // Location
  village: string;
  district: string;
  state: string;
  gpsLat: number;
  gpsLon: number;
}

export interface CreditScoreBreakdown {
  overallScore: number;
  grade: string;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  cropHealth: number;          // 20%
  yieldStability: number;      // 20%
  climateRisk: number;         // 15%
  farmingPractice: number;     // 15%
  financialCapability: number; // 20%
  trustVerification: number;   // 10%
}

export interface CropDiagnostic {
  id: string;
  imageUrl: string;
  diseaseDetected: string;
  confidenceScore: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  treatmentRecommendation: string;
  createdAt: string;
}

export interface LoanProduct {
  id: string;
  bankName: string;
  interestRate: number;
  tenureMonths: number;
  maxAmount: number;
  description: string;
}

export interface LoanApplicationData {
  id: string;
  farmerId: string;
  farmerName: string;
  amount: number;
  tenureMonths: number;
  interestRate: number;
  emi: number;
  bankName: string;
  status: 'PENDING' | 'OFFERED' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  offeredInterestRate?: number;
  offeredTenureMonths?: number;
  adminRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

import { Platform } from 'react-native';

// Dynamic resolver for HTTP server based on OS and environment
const getHttpUrl = () => {
  try {
    const Constants = require('expo-constants').default;
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.packagerOpts?.hostId;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:8000`;
    }
  } catch (e) {
    // Fallback if expo-constants is unavailable
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000'; // Redirects Android Emulator to host computer
  }
  return 'http://localhost:8000'; // iOS Simulator / Web fallback
};

export const BASE_HTTP_URL = getHttpUrl();

// In-Memory Database State
let KYC_DB: Record<string, KYCFlowData> = {};
let DIAGNOSTICS_DB: Record<string, CropDiagnostic[]> = {};
let APPLICATIONS_DB: LoanApplicationData[] = [];

// Pre-seeded Loan Products in Marketplace
export const MOCK_LOAN_PRODUCTS: LoanProduct[] = [
  {
    id: 'prod-1',
    bankName: 'National Agri Development Bank',
    interestRate: 6.8,
    tenureMonths: 12,
    maxAmount: 500000,
    description: 'Special short-term crop cultivation loan with subsidized interest rates for high-yield grains.'
  },
  {
    id: 'prod-2',
    bankName: 'State Farmers Cooperative',
    interestRate: 7.5,
    tenureMonths: 24,
    maxAmount: 800000,
    description: 'Medium-term farm machinery, irrigation pumps, and tractor financing with flexible repayment plans.'
  },
  {
    id: 'prod-3',
    bankName: 'Apex MicroFinance Rural Bank',
    interestRate: 8.9,
    tenureMonths: 18,
    maxAmount: 300000,
    description: 'Quick-disbursement organic farming credit. Lower interest rates available for farmers with AgriScore > 75.'
  }
];

// Helper to determine Grade and Risk from score
export const calculateGradeAndRisk = (score: number) => {
  let grade = 'D';
  let riskRating: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';

  if (score >= 90) {
    grade = 'A+';
    riskRating = 'LOW';
  } else if (score >= 80) {
    grade = 'A';
    riskRating = 'LOW';
  } else if (score >= 70) {
    grade = 'B+';
    riskRating = 'MEDIUM';
  } else if (score >= 60) {
    grade = 'B';
    riskRating = 'MEDIUM';
  } else if (score >= 50) {
    grade = 'C';
    riskRating = 'MEDIUM';
  } else {
    grade = 'D';
    riskRating = 'HIGH';
  }
  return { grade, riskRating };
};

// Seed initial KYC data for testing the farmer profile
const seedFarmerKYC = () => {
  const seedId = 'farmer-user-id-123';
  KYC_DB[seedId] = {
    fullName: 'Ramesh Kumar',
    mobile: '9876543210',
    dob: '1984-06-15',
    gender: 'Male',
    address: 'Plot 42, Green Village Road',
    kycIdType: 'Aadhaar Card',
    kycIdNumber: '1234-5678-9012',
    sizeAcres: 8.5,
    ownershipType: 'OWNED',
    cropType: 'Basmati Rice',
    sowingDate: '2026-05-01',
    harvestDate: '2026-09-30',
    soilType: 'Alluvial Soil',
    irrigationType: 'Tubewell / Canal',
    annualIncome: 450000,
    existingLoans: false,
    outstandingDebt: 0,
    bankName: 'National Agri Development Bank',
    bankAccountNumber: '987654321098',
    village: 'Karnal',
    district: 'Karnal',
    state: 'Haryana',
    gpsLat: 29.6857,
    gpsLon: 76.9905,
  };
  
  DIAGNOSTICS_DB[seedId] = [
    {
      id: 'diag-1',
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500',
      diseaseDetected: 'Rice Blast (Magnaporthe oryzae)',
      confidenceScore: 94.5,
      severity: 'MEDIUM',
      treatmentRecommendation: 'Spray Tricyclazole 75 WP at 0.6 grams per liter of water. Ensure proper spacing and moderate nitrogen fertilizer application.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  APPLICATIONS_DB.push({
    id: 'loan-app-seed',
    farmerId: seedId,
    farmerName: 'Ramesh Kumar',
    amount: 150000,
    tenureMonths: 12,
    interestRate: 6.8,
    emi: 12970,
    bankName: 'National Agri Development Bank',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  });
};
// seedFarmerKYC();

export const apiService = {
  // Sync KYC details from WebSocket event
  syncKYCData: (farmerId: string, data: KYCFlowData) => {
    KYC_DB[farmerId] = data;
    console.log(`[API Service] Synchronized KYC details for farmer: ${farmerId}`);
  },

  // Sync Loan Application from WebSocket event
  syncLoanApplication: (app: LoanApplicationData) => {
    const idx = APPLICATIONS_DB.findIndex(a => a.id === app.id);
    if (idx !== -1) {
      APPLICATIONS_DB[idx] = {
        ...APPLICATIONS_DB[idx],
        ...app
      };
      console.log(`[API Service] Synchronized existing loan status: ${app.id}`);
    } else {
      APPLICATIONS_DB.unshift(app);
      console.log(`[API Service] Synchronized new loan application: ${app.id}`);
    }
  },

  // ADMIN: Get all registered farmers
  getAllFarmers: async (): Promise<KYCFlowData[]> => {
    try {
      const res = await fetch(`${BASE_HTTP_URL}/api/farmers`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          json.data.forEach((farmer: any) => {
            const fid = farmer.farmerId || farmer.farmer_id;
            if (fid) {
              KYC_DB[fid] = farmer;
            }
          });
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[API Service] Failed to get all farmers via HTTP, using local:', e);
    }
    return Object.values(KYC_DB);
  },

  // Fetch Farmer Profile
  getKYCDetails: async (farmerId: string): Promise<KYCFlowData | null> => {
    try {
      const res = await fetch(`${BASE_HTTP_URL}/api/farmer/profile/${farmerId}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          KYC_DB[farmerId] = json.data;
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[API Service] Failed to get KYC details via HTTP, falling back to local DB:', e);
    }
    return KYC_DB[farmerId] || null;
  },

  // Submit KYC Profile
  submitKYC: async (farmerId: string, data: KYCFlowData, cropFieldImage?: string | null): Promise<KYCFlowData> => {
    KYC_DB[farmerId] = { ...data, cropFieldImage: cropFieldImage || undefined };

    try {
      if (cropFieldImage) {
        const formData = new FormData();
        formData.append('farmerId', farmerId);
        Object.keys(data).forEach((key) => {
          const val = (data as any)[key];
          if (val !== undefined && val !== null) {
            formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
          }
        });

        const uriParts = cropFieldImage.split('/');
        const fileName = uriParts[uriParts.length - 1] || 'photo.jpg';
        const fileType = fileName.split('.').pop() || 'jpeg';

        formData.append('cropFieldImage', {
          uri: cropFieldImage,
          name: fileName,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        } as any);

        const res = await fetch(`${BASE_HTTP_URL}/api/farmer/profile-multipart`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          if (json && json.data) {
            KYC_DB[farmerId] = json.data;
            return json.data;
          }
        }
      } else {
        const res = await fetch(`${BASE_HTTP_URL}/api/farmer/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ farmerId, ...data })
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.data) {
            KYC_DB[farmerId] = json.data;
            return json.data;
          }
        }
      }
    } catch (e) {
      console.warn('[API Service] Failed to submit KYC via HTTP, falling back to local DB:', e);
    }
    return KYC_DB[farmerId];
  },

  // Calculate Credit Score based on farmer details
  fetchCreditScore: async (farmerId: string): Promise<CreditScoreBreakdown> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const kyc = KYC_DB[farmerId];
        if (!kyc) {
          // Default baseline score for un-onboarded farmer
          resolve({
            overallScore: 35,
            grade: 'D',
            riskRating: 'HIGH',
            cropHealth: 40,
            yieldStability: 30,
            climateRisk: 40,
            farmingPractice: 30,
            financialCapability: 20,
            trustVerification: 50,
          });
          return;
        }

        // Compute AI-driven dynamic metrics based on fields
        let cropHealth = 70; // Base
        let yieldStability = 65;
        let climateRisk = 80;
        let farmingPractice = 75;
        let financialCapability = 60;
        let trustVerification = 95; // Since KYC files exist

        // Adjust based on ownership (Owned gets more yield stability, leased less)
        if (kyc.ownershipType === 'OWNED') {
          yieldStability += 15;
          financialCapability += 10;
        } else if (kyc.ownershipType === 'SHARED') {
          yieldStability -= 10;
        }

        // Adjust based on size of land
        if (kyc.sizeAcres > 10) {
          financialCapability += 15;
          yieldStability += 10;
        } else if (kyc.sizeAcres < 3) {
          financialCapability -= 10;
        }

        // Adjust based on irrigation
        if (kyc.irrigationType.toLowerCase().includes('drip') || kyc.irrigationType.toLowerCase().includes('sprinkler')) {
          farmingPractice += 15;
          cropHealth += 10;
          climateRisk += 10;
        } else if (kyc.irrigationType.toLowerCase().includes('rainfed')) {
          climateRisk -= 25; // High vulnerability
          yieldStability -= 15;
        }

        // Adjust based on soil analysis and location
        if (kyc.soilType.toLowerCase().includes('alluvial') || kyc.soilType.toLowerCase().includes('black')) {
          cropHealth += 10;
          yieldStability += 10;
        }

        // Adjust based on outstanding debts
        if (kyc.existingLoans) {
          financialCapability -= 25;
        }
        if (kyc.outstandingDebt > 100000) {
          financialCapability -= 15;
        }

        // Cap scores between 0 and 100
        cropHealth = Math.min(100, Math.max(0, cropHealth));
        yieldStability = Math.min(100, Math.max(0, yieldStability));
        climateRisk = Math.min(100, Math.max(0, climateRisk));
        farmingPractice = Math.min(100, Math.max(0, farmingPractice));
        financialCapability = Math.min(100, Math.max(0, financialCapability));
        trustVerification = Math.min(100, Math.max(0, trustVerification));

        // Compute weighted overall score
        // Crop Health (20%), Yield (20%), Climate (15%), Farm Practice (15%), Finance (20%), Trust (10%)
        const overallScore = Math.round(
          (cropHealth * 0.20) +
          (yieldStability * 0.20) +
          (climateRisk * 0.15) +
          (farmingPractice * 0.15) +
          (financialCapability * 0.20) +
          (trustVerification * 0.10)
        );

        const { grade, riskRating } = calculateGradeAndRisk(overallScore);

        resolve({
          overallScore,
          grade,
          riskRating,
          cropHealth,
          yieldStability,
          climateRisk,
          farmingPractice,
          financialCapability,
          trustVerification,
        });
      }, 700);
    });
  },

  // Diagnostic Image Upload API
  uploadCropImage: async (farmerId: string, imageUri: string): Promise<CropDiagnostic> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Seed diagnostic returns based on random crop issues
        const issues = [
          {
            disease: 'Leaf Blast (Pyricularia oryzae)',
            severity: 'MEDIUM' as const,
            rec: 'Apply Carbendazim 50 WP at 2g per liter. Keep water level optimal. Avoid excess nitrogen.'
          },
          {
            disease: 'Brown Spot (Cochliobolus miyabeanus)',
            severity: 'LOW' as const,
            rec: 'Improve soil nutrition by applying potash. Spray Mancozeb at 2.5g per liter if infestation exceeds 10%.'
          },
          {
            disease: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
            severity: 'HIGH' as const,
            rec: 'Immediately drain the field. Apply Streptocycline at 0.1g + Copper Oxychloride at 2.5g per liter. Avoid irrigation from infected fields.'
          }
        ];

        const randomIssue = issues[Math.floor(Math.random() * issues.length)];
        
        const newDiagnostic: CropDiagnostic = {
          id: `diag-${Math.random().toString(36).substr(2, 9)}`,
          imageUrl: imageUri,
          diseaseDetected: randomIssue.disease,
          confidenceScore: parseFloat((85 + Math.random() * 14).toFixed(1)),
          severity: randomIssue.severity,
          treatmentRecommendation: randomIssue.rec,
          createdAt: new Date().toISOString(),
        };

        if (!DIAGNOSTICS_DB[farmerId]) {
          DIAGNOSTICS_DB[farmerId] = [];
        }
        DIAGNOSTICS_DB[farmerId].unshift(newDiagnostic); // Newest first
        resolve(newDiagnostic);
      }, 2000); // Simulate ML analysis delay
    });
  },

  // Fetch crop diagnosis history
  getCropDiagnostics: async (farmerId: string): Promise<CropDiagnostic[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(DIAGNOSTICS_DB[farmerId] || []);
      }, 400);
    });
  },

  // Submit Loan Application
  submitLoanApplication: async (
    farmerId: string, 
    farmerName: string,
    amount: number, 
    tenureMonths: number, 
    interestRate: number, 
    bankName: string
  ): Promise<LoanApplicationData> => {
    // Generate base mock local app
    const monthlyRate = (interestRate / 100) / 12;
    const emi = Math.round(
      (amount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    );

    const mockApp: LoanApplicationData = {
      id: `loan-app-${Math.random().toString(36).substr(2, 9)}`,
      farmerId,
      farmerName,
      amount,
      tenureMonths,
      interestRate,
      emi,
      bankName,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${BASE_HTTP_URL}/api/loans/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId,
          farmerName,
          amount,
          tenureMonths,
          interestRate,
          bankName
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          APPLICATIONS_DB.unshift(json.data);
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[API Service] Failed to submit loan application via HTTP, using mock:', e);
    }

    APPLICATIONS_DB.unshift(mockApp);
    return mockApp;
  },

  // Get active applications for a specific farmer
  getFarmerLoanApplications: async (farmerId: string): Promise<LoanApplicationData[]> => {
    try {
      const res = await fetch(`${BASE_HTTP_URL}/api/loans/farmer/${farmerId}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          // Merge/sync with local DB
          const remoteApps = json.data;
          remoteApps.forEach((app: any) => {
            const idx = APPLICATIONS_DB.findIndex(a => a.id === app.id);
            if (idx !== -1) {
              APPLICATIONS_DB[idx] = app;
            } else {
              APPLICATIONS_DB.push(app);
            }
          });
          return APPLICATIONS_DB.filter(app => app.farmerId === farmerId);
        }
      }
    } catch (e) {
      console.warn('[API Service] Failed to get farmer loan applications via HTTP:', e);
    }
    return APPLICATIONS_DB.filter(app => app.farmerId === farmerId);
  },

  // ADMIN: Get all applications
  getAllLoanApplications: async (): Promise<LoanApplicationData[]> => {
    try {
      const res = await fetch(`${BASE_HTTP_URL}/api/loans`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          APPLICATIONS_DB = json.data;
          return APPLICATIONS_DB;
        }
      }
    } catch (e) {
      console.warn('[API Service] Failed to get all applications via HTTP:', e);
    }
    return APPLICATIONS_DB;
  },

  // ADMIN: Submit Loan offer adjustments or update status
  adminSubmitOffer: async (
    applicationId: string,
    offeredInterestRate: number,
    offeredTenureMonths: number,
    status: 'OFFERED' | 'APPROVED' | 'REJECTED',
    remarks: string
  ): Promise<LoanApplicationData> => {
    const appIndex = APPLICATIONS_DB.findIndex(app => app.id === applicationId);
    const app = appIndex !== -1 ? APPLICATIONS_DB[appIndex] : null;
    
    const monthlyRate = (offeredInterestRate / 100) / 12;
    const newEmi = app ? Math.round(
      (app.amount * monthlyRate * Math.pow(1 + monthlyRate, offeredTenureMonths)) /
      (Math.pow(1 + monthlyRate, offeredTenureMonths) - 1)
    ) : 0;

    const mockUpdatedApp: LoanApplicationData = app ? {
      ...app,
      status,
      offeredInterestRate,
      offeredTenureMonths,
      emi: newEmi,
      adminRemarks: remarks,
      updatedAt: new Date().toISOString(),
    } : {
      id: applicationId,
      farmerId: '',
      farmerName: 'Unknown',
      amount: 0,
      tenureMonths: offeredTenureMonths,
      interestRate: offeredInterestRate,
      emi: newEmi,
      bankName: '',
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (appIndex !== -1) {
      APPLICATIONS_DB[appIndex] = mockUpdatedApp;
    }

    try {
      const res = await fetch(`${BASE_HTTP_URL}/api/loans/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          farmerId: app ? app.farmerId : '',
          status,
          offeredInterestRate,
          offeredTenureMonths,
          adminRemarks: remarks
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          if (appIndex !== -1) {
            APPLICATIONS_DB[appIndex] = json.data;
          }
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[API Service] Failed to update offer via HTTP:', e);
    }

    return mockUpdatedApp;
  },

  // ADMIN: Action loan offer (by farmer: accept/reject)
  farmerActionOffer: async (applicationId: string, accept: boolean): Promise<LoanApplicationData> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const appIndex = APPLICATIONS_DB.findIndex(app => app.id === applicationId);
        if (appIndex === -1) {
          reject(new Error('Loan application not found.'));
          return;
        }

        const app = APPLICATIONS_DB[appIndex];
        const updatedApp: LoanApplicationData = {
          ...app,
          status: accept ? 'APPROVED' : 'REJECTED',
          updatedAt: new Date().toISOString(),
        };

        APPLICATIONS_DB[appIndex] = updatedApp;
        resolve(updatedApp);
      }, 800);
    });
  },

  // ADMIN: Get overall statistics
  getAdminStats: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalRegistered = Object.keys(KYC_DB).length;
        
        // Calculate average credit score
        const activeFarmerIds = Object.keys(KYC_DB);
        let sumScore = 0;
        
        activeFarmerIds.forEach(fid => {
          // Sync calculation (mock)
          const kyc = KYC_DB[fid];
          let score = 35;
          if (kyc) {
            let cropHealth = 70, yieldStability = 65, climateRisk = 80, farmingPractice = 75, financialCapability = 60, trustVerification = 95;
            if (kyc.ownershipType === 'OWNED') { yieldStability += 15; financialCapability += 10; }
            if (kyc.sizeAcres > 10) { financialCapability += 15; yieldStability += 10; }
            if (kyc.irrigationType.toLowerCase().includes('drip')) { farmingPractice += 15; cropHealth += 10; }
            if (kyc.existingLoans) financialCapability -= 25;
            score = Math.round(cropHealth*0.2 + yieldStability*0.2 + climateRisk*0.15 + farmingPractice*0.15 + financialCapability*0.2 + trustVerification*0.1);
          }
          sumScore += score;
        });

        const averageCreditScore = totalRegistered > 0 ? Math.round(sumScore / totalRegistered) : 72;
        const totalLoanVolume = APPLICATIONS_DB
          .filter(app => app.status === 'APPROVED' || app.status === 'DISBURSED')
          .reduce((sum, app) => sum + app.amount, 0);

        const pendingApplications = APPLICATIONS_DB.filter(app => app.status === 'PENDING').length;

        resolve({
          totalRegistered,
          averageCreditScore,
          totalLoanVolume,
          pendingApplications,
          activeLendersCount: 4,
          systemRiskFlagCount: APPLICATIONS_DB.filter(app => app.status === 'REJECTED').length
        });
      }, 500);
    });
  }
};
