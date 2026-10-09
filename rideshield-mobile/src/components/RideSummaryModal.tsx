import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RideRecord } from '../types';
import { useAppTheme } from '../theme/ThemeContext';
import { AppCard, AppButton, AppBadge } from './UIComponents';
import { spacing, radius, typography } from '../theme';

interface RideSummaryModalProps {
  ride: RideRecord | null;
  visible: boolean;
  onClose: () => void;
}

export const RideSummaryModal: React.FC<RideSummaryModalProps> = ({
  ride,
  visible,
  onClose,
}) => {
  const { theme } = useAppTheme();

  if (!ride || !visible) return null;

  const minutes = Math.floor(ride.durationSeconds / 60);
  const seconds = ride.durationSeconds % 60;

  const scoreVariant =
    ride.safetyScore >= 80 ? 'success' : ride.safetyScore >= 60 ? 'warning' : 'danger';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Ride Summary & Coaching</Text>
              <Text style={[styles.date, { color: theme.textMuted }]}>
                {new Date(ride.startTime).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                • {minutes}m {seconds}s duration
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.surfaceHover }]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Planned vs Actual Analytics Card */}
            {(ride.originTripName || ride.plannedDistanceKm) && (
              <AppCard style={[styles.plannedCard, { borderColor: theme.primary }]}>
                <View style={styles.plannedHeader}>
                  <MaterialCommunityIcons name="map-check-outline" size={18} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.plannedTitle, { color: theme.text }]}>
                      Planned Route Telematics: {ride.originTripName || 'Itinerary Ride'}
                    </Text>
                    <Text style={[styles.plannedSub, { color: theme.textMuted }]}>
                      Comparison between planned trip targets and recorded ride execution
                    </Text>
                  </View>
                </View>

                <View style={[styles.compareGrid, { backgroundColor: theme.surfaceHover }]}>
                  <View style={styles.compareItem}>
                    <Text style={[styles.cLabel, { color: theme.textMuted }]}>PLANNED DISTANCE</Text>
                    <Text style={[styles.cVal, { color: theme.text }]}>
                      {ride.plannedDistanceKm ? `${ride.plannedDistanceKm} km` : '-'}
                    </Text>
                  </View>
                  <View style={styles.compareItem}>
                    <Text style={[styles.cLabel, { color: theme.textMuted }]}>ACTUAL DISTANCE</Text>
                    <Text style={[styles.cVal, { color: theme.primary }]}>
                      {ride.distanceKm.toFixed(1)} km
                    </Text>
                  </View>
                  <View style={styles.compareItem}>
                    <Text style={[styles.cLabel, { color: theme.textMuted }]}>EST. DURATION</Text>
                    <Text style={[styles.cVal, { color: theme.text }]}>
                      {ride.plannedDurationMinutes ? `${ride.plannedDurationMinutes}m` : '-'}
                    </Text>
                  </View>
                  <View style={styles.compareItem}>
                    <Text style={[styles.cLabel, { color: theme.textMuted }]}>ACTUAL DURATION</Text>
                    <Text style={[styles.cVal, { color: theme.primary }]}>
                      {minutes}m {seconds}s
                    </Text>
                  </View>
                </View>
              </AppCard>
            )}

            {/* Safety Score Card */}
            <AppCard style={styles.scoreCard}>
              <View style={styles.scoreRow}>
                <View>
                  <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>OVERALL SAFETY SCORE</Text>
                  <Text style={[styles.scoreNumber, { color: theme.text }]}>
                    {ride.safetyScore}<Text style={{ fontSize: 18, color: theme.textMuted }}>/100</Text>
                  </Text>
                </View>
                <AppBadge
                  label={
                    ride.safetyScore >= 90
                      ? 'GRADE A+'
                      : ride.safetyScore >= 80
                      ? 'GRADE A'
                      : ride.safetyScore >= 70
                      ? 'GRADE B'
                      : 'GRADE C'
                  }
                  variant={scoreVariant}
                  size="md"
                />
              </View>

              <Text style={[styles.breakdownTitle, { color: theme.textMuted }]}>
                MATHEMATICAL DEDUCTION BREAKDOWN
              </Text>
              <View style={[styles.breakdownGrid, { backgroundColor: theme.surfaceHover }]}>
                <View style={styles.breakdownItem}>
                  <Text style={[styles.bLabel, { color: theme.textMuted }]}>Hard Braking</Text>
                  <Text style={[styles.bVal, { color: theme.text }]}>
                    -{ride.scoreBreakdown?.hardBrakingPenalty || 0} pts
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={[styles.bLabel, { color: theme.textMuted }]}>Cornering</Text>
                  <Text style={[styles.bVal, { color: theme.text }]}>
                    -{ride.scoreBreakdown?.hardCorneringPenalty || 0} pts
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={[styles.bLabel, { color: theme.textMuted }]}>Potholes</Text>
                  <Text style={[styles.bVal, { color: theme.text }]}>
                    -{ride.scoreBreakdown?.potholePenalty || 0} pts
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={[styles.bLabel, { color: theme.textMuted }]}>Impact Spike</Text>
                  <Text style={[styles.bVal, { color: theme.text }]}>
                    -{ride.scoreBreakdown?.crashPenalty || 0} pts
                  </Text>
                </View>
              </View>
            </AppCard>

            {/* Rider Coaching Tips */}
            {ride.coachingTips && ride.coachingTips.length > 0 && (
              <AppCard style={styles.coachingCard}>
                <View style={styles.coachingHeader}>
                  <MaterialCommunityIcons name="school-outline" size={18} color={theme.primary} />
                  <Text style={[styles.coachingTitle, { color: theme.text }]}>Rider Coaching Insights</Text>
                </View>

                {ride.coachingTips.map((tip, idx) => {
                  const isPositive = tip.type === 'POSITIVE';
                  const isCaution = tip.type === 'CAUTION';
                  const tipColor = isPositive
                    ? theme.success
                    : isCaution
                    ? theme.warning
                    : theme.primary;
                  const tipBg = isPositive
                    ? theme.successLight
                    : isCaution
                    ? theme.warningLight
                    : theme.primaryLight;

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.tipItem,
                        { borderTopColor: theme.border },
                      ]}
                    >
                      <View style={styles.tipTitleRow}>
                        <View style={[styles.tipIconBadge, { backgroundColor: tipBg }]}>
                          <MaterialCommunityIcons
                            name={
                              isPositive
                                ? 'check-circle'
                                : isCaution
                                ? 'alert'
                                : 'information'
                            }
                            size={14}
                            color={tipColor}
                          />
                        </View>
                        <Text style={[styles.tipTitle, { color: theme.text }]}>{tip.title}</Text>
                      </View>
                      <Text style={[styles.tipAdvice, { color: theme.textSecondary }]}>
                        {tip.advice}
                      </Text>
                    </View>
                  );
                })}
              </AppCard>
            )}

            {/* Event Counts Grid */}
            <AppCard style={styles.eventsGridCard}>
              <Text style={[styles.eventsTitle, { color: theme.textMuted }]}>
                EVENT TELEMETRY LOGGED
              </Text>
              <View style={styles.eventsGrid}>
                <View style={[styles.metricBox, { backgroundColor: theme.surfaceHover }]}>
                  <Text style={[styles.mLabel, { color: theme.textMuted }]}>HARD BRAKING</Text>
                  <Text style={[styles.mVal, { color: theme.text }]}>
                    {ride.eventCounts?.hardBraking || 0}
                  </Text>
                </View>
                <View style={[styles.metricBox, { backgroundColor: theme.surfaceHover }]}>
                  <Text style={[styles.mLabel, { color: theme.textMuted }]}>CORNERING</Text>
                  <Text style={[styles.mVal, { color: theme.text }]}>
                    {ride.eventCounts?.hardCornering || 0}
                  </Text>
                </View>
                <View style={[styles.metricBox, { backgroundColor: theme.surfaceHover }]}>
                  <Text style={[styles.mLabel, { color: theme.textMuted }]}>POTHOLES</Text>
                  <Text style={[styles.mVal, { color: theme.text }]}>
                    {ride.eventCounts?.potholes || 0}
                  </Text>
                </View>
                <View style={[styles.metricBox, { backgroundColor: theme.surfaceHover }]}>
                  <Text style={[styles.mLabel, { color: theme.textMuted }]}>CRASH ALARMS</Text>
                  <Text style={[styles.mVal, { color: theme.danger }]}>
                    {ride.eventCounts?.crashes || 0}
                  </Text>
                </View>
              </View>
            </AppCard>

            <View style={{ marginTop: spacing.md }}>
              <AppButton title="Close Summary" variant="primary" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  date: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  scoreCard: {
    padding: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: typography.weights.heavy,
    marginTop: 2,
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  breakdownGrid: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  bLabel: {
    fontSize: 10,
  },
  bVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  coachingCard: {
    padding: spacing.md,
  },
  coachingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  coachingTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  tipItem: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tipIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  tipAdvice: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    paddingLeft: 30,
  },
  eventsGridCard: {
    padding: spacing.md,
  },
  eventsTitle: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  eventsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  mLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  mVal: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: 4,
  },
  plannedCard: {
    padding: spacing.md,
    borderWidth: 1.5,
  },
  plannedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  plannedTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  plannedSub: {
    fontSize: 10,
    marginTop: 2,
  },
  compareGrid: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  compareItem: {
    flex: 1,
    alignItems: 'center',
  },
  cLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  cVal: {
    fontSize: 12,
    fontWeight: typography.weights.heavy,
    marginTop: 2,
  },
});

