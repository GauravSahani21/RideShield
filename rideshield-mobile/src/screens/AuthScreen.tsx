import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRide } from '../context/RideContext';
import { useAppTheme } from '../theme/ThemeContext';
import { AppCard, AppButton } from '../components/UIComponents';
import { spacing, radius, typography } from '../theme';

export const AuthScreen: React.FC = () => {
  const { loginUser, registerUser, loginWithGoogle } = useRide();
  const { theme, isDark, toggleTheme } = useAppTheme();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (isRegister) {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      setLoading(true);
      const res = await registerUser(name, email, phone, password);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to register.');
      }
    } else {
      setLoading(true);
      const res = await loginUser(email, password);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid email or password.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await loginWithGoogle();
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top bar with quick theme toggle */}
        <View style={styles.topUtilityBar}>
          <TouchableOpacity
            style={[styles.themePill, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'weather-night'}
              size={16}
              color={theme.textMuted}
            />
            <Text style={[styles.themePillText, { color: theme.textMuted }]}>
              {isDark ? 'Light' : 'Dark'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Brand Hero */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
            <MaterialCommunityIcons name="shield-check" size={36} color={theme.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: theme.text }]}>RideShield</Text>
          <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
            Intelligent Motorcycle Safety & Emergency SOS Platform
          </Text>
        </View>

        {/* Main Form Card */}
        <AppCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {isRegister ? 'Create Account' : 'Rider Sign In'}
              </Text>
              <Text style={[styles.formDesc, { color: theme.textMuted }]}>
                {isRegister
                  ? 'Set up telemetry profile & emergency dispatch'
                  : 'Enter your credentials to access your safety telemetry'}
              </Text>
            </View>
          </View>

          {errorMsg && (
            <View style={[styles.errorBox, { backgroundColor: theme.dangerLight, borderColor: theme.danger }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.danger} />
              <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
            </View>
          )}

          {isRegister && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>FULL NAME</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                    },
                  ]}
                  placeholder="e.g. Gaurav Sahani"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>PHONE NUMBER (FOR ICE DISPATCH)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                    },
                  ]}
                  placeholder="+1 (555) 019-2834"
                  placeholderTextColor={theme.inputPlaceholder}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>EMAIL ADDRESS</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText,
                },
              ]}
              placeholder="rider@rideshield.com"
              placeholderTextColor={theme.inputPlaceholder}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>PASSWORD</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.inputText,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={theme.inputPlaceholder}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>CONFIRM PASSWORD</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={theme.inputPlaceholder}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          )}

          <View style={{ marginTop: spacing.sm }}>
            <AppButton
              title={isRegister ? 'CREATE ACCOUNT' : 'LOG IN TO RIDESHIELD'}
              variant="primary"
              loading={loading}
              icon="login"
              onPress={handleSubmit}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>OR CONTINUE WITH</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <AppButton
            title="Google Sign-In"
            variant="outline"
            icon="google"
            disabled={loading}
            onPress={handleGoogleSignIn}
          />

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, { color: theme.primary }]}>
              {isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account? Create One"}
            </Text>
          </TouchableOpacity>
        </AppCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  topUtilityBar: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  themePillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: typography.sizes.sm,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    padding: spacing.lg,
  },
  cardHeaderRow: {
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  formDesc: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: typography.sizes.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },
  toggleRow: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
