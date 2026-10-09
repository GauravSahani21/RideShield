import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius, typography } from '../theme';

interface RideShieldLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export const RideShieldLogo: React.FC<RideShieldLogoProps> = ({
  size = 40,
  showText = true,
  textColor,
}) => {
  return (
    <View style={styles.container}>
      {/* Brand Mark Emblem: Hexagonal Shield + Tech Pulse + Motorcycle Cross */}
      <View
        style={[
          styles.emblemWrap,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.3),
          },
        ]}
      >
        <MaterialCommunityIcons
          name="shield-car"
          size={Math.round(size * 0.58)}
          color="#38bdf8"
        />
        <View style={styles.radarRing} />
      </View>

      {showText && (
        <View style={styles.textWrap}>
          <Text style={[styles.brandTitle, textColor ? { color: textColor } : {}]}>
            Ride<Text style={styles.brandAccent}>Shield</Text>
          </Text>
          <Text style={styles.brandSubtitle}>SAFETY & NAVIGATION</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblemWrap: {
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  radarRing: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  textWrap: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.3,
  },
  brandAccent: {
    color: '#0284c7',
  },
  brandSubtitle: {
    fontSize: 8,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    color: '#64748b',
    marginTop: 1,
  },
});
