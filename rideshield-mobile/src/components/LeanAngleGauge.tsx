import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeContext';
import { AppCard, AppBadge } from './UIComponents';
import { spacing, radius, typography } from '../theme';

interface LeanAngleGaugeProps {
  leanAngleDeg: number;
  direction: 'LEFT' | 'RIGHT' | 'CENTER';
  state: 'NORMAL' | 'CAUTION' | 'HIGH';
  isCalibrated: boolean;
}

export const LeanAngleGauge: React.FC<LeanAngleGaugeProps> = ({
  leanAngleDeg,
  direction,
  state,
  isCalibrated,
}) => {
  const { theme } = useAppTheme();

  const stateColor =
    state === 'HIGH'
      ? theme.danger
      : state === 'CAUTION'
      ? theme.warning
      : theme.success;

  // Normalized visual balance bar (-50 deg left to +50 deg right)
  const normalizedPos =
    direction === 'CENTER'
      ? 50
      : direction === 'LEFT'
      ? Math.max(5, 50 - (leanAngleDeg / 50) * 45)
      : Math.min(95, 50 + (leanAngleDeg / 50) * 45);

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <MaterialCommunityIcons name="axis-z-rotate-clockwise" size={18} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.textMuted }]}>
            MOTORCYCLE LEAN ANGLE
          </Text>
        </View>
        <AppBadge
          label={isCalibrated ? 'CALIBRATED MOUNT' : 'RAW IMU'}
          variant={isCalibrated ? 'success' : 'neutral'}
          size="sm"
        />
      </View>

      {/* Primary Lean Angle Display */}
      <View style={styles.centerRow}>
        <View style={styles.leanDisplay}>
          <Text style={[styles.angleVal, { color: stateColor }]}>
            {leanAngleDeg.toFixed(0)}°
          </Text>
          <Text style={[styles.directionText, { color: theme.textSecondary }]}>
            {direction === 'CENTER' ? 'UPRIGHT / LEVEL' : `${direction} LEAN`}
          </Text>
        </View>

        <View style={styles.statePill}>
          <Text style={[styles.stateLabel, { color: stateColor }]}>
            {state === 'HIGH' ? 'DEEP ANGLE' : state === 'CAUTION' ? 'MODERATE' : 'OPTIMAL'}
          </Text>
        </View>
      </View>

      {/* Visual Balance Horizon Indicator */}
      <View style={styles.horizonContainer}>
        <View style={styles.horizonMarks}>
          <Text style={[styles.markText, { color: theme.textMuted }]}>45° L</Text>
          <Text style={[styles.markText, { color: theme.textMuted }]}>0°</Text>
          <Text style={[styles.markText, { color: theme.textMuted }]}>45° R</Text>
        </View>

        <View style={[styles.horizonTrack, { backgroundColor: theme.surfaceHover }]}>
          {/* Center reference notch */}
          <View style={[styles.centerNotch, { backgroundColor: theme.border }]} />

          {/* Dynamic Lean Indicator Bubble */}
          <View
            style={[
              styles.leanBubble,
              {
                left: `${normalizedPos}%`,
                backgroundColor: stateColor,
              },
            ]}
          />
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  leanDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  angleVal: {
    fontSize: 34,
    fontWeight: typography.weights.heavy,
  },
  directionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  statePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  stateLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  horizonContainer: {
    marginTop: spacing.xs,
  },
  horizonMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  markText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  horizonTrack: {
    height: 12,
    borderRadius: radius.full,
    position: 'relative',
    justifyContent: 'center',
  },
  centerNotch: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: 14,
    marginLeft: -1,
  },
  leanBubble: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});
