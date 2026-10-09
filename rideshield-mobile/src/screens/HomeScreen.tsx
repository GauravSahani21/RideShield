import React from 'react';
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
import { RideShieldLogo } from '../components/RideShieldLogo';
import { RideMapView } from '../components/RideMapView';
import { spacing, radius, typography } from '../theme';

interface HomeScreenProps {
  onStartRide: () => void;
  onOpenLive: () => void;
  onOpenContacts: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenDiagnostics: () => void;
  onOpenCalibration: () => void;
  onOpenTripPlanner: () => void;
  onOpenMyRides: () => void;
  onOpenHazards: () => void;
  onSelectRide: (ride: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartRide,
  onOpenLive,
  onOpenContacts,
  onOpenHistory,
  onOpenSettings,
  onOpenDiagnostics,
  onOpenCalibration,
  onOpenTripPlanner,
  onOpenMyRides,
  onOpenHazards,
  onSelectRide,
}) => {
  const {
    state,
    safetyScore,
    currentLocation,
    contacts,
    rideHistory,
    calibrationProfile,
    hazards,
    plannedTrips,
    user,
  } = useRide();
  const { theme, isDark, toggleTheme } = useAppTheme();

  const isRiding =
    state === 'MONITORING' ||
    state === 'EMERGENCY_COUNTDOWN' ||
    state === 'POSSIBLE_CRASH';
  const lastRide = rideHistory[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header with New RideShield Branding */}
      <View style={styles.topBar}>
        <RideShieldLogo size={38} textColor={theme.textPrimary} />

        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={toggleTheme}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'weather-night'}
              size={18}
              color={theme.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={onOpenSettings}
          >
            <MaterialCommunityIcons name="cog-outline" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting & Emergency Readiness Status */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={[styles.greetingText, { color: theme.textSecondary }]}>
            Good day, {user?.name?.split(' ')[0] || 'Rider'}
          </Text>
          <Text style={[styles.statusSubtitle, { color: theme.textPrimary }]}>
            Motorcycle Telematics & SOS: <Text style={{ color: theme.success, fontWeight: '700' }}>READY</Text>
          </Text>
        </View>
        <AppBadge
          label={contacts.length > 0 ? `${contacts.length} ICE CONTACTS` : 'NO ICE CONTACTS'}
          variant={contacts.length > 0 ? 'success' : 'danger'}
          size="sm"
        />
      </View>

      {/* 2. Primary Safety & Telematics Readiness Card */}
      <AppCard style={styles.statusCard}>
        <View style={styles.statusTop}>
          <View>
            <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>
              FLEET SAFETY SCORE
            </Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: theme.primary }]}>
                {safetyScore}
              </Text>
              <Text style={[styles.scoreTotal, { color: theme.textMuted }]}>/100</Text>
            </View>
          </View>

          <AppBadge
            label={isRiding ? 'MONITORING ACTIVE' : 'SYSTEM STANDBY'}
            variant={isRiding ? 'success' : 'neutral'}
            icon={isRiding ? 'record-circle-outline' : 'power-standby'}
            size="md"
          />
        </View>

        {/* Readiness Indicators Strip */}
        <View style={[styles.statusPills, { borderTopColor: theme.borderLight }]}>
          <TouchableOpacity style={styles.telemetryTag} onPress={onOpenCalibration}>
            <MaterialCommunityIcons
              name="cellphone-dock"
              size={14}
              color={calibrationProfile?.calibrated ? theme.success : theme.warning}
            />
            <Text style={[styles.tagText, { color: theme.textSecondary }]}>
              {calibrationProfile?.calibrated ? 'Mount Calibrated' : 'Calibrate Phone'}
            </Text>
          </TouchableOpacity>

          <View style={styles.telemetryTag}>
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={14}
              color={currentLocation?.signalState === 'CONNECTED' ? theme.success : theme.warning}
            />
            <Text style={[styles.tagText, { color: theme.textSecondary }]}>
              {currentLocation?.signalState || 'GPS Connected'}
            </Text>
          </View>

          <TouchableOpacity style={styles.telemetryTag} onPress={onOpenHazards}>
            <MaterialCommunityIcons name="road-variant" size={14} color={theme.warning} />
            <Text style={[styles.tagText, { color: theme.textSecondary }]}>
              {hazards.length} Road Hazards
            </Text>
          </TouchableOpacity>
        </View>
      </AppCard>

      {/* 3. Embedded Google Maps Experience Card */}
      <AppCard style={styles.mapCard}>
        <View style={styles.mapCardHeader}>
          <View>
            <Text style={[styles.mapCardTitle, { color: theme.textPrimary }]}>Live Ride Map & Hazards</Text>
            <Text style={[styles.mapCardSub, { color: theme.textMuted }]}>
              Real-time Google Platform vector surface
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.openMapBtn, { backgroundColor: theme.primaryLight }]}
            onPress={onOpenTripPlanner}
          >
            <MaterialCommunityIcons name="routes" size={14} color={theme.primary} />
            <Text style={[styles.openMapText, { color: theme.primary }]}>Plan Trip</Text>
          </TouchableOpacity>
        </View>

        <RideMapView
          currentLocation={currentLocation}
          hazards={hazards}
          height={180}
          interactive={false}
        />
      </AppCard>

      {/* 4. Primary Calls to Action (Start Ride + Plan A Ride) */}
      <View style={styles.primaryActionWrap}>
        <AppButton
          title={isRiding ? 'RETURN TO ACTIVE RIDE' : 'START RIDE & MONITORING'}
          variant="primary"
          icon={isRiding ? 'speedometer' : 'play-circle-outline'}
          onPress={isRiding ? onOpenLive : onStartRide}
        />

        <TouchableOpacity
          style={[styles.planRideBanner, { backgroundColor: theme.surface, borderColor: theme.primary }]}
          onPress={onOpenTripPlanner}
          activeOpacity={0.8}
        >
          <View style={[styles.planRideIconWrap, { backgroundColor: theme.primaryLight }]}>
            <MaterialCommunityIcons name="map-marker-path" size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.planRideTitle, { color: theme.textPrimary }]}>PLAN A RIDE</Text>
            <Text style={[styles.planRideSub, { color: theme.textMuted }]}>
              Multi-stop route planner, stop optimizer, and road hazard intelligence
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* 5. Quick Navigation & Trip Actions */}
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={[styles.gridTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onOpenMyRides}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconCircle, { backgroundColor: theme.primaryLight }]}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.primary} />
          </View>
          <Text style={[styles.tileTitle, { color: theme.textPrimary }]}>My Rides</Text>
          <Text style={[styles.tileSub, { color: theme.textMuted }]}>{plannedTrips.length} planned itineraries</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onOpenCalibration}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconCircle, { backgroundColor: theme.warningLight }]}>
            <MaterialCommunityIcons name="cellphone-dock" size={20} color={theme.warning} />
          </View>
          <Text style={[styles.tileTitle, { color: theme.textPrimary }]}>Calibrate Mount</Text>
          <Text style={[styles.tileSub, { color: theme.textMuted }]}>Lean-angle zeroing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onOpenHazards}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconCircle, { backgroundColor: theme.dangerLight }]}>
            <MaterialCommunityIcons name="road-variant" size={20} color={theme.danger} />
          </View>
          <Text style={[styles.tileTitle, { color: theme.textPrimary }]}>Road Hazards</Text>
          <Text style={[styles.tileSub, { color: theme.textMuted }]}>{hazards.length} reported</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onOpenContacts}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconCircle, { backgroundColor: theme.successLight }]}>
            <MaterialCommunityIcons name="account-alert-outline" size={20} color={theme.success} />
          </View>
          <Text style={[styles.tileTitle, { color: theme.textPrimary }]}>Emergency ICE</Text>
          <Text style={[styles.tileSub, { color: theme.textMuted }]}>{contacts.length} saved</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Recent Ride Summary */}
      {lastRide ? (
        <AppCard style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: theme.textPrimary }]}>Recent Ride Activity</Text>
            <TouchableOpacity onPress={onOpenHistory}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentMetrics}>
            <View style={styles.metricItem}>
              <Text style={[styles.mVal, { color: theme.textPrimary }]}>
                {lastRide.distanceKm.toFixed(1)} km
              </Text>
              <Text style={[styles.mLab, { color: theme.textMuted }]}>Distance</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.mVal, { color: theme.textPrimary }]}>
                {Math.floor(lastRide.durationSeconds / 60)}m
              </Text>
              <Text style={[styles.mLab, { color: theme.textMuted }]}>Duration</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.mVal, { color: theme.primary }]}>
                {lastRide.maxSpeedKmh.toFixed(0)} km/h
              </Text>
              <Text style={[styles.mLab, { color: theme.textMuted }]}>Peak Speed</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.mVal, { color: theme.success }]}>
                {lastRide.safetyScore}
              </Text>
              <Text style={[styles.mLab, { color: theme.textMuted }]}>Safety</Text>
            </View>
          </View>
        </AppCard>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  greetingText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  statusSubtitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  statusCard: {
    padding: spacing.md,
  },
  statusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  scoreValue: {
    fontSize: 38,
    fontWeight: typography.weights.heavy,
  },
  scoreTotal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginLeft: 2,
  },
  statusPills: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  telemetryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tagText: {
    fontSize: 10,
    fontWeight: typography.weights.medium,
  },
  mapCard: {
    padding: spacing.md,
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mapCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  mapCardSub: {
    fontSize: 10,
  },
  openMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  openMapText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  primaryActionWrap: {
    marginTop: 2,
    gap: spacing.sm,
  },
  planRideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  planRideIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRideTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.5,
  },
  planRideSub: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridTile: {
    width: '48%',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  tileIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  tileSub: {
    fontSize: 10,
    marginTop: 1,
  },
  recentCard: {
    padding: spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recentTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  viewAllText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  recentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  mVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  mLab: {
    fontSize: 9,
    marginTop: 2,
  },
});
