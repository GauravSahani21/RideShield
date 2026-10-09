import React, { useState, useEffect } from 'react';
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
import { RouteOption } from '../types';
import { AppCard, AppButton, AppBadge } from '../components/UIComponents';
import { RideMapView } from '../components/RideMapView';
import { LeanAngleGauge } from '../components/LeanAngleGauge';
import { HazardWarningBanner } from '../components/HazardWarningBanner';
import { spacing, radius, typography } from '../theme';

interface NavigationScreenProps {
  route: RouteOption;
  onEndNavigation: () => void;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({
  route,
  onEndNavigation,
}) => {
  const {
    currentRecord,
    currentLocation,
    currentLeanAngle,
    currentLeanDirection,
    currentLeanState,
    calibrationProfile,
    activeHazardAlert,
    dismissHazardAlert,
    triggerManualSos,
    hazards,
  } = useRide();
  const { theme } = useAppTheme();

  const [stepIndex, setStepIndex] = useState(0);

  const steps = route.steps || [
    {
      instruction: 'Proceed along main avenue toward destination',
      maneuver: 'straight',
      distanceMeters: 450,
      durationSeconds: 45,
      startLocation: { latitude: 37.7749, longitude: -122.4194 },
      endLocation: { latitude: 37.776, longitude: -122.418 },
    },
  ];

  const currentStep = steps[stepIndex] || steps[0];
  const currentSpeed = currentRecord?.speed || 0;

  // Auto step advance simulation
  useEffect(() => {
    if (stepIndex < steps.length - 1) {
      const timer = setTimeout(() => {
        setStepIndex((prev) => prev + 1);
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [stepIndex, steps.length]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* High-Contrast Rider Turn-by-Turn Header Strip */}
      <View style={[styles.turnHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.turnLeft}>
          <View style={[styles.turnIconBadge, { backgroundColor: theme.primaryLight }]}>
            <MaterialCommunityIcons
              name={
                currentStep.maneuver === 'turn-left'
                  ? 'arrow-top-left'
                  : currentStep.maneuver === 'turn-right'
                  ? 'arrow-top-right'
                  : currentStep.maneuver === 'arrive'
                  ? 'flag-checkered'
                  : 'arrow-up'
              }
              size={32}
              color={theme.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.turnDistText, { color: theme.primary }]}>
              IN {currentStep.distanceMeters} METERS
            </Text>
            <Text style={[styles.turnInstructionText, { color: theme.textPrimary }]} numberOfLines={2}>
              {currentStep.instruction}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.closeNavBtn, { backgroundColor: theme.surfaceHover }]}
          onPress={() => {
            Alert.alert('End Navigation', 'Exit turn-by-turn guidance?', [
              { text: 'Keep Navigating', style: 'cancel' },
              { text: 'Exit', style: 'destructive', onPress: onEndNavigation },
            ]);
          }}
        >
          <MaterialCommunityIcons name="close" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Proximity Road Hazard Alert Banner */}
        <HazardWarningBanner alert={activeHazardAlert} onDismiss={dismissHazardAlert} />

        {/* Full In-App Navigation Map Surface */}
        <RideMapView
          currentLocation={currentLocation}
          hazards={hazards}
          route={route}
          height={260}
          interactive={false}
        />

        {/* Motorcycle Cockpit Telemetry HUD */}
        <View style={styles.hudRow}>
          {/* Speed HUD */}
          <AppCard style={styles.speedHudCard}>
            <Text style={[styles.hudLabel, { color: theme.textMuted }]}>SPEED</Text>
            <View style={styles.speedNumberRow}>
              <Text style={[styles.speedNum, { color: theme.textPrimary }]}>
                {currentSpeed.toFixed(0)}
              </Text>
              <Text style={[styles.speedUnit, { color: theme.primary }]}>KM/H</Text>
            </View>
            <View style={styles.gpsSignalTag}>
              <View
                style={[
                  styles.sigDot,
                  {
                    backgroundColor:
                      currentLocation?.signalState === 'CONNECTED'
                        ? theme.success
                        : theme.warning,
                  },
                ]}
              />
              <Text style={[styles.sigText, { color: theme.textSecondary }]}>
                {currentLocation?.signalState || 'GPS FIXED'}
              </Text>
            </View>
          </AppCard>

          {/* Trip Progress HUD */}
          <AppCard style={styles.tripHudCard}>
            <View style={styles.tripMetricCol}>
              <Text style={[styles.hudLabel, { color: theme.textMuted }]}>REMAINING</Text>
              <Text style={[styles.tripNum, { color: theme.textPrimary }]}>
                {route.distanceKm} km
              </Text>
            </View>
            <View style={styles.tripMetricCol}>
              <Text style={[styles.hudLabel, { color: theme.textMuted }]}>ETA DURATION</Text>
              <Text style={[styles.tripNum, { color: theme.success }]}>
                {route.durationMinutes} min
              </Text>
            </View>
          </AppCard>
        </View>

        {/* Real-time Calibrated Lean Angle Horizon Gauge */}
        <LeanAngleGauge
          leanAngleDeg={currentLeanAngle}
          direction={currentLeanDirection}
          state={currentLeanState}
          isCalibrated={!!calibrationProfile?.calibrated}
        />

        {/* Turn-by-Turn Maneuver List & Route Steps */}
        <AppCard style={styles.stepsCard}>
          <View style={styles.stepsCardHeader}>
            <View>
              <Text style={[styles.stepsTitle, { color: theme.textPrimary }]}>
                Turn-by-Turn Route Guidance
              </Text>
              <Text style={[styles.stepsSub, { color: theme.textMuted }]}>
                Step {stepIndex + 1} of {steps.length} • {route.summary}
              </Text>
            </View>
            <View style={styles.stepNavButtons}>
              <TouchableOpacity
                style={[
                  styles.stepArrowBtn,
                  { borderColor: theme.border, opacity: stepIndex === 0 ? 0.3 : 1 },
                ]}
                disabled={stepIndex === 0}
                onPress={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              >
                <MaterialCommunityIcons name="chevron-left" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.stepArrowBtn,
                  { borderColor: theme.border, opacity: stepIndex === steps.length - 1 ? 0.3 : 1 },
                ]}
                disabled={stepIndex === steps.length - 1}
                onPress={() => setStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
              >
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.stepsList}>
            {steps.map((st, idx) => {
              const isCurrent = idx === stepIndex;
              const isPast = idx < stepIndex;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.stepRowItem,
                    isCurrent && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                    isPast && { opacity: 0.5 },
                  ]}
                  onPress={() => setStepIndex(idx)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.stepIconWrap,
                      {
                        backgroundColor: isCurrent
                          ? theme.primary
                          : isPast
                          ? theme.border
                          : theme.surfaceHover,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        st.maneuver === 'turn-left'
                          ? 'arrow-top-left'
                          : st.maneuver === 'turn-right'
                          ? 'arrow-top-right'
                          : st.maneuver === 'arrive'
                          ? 'flag-checkered'
                          : st.maneuver === 'merge'
                          ? 'call-merge'
                          : 'arrow-up'
                      }
                      size={16}
                      color={isCurrent ? '#ffffff' : theme.textPrimary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.stepInstructionText,
                        {
                          color: isCurrent ? theme.primary : theme.textPrimary,
                          fontWeight: isCurrent ? 'bold' : 'normal',
                        },
                      ]}
                    >
                      {st.instruction}
                    </Text>
                    <Text style={[styles.stepDistanceText, { color: theme.textMuted }]}>
                      {st.distanceMeters >= 1000
                        ? `${(st.distanceMeters / 1000).toFixed(1)} km`
                        : `${st.distanceMeters} m`}
                    </Text>
                  </View>

                  {isCurrent && (
                    <AppBadge label="NOW" variant="primary" size="sm" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>

        {/* Emergency Panic SOS Button */}
        <View style={styles.panicRow}>
          <TouchableOpacity
            style={styles.panicBtn}
            onPress={() => {
              Alert.alert('Trigger Manual SOS', 'Broadcast emergency location immediately?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'CONFIRM SOS', style: 'destructive', onPress: triggerManualSos },
              ]);
            }}
          >
            <MaterialCommunityIcons name="alert-octagon" size={20} color="#ffffff" />
            <Text style={styles.panicBtnText}>EMERGENCY SOS OVERRIDE</Text>
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
  turnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  turnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  turnIconBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnDistText: {
    fontSize: 11,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.8,
  },
  turnInstructionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  closeNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  hudRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  speedHudCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  hudLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  speedNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4,
  },
  speedNum: {
    fontSize: 42,
    fontWeight: typography.weights.heavy,
  },
  speedUnit: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
  },
  gpsSignalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sigDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sigText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  tripHudCard: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-around',
  },
  tripMetricCol: {
    alignItems: 'center',
  },
  tripNum: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    marginTop: 2,
  },
  panicRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  panicBtn: {
    backgroundColor: '#ef4444',
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  panicBtnText: {
    color: '#ffffff',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.8,
  },
  stepsCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  stepsSub: {
    fontSize: 10,
    marginTop: 2,
  },
  stepNavButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  stepArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsList: {
    gap: 6,
  },
  stepRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInstructionText: {
    fontSize: 11,
    lineHeight: 16,
  },
  stepDistanceText: {
    fontSize: 10,
    marginTop: 2,
  },
});

