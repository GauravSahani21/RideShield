import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRide } from '../context/RideContext';
import { useAppTheme } from '../theme/ThemeContext';
import { AppPageHeader, AppCard, AppButton, AppBadge } from '../components/UIComponents';
import { spacing, radius, typography } from '../theme';

interface MountCalibrationScreenProps {
  onBack: () => void;
  onCalibrationComplete?: () => void;
  onProceedWithoutCalibration?: () => void;
}

export const MountCalibrationScreen: React.FC<MountCalibrationScreenProps> = ({
  onBack,
  onCalibrationComplete,
  onProceedWithoutCalibration,
}) => {
  const {
    calibrationProfile,
    isCalibrating,
    calibrationProgress,
    calibrationError,
    startMountCalibration,
    cancelMountCalibration,
    recalibrateMount,
  } = useRide();
  const { theme } = useAppTheme();

  const handleStart = async () => {
    const success = await startMountCalibration();
    if (success && onCalibrationComplete) {
      onCalibrationComplete();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AppPageHeader
        title="Phone Mount Calibration"
        subtitle="Align relative orientation and zero motorcycle lean-angle baseline"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instruction Card */}
        <AppCard style={styles.card}>
          <View style={[styles.iconBadge, { backgroundColor: theme.primaryLight }]}>
            <MaterialCommunityIcons name="cellphone-dock" size={32} color={theme.primary} />
          </View>
          <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
            Step 1: Secure in Motorcycle Mount
          </Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
            Place your phone securely inside your handlebar or stem mount in your normal riding position.
          </Text>

          <View style={[styles.tipBox, { backgroundColor: theme.surfaceHover, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.primary} />
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Keep the motorcycle stationary on a level surface. Do NOT move or shake the handlebars during the 5–10s calibration window.
            </Text>
          </View>
        </AppCard>

        {/* Current Calibration Status */}
        <AppCard style={styles.card}>
          <Text style={[styles.cardHeader, { color: theme.textMuted }]}>
            CALIBRATION PROFILE STATUS
          </Text>

          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: theme.textPrimary }]}>
                {calibrationProfile?.calibrated ? 'Mount Calibrated' : 'Not Calibrated Yet'}
              </Text>
              <Text style={[styles.statusSubtitle, { color: theme.textMuted }]}>
                {calibrationProfile?.calibrated
                  ? `Calibrated ${new Date(calibrationProfile.calibratedAt).toLocaleTimeString()}`
                  : 'Requires zero-offset baseline for accurate lean angle'}
              </Text>
            </View>
            <AppBadge
              label={calibrationProfile?.calibrated ? 'READY' : 'REQUIRED'}
              variant={calibrationProfile?.calibrated ? 'success' : 'warning'}
              size="md"
            />
          </View>

          {calibrationProfile && (
            <View style={[styles.profileGrid, { backgroundColor: theme.surfaceHover }]}>
              <View style={styles.profileItem}>
                <Text style={[styles.pLabel, { color: theme.textMuted }]}>ROLL (LEAN OFFSET)</Text>
                <Text style={[styles.pVal, { color: theme.textPrimary }]}>
                  {calibrationProfile.baselineOrientation.roll}°
                </Text>
              </View>
              <View style={styles.profileItem}>
                <Text style={[styles.pLabel, { color: theme.textMuted }]}>PITCH (TILT OFFSET)</Text>
                <Text style={[styles.pVal, { color: theme.textPrimary }]}>
                  {calibrationProfile.baselineOrientation.pitch}°
                </Text>
              </View>
              <View style={styles.profileItem}>
                <Text style={[styles.pLabel, { color: theme.textMuted }]}>ACCEL VARIANCE</Text>
                <Text style={[styles.pVal, { color: theme.textPrimary }]}>
                  {calibrationProfile.sensorVariance.accel.toFixed(4)}
                </Text>
              </View>
            </View>
          )}
        </AppCard>

        {/* Sampling Progress & Error Feedback */}
        {isCalibrating && (
          <AppCard style={[styles.card, { borderColor: theme.primary }]}>
            <View style={styles.calibratingHeader}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.calibratingTitle, { color: theme.primary }]}>
                SAMPLING SENSOR WINDOW... ({calibrationProgress}%)
              </Text>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: theme.surfaceHover }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${calibrationProgress}%`, backgroundColor: theme.primary },
                ]}
              />
            </View>
            <Text style={[styles.calibratingSub, { color: theme.textMuted }]}>
              Measuring gravity vector and evaluating vibration variance...
            </Text>
          </AppCard>
        )}

        {calibrationError && (
          <View style={[styles.errorCard, { backgroundColor: theme.dangerLight, borderColor: theme.danger }]}>
            <MaterialCommunityIcons name="alert-octagon" size={20} color={theme.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.errorTitle, { color: theme.danger }]}>Calibration Failed</Text>
              <Text style={[styles.errorDesc, { color: theme.danger }]}>{calibrationError}</Text>
            </View>
          </View>
        )}

        {/* Action Controls */}
        <View style={styles.actionRow}>
          {isCalibrating ? (
            <AppButton
              title="Cancel Calibration"
              variant="outline"
              onPress={cancelMountCalibration}
            />
          ) : (
            <>
              <AppButton
                title={calibrationProfile?.calibrated ? 'RECALIBRATE PHONE' : 'START CALIBRATION'}
                variant="primary"
                icon="tune"
                onPress={handleStart}
              />
              {onProceedWithoutCalibration && (
                <View style={{ marginTop: 8 }}>
                  <AppButton
                    title="PROCEED TO RIDE WITHOUT CALIBRATING"
                    variant="outline"
                    icon="arrow-right"
                    onPress={onProceedWithoutCalibration}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stepTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    width: '100%',
  },
  tipText: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    flex: 1,
  },
  cardHeader: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  statusTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  statusSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  profileGrid: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  profileItem: {
    flex: 1,
    alignItems: 'center',
  },
  pLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  pVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  calibratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  calibratingTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  progressBarTrack: {
    height: 8,
    width: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  calibratingSub: {
    fontSize: 10,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  errorDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  actionRow: {
    marginTop: spacing.sm,
  },
});
