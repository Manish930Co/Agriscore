import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useFarmerStore } from '../../store/useFarmerStore';
import { colors } from '../../theme/colors';
import { Camera, Image as ImageIcon, History, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react-native';

export default function CropUploadScreen() {
  const { user } = useAuthStore();
  const { diagnostics, uploadCropImage, fetchDiagnostics, isSaving, isLoading } = useFarmerStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeDiagnostic, setActiveDiagnostic] = useState<any>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchDiagnostics(user.uid);
    }
  }, [user?.uid]);

  const handleSelectImage = (source: 'camera' | 'gallery') => {
    // Mock image selection
    const mockImages = [
      'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500', // Rice leaf blast
      'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500', // Healthy corn
      'https://images.unsplash.com/photo-1589146115997-6a1005ca7b64?w=500', // Rust disease
    ];
    const randomImg = mockImages[Math.floor(Math.random() * mockImages.length)];
    setSelectedImage(randomImg);
    setActiveDiagnostic(null);
    
    Alert.alert(
      'Image Selected',
      `Simulated image imported from your ${source}. Ready to run AI diagnostics.`,
      [{ text: 'OK' }]
    );
  };

  const handleRunDiagnostics = async () => {
    if (!selectedImage || !user?.uid) {
      Alert.alert('No Image', 'Please capture or select an image of the crop first.');
      return;
    }

    try {
      const result = await uploadCropImage(user.uid, selectedImage);
      setActiveDiagnostic(result);
      Alert.alert('Analysis Complete', `AI detected: ${result.diseaseDetected}`);
    } catch (err: any) {
      Alert.alert('Analysis Failed', err.message || 'ML inference model failed.');
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'LOW': return colors.success;
      case 'MEDIUM': return colors.warning;
      case 'HIGH': return colors.error;
      default: return colors.muted;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Crop Disease Diagnostic AI</Text>
      <Text style={styles.subtitle}>Upload images of crop leaves to diagnose diseases, receive treatment suggestions, and update agronomy score.</Text>

      {/* Select Photo Box */}
      <View style={styles.uploadCard}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
        ) : (
          <View style={styles.placeholderBox}>
            <Camera size={44} color={colors.muted} />
            <Text style={styles.placeholderText}>No crop image selected</Text>
          </View>
        )}

        <View style={styles.uploadRow}>
          <TouchableOpacity onPress={() => handleSelectImage('camera')} style={styles.pickerBtn}>
            <Camera size={18} color={colors.charcoal} />
            <Text style={styles.pickerBtnText}>Use Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleSelectImage('gallery')} style={styles.pickerBtn}>
            <ImageIcon size={18} color={colors.charcoal} />
            <Text style={styles.pickerBtnText}>Browse Gallery</Text>
          </TouchableOpacity>
        </View>

        {selectedImage && !activeDiagnostic && (
          <TouchableOpacity 
            onPress={handleRunDiagnostics} 
            disabled={isSaving} 
            style={[styles.diagnoseBtn, isSaving && styles.btnDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <ShieldCheck size={20} color={colors.white} />
                <Text style={styles.diagnoseBtnText}>Run AI Disease Analysis</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Diagnostic Results display */}
      {activeDiagnostic && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <AlertCircle size={24} color={getSeverityColor(activeDiagnostic.severity)} />
            <Text style={styles.resultTitle}>AI Analysis Results</Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(activeDiagnostic.severity) + '15' }]}>
              <Text style={[styles.severityText, { color: getSeverityColor(activeDiagnostic.severity) }]}>{activeDiagnostic.severity} Severity</Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Pathogen/Disease:</Text>
            <Text style={styles.metricVal}>{activeDiagnostic.diseaseDetected}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Model Confidence:</Text>
            <Text style={styles.metricVal}>{activeDiagnostic.confidenceScore}%</Text>
          </View>

          <Text style={styles.recTitle}>Recommended Treatment Actions:</Text>
          <Text style={styles.recText}>{activeDiagnostic.treatmentRecommendation}</Text>

          <Text style={styles.agriScoreImpact}>✓ Analysis submitted. Agronomic practice rating recalculated (+2% to Practicing Score).</Text>
        </View>
      )}

      {/* History Log */}
      <View style={styles.historySection}>
        <View style={styles.historyTitleRow}>
          <History size={20} color={colors.charcoal} />
          <Text style={styles.historyTitle}>Past Diagnostic Reports</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : diagnostics.length === 0 ? (
          <Text style={styles.noHistoryText}>No past diagnostic reports. Diagnose crop issues to start tracking history.</Text>
        ) : (
          diagnostics.map((diag) => (
            <View key={diag.id} style={styles.historyItem}>
              <Image source={{ uri: diag.imageUrl }} style={styles.historyThumb} />
              <View style={styles.historyContent}>
                <Text style={styles.historyDisease} numberOfLines={1}>{diag.diseaseDetected}</Text>
                <View style={styles.historyMeta}>
                  <Text style={[styles.historySev, { color: getSeverityColor(diag.severity) }]}>{diag.severity} Severity</Text>
                  <Text style={styles.historyDate}>
                    {new Date(diag.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.charcoal,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  uploadCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  placeholderBox: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: colors.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 10,
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    flex: 0.48,
    height: 44,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
    marginLeft: 6,
  },
  diagnoseBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  diagnoseBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.charcoal,
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: 16,
    marginBottom: 6,
  },
  recText: {
    fontSize: 13,
    color: colors.charcoalLight,
    lineHeight: 18,
  },
  agriScoreImpact: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: 14,
    backgroundColor: colors.primaryBg,
    padding: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.primaryLight,
  },
  historySection: {
    marginTop: 10,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginLeft: 8,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  historyThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyDisease: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  historySev: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 11,
    color: colors.muted,
  },
  noHistoryText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  loader: {
    marginVertical: 20,
  },
});
