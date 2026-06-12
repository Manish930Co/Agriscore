import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFarmerStore } from '../../store/useFarmerStore';
import { colors } from '../../theme/colors';
import { ShieldCheck, TrendingUp, HelpCircle, Activity, Globe, Sprout, Landmark, FileCheck } from 'lucide-react-native';

export default function AgriScoreReportScreen() {
  const { creditScore, kycDetails } = useFarmerStore();

  const getProgressColor = (val: number) => {
    if (val >= 80) return colors.success;
    if (val >= 50) return colors.warning;
    return colors.error;
  };

  const modules = [
    {
      name: 'Crop Health Rating',
      weight: '20%',
      icon: <Sprout size={18} color={colors.primaryDark} />,
      score: creditScore?.cropHealth || 40,
      description: 'Calculated from crop diagnostic photos uploaded, pest incidence history, and soil health conditions.',
      tips: 'Take regular photos of crop foliage using the Crop AI module to demonstrate active health monitoring.'
    },
    {
      name: 'Yield Stability Index',
      weight: '20%',
      icon: <Activity size={18} color="#3B82F6" />,
      score: creditScore?.yieldStability || 30,
      description: 'Based on land holding size, historical crop outputs, crop rotation cycles, and land ownership type.',
      tips: 'Longer-term lease agreements or owned land structures improve this index.'
    },
    {
      name: 'Climate & Weather Vulnerability',
      weight: '15%',
      icon: <Globe size={18} color="#8B5CF6" />,
      score: creditScore?.climateRisk || 40,
      description: 'Based on historical district weather anomalies, rainfall predictions, and drought resilience.',
      tips: 'Upgrade irrigation properties to modern setups to mitigate low rain vulnerabilities.'
    },
    {
      name: 'Farming Practice Rating',
      weight: '15%',
      icon: <TrendingUp size={18} color="#EC4899" />,
      score: creditScore?.farmingPractice || 30,
      description: 'Calculated from soil conservation practice selection, biological crop protection usage, and irrigation mechanism.',
      tips: 'Adopt drip or sprinkler irrigation and organic soil amendments to boost rating.'
    },
    {
      name: 'Financial Capability Score',
      weight: '20%',
      icon: <Landmark size={18} color={colors.accentDark} />,
      score: creditScore?.financialCapability || 20,
      description: 'Evaluates annual farm revenues, bank statement history, existing debt ratio, and credit history.',
      tips: 'Keep debts low, clear active loans on time, and direct farm income transactions through your registered bank account.'
    },
    {
      name: 'Trust & Verification Rating',
      weight: '10%',
      icon: <FileCheck size={18} color="#06B6D4" />,
      score: creditScore?.trustVerification || 50,
      description: 'Determines the validity of identification uploads, physical address verification, and GPS coordinate tracking.',
      tips: 'Ensure all KYC documentation details match precisely with bank and identity registers.'
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <ShieldCheck size={28} color={colors.primaryDark} />
        <Text style={styles.headerTitle}>AI Credit Audit Report</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        Detailed multi-dimensional rating computed by our agricultural risk assessment algorithms.
      </Text>

      {/* Credit Summary Card */}
      {creditScore ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Overall Rating</Text>
              <Text style={styles.summaryScore}>{creditScore.overallScore} <Text style={styles.maxScore}>/ 100</Text></Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getProgressColor(creditScore.overallScore) + '15' }]}>
              <Text style={[styles.badgeText, { color: getProgressColor(creditScore.overallScore) }]}>Grade {creditScore.grade}</Text>
            </View>
          </View>
          <Text style={styles.summaryDesc}>
            Your profile has a <Text style={{ fontWeight: '700', color: getProgressColor(creditScore.overallScore) }}>{creditScore.riskRating}</Text> risk rating. 
            Lenders offer dynamic interest rates on the marketplace based on these criteria.
          </Text>
        </View>
      ) : (
        <View style={styles.summaryCard}>
          <Text style={styles.noKYCText}>Onboarding incomplete. Showing default baseline profile parameters.</Text>
        </View>
      )}

      {/* Modules List */}
      <Text style={styles.sectionTitle}>Performance Breakdown</Text>
      {modules.map((mod, index) => (
        <View key={index} style={styles.moduleCard}>
          <View style={styles.moduleHeader}>
            <View style={styles.iconBox}>
              {mod.icon}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.moduleName}>{mod.name}</Text>
              <Text style={styles.moduleWeight}>Weight: {mod.weight}</Text>
            </View>
            <Text style={[styles.moduleScore, { color: getProgressColor(mod.score) }]}>{mod.score} / 100</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${mod.score}%`, backgroundColor: getProgressColor(mod.score) }
              ]} 
            />
          </View>

          <Text style={styles.moduleDesc}>{mod.description}</Text>
          
          <View style={styles.tipBox}>
            <HelpCircle size={14} color={colors.muted} style={{ marginTop: 2, marginRight: 6 }} />
            <Text style={styles.tipText}><Text style={{ fontWeight: '700', color: colors.charcoalLight }}>How to improve: </Text>{mod.tips}</Text>
          </View>
        </View>
      ))}
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
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.charcoal,
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryScore: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  maxScore: {
    fontSize: 16,
    color: colors.primaryLight,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryDesc: {
    fontSize: 13,
    color: colors.primaryLight,
    lineHeight: 18,
    opacity: 0.9,
  },
  noKYCText: {
    fontSize: 13,
    color: colors.primaryLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 12,
  },
  moduleCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
  moduleWeight: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  moduleScore: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  moduleDesc: {
    fontSize: 12,
    color: colors.charcoalLight,
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
    flex: 1,
  },
});
