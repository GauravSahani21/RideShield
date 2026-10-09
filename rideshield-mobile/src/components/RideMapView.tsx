import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeContext';
import { LocationData, RoadHazard, RouteOption } from '../types';
import { radius, typography, spacing } from '../theme';

interface RideMapViewProps {
  currentLocation: LocationData | null;
  hazards?: RoadHazard[];
  route?: RouteOption | null;
  selectedHazard?: RoadHazard | null;
  onSelectHazard?: (hazard: RoadHazard) => void;
  height?: number;
  interactive?: boolean;
}

export const RideMapView: React.FC<RideMapViewProps> = ({
  currentLocation,
  hazards = [],
  route,
  selectedHazard,
  onSelectHazard,
  height = 240,
  interactive = true,
}) => {
  const { theme, isDark } = useAppTheme();
  const [zoomLevel, setZoomLevel] = useState(15);
  const [mapStyle, setMapStyle] = useState<'STANDARD' | 'SATELLITE'>('STANDARD');

  const lat = currentLocation?.latitude || 12.9716;
  const lng = currentLocation?.longitude || 77.5946;

  const apiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyA8SEFUFFnGQvxUzG8ZY4TlBXo4EVs6m_g';

  // Construct dynamic Google Maps Static Tile URL
  const mapType = mapStyle === 'SATELLITE' ? 'hybrid' : 'roadmap';
  const widthPx = 640;
  const heightPx = Math.round(height * 2);

  // Markers
  let markersQuery = `&markers=color:blue%7Clabel:R%7C${lat},${lng}`;
  if (hazards.length > 0) {
    hazards.slice(0, 5).forEach((h) => {
      const color = h.severity === 'CRITICAL' || h.severity === 'HIGH' ? 'red' : 'orange';
      markersQuery += `&markers=color:${color}%7Csize:small%7C${h.latitude},${h.longitude}`;
    });
  }

  // Polyline path if available
  let pathQuery = '';
  if (route?.polyline && route.polyline.length > 10 && !route.polyline.startsWith('mock_')) {
    pathQuery = `&path=weight:5%7Ccolor:0x0284c7ff%7Cenc:${encodeURIComponent(route.polyline)}`;
  } else if (route?.steps && route.steps.length > 0) {
    const coords = route.steps.map((s) => `${s.startLocation.latitude},${s.startLocation.longitude}`).join('|');
    pathQuery = `&path=weight:5%7Ccolor:0x0284c7ff%7C${coords}`;
  }

  const googleStaticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoomLevel}&size=${widthPx}x${heightPx}&scale=2&maptype=${mapType}${markersQuery}${pathQuery}&key=${apiKey}`;

  // Interactive Web Leaflet / Google Embed HTML for web and mobile webview
  const leafletEmbedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${isDark ? '#0f172a' : '#f8fafc'}; }
          .leaflet-control-attribution { display: none; }
          .hazard-marker {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 0 6px rgba(0,0,0,0.4);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${zoomLevel});
          
          ${
            mapStyle === 'SATELLITE'
              ? `L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }).addTo(map);`
              : isDark
              ? `L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);`
              : `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);`
          }

          // Rider Beacon Marker
          const riderIcon = L.divIcon({
            className: 'rider-pin',
            html: '<div style="width:18px;height:18px;background:#0284c7;border:3px solid #ffffff;border-radius:50%;box-shadow:0 0 10px #0284c7;"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });
          L.marker([${lat}, ${lng}], { icon: riderIcon }).addTo(map).bindPopup('Rider Position');

          // Hazard Pins
          ${hazards
            .slice(0, 10)
            .map(
              (h) => `
            L.circleMarker([${h.latitude}, ${h.longitude}], {
              radius: 7,
              fillColor: '${h.severity === 'CRITICAL' || h.severity === 'HIGH' ? '#ef4444' : '#f59e0b'}',
              color: '#ffffff',
              weight: 2,
              fillOpacity: 0.9
            }).addTo(map).bindPopup('<b>${h.type}</b><br/>Severity: ${h.severity}');
          `
            )
            .join('\n')}

          // Route Polyline
          ${
            route?.steps && route.steps.length > 0
              ? `
            const points = [
              [${lat}, ${lng}],
              ${route.steps.map((s) => `[${s.startLocation.latitude}, ${s.startLocation.longitude}], [${s.endLocation.latitude}, ${s.endLocation.longitude}]`).join(',')}
            ];
            L.polyline(points, { color: '${route.isSafer ? '#10b981' : '#0284c7'}', weight: 5, opacity: 0.85 }).addTo(map);
          `
              : ''
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height, borderColor: theme.border }]}>
      {/* 1. Web Platform (Browser) -> Live Interactive OpenStreetMap / Google Tiles */}
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={leafletEmbedHtml}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: radius.md,
          }}
          title="Live Map"
        />
      ) : (
        /* 2. Mobile Platform (Android/iOS) -> Interactive WebView or Static Map fallback */
        <View style={styles.mobileMapWrap}>
          {WebView ? (
            <WebView
              originWhitelist={['*']}
              source={{ html: leafletEmbedHtml }}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
              }}
              scrollEnabled={interactive}
              domStorageEnabled={true}
              javaScriptEnabled={true}
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              )}
            />
          ) : (
            <Image
              source={{ uri: googleStaticMapUrl }}
              style={styles.mobileImageMap}
              resizeMode="cover"
            />
          )}
        </View>
      )}

      {/* Top Map HUD: Live GPS Telemetry */}
      <View style={styles.topHud}>
        <View style={[styles.hudPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View
            style={[
              styles.signalDot,
              {
                backgroundColor:
                  currentLocation?.signalState === 'CONNECTED'
                    ? theme.success
                    : currentLocation?.signalState === 'WEAK_SIGNAL'
                    ? theme.warning
                    : theme.danger,
              },
            ]}
          />
          <Text style={[styles.hudText, { color: theme.textPrimary }]}>
            {currentLocation?.signalState || 'GPS FIXED'}
          </Text>
          <Text style={[styles.coordsText, { color: theme.textMuted }]}>
            {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.sdkTag, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setMapStyle(mapStyle === 'STANDARD' ? 'SATELLITE' : 'STANDARD')}
        >
          <MaterialCommunityIcons
            name={mapStyle === 'SATELLITE' ? 'earth' : 'layers-outline'}
            size={14}
            color={theme.primary}
          />
          <Text style={[styles.sdkText, { color: theme.textPrimary }]}>
            {mapStyle === 'SATELLITE' ? 'Satellite' : 'Vector Map'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Map Controls Overlay */}
      {interactive && (
        <View style={styles.bottomControls}>
          <View style={[styles.zoomCluster, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => setZoomLevel(Math.min(18, zoomLevel + 1))}
            >
              <MaterialCommunityIcons name="plus" size={16} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={[styles.zoomDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => setZoomLevel(Math.max(10, zoomLevel - 1))}
            >
              <MaterialCommunityIcons name="minus" size={16} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mobileMapWrap: {
    width: '100%',
    height: '100%',
  },
  mobileImageMap: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHud: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hudText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  coordsText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sdkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  sdkText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  bottomControls: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'column',
    gap: spacing.xs,
    zIndex: 10,
  },
  zoomCluster: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  zoomBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
  },
});
