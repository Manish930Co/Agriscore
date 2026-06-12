import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, UserCheck, Landmark } from 'lucide-react-native';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'farmer' | 'admin'>('farmer');
  const [secureText, setSecureText] = useState(true);
  
  const { registerUser, isLoading, clearError } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Required Fields', 'Please fill in all inputs.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      await registerUser(email, password, role);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.headerContainer}>
        <View style={styles.logoCircle}>
          <ShieldCheck size={40} color={colors.white} />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join AgriScore to construct or verify digital agricultural credit scores</Text>
      </View>

      {/* Role Selection Tabs */}
      <Text style={styles.sectionLabel}>Select Your Account Type</Text>
      <View style={styles.roleTabsContainer}>
        <TouchableOpacity 
          onPress={() => setRole('farmer')} 
          style={[styles.roleTab, role === 'farmer' && styles.roleTabActive]}
        >
          <UserCheck size={20} color={role === 'farmer' ? colors.primaryDark : colors.muted} />
          <Text style={[styles.roleTabText, role === 'farmer' && styles.roleTabTextActive]}>Farmer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setRole('admin')} 
          style={[styles.roleTab, role === 'admin' && styles.roleTabActive]}
        >
          <Landmark size={20} color={role === 'admin' ? colors.primaryDark : colors.muted} />
          <Text style={[styles.roleTabText, role === 'admin' && styles.roleTabTextActive]}>Lender / Bank</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        {/* Email */}
        <Text style={styles.inputLabel}>Email Address</Text>
        <View style={styles.inputWrapper}>
          <Mail size={20} color={colors.muted} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="enter your email address"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password */}
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputWrapper}>
          <Lock size={20} color={colors.muted} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="create a strong password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
            }}
            secureTextEntry={secureText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
            {secureText ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={styles.inputWrapper}>
          <Lock size={20} color={colors.muted} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="re-enter password to verify"
            placeholderTextColor={colors.muted}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              clearError();
            }}
            secureTextEntry={secureText}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity 
          onPress={handleRegister} 
          disabled={isLoading} 
          style={[styles.submitButton, isLoading && styles.buttonDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Back to Login Link */}
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginLinkText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkActive}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 40,
    paddingTop: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.charcoal,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 10,
    marginTop: 8,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
    marginLeft: 8,
  },
  roleTabTextActive: {
    color: colors.charcoal,
    fontWeight: '700',
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: colors.charcoal,
    fontSize: 15,
  },
  eyeBtn: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    color: colors.muted,
    fontSize: 14,
  },
  loginLinkActive: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
});
