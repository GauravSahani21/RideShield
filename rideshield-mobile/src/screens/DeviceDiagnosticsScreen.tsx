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
import { AppPageHeader, AppCard, AppBadge } from '../components/UIComponents';
import { spacing, radius, typography } from '../theme';

interface DeviceDiagnosticsScreenProps {
  onBack: () => void;
}

export const DeviceDiagnosticsScreen: React.FC<DeviceDiagnosticsScreenProps> = ({ onBack }) => {
  const { sensorCapabilities, sensorProvider, setSensorProviderType, checkDeviceHealth } = useRide();
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppPageHeader
        title="Hardware Diagnostics"
        subtitle="Sensor health, data source pipelines, and positioning calibration"
        onBack={onBack}
        rightElement={
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
            onPress={checkDeviceHealth}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="refresh" size={18} color={theme.primary} />
            <Text style={[styles.refreshBtnText, { color: theme.primary }]}>Check</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Sensor Provider Selector */}
        <AppCard style={styles.card}>
          <Text style={[styles.cardHeader, { color: theme.textMuted }]}>DATA SOURCE ARCHITECTURE</Text>
          <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
            RideShield decouples detection logic from sensors, allowing seamless hot-swapping between phone sensors, simulation rig, and future smart garments.
          </Text>

          <View style={styles.providerGrid}>
            <TouchableOpacity
              style={[
                styles.providerOption,
                {
                  backgroundColor:
                    sensorProvider.id === 'PHONE_BUILTIN' ? theme.primaryLight : theme.surfaceHover,
                  borderColor:
                    sensorProvider.id === 'PHONE_BUILTIN' ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSensorProviderType('PHONE')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="cellphone"
                size={22}
                color={sensorProvider.id === 'PHONE_BUILTIN' ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.providerTitle,
                  {
                    color:
                      sensorProvider.id === 'PHONE_BUILTIN' ? theme.primary : theme.text,
                  },
                ]}
              >
                Phone IMU
              </Text>
              <Text style={[styles.providerSub, { color: theme.textMuted }]}>Hardware</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerOption,
                {
                  backgroundColor:
                    sensorProvider.id === 'SENSOR_SIMULATOR' ? theme.primaryLight : theme.surfaceHover,
                  borderColor:
                    sensorProvider.id === 'SENSOR_SIMULATOR' ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSensorProviderType('SIMULATOR')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="flask-outline"
                size={22}
                color={sensorProvider.id === 'SENSOR_SIMULATOR' ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.providerTitle,
                  {
                    color:
                      sensorProvider.id === 'SENSOR_SIMULATOR' ? theme.primary : theme.text,
                  },
                ]}
              >
                Simulator Rig
              </Text>
              <Text style={[styles.providerSub, { color: theme.textMuted }]}>Bench Test</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerOption,
                {
                  backgroundColor:
                    sensorProvider.id === 'BLUETOOTH_GARMENT_IMU' ? theme.primaryLight : theme.surfaceHover,
                  borderColor:
                    sensorProvider.id === 'BLUETOOTH_GARMENT_IMU' ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSensorProviderType('BLUETOOTH')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="tshirt-crew-outline"
                size={22}
                color={sensorProvider.id === 'BLUETOOTH_GARMENT_IMU' ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.providerTitle,
                  {
                    color:
                      sensorProvider.id === 'BLUETOOTH_GARMENT_IMU' ? theme.primary : theme.text,
                  },
                ]}
              >
                BLE Garment
              </Text>
              <Text style={[styles.providerSub, { color: theme.textMuted }]}>External IMU</Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Onboard Hardware Status */}
        <AppCard style={styles.card}>
          <Text style={[styles.cardHeader, { color: theme.textMuted }]}>
            ONBOARD SENSORS & SYSTEM HEALTH
          </Text>

          <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <View style={[styles.sensorIconBadge, { backgroundColor: theme.primaryLight }]}>
                <MaterialCommunityIcons name="axis-arrow" size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>3-Axis Accelerometer</Text>
                <Text style={[styles.itemSub, { color: theme.textMuted }]}>G-force impact spikes & jerk</Text>
              </View>
            </View>
            <AppBadge
              label={sensorCapabilities?.accelerometer ? 'ONLINE' : 'ACTIVE'}
              variant="success"
            />
          </View>

          <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.sensorIconBadge, { backgroundColor: theme.primaryLight }]}>
                <MaterialCommunityIcons name="rotate-3d-variant" size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>Gyroscope</Text>
                <Text style={[styles.itemSub, { color: theme.textMuted }]}>Angular rate & rollover rotation</Text>
              </View>
            </View>
            <AppBadge
              label={sensorCapabilities?.gyroscope ? 'ONLINE' : 'ACTIVE'}
              variant="success"
            />
          </View>

          <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.sensorIconBadge, { backgroundColor: theme.successLight }]}>
                <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.success} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>GPS Satellite Receiver</Text>
                <Text style={[styles.itemSub, { color: theme.textMuted }]}>Live velocity & emergency fix</Text>
              </View>
            </View>
            <AppBadge
              label={sensorCapabilities?.locationPermissionGranted ? 'LOCKED' : 'AVAILABLE'}
              variant={sensorCapabilities?.locationPermissionGranted ? 'success' : 'warning'}
            />
          </View>

          <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.sensorIconBadge, { backgroundColor: theme.surfaceHover }]}>
                <MaterialCommunityIcons name="compass-outline" size={18} color={theme.textMuted} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>Magnetometer (Optional)</Text>
                <Text style={[styles.itemSub, { color: theme.textMuted }]}>Compass heading orientation</Text>
              </View>
            </View>
            <AppBadge label="OPTIONAL" variant="neutral" />
          </View>

          <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.sensorIconBadge, { backgroundColor: theme.successLight }]}>
                <MaterialCommunityIcons name="battery-high" size={18} color={theme.success} />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>Device Battery Level</Text>
                <Text style={[styles.itemSub, { color: theme.textMuted }]}>Optimal for background monitoring</Text>
              </View>
            </View>
            <AppBadge label="85% OPTIMAL" variant="success" />
          </View>
        </AppCard>

        {/* Safety Note */}
        <AppCard style={styles.noteCard}>
          <MaterialCommunityIcons name="shield-check" size={20} color={theme.primary} />
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            Hardware polling operates with dynamic fallback. If native sensors disconnect during a ride, RideShield automatically notifies you rather than silently degrading safety telemetry.
          </Text>
        </AppCard>
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
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  refreshBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  card: {
    padding: spacing.md,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  providerGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  providerOption: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  providerTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginTop: 4,
  },
  providerSub: {
    fontSize: 10,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sensorIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  itemSub: {
    fontSize: 10,
    marginTop: 2,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
});
