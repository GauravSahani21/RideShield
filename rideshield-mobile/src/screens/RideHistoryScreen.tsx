import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRide } from '../context/RideContext';
import { useAppTheme } from '../theme/ThemeContext';
import { AppPageHeader, AppCard, AppBadge } from '../components/UIComponents';
import { spacing, radius, typography } from '../theme';

interface RideHistoryScreenProps {
  onBack: () => void;
}

export const RideHistoryScreen: React.FC<RideHistoryScreenProps> = ({ onBack }) => {
  const { rideHistory } = useRide();
  const { theme } = useAppTheme();

  const openMap = (lat: number, lng: number) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppPageHeader
        title="Ride History"
        subtitle="Completed journeys, telematics log and road safety records"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {rideHistory.length === 0 ? (
          <AppCard style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceHover }]}>
              <MaterialCommunityIcons name="map-marker-path" size={36} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Recorded Trips Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              Completed rides, driving telemetry, and detected road hazards will appear here automatically.
            </Text>
          </AppCard>
        ) : (
          rideHistory.map((ride) => {
            const dateStr = new Date(ride.startTime).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const timeStr = new Date(ride.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const minutes = Math.floor(ride.durationSeconds / 60);
            const seconds = ride.durationSeconds % 60;

            const scoreVariant =
              ride.safetyScore > 80 ? 'success' : ride.safetyScore > 60 ? 'warning' : 'danger';

            return (
              <AppCard key={ride.id} style={styles.rideCard}>
                {/* Header Strip */}
                <View style={styles.rideCardHeader}>
                  <View>
                    <Text style={[styles.rideDate, { color: theme.text }]}>
                      {dateStr} • {timeStr}
                    </Text>
                    <Text style={[styles.rideId, { color: theme.textMuted }]}>
                      ID: {ride.id.slice(-8)}
                    </Text>
                  </View>
                  <AppBadge
                    label={`SCORE ${ride.safetyScore}`}
                    variant={scoreVariant}
                    size="md"
                  />
                </View>

                {/* Metrics Breakdown Grid */}
                <View style={[styles.metricsStrip, { backgroundColor: theme.surfaceHover }]}>
                  <View style={styles.stripCol}>
                    <Text style={[styles.stripLabel, { color: theme.textMuted }]}>DURATION</Text>
                    <Text style={[styles.stripVal, { color: theme.text }]}>
                      {minutes}m {seconds}s
                    </Text>
                  </View>
                  <View style={styles.stripCol}>
                    <Text style={[styles.stripLabel, { color: theme.textMuted }]}>MAX SPEED</Text>
                    <Text style={[styles.stripVal, { color: theme.text }]}>
                      {ride.maxSpeedKmh.toFixed(0)} km/h
                    </Text>
                  </View>
                  <View style={styles.stripCol}>
                    <Text style={[styles.stripLabel, { color: theme.textMuted }]}>INCIDENTS</Text>
                    <Text
                      style={[
                        styles.stripVal,
                        { color: ride.incidents.length > 0 ? theme.warning : theme.success },
                      ]}
                    >
                      {ride.incidents.length}
                    </Text>
                  </View>
                </View>

                {/* Event Incidents List */}
                {ride.incidents.length > 0 && (
                  <View style={styles.incidentList}>
                    <Text style={[styles.incidentListTitle, { color: theme.textMuted }]}>
                      RECORDED ROAD INCIDENTS
                    </Text>
                    {ride.incidents.map((ev, idx) => {
                      const isCrash =
                        ev.type === 'POSSIBLE_CRASH' ||
                        ev.type === 'HIGH_SIDE_CRASH' ||
                        ev.type === 'VEHICLE_ROLLOVER';
                      const isPothole = ev.type === 'POTHOLE';

                      const iconName = isCrash
                        ? 'alert-octagon'
                        : isPothole
                        ? 'road-variant'
                        : 'car-brake-alert';

                      const iconColor = isCrash
                        ? theme.danger
                        : isPothole
                        ? theme.warning
                        : theme.primary;

                      return (
                        <View
                          key={idx}
                          style={[
                            styles.incidentItem,
                            { borderTopColor: theme.border },
                          ]}
                        >
                          <View style={styles.incidentItemLeft}>
                            <View
                              style={[
                                styles.incidentIconBadge,
                                {
                                  backgroundColor: isCrash
                                    ? theme.dangerLight
                                    : isPothole
                                    ? theme.warningLight
                                    : theme.primaryLight,
                                },
                              ]}
                            >
                              <MaterialCommunityIcons name={iconName} size={16} color={iconColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.incidentItemDesc, { color: theme.text }]}>
                                {ev.description}
                              </Text>
                              <Text style={[styles.incidentItemTime, { color: theme.textMuted }]}>
                                {new Date(ev.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}{' '}
                                • Peak {ev.peakAccelG.toFixed(1)}G ({ev.confidence}% conf)
                              </Text>
                            </View>
                          </View>

                          {ev.location && (
                            <TouchableOpacity
                              style={[styles.mapBtn, { backgroundColor: theme.primaryLight }]}
                              onPress={() =>
                                openMap(ev.location!.latitude, ev.location!.longitude)
                              }
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons
                                name="map-marker-radius"
                                size={16}
                                color={theme.primary}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </AppCard>
            );
          })
        )}
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
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  rideCard: {
    padding: spacing.md,
  },
  rideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  rideDate: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  rideId: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metricsStrip: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stripCol: {
    flex: 1,
    alignItems: 'center',
  },
  stripLabel: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },
  stripVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  incidentList: {
    marginTop: spacing.sm,
  },
  incidentListTitle: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  incidentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  incidentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  incidentIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentItemDesc: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  incidentItemTime: {
    fontSize: 10,
    marginTop: 2,
  },
  mapBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
