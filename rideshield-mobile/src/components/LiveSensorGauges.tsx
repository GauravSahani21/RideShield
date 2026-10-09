import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { AppCard } from './UIComponents';
import { spacing, radius, typography } from '../theme';

interface LiveSensorGaugesProps {
  accelMagnitude: number;
  gyroMagnitude: number;
  accelX: number;
  accelY: number;
  accelZ: number;
}

export const LiveSensorGauges: React.FC<LiveSensorGaugesProps> = ({
  accelMagnitude,
  gyroMagnitude,
  accelX,
  accelY,
  accelZ,
}) => {
  const { theme } = useAppTheme();

  // Normalize visual progress bars (0 to 5G)
  const accelPercent = Math.min(100, (accelMagnitude / 4.0) * 100);
  const gyroPercent = Math.min(100, (gyroMagnitude / 5.0) * 100);

  const getAccelColor = (val: number) => {
    if (val > 3.0) return theme.danger;
    if (val > 1.8) return theme.warning;
    return theme.success;
  };

  const getGyroColor = (val: number) => {
    if (val > 3.5) return theme.danger;
    if (val > 2.0) return theme.warning;
    return theme.primary;
  };

  return (
    <AppCard style={styles.card}>
      <Text style={[styles.cardHeader, { color: theme.textMuted }]}>
        6-AXIS IMU LIVE SENSOR TELEMETRY
      </Text>

      {/* G-Force Impact Gauge */}
      <View style={styles.meterContainer}>
        <View style={styles.labelRow}>
          <Text style={[styles.meterLabel, { color: theme.textSecondary }]}>
            Linear Acceleration (Impact)
          </Text>
          <Text style={[styles.meterValue, { color: getAccelColor(accelMagnitude) }]}>
            {accelMagnitude.toFixed(2)} G
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.surfaceHover }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${accelPercent}%`,
                backgroundColor: getAccelColor(accelMagnitude),
              },
            ]}
          />
        </View>
      </View>

      {/* Gyroscope Angular Rate Gauge */}
      <View style={styles.meterContainer}>
        <View style={styles.labelRow}>
          <Text style={[styles.meterLabel, { color: theme.textSecondary }]}>
            Angular Velocity (Tumble / Roll)
          </Text>
          <Text style={[styles.meterValue, { color: getGyroColor(gyroMagnitude) }]}>
            {gyroMagnitude.toFixed(2)} rad/s
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.surfaceHover }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${gyroPercent}%`,
                backgroundColor: getGyroColor(gyroMagnitude),
              },
            ]}
          />
        </View>
      </View>

      {/* 3-Axis Decomposition */}
      <View style={[styles.axisGrid, { backgroundColor: theme.surfaceHover }]}>
        <View style={styles.axisItem}>
          <Text style={[styles.axisName, { color: theme.textMuted }]}>X (Lateral)</Text>
          <Text style={[styles.axisVal, { color: theme.text }]}>
            {accelX.toFixed(2)} G
          </Text>
        </View>
        <View style={styles.axisItem}>
          <Text style={[styles.axisName, { color: theme.textMuted }]}>Y (Longitudinal)</Text>
          <Text style={[styles.axisVal, { color: theme.text }]}>
            {accelY.toFixed(2)} G
          </Text>
        </View>
        <View style={styles.axisItem}>
          <Text style={[styles.axisName, { color: theme.textMuted }]}>Z (Vertical)</Text>
          <Text style={[styles.axisVal, { color: theme.text }]}>
            {accelZ.toFixed(2)} G
          </Text>
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
  cardHeader: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  meterContainer: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  meterValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  track: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  axisGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: 2,
  },
  axisItem: {
    alignItems: 'center',
    flex: 1,
  },
  axisName: {
    fontSize: 10,
    marginBottom: 2,
  },
  axisVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
