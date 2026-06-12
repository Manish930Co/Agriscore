import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useLoanStore } from '../../store/useLoanStore';
import { colors } from '../../theme/colors';
import { BarChart3, Users, Landmark, AlertTriangle, ShieldCheck, LogOut, ChevronRight } from 'lucide-react-native';

export default function AdminDashboard({ navigation }: any) {
  const { logout, user } = useAuthStore();
  const { adminStats, fetchAdminStats, fetchAllApplications, isLoading, resetLoanStore } = useLoanStore();

  const handleRefresh = async () => {
    await fetchAdminStats();
    await fetchAllApplications();
  };

  useEffect(() => {
    fetchAdminStats();
    fetchAllApplications();
  }, []);

  const handleLogout = async () => {
    resetLoanStore();
    await logout();
  };

  if (isLoading && !adminStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={[colors.primary]} />}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Admin Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roleText}>Lender Account</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Analytics KPI Metrics Grid */}
      <Text style={styles.sectionTitle}>Portfolio Overview</Text>
      
      <View style={styles.statsGrid}>
        {/* Metric Card 1 */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryBg }]}>
            <Users size={20} color={colors.primaryDark} />
          </View>
          <Text style={styles.statVal}>{adminStats?.totalRegistered || 0}</Text>
          <Text style={styles.statLabel}>Registered Farmers</Text>
        </View>

        {/* Metric Card 2 */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
            <ShieldCheck size={20} color="#2563EB" />
          </View>
          <Text style={styles.statVal}>{adminStats?.averageCreditScore || 0}</Text>
          <Text style={styles.statLabel}>Avg AgriScore (0-100)</Text>
        </View>

        {/* Metric Card 3 */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
            <Landmark size={20} color="#EA580C" />
          </View>
          <Text style={styles.statVal}>₹{(adminStats?.totalLoanVolume || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Active Disbursed Loans</Text>
        </View>

        {/* Metric Card 4 */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
            <AlertTriangle size={20} color={colors.error} />
          </View>
          <Text style={styles.statVal}>{adminStats?.pendingApplications || 0}</Text>
          <Text style={styles.statLabel}>Pending Audits</Text>
        </View>
      </View>

      {/* Verification Pipeline CTA Card */}
      <View style={styles.pipelineCard}>
        <View style={styles.pipelineInfo}>
          <Text style={styles.pipelineTitle}>Verification & Loan Pipeline</Text>
          <Text style={styles.pipelineDesc}>Inspect farmer KYC files, review 6-module AI credit profiles, adjust offer interest rates/tenures, and action pending loan applications.</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('VerificationPipeline')} 
          style={styles.pipelineBtn}
        >
          <Text style={styles.pipelineBtnText}>Enter Pipeline</Text>
          <ChevronRight size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Lender System summary */}
      <View style={styles.systemCard}>
        <Text style={styles.systemTitle}>System Status</Text>
        <View style={styles.systemRow}>
          <Text style={styles.systemLabel}>Lender Nodes Connected</Text>
          <Text style={styles.systemVal}>{adminStats?.activeLendersCount || 4} Active</Text>
        </View>
        <View style={styles.systemRow}>
          <Text style={styles.systemLabel}>Risk/Rejected Flags</Text>
          <Text style={[styles.systemVal, { color: colors.error }]}>{adminStats?.systemRiskFlagCount || 0} Flags</Text>
        </View>
        <View style={styles.systemRow}>
          <Text style={styles.systemLabel}>AI ML Scoring Engine</Text>
          <Text style={[styles.systemVal, { color: colors.success }]}>Online</Text>
        </View>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  roleText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emailText: {
    fontSize: 18,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1.5,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.charcoal,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 4,
  },
  pipelineCard: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  pipelineInfo: {
    marginBottom: 16,
  },
  pipelineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  pipelineDesc: {
    fontSize: 12,
    color: colors.primaryLight,
    lineHeight: 18,
    marginTop: 6,
    opacity: 0.9,
  },
  pipelineBtn: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  systemCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 16,
    padding: 16,
  },
  systemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 12,
  },
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  systemLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  systemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.charcoal,
  },
});
