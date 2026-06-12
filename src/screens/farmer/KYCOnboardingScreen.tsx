import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/useAuthStore';
import { useFarmerStore } from '../../store/useFarmerStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { colors } from '../../theme/colors';
import { Check, ChevronLeft, ChevronRight, User, Home, Landmark, MapPin, Camera, Image as ImageIcon, Trash2, RotateCcw } from 'lucide-react-native';

export default function KYCOnboardingScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { submitKYC, isSaving, kycDetails } = useFarmerStore();
  const { cropFieldImage, setCropFieldImage } = useOnboardingStore();

  const [step, setStep] = useState(1);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera access is required to take real-time crop photos. Please enable it in system settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCropFieldImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to launch native camera.');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Gallery access is required to upload an existing crop photo. Please enable it in system settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCropFieldImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to launch image library.');
    }
  };

  const handleRemoveImage = () => {
    setCropFieldImage(null);
  };

  // Form State
  // Step 1: Personal
  const [fullName, setFullName] = useState(kycDetails?.fullName || '');
  const [mobile, setMobile] = useState(kycDetails?.mobile || '');
  const [dob, setDob] = useState(kycDetails?.dob || '');
  const [gender, setGender] = useState(kycDetails?.gender || 'Male');
  const [address, setAddress] = useState(kycDetails?.address || '');
  const [kycIdType, setKycIdType] = useState(kycDetails?.kycIdType || 'Aadhaar Card');
  const [kycIdNumber, setKycIdNumber] = useState(kycDetails?.kycIdNumber || '');

  // Step 2: Farm
  const [sizeAcres, setSizeAcres] = useState(kycDetails?.sizeAcres ? String(kycDetails.sizeAcres) : '');
  const [ownershipType, setOwnershipType] = useState<'OWNED' | 'LEASED' | 'SHARED'>(kycDetails?.ownershipType || 'OWNED');
  const [cropType, setCropType] = useState(kycDetails?.cropType || '');
  const [sowingDate, setSowingDate] = useState(kycDetails?.sowingDate || '');
  const [harvestDate, setHarvestDate] = useState(kycDetails?.harvestDate || '');
  const [soilType, setSoilType] = useState(kycDetails?.soilType || 'Alluvial Soil');
  const [irrigationType, setIrrigationType] = useState(kycDetails?.irrigationType || 'Tubewell');

  // Step 3: Financial
  const [annualIncome, setAnnualIncome] = useState(kycDetails?.annualIncome ? String(kycDetails.annualIncome) : '');
  const [existingLoans, setExistingLoans] = useState(kycDetails?.existingLoans || false);
  const [outstandingDebt, setOutstandingDebt] = useState(kycDetails?.outstandingDebt ? String(kycDetails.outstandingDebt) : '0');
  const [bankName, setBankName] = useState(kycDetails?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(kycDetails?.bankAccountNumber || '');

  // Step 4: Location
  const [village, setVillage] = useState(kycDetails?.village || '');
  const [district, setDistrict] = useState(kycDetails?.district || '');
  const [state, setState] = useState(kycDetails?.state || '');
  const [gpsLat, setGpsLat] = useState(kycDetails?.gpsLat ? String(kycDetails.gpsLat) : '28.6139');
  const [gpsLon, setGpsLon] = useState(kycDetails?.gpsLon ? String(kycDetails.gpsLon) : '77.2090');

  const handleNext = () => {
    if (step === 1) {
      if (!fullName || !mobile || !dob || !address || !kycIdNumber) {
        Alert.alert('Incomplete Fields', 'Please fill in all personal details.');
        return;
      }
    } else if (step === 2) {
      if (!sizeAcres || !cropType || !sowingDate || !harvestDate) {
        Alert.alert('Incomplete Fields', 'Please fill in all farm details.');
        return;
      }
    } else if (step === 3) {
      if (!annualIncome || !bankName || !bankAccountNumber) {
        Alert.alert('Incomplete Fields', 'Please fill in all financial details.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!village || !district || !state) {
      Alert.alert('Incomplete Fields', 'Please fill in village, district, and state.');
      return;
    }

    if (!user?.uid) return;

    const formattedData = {
      fullName,
      mobile,
      dob,
      gender,
      address,
      kycIdType,
      kycIdNumber,
      sizeAcres: parseFloat(sizeAcres) || 0,
      ownershipType,
      cropType,
      sowingDate,
      harvestDate,
      soilType,
      irrigationType,
      annualIncome: parseFloat(annualIncome) || 0,
      existingLoans,
      outstandingDebt: parseFloat(outstandingDebt) || 0,
      bankName,
      bankAccountNumber,
      village,
      district,
      state,
      gpsLat: parseFloat(gpsLat) || 0,
      gpsLon: parseFloat(gpsLon) || 0,
    };

    try {
      await submitKYC(user.uid, formattedData);
      Alert.alert('Success', 'KYC & Farm details uploaded. AgriScore updated!', [
        { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
      ]);
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Something went wrong.');
    }
  };

  // Prefill helper for testing onboarding quickly
  const handleAutoFill = () => {
    setFullName('Ramesh Kumar');
    setMobile('9876543210');
    setDob('1984-06-15');
    setGender('Male');
    setAddress('Plot 42, Green Village Road');
    setKycIdType('Aadhaar Card');
    setKycIdNumber('1234-5678-9012');
    setSizeAcres('8.5');
    setOwnershipType('OWNED');
    setCropType('Basmati Rice');
    setSowingDate('2026-05-01');
    setHarvestDate('2026-09-30');
    setSoilType('Alluvial Soil');
    setIrrigationType('Tubewell / Canal');
    setAnnualIncome('450000');
    setExistingLoans(false);
    setOutstandingDebt('0');
    setBankName('National Agri Development Bank');
    setBankAccountNumber('987654321098');
    setVillage('Karnal');
    setDistrict('Karnal');
    setState('Haryana');
    setGpsLat('29.6857');
    setGpsLon('76.9905');
    Alert.alert('Prefilled', 'Form fields prefilled with testing data.');
  };

  return (
    <View style={styles.container}>
      {/* Steps Progress Header */}
      <View style={styles.stepsHeader}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.stepIndicatorWrapper}>
            <View 
              style={[
                styles.stepBubble, 
                step >= s ? styles.stepBubbleActive : styles.stepBubbleInactive
              ]}
            >
              {step > s ? <Check size={14} color={colors.white} /> : <Text style={[styles.stepText, step >= s && styles.stepTextActive]}>{s}</Text>}
            </View>
            {s < 4 && <View style={[styles.stepLine, step > s ? styles.stepLineActive : styles.stepLineInactive]} />}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Step 1: Personal Details */}
        {step === 1 && (
          <View>
            <View style={styles.stepTitleRow}>
              <User size={24} color={colors.primaryDark} />
              <Text style={styles.stepTitle}>Personal Details</Text>
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>DOB (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 1984-06-15"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>Gender</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Male / Female / Other"
                  value={gender}
                  onChangeText={setGender}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>ID Type</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Aadhaar / PAN"
                  value={kycIdType}
                  onChangeText={setKycIdType}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>ID Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="ID Number"
                  value={kycIdNumber}
                  onChangeText={setKycIdNumber}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Full physical address"
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        )}

        {/* Step 2: Farm Details */}
        {step === 2 && (
          <View>
            <View style={styles.stepTitleRow}>
              <Home size={24} color={colors.primaryDark} />
              <Text style={styles.stepTitle}>Farm details</Text>
            </View>

            <Text style={styles.inputLabel}>Farm Size (Acres)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 8.5"
              keyboardType="numeric"
              value={sizeAcres}
              onChangeText={setSizeAcres}
            />

            <Text style={styles.inputLabel}>Ownership Type</Text>
            <View style={styles.tabRow}>
              {(['OWNED', 'LEASED', 'SHARED'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setOwnershipType(type)}
                  style={[styles.tabButton, ownershipType === type && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabText, ownershipType === type && styles.tabTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Primary Crop Cultivated</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Basmati Rice, Wheat, Cotton"
              value={cropType}
              onChangeText={setCropType}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>Sowing Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 2026-05-01"
                  value={sowingDate}
                  onChangeText={setSowingDate}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>Expected Harvest (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 2026-09-30"
                  value={harvestDate}
                  onChangeText={setHarvestDate}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Soil Type</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Alluvial Soil, Black Soil, Clayey"
              value={soilType}
              onChangeText={setSoilType}
            />

            <Text style={styles.inputLabel}>Irrigation Source / Type</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Tubewell / Canal / Drip Irrigation"
              value={irrigationType}
              onChangeText={setIrrigationType}
            />
          </View>
        )}

        {/* Step 3: Financial Details */}
        {step === 3 && (
          <View>
            <View style={styles.stepTitleRow}>
              <Landmark size={24} color={colors.primaryDark} />
              <Text style={styles.stepTitle}>Financial Details</Text>
            </View>

            <Text style={styles.inputLabel}>Annual Farm Income (₹)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 450000"
              keyboardType="numeric"
              value={annualIncome}
              onChangeText={setAnnualIncome}
            />

            <Text style={styles.inputLabel}>Do you have existing outstanding loans?</Text>
            <View style={styles.tabRow}>
              <TouchableOpacity
                onPress={() => setExistingLoans(true)}
                style={[styles.tabButton, existingLoans === true && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, existingLoans === true && styles.tabTextActive]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setExistingLoans(false)}
                style={[styles.tabButton, existingLoans === false && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, existingLoans === false && styles.tabTextActive]}>No</Text>
              </TouchableOpacity>
            </View>

            {existingLoans && (
              <>
                <Text style={styles.inputLabel}>Total Outstanding Debt (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Outstanding amount in ₹"
                  keyboardType="numeric"
                  value={outstandingDebt}
                  onChangeText={setOutstandingDebt}
                />
              </>
            )}

            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. National Agri Development Bank"
              value={bankName}
              onChangeText={setBankName}
            />

            <Text style={styles.inputLabel}>Bank Account Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Account Number"
              keyboardType="numeric"
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
            />
          </View>
        )}

        {/* Step 4: Location Details */}
        {step === 4 && (
          <View>
            <View style={styles.stepTitleRow}>
              <MapPin size={24} color={colors.primaryDark} />
              <Text style={styles.stepTitle}>GPS Location Details</Text>
            </View>

            <Text style={styles.inputLabel}>Village</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Village name"
              value={village}
              onChangeText={setVillage}
            />

            <Text style={styles.inputLabel}>District</Text>
            <TextInput
              style={styles.textInput}
              placeholder="District name"
              value={district}
              onChangeText={setDistrict}
            />

            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.textInput}
              placeholder="State name"
              value={state}
              onChangeText={setState}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>GPS Latitude (Latitude)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 29.6857"
                  keyboardType="numeric"
                  value={gpsLat}
                  onChangeText={setGpsLat}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>GPS Longitude (Longitude)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 76.9905"
                  keyboardType="numeric"
                  value={gpsLon}
                  onChangeText={setGpsLon}
                />
              </View>
            </View>

            {/* Verify Crop Field Section */}
            <Text style={styles.inputLabel}>Verify Crop Field (Optional)</Text>
            <View style={styles.uploadCard}>
              {cropFieldImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: cropFieldImage }} style={styles.previewImage} />
                  <View style={styles.previewOverlay}>
                    <TouchableOpacity style={styles.previewBtn} onPress={handlePickImage}>
                      <RotateCcw size={16} color={colors.white} />
                      <Text style={styles.previewBtnText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.previewBtn, styles.deleteBtn]} onPress={handleRemoveImage}>
                      <Trash2 size={16} color={colors.white} />
                      <Text style={styles.previewBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <View style={styles.uploadIconRow}>
                    <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleTakePhoto}>
                      <Camera size={24} color={colors.primaryDark} />
                      <Text style={styles.uploadOptionText}>Take Photo</Text>
                    </TouchableOpacity>
                    <View style={styles.dividerLine} />
                    <TouchableOpacity style={styles.uploadOptionBtn} onPress={handlePickImage}>
                      <ImageIcon size={24} color={colors.primaryDark} />
                      <Text style={styles.uploadOptionText}>From Gallery</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.uploadInstruction}>
                    Capture or upload a clear photo of your standing crop or field for AI health assessment.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryHeading}>Data Verification Agreement</Text>
              <Text style={styles.summaryText}>By submitting, you consent to our automated credit evaluation module calculating your AgriScore using agronomic parameters, soil properties, and banking statistics.</Text>
            </View>
          </View>
        )}

        {/* Action Controls */}
        <View style={styles.footerButtons}>
          {step > 1 ? (
            <TouchableOpacity onPress={handlePrev} style={styles.prevBtn}>
              <ChevronLeft size={20} color={colors.charcoal} />
              <Text style={styles.prevBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleAutoFill} style={styles.autoFillBtn}>
              <Text style={styles.autoFillText}>Prefill Demo Data</Text>
            </TouchableOpacity>
          )}

          {step < 4 ? (
            <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>Continue</Text>
              <ChevronRight size={20} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={handleSubmit} 
              disabled={isSaving} 
              style={[styles.nextBtn, styles.submitBtn, isSaving && styles.btnDisabled]}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>Submit profile</Text>
                  <Check size={20} color={colors.white} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  stepIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBubbleActive: {
    backgroundColor: colors.primary,
  },
  stepBubbleInactive: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  stepTextActive: {
    color: colors.white,
  },
  stepLine: {
    height: 3,
    width: 40,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepLineInactive: {
    backgroundColor: colors.borderColor,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.charcoal,
    marginLeft: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 8,
    marginTop: 14,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: colors.charcoal,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCol: {
    width: '48%',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.charcoal,
    fontWeight: '700',
  },
  summaryBox: {
    backgroundColor: colors.primaryBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    marginTop: 24,
  },
  summaryHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDeep,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 12,
    color: colors.primaryDark,
    lineHeight: 18,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 36,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderColor,
    backgroundColor: colors.white,
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    marginLeft: 4,
  },
  autoFillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  autoFillText: {
    fontSize: 12,
    color: colors.charcoal,
    fontWeight: '700',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 'auto',
  },
  submitBtn: {
    backgroundColor: colors.primaryDark,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    marginRight: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  uploadCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderColor,
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  uploadOptionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  uploadOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 6,
  },
  dividerLine: {
    width: 1,
    height: 36,
    backgroundColor: colors.borderColor,
  },
  uploadInstruction: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  previewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  deleteBtn: {
    backgroundColor: 'rgba(220,38,38,0.7)',
    borderColor: 'rgba(220,38,38,0.9)',
  },
  previewBtnText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
});
