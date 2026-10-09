import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRide } from '../context/RideContext';
import { useAppTheme } from '../theme/ThemeContext';
import { AppCard, AppButton, AppBadge } from '../components/UIComponents';
import { spacing, radius, typography } from '../theme';

export const CrashAlertModal: React.FC = () => {
  const {
    state,
    countdownRemaining,
    activeIncident,
    cancelAlert,
    currentLocation,
    sosDeliveryStatus,
  } = useRide();
  const { isDark } = useAppTheme();

  const isVisible =
    state === 'POSSIBLE_CRASH' ||
    state === 'EMERGENCY_COUNTDOWN' ||
    state === 'SOS_PENDING' ||
    state === 'SOS_TRIGGERED' ||
    state === 'CANCELLED';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const isCancelled = state === 'CANCELLED';
  const isTriggered = state === 'SOS_TRIGGERED' || state === 'SOS_PENDING';

  const flashColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isCancelled
      ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.3)']
      : ['rgba(239, 68, 68, 0.12)', 'rgba(239, 68, 68, 0.28)'],
  });

  return (
    <Modal visible={isVisible} animationType="fade" transparent={false}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1120" />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.container, { backgroundColor: flashColor }]}>
          {/* Header Status Bar */}
          <View style={styles.alertHeader}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isCancelled
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={isCancelled ? 'shield-check' : 'alert-decagram'}
                  size={36}
                  color={isCancelled ? '#10b981' : '#ef4444'}
                />
              </View>
              <Text
                style={[
                  styles.alertTitle,
                  { color: isCancelled ? '#10b981' : '#ef4444' },
                ]}
              >
                {isCancelled
                  ? 'EMERGENCY CANCELLED'
                  : isTriggered
                  ? 'EMERGENCY SOS SENT'
                  : 'POSSIBLE CRASH DETECTED'}
              </Text>
            </View>
            <Text style={styles.alertSubtitle}>
              {isCancelled
                ? 'Rider confirmed safe. Siren deactivated and false alarm logged.'
                : isTriggered
                ? `Emergency SOS broadcasted • Dispatch Status: ${sosDeliveryStatus}`
                : `High-impact telemetry detected (${activeIncident?.confidence || 90}% confidence). Verifying rider safety.`}
            </Text>
          </View>

          {/* High-Stress Countdown Counter */}
          <View style={styles.centerSection}>
            {isCancelled ? (
              <View style={[styles.countdownCircle, styles.cancelledCircle]}>
                <MaterialCommunityIcons name="check-bold" size={54} color="#10b981" />
                <Text style={styles.safeLabel}>RIDER SAFE</Text>
              </View>
            ) : !isTriggered ? (
              <Animated.View
                style={[
                  styles.countdownCircle,
                  styles.activeCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={styles.countdownNumber}>{countdownRemaining}</Text>
                <Text style={styles.countdownLabel}>SECONDS REMAINING</Text>
              </Animated.View>
            ) : (
              <View style={[styles.countdownCircle, styles.sosSentCircle]}>
                <MaterialCommunityIcons name="broadcast" size={54} color="#ffffff" />
                <Text style={styles.sosSentLabel}>{sosDeliveryStatus}</Text>
              </View>
            )}

            {/* Telemetry Breakdown Card */}
            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryTitle}>CRASH TELEMETRY & ROOT REASON</Text>

              {activeIncident?.reasons && activeIncident.reasons.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  {activeIncident.reasons.map((r, i) => (
                    <Text key={i} style={styles.reasonBullet}>
                      • {r}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.statGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>PEAK IMPACT</Text>
                  <Text style={styles.statVal}>
                    {activeIncident?.peakAccelG.toFixed(1) || '3.5'} G
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>CONFIDENCE</Text>
                  <Text style={styles.statVal}>
                    {activeIncident?.confidence || 90}%
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>TYPE</Text>
                  <Text style={[styles.statVal, { fontSize: 12 }]}>
                    {activeIncident?.type || 'CRASH'}
                  </Text>
                </View>
              </View>

              {currentLocation && (
                <View style={styles.locationPill}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#38bdf8" />
                  <Text style={styles.locationText}>
                    GPS: {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Footer: High-Visibility Cancellation */}
          <View style={styles.footerSection}>
            {!isCancelled && !isTriggered && (
              <TouchableOpacity
                style={styles.safeButton}
                activeOpacity={0.8}
                onPress={cancelAlert}
              >
                <MaterialCommunityIcons name="hand-okay" size={28} color="#ffffff" />
                <View>
                  <Text style={styles.safeButtonTitle}>I'M SAFE — CANCEL SOS</Text>
                  <Text style={styles.safeButtonSubtitle}>Disarms siren & prevents emergency dispatch</Text>
                </View>
              </TouchableOpacity>
            )}

            {isCancelled && (
              <TouchableOpacity
                style={styles.dismissButton}
                activeOpacity={0.8}
                onPress={cancelAlert}
              >
                <Text style={styles.dismissButtonText}>RETURN TO DASHBOARD</Text>
              </TouchableOpacity>
            )}

            {isTriggered && (
              <TouchableOpacity
                style={[styles.dismissButton, { borderColor: '#ef4444' }]}
                activeOpacity={0.8}
                onPress={cancelAlert}
              >
                <Text style={[styles.dismissButtonText, { color: '#ef4444' }]}>
                  DISMISS ALERT
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  alertHeader: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  badgeRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.8,
  },
  alertSubtitle: {
    color: '#94a3b8',
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  centerSection: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  countdownCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  cancelledCircle: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  sosSentCircle: {
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: typography.weights.heavy,
    color: '#ffffff',
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#f87171',
    letterSpacing: 1,
  },
  safeLabel: {
    fontSize: 14,
    fontWeight: typography.weights.heavy,
    color: '#10b981',
    letterSpacing: 1,
    marginTop: 6,
  },
  sosSentLabel: {
    fontSize: 14,
    fontWeight: typography.weights.heavy,
    color: '#ffffff',
    letterSpacing: 1,
    marginTop: 6,
  },
  telemetryCard: {
    width: '100%',
    backgroundColor: '#131d33',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  telemetryTitle: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  reasonBullet: {
    color: '#f87171',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    lineHeight: 18,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0b1120',
    borderRadius: radius.sm,
    padding: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: typography.weights.bold,
  },
  statVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
    marginTop: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0b1120',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: spacing.sm,
    justifyContent: 'center',
  },
  locationText: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footerSection: {
    marginBottom: spacing.md,
  },
  safeButton: {
    backgroundColor: '#10b981',
    borderRadius: radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  safeButtonTitle: {
    color: '#ffffff',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.8,
  },
  safeButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
  },
  dismissButton: {
    backgroundColor: '#1e293b',
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
});
