import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRide } from '../context/RideContext';
import { useAppTheme } from '../theme/ThemeContext';
import { RoadHazard, RoadHazardType } from '../types';
import { AppPageHeader, AppCard, AppButton, AppBadge } from '../components/UIComponents';
import { RideMapView } from '../components/RideMapView';
import { spacing, radius, typography } from '../theme';

interface RoadHazardsScreenProps {
  onBack: () => void;
}

export const RoadHazardsScreen: React.FC<RoadHazardsScreenProps> = ({ onBack }) => {
  const { hazards, currentLocation, reportManualHazard } = useRide();
  const { theme } = useAppTheme();

  const [selectedHazard, setSelectedHazard] = useState<RoadHazard | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<RoadHazardType>('POTHOLE');

  const handleReportSubmit = async () => {
    await reportManualHazard(selectedReportType);
    setReportModalVisible(false);
    Alert.alert('Hazard Reported', 'Your observation has been verified and added to the road-risk intelligence network.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AppPageHeader
        title="Road Hazard Intelligence"
        subtitle="Shared community hazard database, pothole detection & clustering"
        onBack={onBack}
        action={
          <TouchableOpacity
            style={[styles.reportBtn, { backgroundColor: theme.dangerLight, borderColor: theme.danger }]}
            onPress={() => setReportModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={16} color={theme.danger} />
            <Text style={[styles.reportBtnText, { color: theme.danger }]}>Report</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map Visualization with Hazard Pins */}
        <RideMapView
          currentLocation={currentLocation}
          hazards={hazards}
          selectedHazard={selectedHazard}
          onSelectHazard={(h) => setSelectedHazard(h)}
          height={220}
        />

        {/* Selected Hazard Card Detail */}
        {selectedHazard && (
          <AppCard style={[styles.selectedCard, { borderColor: theme.primary }]}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedTitleRow}>
                <MaterialCommunityIcons name="alert-octagon" size={20} color={theme.danger} />
                <Text style={[styles.selTitle, { color: theme.textPrimary }]}>
                  {selectedHazard.type.replace('_', ' ')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedHazard(null)}>
                <MaterialCommunityIcons name="close" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.selAddr, { color: theme.textSecondary }]}>
              {selectedHazard.address || `${selectedHazard.latitude.toFixed(4)}, ${selectedHazard.longitude.toFixed(4)}`}
            </Text>

            <View style={[styles.metricsRow, { backgroundColor: theme.surfaceHover }]}>
              <View style={styles.metricCol}>
                <Text style={[styles.mLabel, { color: theme.textMuted }]}>CONFIDENCE</Text>
                <Text style={[styles.mVal, { color: theme.primary }]}>{selectedHazard.confidence}%</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={[styles.mLabel, { color: theme.textMuted }]}>REPORTS</Text>
                <Text style={[styles.mVal, { color: theme.textPrimary }]}>{selectedHazard.reportCount}</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={[styles.mLabel, { color: theme.textMuted }]}>SPEED LIMIT</Text>
                <Text style={[styles.mVal, { color: theme.warning }]}>
                  ~{selectedHazard.recommendedSpeedKmh || 30} km/h
                </Text>
              </View>
            </View>
          </AppCard>
        )}

        {/* Community Hazards List */}
        <AppCard style={styles.card}>
          <Text style={[styles.cardHeader, { color: theme.textMuted }]}>
            VERIFIED NEARBY ROAD HAZARDS ({hazards.length})
          </Text>

          <View style={styles.hazardList}>
            {hazards.map((h) => {
              const isSevere = h.severity === 'CRITICAL' || h.severity === 'HIGH';
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.hazardItem, { borderTopColor: theme.border }]}
                  onPress={() => setSelectedHazard(h)}
                >
                  <View style={[styles.hIconCircle, { backgroundColor: isSevere ? theme.dangerLight : theme.warningLight }]}>
                    <MaterialCommunityIcons
                      name={h.type === 'POTHOLE' ? 'road-variant' : 'alert-decagram'}
                      size={18}
                      color={isSevere ? theme.danger : theme.warning}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.hTopRow}>
                      <Text style={[styles.hType, { color: theme.textPrimary }]}>
                        {h.type.replace('_', ' ')}
                      </Text>
                      <AppBadge
                        label={h.status}
                        variant={h.status === 'CONFIRMED' ? 'success' : 'warning'}
                        size="sm"
                      />
                    </View>
                    <Text style={[styles.hSub, { color: theme.textMuted }]}>
                      {h.reportCount} reports • {h.confidence}% conf • {h.source}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>
      </ScrollView>

      {/* Manual Hazard Reporting Modal */}
      <Modal visible={reportModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Report Road Hazard
              </Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Help protect fellow riders by tagging road hazards at your current GPS coordinates.
            </Text>

            <View style={styles.typesGrid}>
              {[
                { type: 'POTHOLE', label: 'Pothole', icon: 'road-variant' },
                { type: 'ROUGH_ROAD', label: 'Rough Road', icon: 'vibrate' },
                { type: 'ACCIDENT', label: 'Accident', icon: 'car-emergency' },
                { type: 'DEBRIS', label: 'Debris / Gravel', icon: 'hazard-lights' },
                { type: 'CONSTRUCTION', label: 'Construction', icon: 'cone' },
                { type: 'FLOODED_ROAD', label: 'Flooded', icon: 'water-alert' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor:
                        selectedReportType === item.type ? theme.primaryLight : theme.surfaceHover,
                      borderColor:
                        selectedReportType === item.type ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedReportType(item.type as RoadHazardType)}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={20}
                    color={selectedReportType === item.type ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      {
                        color:
                          selectedReportType === item.type ? theme.primary : theme.textPrimary,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => setReportModalVisible(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Submit Hazard"
                  variant="primary"
                  icon="check"
                  onPress={handleReportSubmit}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  reportBtnText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  selectedCard: {
    padding: spacing.md,
    borderWidth: 1.5,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  selAddr: {
    fontSize: typography.sizes.xs,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  mLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  mVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  hazardList: {
    marginTop: 4,
  },
  hazardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  hIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hType: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  hSub: {
    fontSize: 10,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  typeBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  typeBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
