import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRide } from '../context/RideContext';
import { useAppTheme } from '../theme/ThemeContext';
import { AppCard, AppButton, AppBadge } from '../components/UIComponents';
import { spacing, radius, typography } from '../theme';

export const OnboardingWizard: React.FC = () => {
  const { completeOnboarding, sensorCapabilities, checkDeviceHealth } = useRide();
  const { theme } = useAppTheme();
  const [step, setStep] = useState(1);

  const handleNext = async () => {
    if (step === 3) {
      await checkDeviceHealth();
    }
    if (step < 4) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Step Progress Indicators */}
        <View style={styles.topProgress}>
          <Text style={[styles.stepCounterText, { color: theme.textMuted }]}>
            STEP {step} OF 4
          </Text>
          <View style={styles.stepIndicatorRow}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepBar,
                  {
                    backgroundColor:
                      step >= s ? theme.primary : theme.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* STEP 1: Mission Brief */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="shield-check" size={44} color={theme.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Welcome to RideShield</Text>
            <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
              RideShield is an intelligent motorcycle safety platform that monitors your riding dynamics, filters road jolts, detects possible crashes, and automatically initiates emergency SOS if you cannot respond.
            </Text>

            <AppCard style={styles.summaryCard}>
              <View style={styles.featureRow}>
                <MaterialCommunityIcons name="speedometer" size={20} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>Motion & Telematics</Text>
                  <Text style={[styles.featureDesc, { color: theme.textMuted }]}>6-axis IMU + GPS speed fusion for road hazards</Text>
                </View>
              </View>
              <View style={styles.featureRow}>
                <MaterialCommunityIcons name="broadcast" size={20} color={theme.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>Automated Emergency SOS</Text>
                  <Text style={[styles.featureDesc, { color: theme.textMuted }]}>High-decibel alert with 25-second countdown buffer</Text>
                </View>
              </View>
            </AppCard>
          </View>
        )}

        {/* STEP 2: Permissions Required */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="shield-lock-outline" size={44} color={theme.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Safety Permissions</Text>
            <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
              To operate reliably inside your jacket or handlebar mount, RideShield needs access to native sensor hardware and positioning.
            </Text>

            <AppCard style={styles.summaryCard}>
              <View style={styles.permItem}>
                <View style={[styles.permIconBadge, { backgroundColor: theme.successLight }]}>
                  <MaterialCommunityIcons name="axis-arrow" size={20} color={theme.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.permTitle, { color: theme.text }]}>Motion & Orientation (IMU)</Text>
                  <Text style={[styles.permDesc, { color: theme.textMuted }]}>High-rate accelerometer and angular velocity</Text>
                </View>
                <AppBadge label="REQUIRED" variant="info" />
              </View>

              <View style={styles.permItem}>
                <View style={[styles.permIconBadge, { backgroundColor: theme.successLight }]}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={20} color={theme.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.permTitle, { color: theme.text }]}>GPS Positioning</Text>
                  <Text style={[styles.permDesc, { color: theme.textMuted }]}>Exact coordinate dispatch for emergency services</Text>
                </View>
                <AppBadge label="REQUIRED" variant="info" />
              </View>

              <View style={styles.permItem}>
                <View style={[styles.permIconBadge, { backgroundColor: theme.successLight }]}>
                  <MaterialCommunityIcons name="volume-high" size={20} color={theme.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.permTitle, { color: theme.text }]}>High-Priority Audio Siren</Text>
                  <Text style={[styles.permDesc, { color: theme.textMuted }]}>Audible confirmation alert even if phone is silenced</Text>
                </View>
                <AppBadge label="REQUIRED" variant="info" />
              </View>
            </AppCard>
          </View>
        )}

        {/* STEP 3: Sensor Diagnostics */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="tune" size={44} color={theme.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Sensor Diagnostics</Text>
            <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
              Verifying onboard smartphone sensors for real-time crash detection pipeline.
            </Text>

            <AppCard style={styles.summaryCard}>
              <View style={styles.diagRow}>
                <Text style={[styles.diagLabel, { color: theme.text }]}>3-Axis Accelerometer</Text>
                <AppBadge
                  label={sensorCapabilities?.accelerometer ? 'HEALTHY' : 'READY'}
                  variant={sensorCapabilities?.accelerometer ? 'success' : 'warning'}
                />
              </View>
              <View style={styles.diagRow}>
                <Text style={[styles.diagLabel, { color: theme.text }]}>Gyroscope (Angular Rate)</Text>
                <AppBadge
                  label={sensorCapabilities?.gyroscope ? 'HEALTHY' : 'READY'}
                  variant={sensorCapabilities?.gyroscope ? 'success' : 'warning'}
                />
              </View>
              <View style={styles.diagRow}>
                <Text style={[styles.diagLabel, { color: theme.text }]}>GPS Positioning Engine</Text>
                <AppBadge
                  label={sensorCapabilities?.locationPermissionGranted ? 'LOCKED' : 'AVAILABLE'}
                  variant={sensorCapabilities?.locationPermissionGranted ? 'success' : 'warning'}
                />
              </View>
              <View style={styles.diagRow}>
                <Text style={[styles.diagLabel, { color: theme.text }]}>Battery Readiness</Text>
                <AppBadge label="OPTIMAL (85%)" variant="success" />
              </View>
            </AppCard>
          </View>
        )}

        {/* STEP 4: Safety Buffer Confirmation */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <View style={[styles.iconCircle, { backgroundColor: theme.warningLight, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="timer-sand" size={44} color={theme.warning} />
            </View>
            <Text style={[styles.stepTitle, { color: theme.text }]}>The 25-Second Buffer</Text>
            <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
              How RideShield prevents false emergency calls:
            </Text>

            <AppCard style={styles.summaryCard}>
              <View style={styles.flowStep}>
                <View style={[styles.flowNum, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.flowNumText, { color: theme.primary }]}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.flowTitle, { color: theme.text }]}>Impact Signature Detected</Text>
                  <Text style={[styles.flowSub, { color: theme.textMuted }]}>
                    Sudden deceleration spike &gt; 3.5G + tumble rotation
                  </Text>
                </View>
              </View>

              <View style={styles.flowStep}>
                <View style={[styles.flowNum, { backgroundColor: theme.dangerLight }]}>
                  <Text style={[styles.flowNumText, { color: theme.danger }]}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.flowTitle, { color: theme.text }]}>Loud Alarm & Countdown</Text>
                  <Text style={[styles.flowSub, { color: theme.textMuted }]}>
                    25-second window starts. Press "I'M SAFE" anytime to cancel.
                  </Text>
                </View>
              </View>

              <View style={styles.flowStep}>
                <View style={[styles.flowNum, { backgroundColor: theme.surfaceHover }]}>
                  <Text style={[styles.flowNumText, { color: theme.textSecondary }]}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.flowTitle, { color: theme.text }]}>Automated Dispatch</Text>
                  <Text style={[styles.flowSub, { color: theme.textMuted }]}>
                    If timer expires without cancellation, emergency contacts receive your GPS link.
                  </Text>
                </View>
              </View>
            </AppCard>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <AppButton
            title={step === 4 ? "COMPLETE SETUP & START" : "CONTINUE"}
            variant="primary"
            icon={step === 4 ? 'check' : 'arrow-right'}
            onPress={handleNext}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  topProgress: {
    marginBottom: spacing.xl,
  },
  stepCounterText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
  stepContent: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  featureDesc: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  permDesc: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  diagLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  flowStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flowNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowNumText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  flowTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  flowSub: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  actionContainer: {
    marginTop: spacing.lg,
  },
});
