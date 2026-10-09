import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeContext';
import { HazardWarningAlert } from '../types';
import { AppCard, AppBadge } from './UIComponents';
import { spacing, radius, typography } from '../theme';

interface HazardWarningBannerProps {
  alert: HazardWarningAlert | null;
  onDismiss: () => void;
}

export const HazardWarningBanner: React.FC<HazardWarningBannerProps> = ({
  alert,
  onDismiss,
}) => {
  const { theme } = useAppTheme();

  if (!alert) return null;

  const isSevere = alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
  const bannerBg = isSevere ? theme.dangerLight : theme.warningLight;
  const bannerBorder = isSevere ? theme.danger : theme.warning;
  const iconColor = isSevere ? theme.danger : theme.warning;

  return (
    <View style={[styles.container, { backgroundColor: bannerBg, borderColor: bannerBorder }]}>
      <View style={styles.leftRow}>
        <View style={[styles.iconCircle, { backgroundColor: bannerBorder }]}>
          <MaterialCommunityIcons
            name={
              alert.hazard.type === 'POTHOLE'
                ? 'road-variant'
                : alert.hazard.type === 'ACCIDENT'
                ? 'car-emergency'
                : 'alert-decagram'
            }
            size={20}
            color="#ffffff"
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {alert.hazard.type.replace('_', ' ')} AHEAD
            </Text>
            <AppBadge
              label={`${alert.distanceMeters}m`}
              variant={isSevere ? 'danger' : 'warning'}
              size="sm"
            />
          </View>
          <Text style={[styles.actionText, { color: theme.textSecondary }]}>
            {alert.recommendedAction}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.dismissBtn, { backgroundColor: theme.surface }]}
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="close" size={16} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.5,
  },
  actionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    lineHeight: 16,
  },
  dismissBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
