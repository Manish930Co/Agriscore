import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useFarmerStore } from '../../store/useFarmerStore';
import { useLoanStore } from '../../store/useLoanStore';
import { colors } from '../../theme/colors';
import { Calculator, BadgePercent, Clock, ShieldCheck, ChevronRight, Check, X } from 'lucide-react-native';

export default function LoanMarketplaceScreen() {
  const { user } = useAuthStore();
  const { kycDetails, creditScore } = useFarmerStore();
  const { 
    applications, 
    loanProducts, 
    fetchFarmerApplications, 
    applyForLoan, 
    farmerActionOffer,
    isSaving, 
    isLoading 
  } = useLoanStore();

  // EMI Calculator State
  const [calcAmount, setCalcAmount] = useState('100000');
  const [calcTenure, setCalcTenure] = useState('12');
  const [calcRate, setCalcRate] = useState('7.2');
  const [calcEmi, setCalcEmi] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      fetchFarmerApplications(user.uid);
    }
  }, [user?.uid]);

  // Compute EMI whenever inputs alter
  useEffect(() => {
    const P = parseFloat(calcAmount) || 0;
    const N = parseInt(calcTenure) || 0;
    const R = (parseFloat(calcRate) || 0) / 100 / 12;

    if (P > 0 && N > 0 && R > 0) {
      const emiVal = Math.round((P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1));
      setCalcEmi(emiVal);
    } else {
      setCalcEmi(0);
    }
  }, [calcAmount, calcTenure, calcRate]);

  const handleApply = async (product: any) => {
    if (!kycDetails) {
      Alert.alert('KYC Profile Required', 'Please submit your KYC & Farm details before applying for a loan.');
      return;
    }

    if (!user?.uid) return;

    // Check if an application is already pending/offered
    const hasActiveLoan = applications.some(app => app.status === 'PENDING' || app.status === 'OFFERED');
    if (hasActiveLoan) {
      Alert.alert('Application Active', 'You already have a loan request in evaluation. Please wait or resolve the active offer.');
      return;
    }

    // Adjust rate based on credit score premium discount
    let finalRate = product.interestRate;
    if (creditScore && creditScore.overallScore >= 80) {
      finalRate -= 0.5; // 50 bps discount for high score
    } else if (creditScore && creditScore.overallScore < 50) {
      finalRate += 1.0; // risk premium addition
    }
    finalRate = parseFloat(finalRate.toFixed(1));

    // Prompt confirmation
    Alert.alert(
      'Apply for Loan',
      `Confirm application for ₹${calcAmount} at ${finalRate}% interest rate with ${product.bankName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply Now', 
          onPress: async () => {
            try {
              await applyForLoan(
                user.uid,
                kycDetails.fullName,
                parseFloat(calcAmount) || 100000,
                parseInt(calcTenure) || 12,
                finalRate,
                product.bankName
              );
              Alert.alert('Application Submitted', 'Your loan request has been sent to the lender verification pipeline.');
            } catch (err: any) {
              Alert.alert('Submission Error', err.message);
            }
          }
        }
      ]
    );
  };

  const handleOfferResponse = async (appId: string, accept: boolean) => {
    try {
      await farmerActionOffer(appId, accept);
      Alert.alert(
        accept ? 'Terms Approved' : 'Offer Declined',
        accept ? 'Loan terms accepted! Moving to disbursement.' : 'Terms declined. Request updated.'
      );
    } catch (err: any) {
      Alert.alert('Action failed', err.message);
    }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* EMI Calculator */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Calculator size={20} color={colors.primaryDark} />
          <Text style={styles.cardTitle}>Loan EMI Calculator</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.halfCol, { marginBottom: 12 }]}>
            <Text style={styles.inputLabel}>Required Amount (₹)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={calcAmount}
              onChangeText={setCalcAmount}
            />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.inputLabel}>Tenure (Months)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={calcTenure}
              onChangeText={setCalcTenure}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.inputLabel}>Interest Rate (% p.a.)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={calcRate}
              onChangeText={setCalcRate}
            />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.inputLabel}>Calculated EMI</Text>
            <View style={styles.emiDisplay}>
              <Text style={styles.emiText}>₹{calcEmi.toLocaleString()} <Text style={styles.emiSubText}>/ mo</Text></Text>
            </View>
          </View>
        </View>
      </View>

      {/* Loan comparison cards */}
      <Text style={styles.sectionTitle}>Lending Marketplace Products</Text>
      {creditScore && (
        <Text style={styles.scoreDiscountBanner}>
          💡 Your AgriScore is {creditScore.overallScore} ({creditScore.grade} Grade). 
          {creditScore.overallScore >= 80 ? ' You qualify for a 0.5% interest rate discount!' : ' Complete crop and soil practices to reduce rate premiums.'}
        </Text>
      )}

      {loanProducts.map((prod) => {
        let finalRate = prod.interestRate;
        if (creditScore && creditScore.overallScore >= 80) {
          finalRate -= 0.5;
        } else if (creditScore && creditScore.overallScore < 50) {
          finalRate += 1.0;
        }
        finalRate = parseFloat(finalRate.toFixed(1));

        return (
          <View key={prod.id} style={styles.prodCard}>
            <View style={styles.prodHeader}>
              <View style={styles.prodIconCircle}>
                <Clock size={20} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.prodBankName}>{prod.bankName}</Text>
                <Text style={styles.prodTenure}>Max tenure: {prod.tenureMonths} months</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.prodRate}>{finalRate}%</Text>
                <Text style={styles.prodRateLabel}>Interest Rate</Text>
              </View>
            </View>
            <Text style={styles.prodDesc}>{prod.description}</Text>
            <View style={styles.prodFooter}>
              <Text style={styles.prodMaxAmt}>Max Loan: ₹{prod.maxAmount.toLocaleString()}</Text>
              <TouchableOpacity onPress={() => handleApply(prod)} style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>Apply Now</Text>
                <ChevronRight size={14} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Loan application Status tracker */}
      <Text style={styles.sectionTitle}>Application Tracking & Status</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : applications.length === 0 ? (
        <Text style={styles.emptyTrackerText}>No current or past loan applications found.</Text>
      ) : (
        applications.map((app) => (
          <View key={app.id} style={styles.trackerCard}>
            <View style={styles.trackerHeader}>
              <Text style={styles.trackerBank}>{app.bankName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '15' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>{app.status}</Text>
              </View>
            </View>

            <View style={styles.trackerDetails}>
              <View style={styles.trackerCol}>
                <Text style={styles.trackerLabel}>Loan Amount</Text>
                <Text style={styles.trackerVal}>₹{app.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.trackerCol}>
                <Text style={styles.trackerLabel}>Tenure / Rate</Text>
                <Text style={styles.trackerVal}>{app.offeredTenureMonths || app.tenureMonths} Mo @ {app.offeredInterestRate || app.interestRate}%</Text>
              </View>
              <View style={styles.trackerCol}>
                <Text style={styles.trackerLabel}>EMI Amount</Text>
                <Text style={styles.trackerVal}>₹{app.emi.toLocaleString()}/mo</Text>
              </View>
            </View>

            {app.adminRemarks && (
              <View style={styles.remarksBox}>
                <Text style={styles.remarksTitle}>Lender Remarks:</Text>
                <Text style={styles.remarksText}>{app.adminRemarks}</Text>
              </View>
            )}

            {/* Offer response buttons */}
            {app.status === 'OFFERED' && (
              <View style={styles.responseRow}>
                <TouchableOpacity 
                  onPress={() => handleOfferResponse(app.id, false)} 
                  disabled={isSaving}
                  style={[styles.actionBtn, styles.declineBtn]}
                >
                  <X size={16} color={colors.error} />
                  <Text style={[styles.actionBtnText, { color: colors.error }]}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleOfferResponse(app.id, true)} 
                  disabled={isSaving}
                  style={[styles.actionBtn, styles.acceptBtn]}
                >
                  <Check size={16} color={colors.white} />
                  <Text style={[styles.actionBtnText, { color: colors.white }]}>Accept Terms</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCol: {
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
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: colors.charcoal,
  },
  emiDisplay: {
    height: 44,
    justifyContent: 'center',
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  emiText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  emiSubText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: 12,
    marginBottom: 12,
  },
  scoreDiscountBanner: {
    fontSize: 12,
    color: colors.primaryDark,
    backgroundColor: colors.primaryBg,
    borderWidth: 0.5,
    borderColor: colors.primaryLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    lineHeight: 18,
    fontWeight: '600',
  },
  prodCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  prodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prodIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prodBankName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
  prodTenure: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  prodRate: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  prodRateLabel: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  prodDesc: {
    fontSize: 12,
    color: colors.charcoalLight,
    lineHeight: 18,
    marginVertical: 12,
  },
  prodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 12,
  },
  prodMaxAmt: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
  },
  applyBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },
  emptyTrackerText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  trackerCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: 8,
    marginBottom: 10,
  },
  trackerBank: {
    fontSize: 13,
    fontWeight: '700',
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
  trackerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  trackerCol: {
    flex: 1,
  },
  trackerLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '500',
  },
  trackerVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: 2,
  },
  remarksBox: {
    backgroundColor: colors.lightGray,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  remarksTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.charcoal,
  },
  remarksText: {
    fontSize: 11,
    color: colors.charcoalLight,
    marginTop: 2,
  },
  responseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    flex: 0.48,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  declineBtn: {
    borderColor: colors.error,
    backgroundColor: colors.white,
  },
  acceptBtn: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryDark,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  loader: {
    marginVertical: 20,
  },
});
