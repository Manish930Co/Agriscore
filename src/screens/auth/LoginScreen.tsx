import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, User, Landmark } from 'lucide-react-native';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter both email and password.');
      return;
    }
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message || 'Check credentials and try again.');
    }
  };

  const handleQuickLogin = async (role: 'farmer' | 'admin') => {
    clearError();
    const testEmail = role === 'farmer' ? 'farmer@agriscore.com' : 'admin@agriscore.com';
    const testPassword = 'password123';
    
    setEmail(testEmail);
    setPassword(testPassword);

    try {
      await login(testEmail, testPassword);
    } catch (err: any) {
      Alert.alert('Quick Login Failed', err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.headerContainer}>
        <View style={styles.logoCircle}>
          <ShieldCheck size={40} color={colors.white} />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to manage your agricultural credit profile</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Email Input */}
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

        {/* Password Input */}
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputWrapper}>
          <Lock size={20} color={colors.muted} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="enter your password"
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

        {/* Login Button */}
        <TouchableOpacity 
          onPress={handleLogin} 
          disabled={isLoading} 
          style={[styles.submitButton, isLoading && styles.buttonDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* Register Navigation Link */}
        <View style={styles.registerLinkContainer}>
          <Text style={styles.registerLinkText}>New to AgriScore? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLinkActive}>Register now</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>DEVELOPER QUICK LOGIN</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Quick Logins for Testing */}
        <View style={styles.quickLoginRow}>
          <TouchableOpacity onPress={() => handleQuickLogin('farmer')} style={styles.quickLoginCard}>
            <User size={24} color={colors.primaryDark} />
            <Text style={styles.quickLoginTitle}>Farmer Portal</Text>
            <Text style={styles.quickLoginSubtitle}>Ramesh Kumar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleQuickLogin('admin')} style={styles.quickLoginCard}>
            <Landmark size={24} color={colors.accentDark} />
            <Text style={styles.quickLoginTitle}>Lender Portal</Text>
            <Text style={styles.quickLoginSubtitle}>Bank/Admin</Text>
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
    marginBottom: 36,
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
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerLinkText: {
    color: colors.muted,
    fontSize: 14,
  },
  registerLinkActive: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderColor,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  quickLoginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickLoginCard: {
    flex: 0.47,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickLoginTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: 8,
  },
  quickLoginSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
});
