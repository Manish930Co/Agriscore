import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useFarmerStore } from '../../store/useFarmerStore';
import { useLoanStore } from '../../store/useLoanStore';
import CreditScoreGauge from '../../components/CreditScoreGauge';
import { colors } from '../../theme/colors';
import { Leaf, Landmark, AlertTriangle, ChevronRight, Activity, TrendingUp, LogOut } from 'lucide-react-native';

export default function FarmerDashboard({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const { kycDetails, creditScore, fetchKYC, isLoading, resetFarmerStore } = useFarmerStore();
  const { applications, fetchFarmerApplications, resetLoanStore } = useLoanStore();

  const handleRefresh = async () => {
    if (user?.uid) {
      await fetchKYC(user.uid);
      await fetchFarmerApplications(user.uid);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchKYC(user.uid);
      fetchFarmerApplications(user.uid);
    }
  }, [user?.uid]);

  const handleLogout = async () => {
    resetFarmerStore();
    resetLoanStore();
    await logout();
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

  const activeLoan = applications[0];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={[colors.primary]} />}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Welcome & Logout Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, Farmer</Text>
          <Text style={styles.nameText}>{kycDetails?.fullName || user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* KYC Alert if not onboarded */}
      {!kycDetails && (
        <View style={styles.alertCard}>
          <AlertTriangle color={colors.accentDark} size={28} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Complete Your Profile</Text>
            <Text style={styles.alertDesc}>Please submit your farm and financial details to calculate your AgriScore and unlock loans.</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('KYCOnboarding')} 
              style={styles.alertBtn}
            >
              <Text style={styles.alertBtnText}>Start Onboarding</Text>
              <ChevronRight size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Credit Score Gauge Card */}
      {kycDetails && creditScore && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Credit Health</Text>
          <View style={styles.gaugeWrapper}>
            <CreditScoreGauge score={creditScore.overallScore} />
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('AgriScoreReport')} 
            style={styles.reportLink}
          >
            <Text style={styles.reportLinkText}>View Detailed AI Credit Report</Text>
            <ChevronRight size={16} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>
      )}

      {/* Active Loan Application Tracker */}
      {activeLoan && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Active Loan Request</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeLoan.status) + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(activeLoan.status) }]}>{activeLoan.status}</Text>
            </View>
          </View>
          
          <View style={styles.loanDetails}>
            <View style={styles.loanDetailItem}>
              <Text style={styles.detailLabel}>Bank Name</Text>
              <Text style={styles.detailValue}>{activeLoan.bankName}</Text>
            </View>
            <View style={styles.loanDetailItem}>
              <Text style={styles.detailLabel}>Applied Amount</Text>
              <Text style={styles.detailValue}>₹{activeLoan.amount.toLocaleString()}</Text>
            </View>
          </View>

          {activeLoan.status === 'OFFERED' && (
            <View style={styles.offerBox}>
              <Text style={styles.offerText}>Bank has offered adjusted terms: {activeLoan.offeredInterestRate}% Interest, {activeLoan.offeredTenureMonths} Months. EMI: ₹{activeLoan.emi.toLocaleString()}/mo.</Text>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => navigation.navigate('LoanMarketplace')}
              >
                <Text style={styles.actionBtnText}>Respond to Offer</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeLoan.status === 'PENDING' && (
            <Text style={styles.trackerHelpText}>Your application is currently being evaluated by {activeLoan.bankName}. Check back soon.</Text>
          )}
        </View>
      )}

      {/* Farm Analytics Summary */}
      {kycDetails && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Farm Diagnostics & Analytics</Text>
          
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <View style={[styles.iconBox, { backgroundColor: colors.primaryBg }]}>
                <Leaf size={20} color={colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.analyticLabel}>Crop Type</Text>
                <Text style={styles.analyticValue}>{kycDetails.cropType}</Text>
              </View>
            </View>

            <View style={styles.analyticsItem}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <Activity size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.analyticLabel}>Farm Area</Text>
                <Text style={styles.analyticValue}>{kycDetails.sizeAcres} Acres</Text>
              </View>
            </View>

            <View style={styles.analyticsItem}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                <TrendingUp size={20} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.analyticLabel}>Expected Harvest</Text>
                <Text style={styles.analyticValue}>
                  {new Date(kycDetails.harvestDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>

            <View style={styles.analyticsItem}>
              <View style={[styles.iconBox, { backgroundColor: '#F5F5F7' }]}>
                <Landmark size={20} color={colors.charcoal} />
              </View>
              <View>
                <Text style={styles.analyticLabel}>Soil & Water</Text>
                <Text style={styles.analyticValue}>{kycDetails.soilType}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.charcoal,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: colors.accentLight + '40',
    borderWidth: 1,
    borderColor: colors.accent + '30',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accentDark,
  },
  alertDesc: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  alertBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: colors.accentDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 16,
  },
  gaugeWrapper: {
    paddingVertical: 10,
  },
  reportLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
    paddingTop: 16,
    marginTop: 16,
  },
  reportLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    marginRight: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  loanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  loanDetailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: 4,
  },
  trackerHelpText: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  offerBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  offerText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
    fontWeight: '500',
  },
  actionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.lightGray,
    padding: 10,
    borderRadius: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  analyticLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
  },
  analyticValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: 2,
  },
});
