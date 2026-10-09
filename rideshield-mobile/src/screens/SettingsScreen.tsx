import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRide } from '../context/RideContext';
import { useAppTheme } from '../theme/ThemeContext';
import { AppPageHeader, AppCard } from '../components/UIComponents';
import { spacing, radius, typography } from '../theme';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { settings, updateSettings } = useRide();
  const { theme, isDark, toggleTheme } = useAppTheme();

  const handleSensitivityChange = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    updateSettings({ ...settings, sensitivity: level });
  };

  const handleDurationChange = (seconds: number) => {
    updateSettings({ ...settings, countdownDurationSeconds: seconds });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppPageHeader
        title="Settings & Calibration"
        subtitle="Detection thresholds, countdown window, siren & display preferences"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance Mode */}
        <AppCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>DISPLAY THEME</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelCol}>
              <Text style={[styles.switchTitle, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.switchDesc, { color: theme.textMuted }]}>
                {isDark ? 'Deep navy charcoal theme active' : 'Clean white and light blue theme active'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={Platform.OS === 'android' ? (isDark ? '#ffffff' : '#f4f3f4') : undefined}
            />
          </View>
        </AppCard>

        {/* Crash Detection Sensitivity */}
        <AppCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>CRASH SENSITIVITY CALIBRATION</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Adjust how aggressively the multi-sensor fusion engine triggers crash confirmation.
          </Text>

          <View style={styles.optionsRow}>
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => {
              const isSelected = settings.sensitivity === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelOption,
                    {
                      backgroundColor: isSelected ? theme.primaryLight : theme.surfaceHover,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => handleSensitivityChange(level)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.levelOptionText,
                      {
                        color: isSelected ? theme.primary : theme.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {level}
                  </Text>
                  <Text style={[styles.levelDesc, { color: theme.textMuted }]}>
                    {level === 'LOW'
                      ? '4.5G spike'
                      : level === 'MEDIUM'
                      ? '3.5G spike'
                      : '2.8G spike'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>

        {/* Countdown Window Duration */}
        <AppCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            CANCELLATION COUNTDOWN BUFFER
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Buffer time allowed for rider to tap "I'M SAFE" before automatic SOS transmission.
          </Text>

          <View style={styles.optionsRow}>
            {[15, 25, 35].map((sec) => {
              const isSelected = settings.countdownDurationSeconds === sec;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[
                    styles.levelOption,
                    {
                      backgroundColor: isSelected ? theme.primaryLight : theme.surfaceHover,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => handleDurationChange(sec)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.levelOptionText,
                      {
                        color: isSelected ? theme.primary : theme.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {sec}s
                  </Text>
                  <Text style={[styles.levelDesc, { color: theme.textMuted }]}>
                    {sec === 15 ? 'Aggressive' : sec === 25 ? 'Recommended' : 'Extended'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>

        {/* Audio & Haptic Switches */}
        <AppCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ALERT OUTPUTS</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelCol}>
              <Text style={[styles.switchTitle, { color: theme.text }]}>High-Priority Siren Alarm</Text>
              <Text style={[styles.switchDesc, { color: theme.textMuted }]}>
                Loud audio alert override during countdown
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(val) =>
                updateSettings({ ...settings, soundEnabled: val })
              }
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>

          <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, marginTop: 12 }]}>
            <View style={styles.switchLabelCol}>
              <Text style={[styles.switchTitle, { color: theme.text }]}>Haptic Vibration Pulses</Text>
              <Text style={[styles.switchDesc, { color: theme.textMuted }]}>
                Continuous haptic pulses for pocket / jacket awareness
              </Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(val) =>
                updateSettings({ ...settings, vibrationEnabled: val })
              }
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
        </AppCard>

        {/* System Information */}
        <AppCard style={styles.aboutCard}>
          <View style={styles.aboutHeaderRow}>
            <MaterialCommunityIcons name="information-outline" size={20} color={theme.primary} />
            <Text style={[styles.aboutTitle, { color: theme.text }]}>
              RideShield v1.0.0 Production Core
            </Text>
          </View>
          <Text style={[styles.aboutLegal, { color: theme.textMuted }]}>
            Engineered with decoupled sensor architecture, mathematical Butterworth filtering, peak prominence detection, and automatic GPS failover. Always wear certified protective gear and ride responsibly.
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
  sectionCard: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelOption: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  levelOptionText: {
    fontSize: typography.sizes.sm,
    marginBottom: 2,
  },
  levelDesc: {
    fontSize: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabelCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  switchTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  switchDesc: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  aboutCard: {
    padding: spacing.md,
  },
  aboutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  aboutTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  aboutLegal: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
});
