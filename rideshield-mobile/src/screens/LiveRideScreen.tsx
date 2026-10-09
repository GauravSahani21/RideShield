import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRide } from '../context/RideContext';
import { useAppTheme } from '../theme/ThemeContext';
import { AppCard, AppButton, AppBadge, AppPageHeader } from '../components/UIComponents';
import { LiveSensorGauges } from '../components/LiveSensorGauges';
import { LeanAngleGauge } from '../components/LeanAngleGauge';
import { HazardWarningBanner } from '../components/HazardWarningBanner';
import { RideMapView } from '../components/RideMapView';
import { spacing, radius, typography } from '../theme';

interface LiveRideScreenProps {
  onBack: () => void;
  onFinishRide: (savedRide?: any) => void;
  onOpenTripPlanner?: () => void;
}

export const LiveRideScreen: React.FC<LiveRideScreenProps> = ({
  onBack,
  onFinishRide,
  onOpenTripPlanner,
}) => {
  const {
    currentRecord,
    currentLocation,
    activeRide,
    endRide,
    triggerManualSos,
    runDemoScenario,
    currentLeanAngle,
    currentLeanDirection,
    currentLeanState,
    calibrationProfile,
    activeHazardAlert,
    dismissHazardAlert,
    hazards,
  } = useRide();
  const { theme } = useAppTheme();

  const [showSimLab, setShowSimLab] = useState(false);

  const durationSec = activeRide?.durationSeconds || 0;
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const currentSpeed = currentRecord?.speed || 0;
  const maxSpeed = activeRide?.maxSpeedKmh || 0;

  const handleEndRideConfirm = () => {
    Alert.alert(
      'End Ride Session',
      'Stop continuous sensor monitoring and generate ride analysis?',
      [
        { text: 'Keep Monitoring', style: 'cancel' },
        {
          text: 'Finish & Save',
          style: 'destructive',
          onPress: async () => {
            const saved = await endRide();
            onFinishRide(saved);
          },
        },
      ]
    );
  };

  const handleManualSosPrompt = () => {
    Alert.alert(
      'Activate Emergency SOS',
      'This initiates the confirmation countdown and informs emergency contacts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ACTIVATE SOS',
          style: 'destructive',
          onPress: triggerManualSos,
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AppPageHeader
        title="Live Ride Monitoring"
        subtitle="Continuous 6-Axis IMU, GPS & Lean-Angle Engine"
        onBack={onBack}
        action={
          <View style={styles.headerRight}>
            <AppBadge label="RECORDING" variant="success" icon="record-circle-outline" />
            <TouchableOpacity
              style={[
                styles.labToggleBtn,
                {
                  backgroundColor: showSimLab ? theme.primaryLight : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setShowSimLab(!showSimLab)}
            >
              <MaterialCommunityIcons
                name="flask-outline"
                size={18}
                color={showSimLab ? theme.primary : theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Proximity Road Hazard Warning Banner */}
        <HazardWarningBanner alert={activeHazardAlert} onDismiss={dismissHazardAlert} />

        {/* Speedometer & Trip Telematics Card */}
        <AppCard style={styles.speedCard}>
          <Text style={[styles.speedLabel, { color: theme.textMuted }]}>CURRENT SPEED</Text>
          <View style={styles.speedRow}>
            <Text style={[styles.speedVal, { color: theme.textPrimary }]}>
              {currentSpeed.toFixed(0)}
            </Text>
            <Text style={[styles.speedUnit, { color: theme.primary }]}>KM/H</Text>
          </View>

          <View style={[styles.metricsRow, { borderTopColor: theme.borderLight }]}>
            <View style={styles.metricCol}>
              <Text style={[styles.mLabel, { color: theme.textMuted }]}>ELAPSED</Text>
              <Text style={[styles.mVal, { color: theme.textPrimary }]}>{timeFormatted}</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={[styles.mLabel, { color: theme.textMuted }]}>MAX SPEED</Text>
              <Text style={[styles.mVal, { color: theme.textPrimary }]}>{maxSpeed.toFixed(0)} km/h</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={[styles.mLabel, { color: theme.textMuted }]}>EVENTS</Text>
              <Text style={[styles.mVal, { color: theme.textPrimary }]}>
                {activeRide?.incidents.length || 0}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Real-time Calibrated Lean Angle Horizon Gauge */}
        <LeanAngleGauge
          leanAngleDeg={currentLeanAngle}
          direction={currentLeanDirection}
          state={currentLeanState}
          isCalibrated={!!calibrationProfile?.calibrated}
        />

        {/* In-App Live Map with Hazard Markers */}
        <RideMapView
          currentLocation={currentLocation}
          hazards={hazards}
          height={190}
          interactive={false}
        />

        {/* 6-Axis IMU Telemetry Gauges */}
        <LiveSensorGauges
          accelMagnitude={currentRecord?.accelMagnitude || 1.0}
          gyroMagnitude={currentRecord?.gyroMagnitude || 0.0}
          accelX={currentRecord?.accelX || 0.0}
          accelY={currentRecord?.accelY || 0.0}
          accelZ={currentRecord?.accelZ || 1.0}
        />

        {/* Bench Simulation Lab (Collapsible) */}
        {showSimLab && (
          <AppCard style={[styles.simCard, { borderColor: theme.warning }]}>
            <View style={styles.simHeader}>
              <MaterialCommunityIcons name="flask-outline" size={18} color={theme.warning} />
              <Text style={[styles.simTitle, { color: theme.warning }]}>
                Simulation & Bench Test Lab
              </Text>
            </View>
            <Text style={[styles.simDesc, { color: theme.textSecondary }]}>
              Inject real sensor events into the detection pipeline without physical hazard risk.
            </Text>
            <View style={styles.simGrid}>
              <AppButton
                title="Simulate Crash (4.8G + Tumble)"
                variant="danger"
                onPress={() => runDemoScenario('CRASH')}
                style={styles.simBtn}
              />
              <AppButton
                title="Simulate Pothole (3.2G Jolt)"
                variant="secondary"
                onPress={() => runDemoScenario('POTHOLE')}
                style={styles.simBtn}
              />
              <AppButton
                title="Simulate Hard Braking (-18 km/h)"
                variant="secondary"
                onPress={() => runDemoScenario('HARD_BRAKING')}
                style={styles.simBtn}
              />
              <AppButton
                title="Simulate Normal Ride (Safe)"
                variant="outline"
                onPress={() => runDemoScenario('NORMAL')}
                style={styles.simBtn}
              />
            </View>
          </AppCard>
        )}

        {/* Primary Action Buttons */}
        <View style={styles.actionRow}>
          <AppButton
            title="FINISH & RECORD RIDE"
            variant="primary"
            icon="flag-checkered"
            onPress={handleEndRideConfirm}
          />

          <TouchableOpacity style={styles.sosButton} onPress={handleManualSosPrompt}>
            <MaterialCommunityIcons name="alert-octagon" size={20} color="#ffffff" />
            <Text style={styles.sosButtonText}>MANUAL SOS PANIC BUTTON</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  speedCard: {
    padding: spacing.md,
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 4,
  },
  speedVal: {
    fontSize: 54,
    fontWeight: typography.weights.heavy,
  },
  speedUnit: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.heavy,
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    marginTop: 4,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  mLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  mVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  simCard: {
    padding: spacing.md,
    borderWidth: 1.5,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  simTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  simDesc: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: spacing.sm,
  },
  simGrid: {
    gap: 6,
  },
  simBtn: {
    width: '100%',
  },
  actionRow: {
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  sosButton: {
    backgroundColor: '#ef4444',
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.5,
  },
});
