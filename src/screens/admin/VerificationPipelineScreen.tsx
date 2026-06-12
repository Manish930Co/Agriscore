import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLoanStore } from '../../store/useLoanStore';
import { apiService, KYCFlowData, CreditScoreBreakdown, BASE_HTTP_URL } from '../../services/api';
import { webSocketService } from '../../services/websocket';
import { colors } from '../../theme/colors';
import { Search, Eye, X, Check, FileCheck, ShieldAlert, Landmark, Phone, MapPin } from 'lucide-react-native';

function SkeletonLoader() {
  return (
    <View style={{ marginVertical: 12, gap: 10 }}>
      <View style={{ backgroundColor: '#E5E7EB', borderRadius: 4, width: '80%', height: 18 }} />
      <View style={{ backgroundColor: '#E5E7EB', borderRadius: 4, width: '60%', height: 14 }} />
      <View style={{ backgroundColor: '#E5E7EB', borderRadius: 4, width: '90%', height: 14 }} />
      <View style={{ backgroundColor: '#E5E7EB', borderRadius: 4, width: '70%', height: 14 }} />
      <View style={{ backgroundColor: '#E5E7EB', borderRadius: 4, width: '85%', height: 14 }} />
    </View>
  );
}

export default function VerificationPipelineScreen() {
  const { 
    allApplications, 
    lenderFarmersList, 
    fetchAllApplications, 
    fetchLenderFarmersList, 
    adminSubmitOffer, 
    isLoading, 
    isSaving 
  } = useLoanStore();
  
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'farmers'>('applications');
  
  // Audited details state
  const [farmerKYC, setFarmerKYC] = useState<KYCFlowData | null>(null);
  const [farmerScore, setFarmerScore] = useState<CreditScoreBreakdown | null>(null);
  const [loadedFarmerId, setLoadedFarmerId] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Offer fields state
  const [offeredRate, setOfferedRate] = useState('');
  const [offeredTenure, setOfferedTenure] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchAllApplications();
    fetchLenderFarmersList();
  }, []);

  // Guarantee clean API pull whenever the screen gains focus or re-enters
  useFocusEffect(
    React.useCallback(() => {
      fetchAllApplications();
      fetchLenderFarmersList();

      if (isAuditing && selectedApp) {
        console.log('[VerificationPipeline] Re-focus detected. Clean pulling data for farmer:', selectedApp.farmerId);
        
        const cleanPull = async () => {
          try {
            const kyc = await apiService.getKYCDetails(selectedApp.farmerId);
            const score = await apiService.fetchCreditScore(selectedApp.farmerId);
            setFarmerKYC(kyc);
            setFarmerScore(score);
            setLoadedFarmerId(selectedApp.farmerId);
          } catch (err) {
            console.error('[VerificationPipeline] Clean pull failed:', err);
          }
        };

        cleanPull();
      }
    }, [isAuditing, selectedApp])
  );

  useEffect(() => {
    if (!selectedApp) return;

    const handleUpdate = async (payload: any) => {
      if (selectedApp.farmerId === payload.farmerId) {
        console.log('[VerificationPipeline] Real-time update received for farmer:', payload.farmerId);
        try {
          const kyc = await apiService.getKYCDetails(payload.farmerId);
          const score = await apiService.fetchCreditScore(payload.farmerId);
          setFarmerKYC(kyc);
          setFarmerScore(score);
          setLoadedFarmerId(payload.farmerId);
        } catch (err) {
          console.error('[VerificationPipeline] Failed to reload KYC/score details:', err);
        }
      }
    };

    const unsubscribeKYC = webSocketService.addEventListener('KYC_SUBMITTED', handleUpdate);
    const unsubscribeProfile = webSocketService.addEventListener('FARMER_PROFILE_UPDATED', handleUpdate);

    return () => {
      unsubscribeKYC();
      unsubscribeProfile();
    };
  }, [selectedApp]);

  const handleInspect = async (app: any) => {
    setSelectedApp(app);
    setIsAuditing(true);
    setFarmerKYC(null);
    setFarmerScore(null);
    setLoadedFarmerId(null);
    
    // Set default fields to input
    setOfferedRate(String(app.interestRate));
    setOfferedTenure(String(app.tenureMonths));
    setRemarks('');

    try {
      // Fetch details asynchronously
      const kyc = await apiService.getKYCDetails(app.farmerId);
      const score = await apiService.fetchCreditScore(app.farmerId);
      setFarmerKYC(kyc);
      setFarmerScore(score);
      setLoadedFarmerId(app.farmerId);
    } catch (err: any) {
      Alert.alert('Load Error', 'Failed to retrieve detailed farmer metrics.');
    }
  };

  const handleActionApplication = async (status: 'OFFERED' | 'APPROVED' | 'REJECTED') => {
    if (!selectedApp) return;
    
    const rate = parseFloat(offeredRate);
    const tenure = parseInt(offeredTenure);

    if (isNaN(rate) || isNaN(tenure) || rate <= 0 || tenure <= 0) {
      Alert.alert('Invalid Terms', 'Please enter valid interest rate and tenure.');
      return;
    }

    try {
      await adminSubmitOffer(selectedApp.id, rate, tenure, status, remarks);
      Alert.alert(
        'Action Submitted', 
        `Loan status updated to ${status}.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              setIsAuditing(false);
              setSelectedApp(null);
            } 
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to update application.');
    }
  };

  const handleInspectFarmer = (farmer: KYCFlowData) => {
    // Generate a mock app container to fit the existing audit panel nicely
    const mockApp = {
      id: `mock-app-${farmer.farmerId || farmer.fullName}`,
      farmerId: farmer.farmerId || 'unknown',
      farmerName: farmer.fullName || 'Farmer',
      amount: 0,
      tenureMonths: 12,
      interestRate: 6.8,
      bankName: 'None',
      status: 'PENDING'
    };
    handleInspect(mockApp);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'OFFERED': return colors.info;
      case 'APPROVED': return colors.success;
      case 'REJECTED': return colors.error;
      default: return colors.muted;
    }
  };

  return (
    <View style={styles.container}>
      {/* Search/Pipeline Count Header */}
      {!isAuditing && (
        <View style={styles.pipelineHeader}>
          <Text style={styles.pipelineTitle}>Lender Underwriting Dashboard</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'applications' && styles.activeTabButton]}
              onPress={() => setActiveTab('applications')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'applications' && styles.activeTabButtonText]}>
                Applications ({allApplications.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'farmers' && styles.activeTabButton]}
              onPress={() => setActiveTab('farmers')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'farmers' && styles.activeTabButtonText]}>
                Farmers ({lenderFarmersList.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main List view */}
      {!isAuditing ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : activeTab === 'applications' ? (
            allApplications.length === 0 ? (
              <Text style={styles.emptyText}>No active loan applications in the pipeline.</Text>
            ) : (
              allApplications.map((app) => (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appHeader}>
                    <Text style={styles.farmerName}>{app.farmerName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '15' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>{app.status}</Text>
                    </View>
                  </View>

                  <View style={styles.appRow}>
                    <View style={styles.appCol}>
                      <Text style={styles.appLabel}>Loan Amount</Text>
                      <Text style={styles.appValue}>₹{app.amount.toLocaleString()}</Text>
                    </View>
                    <View style={styles.appCol}>
                      <Text style={styles.appLabel}>Requested Terms</Text>
                      <Text style={styles.appValue}>{app.tenureMonths} Mo @ {app.interestRate}%</Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => handleInspect(app)} style={styles.inspectBtn}>
                    <Eye size={16} color={colors.white} />
                    <Text style={styles.inspectBtnText}>Audit Profile</Text>
                  </TouchableOpacity>
                </View>
              ))
            )
          ) : (
            lenderFarmersList.length === 0 ? (
              <Text style={styles.emptyText}>No registered farmers onboarded yet.</Text>
            ) : (
              lenderFarmersList.map((farmer) => {
                const fid = farmer.farmerId || farmer.farmer_id || 'unknown';
                return (
                  <View key={fid} style={styles.appCard}>
                    <View style={styles.appHeader}>
                      <Text style={styles.farmerName}>{farmer.fullName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: colors.success + '15' }]}>
                        <Text style={[styles.statusText, { color: colors.success }]}>Registered</Text>
                      </View>
                    </View>

                    <View style={styles.appRow}>
                      <View style={styles.appCol}>
                        <Text style={styles.appLabel}>Mobile Number</Text>
                        <Text style={styles.appValue}>{farmer.mobile || 'N/A'}</Text>
                      </View>
                      <View style={styles.appCol}>
                        <Text style={styles.appLabel}>Location</Text>
                        <Text style={styles.appValue}>{farmer.district ? `${farmer.district}, ${farmer.state}` : 'N/A'}</Text>
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => handleInspectFarmer(farmer)} style={styles.inspectBtn}>
                      <Eye size={16} color={colors.white} />
                      <Text style={styles.inspectBtnText}>Audit Profile</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )
          )}
        </ScrollView>
      ) : (
        /* Detailed Audit View */
        <ScrollView contentContainerStyle={styles.auditContent}>
          {/* Audit Header */}
          <View style={styles.auditHeaderRow}>
            <Text style={styles.auditTitle}>Profile Audit Panel</Text>
            <TouchableOpacity onPress={() => setIsAuditing(false)} style={styles.closeBtn}>
              <X size={20} color={colors.charcoal} />
            </TouchableOpacity>
          </View>

          {/* Farmer Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Applicant Credentials</Text>
            <Text style={styles.auditFarmerName}>{selectedApp.farmerName}</Text>
            
            {(!farmerKYC || loadedFarmerId !== selectedApp.farmerId) ? (
              <SkeletonLoader />
            ) : (
              <View style={styles.kycDetailsGrid}>
                <View style={styles.kycRow}>
                  <Phone size={14} color={colors.muted} />
                  <Text style={styles.kycText}>Mobile: {farmerKYC.mobile}</Text>
                </View>
                <View style={styles.kycRow}>
                  <MapPin size={14} color={colors.muted} />
                  <Text style={styles.kycText}>Location: {farmerKYC.village}, {farmerKYC.district}, {farmerKYC.state}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Landmark size={14} color={colors.muted} />
                  <Text style={styles.kycText}>Bank: {farmerKYC.bankName} (Acct: ...{farmerKYC.bankAccountNumber ? String(farmerKYC.bankAccountNumber).slice(-4) : 'N/A'})</Text>
                </View>

                <View style={styles.kycDetailsDivider} />
                
                <Text style={styles.subLabel}>Farm & Agronomics:</Text>
                <Text style={styles.metaRow}>• Land Area: {farmerKYC.sizeAcres} Acres ({farmerKYC.ownershipType})</Text>
                <Text style={styles.metaRow}>• Current Crop: {farmerKYC.cropType} (Soil: {farmerKYC.soilType})</Text>
                <Text style={styles.metaRow}>• Irrigation: {farmerKYC.irrigationType}</Text>
                <Text style={styles.metaRow}>• Sowing Date: {farmerKYC.sowingDate} | Harvest: {farmerKYC.harvestDate}</Text>

                {farmerKYC.cropFieldImage && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.subLabel, { marginBottom: 6 }]}>Verified Crop Field Photo:</Text>
                    <Image 
                      source={{ uri: String(farmerKYC.cropFieldImage).startsWith('http') ? String(farmerKYC.cropFieldImage) : `${BASE_HTTP_URL}${farmerKYC.cropFieldImage}` }} 
                      style={{ width: '100%', height: 160, borderRadius: 8, resizeMode: 'cover' }} 
                    />
                  </View>
                )}

                <View style={styles.kycDetailsDivider} />

                <Text style={styles.subLabel}>Income & Debts:</Text>
                <Text style={styles.metaRow}>• Annual Income: ₹{farmerKYC.annualIncome?.toLocaleString() || '0'}</Text>
                <Text style={styles.metaRow}>• Outstanding Debt: ₹{farmerKYC.outstandingDebt?.toLocaleString() || '0'}</Text>
              </View>
            )}
          </View>

          {/* AI Metrics Breakdown */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>AI Risk Rating Assessment</Text>
            {(!farmerScore || loadedFarmerId !== selectedApp.farmerId) ? (
              <SkeletonLoader />
            ) : (
              <View>
                <View style={styles.scoreSummaryRow}>
                  <Text style={styles.scoreText}>AgriScore: {farmerScore.overallScore} / 100</Text>
                  <View style={[styles.badge, { backgroundColor: colors.primaryBg }]}>
                    <Text style={styles.badgeText}>Grade {farmerScore.grade}</Text>
                  </View>
                </View>

                {/* Module progress lists */}
                {[
                  { label: 'Crop Health (20%)', score: farmerScore.cropHealth, color: colors.success },
                  { label: 'Yield Stability (20%)', score: farmerScore.yieldStability, color: '#3B82F6' },
                  { label: 'Climate Risk (15%)', score: farmerScore.climateRisk, color: '#8B5CF6' },
                  { label: 'Farming Practice (15%)', score: farmerScore.farmingPractice, color: '#EC4899' },
                  { label: 'Financial Capability (20%)', score: farmerScore.financialCapability, color: colors.accentDark },
                  { label: 'Trust & KYC (10%)', score: farmerScore.trustVerification, color: '#06B6D4' },
                ].map((mod, i) => (
                  <View key={i} style={styles.modRow}>
                    <View style={styles.modLabelRow}>
                      <Text style={styles.modLabel}>{mod.label}</Text>
                      <Text style={styles.modVal}>{mod.score}%</Text>
                    </View>
                    <View style={styles.modProgressTrack}>
                      <View style={[styles.modProgressFill, { width: `${mod.score}%`, backgroundColor: mod.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Underwriting Form */}
          {selectedApp.amount > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Lender Credit Underwriting</Text>
              
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Offer Rate (% p.a.)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={offeredRate}
                    onChangeText={setOfferedRate}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Offer Tenure (Months)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={offeredTenure}
                    onChangeText={setOfferedTenure}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Underwriting Remarks</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Provide context or instructions for adjusting rate/tenure terms."
                multiline
                numberOfLines={3}
                value={remarks}
                onChangeText={setRemarks}
              />

              {/* Application status triggers */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  onPress={() => handleActionApplication('REJECTED')} 
                  disabled={isSaving}
                  style={[styles.actionBtn, styles.rejectBtn]}
                >
                  <X size={18} color={colors.white} />
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleActionApplication('OFFERED')} 
                  disabled={isSaving}
                  style={[styles.actionBtn, styles.offerBtn]}
                >
                  <Landmark size={18} color={colors.white} />
                  <Text style={styles.actionBtnText}>Adjust Offer</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleActionApplication('APPROVED')} 
                  disabled={isSaving}
                  style={[styles.actionBtn, styles.approveBtn]}
                >
                  <Check size={18} color={colors.white} />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.sectionCard, { alignItems: 'center', paddingVertical: 24 }]}>
              <Landmark size={32} color={colors.muted} />
              <Text style={[styles.subLabel, { marginTop: 12, marginBottom: 4 }]}>No Active Loan Application</Text>
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18 }}>
                This farmer has successfully onboarded but hasn't submitted a loan request yet.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pipelineHeader: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  pipelineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.charcoal,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  activeTabButtonText: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loader: {
    marginVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: 40,
    fontStyle: 'italic',
  },
  appCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: 8,
    marginBottom: 10,
  },
  farmerName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.charcoal,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  appCol: {
    flex: 1,
  },
  appLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '500',
  },
  appValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: 2,
  },
  inspectBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inspectBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  auditContent: {
    padding: 16,
    paddingBottom: 40,
  },
  auditHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  auditTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.charcoal,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.charcoal,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: 8,
    marginBottom: 12,
  },
  auditFarmerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 10,
  },
  kycDetailsGrid: {
    marginTop: 4,
  },
  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kycText: {
    fontSize: 12.5,
    color: colors.charcoal,
    marginLeft: 8,
  },
  kycDetailsDivider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: 12,
  },
  subLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 8,
  },
  metaRow: {
    fontSize: 12,
    color: colors.charcoalLight,
    marginBottom: 4.5,
    lineHeight: 16,
  },
  scoreSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.charcoal,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  modRow: {
    marginBottom: 10,
  },
  modLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },
  modVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.charcoal,
  },
  modProgressTrack: {
    height: 5,
    backgroundColor: colors.lightGray,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  modProgressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  formCol: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: colors.charcoal,
  },
  textArea: {
    height: 70,
    paddingTop: 10,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  rejectBtn: {
    flex: 0.28,
    backgroundColor: colors.error,
  },
  offerBtn: {
    flex: 0.38,
    backgroundColor: colors.warning,
  },
  approveBtn: {
    flex: 0.28,
    backgroundColor: colors.success,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
});
