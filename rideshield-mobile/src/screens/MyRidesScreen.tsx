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
import { TripPlan, RideRecord } from '../types';
import { AppPageHeader, AppCard, AppButton, AppBadge } from '../components/UIComponents';
import { spacing, radius, typography } from '../theme';

interface MyRidesScreenProps {
  onBack: () => void;
  onOpenTripPlanner: (plan?: TripPlan) => void;
  onStartTripRide: (plan: TripPlan) => void;
  onSelectRideSummary: (ride: RideRecord) => void;
}

export const MyRidesScreen: React.FC<MyRidesScreenProps> = ({
  onBack,
  onOpenTripPlanner,
  onStartTripRide,
  onSelectRideSummary,
}) => {
  const { plannedTrips, rideHistory, deleteTripPlan, startRideFromPlan } = useRide();
  const { theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'PLANNED' | 'COMPLETED'>('PLANNED');

  const handleDeleteTrip = (plan: TripPlan) => {
    Alert.alert(
      'Delete Trip Plan',
      `Are you sure you want to remove "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTripPlan(plan.id),
        },
      ]
    );
  };

  const handleStartTrip = async (plan: TripPlan) => {
    await startRideFromPlan(plan);
    onStartTripRide(plan);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AppPageHeader
        title="My Rides"
        subtitle="Manage planned itineraries and review completed ride telematics"
        onBack={onBack}
      />

      {/* Tabs Row */}
      <View style={[styles.tabsRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'PLANNED' && [styles.activeTab, { borderBottomColor: theme.primary }],
          ]}
          onPress={() => setActiveTab('PLANNED')}
        >
          <MaterialCommunityIcons
            name="calendar-clock"
            size={18}
            color={activeTab === 'PLANNED' ? theme.primary : theme.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'PLANNED' ? theme.primary : theme.textMuted },
            ]}
          >
            PLANNED TRIPS ({plannedTrips.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'COMPLETED' && [styles.activeTab, { borderBottomColor: theme.primary }],
          ]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <MaterialCommunityIcons
            name="history"
            size={18}
            color={activeTab === 'COMPLETED' ? theme.primary : theme.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'COMPLETED' ? theme.primary : theme.textMuted },
            ]}
          >
            COMPLETED ({rideHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ============================================================ */}
        {/* PLANNED TRIPS TAB */}
        {/* ============================================================ */}
        {activeTab === 'PLANNED' && (
          <View style={styles.tabContent}>
            {/* Create New Trip Banner */}
            <AppCard style={styles.createCard}>
              <View style={styles.createInner}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.createTitle, { color: theme.textPrimary }]}>
                    Plan a New Motorcycle Journey
                  </Text>
                  <Text style={[styles.createSub, { color: theme.textMuted }]}>
                    Multi-stop route planning, waypoint optimization, and hazard alerts.
                  </Text>
                </View>
                <AppButton
                  title="+ PLAN TRIP"
                  variant="primary"
                  onPress={() => onOpenTripPlanner()}
                />
              </View>
            </AppCard>

            {plannedTrips.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="routes" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Planned Trips Yet</Text>
                <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                  Plan your route before heading out to optimize stops and review hazards.
                </Text>
              </View>
            ) : (
              plannedTrips.map((plan) => {
                const route = plan.selectedRoute;
                return (
                  <AppCard key={plan.id} style={styles.tripCard}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.tripName, { color: theme.textPrimary }]}>{plan.name}</Text>
                        <Text style={[styles.tripCreated, { color: theme.textMuted }]}>
                          Created {new Date(plan.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <AppBadge
                        label={`${plan.stops.length + 2} WAYPOINTS`}
                        variant="info"
                        size="sm"
                      />
                    </View>

                    {/* Route Details */}
                    {route && (
                      <View style={[styles.metricsBanner, { backgroundColor: theme.surfaceHover }]}>
                        <View style={styles.metricItem}>
                          <Text style={[styles.mLabel, { color: theme.textMuted }]}>DISTANCE</Text>
                          <Text style={[styles.mVal, { color: theme.textPrimary }]}>{route.distanceKm} km</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={[styles.mLabel, { color: theme.textMuted }]}>EST. DURATION</Text>
                          <Text style={[styles.mVal, { color: theme.textPrimary }]}>{route.durationMinutes} min</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={[styles.mLabel, { color: theme.textMuted }]}>SAFETY SCORE</Text>
                          <Text style={[styles.mVal, { color: theme.success }]}>{route.safetyScore}/100</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={[styles.mLabel, { color: theme.textMuted }]}>HAZARDS</Text>
                          <Text
                            style={[
                              styles.mVal,
                              { color: route.hazardCount > 0 ? theme.warning : theme.success },
                            ]}
                          >
                            {route.hazardCount}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Itinerary Chain summary */}
                    <View style={styles.chainSummary}>
                      <View style={styles.chainRow}>
                        <MaterialCommunityIcons name="circle-slice-8" size={14} color={theme.success} />
                        <Text style={[styles.chainText, { color: theme.textSecondary }]} numberOfLines={1}>
                          Start: {plan.startLocation ? 'Departure Origin' : 'Current GPS'}
                        </Text>
                      </View>
                      {plan.stops.map((s, idx) => (
                        <View key={s.id} style={styles.chainRow}>
                          <MaterialCommunityIcons name="arrow-down" size={12} color={theme.textMuted} />
                          <Text style={[styles.chainText, { color: theme.textSecondary }]} numberOfLines={1}>
                            Stop {idx + 1}: {s.name} {s.locked ? '🔒' : ''}
                          </Text>
                        </View>
                      ))}
                      <View style={styles.chainRow}>
                        <MaterialCommunityIcons name="map-marker" size={14} color={theme.danger} />
                        <Text style={[styles.chainText, { color: theme.textSecondary }]} numberOfLines={1}>
                          Dest: {plan.destination.name}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
                      <TouchableOpacity
                        style={[styles.smallBtn, { borderColor: theme.border }]}
                        onPress={() => onOpenTripPlanner(plan)}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.textPrimary} />
                        <Text style={[styles.smallBtnText, { color: theme.textPrimary }]}>Edit Route</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.smallBtn, { borderColor: theme.dangerLight }]}
                        onPress={() => handleDeleteTrip(plan)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.danger} />
                        <Text style={[styles.smallBtnText, { color: theme.danger }]}>Delete</Text>
                      </TouchableOpacity>

                      <View style={{ flex: 1 }}>
                        <AppButton
                          title="START RIDE"
                          variant="primary"
                          icon="play-circle-outline"
                          onPress={() => handleStartTrip(plan)}
                        />
                      </View>
                    </View>
                  </AppCard>
                );
              })
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* COMPLETED RIDES TAB */}
        {/* ============================================================ */}
        {activeTab === 'COMPLETED' && (
          <View style={styles.tabContent}>
            {rideHistory.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="bike-fast" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Completed Rides</Text>
                <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                  Your past trips and telematics analysis will appear here.
                </Text>
              </View>
            ) : (
              rideHistory.map((ride) => {
                const minutes = Math.floor(ride.durationSeconds / 60);
                const isPlanned = !!ride.originTripName;

                return (
                  <TouchableOpacity
                    key={ride.id}
                    activeOpacity={0.8}
                    onPress={() => onSelectRideSummary(ride)}
                  >
                    <AppCard style={styles.tripCard}>
                      <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.tripName, { color: theme.textPrimary }]}>
                            {ride.originTripName || `Ride on ${new Date(ride.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
                          </Text>
                          <Text style={[styles.tripCreated, { color: theme.textMuted }]}>
                            {new Date(ride.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {minutes} min duration
                          </Text>
                        </View>
                        <AppBadge
                          label={`SCORE: ${ride.safetyScore}`}
                          variant={ride.safetyScore >= 80 ? 'success' : 'warning'}
                          size="md"
                        />
                      </View>

                      {/* Telematics stats */}
                      <View style={[styles.metricsBanner, { backgroundColor: theme.surfaceHover }]}>
                        <View style={styles.metricItem}>
                          <Text style={[styles.mLabel, { color: theme.textMuted }]}>DISTANCE</Text>
                          <Text style={[styles.mVal, { color: theme.textPrimary }]}>{ride.distanceKm.toFixed(1)} km</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={[styles.mLabel, { color: theme.textMuted }]}>AVG SPEED</Text>
                          <Text style={[styles.mVal, { color: theme.textPrimary }]}>{ride.avgSpeedKmh.toFixed(0)} km/h</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={[styles.mLabel, { color: theme.textMuted }]}>MAX SPEED</Text>
                          <Text style={[styles.mVal, { color: theme.textPrimary }]}>{ride.maxSpeedKmh.toFixed(0)} km/h</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={[styles.mLabel, { color: theme.textMuted }]}>POTHOLES</Text>
                          <Text style={[styles.mVal, { color: theme.warning }]}>{ride.eventCounts?.potholes || 0}</Text>
                        </View>
                      </View>

                      {/* Planned vs Actual Analytics Pill */}
                      {isPlanned && (
                        <View style={[styles.plannedVsActualPill, { backgroundColor: theme.primaryLight }]}>
                          <MaterialCommunityIcons name="chart-bell-curve" size={14} color={theme.primary} />
                          <Text style={[styles.plannedVsActualText, { color: theme.primary }]}>
                            Planned: {ride.plannedDistanceKm || '-'} km / {ride.plannedDurationMinutes || '-'}m • Actual: {ride.distanceKm.toFixed(1)} km / {minutes}m
                          </Text>
                        </View>
                      )}

                      <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.viewDetailsText, { color: theme.primary }]}>
                            View Full Coaching & Deduction Analysis →
                          </Text>
                        </View>
                      </View>
                    </AppCard>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  content: {
    padding: spacing.md,
  },
  tabContent: {
    gap: spacing.md,
  },
  createCard: {
    padding: spacing.md,
  },
  createInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  createTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  createSub: {
    fontSize: 10,
    marginTop: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  emptySub: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    maxWidth: 240,
  },
  tripCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  tripCreated: {
    fontSize: 10,
    marginTop: 2,
  },
  metricsBanner: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 10,
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  mLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  mVal: {
    fontSize: 13,
    fontWeight: typography.weights.heavy,
    marginTop: 2,
  },
  chainSummary: {
    gap: 4,
    paddingVertical: 2,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chainText: {
    fontSize: 11,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  plannedVsActualPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  plannedVsActualText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
});
