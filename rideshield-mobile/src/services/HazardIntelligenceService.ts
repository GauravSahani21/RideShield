import {
  RoadHazard,
  RoadHazardType,
  RoadHazardSeverity,
  RoadHazardStatus,
  HazardWarningAlert,
  LocationData,
  NormalizedSensorRecord,
} from '../types';

export class HazardIntelligenceService {
  // Distance radius for spatial clustering (approx 35 meters)
  private static readonly CLUSTER_DISTANCE_METERS = 35;

  // Aging window: after 7 days without reports, hazard status degrades
  private static readonly AGING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

  /**
   * Calculate distance between two geographic coordinates using Haversine formula (meters)
   */
  public static calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Determine if an autodetected pothole should cluster with an existing hazard or create a new one
   */
  public static clusterOrAddHazard(
    existingHazards: RoadHazard[],
    detected: {
      type: RoadHazardType;
      latitude: number;
      longitude: number;
      severity: RoadHazardSeverity;
      confidence: number;
      source?: 'SENSOR_AUTODETECT' | 'USER_REPORT';
    }
  ): { updatedList: RoadHazard[]; affectedHazard: RoadHazard } {
    let matchedIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < existingHazards.length; i++) {
      const h = existingHazards[i];
      const dist = this.calculateDistanceMeters(
        h.latitude,
        h.longitude,
        detected.latitude,
        detected.longitude
      );
      if (dist <= this.CLUSTER_DISTANCE_METERS && dist < minDistance) {
        minDistance = dist;
        matchedIndex = i;
      }
    }

    const now = Date.now();

    if (matchedIndex >= 0) {
      // Cluster with existing hazard
      const existing = existingHazards[matchedIndex];
      const newReportCount = existing.reportCount + 1;

      // Weighted location convergence
      const updatedLat =
        (existing.latitude * existing.reportCount + detected.latitude) / newReportCount;
      const updatedLng =
        (existing.longitude * existing.reportCount + detected.longitude) / newReportCount;

      // Confidence climbs with multiple rider detections
      const updatedConfidence = Math.min(99, Math.round(existing.confidence * 0.7 + detected.confidence * 0.3 + 5));

      const updatedHazard: RoadHazard = {
        ...existing,
        latitude: updatedLat,
        longitude: updatedLng,
        reportCount: newReportCount,
        lastDetected: now,
        confidence: updatedConfidence,
        status: newReportCount >= 3 ? 'CONFIRMED' : 'TENTATIVE',
        severity:
          detected.severity === 'CRITICAL' || existing.severity === 'CRITICAL'
            ? 'CRITICAL'
            : detected.severity === 'HIGH' || existing.severity === 'HIGH'
            ? 'HIGH'
            : existing.severity,
      };

      const copy = [...existingHazards];
      copy[matchedIndex] = updatedHazard;
      return { updatedList: copy, affectedHazard: updatedHazard };
    } else {
      // Create new tentative hazard
      const newHazard: RoadHazard = {
        id: `hazard-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: detected.type,
        latitude: detected.latitude,
        longitude: detected.longitude,
        severity: detected.severity,
        confidence: detected.confidence,
        reportCount: 1,
        firstDetected: now,
        lastDetected: now,
        status: 'TENTATIVE',
        source: detected.source || 'SENSOR_AUTODETECT',
        recommendedSpeedKmh: detected.severity === 'CRITICAL' ? 25 : detected.severity === 'HIGH' ? 35 : 45,
      };

      return {
        updatedList: [newHazard, ...existingHazards],
        affectedHazard: newHazard,
      };
    }
  }

  /**
   * Check for hazards within warning distance of current rider location
   */
  public static checkProximityWarnings(
    currentLocation: LocationData,
    hazards: RoadHazard[],
    warningRadiusMeters = 200
  ): HazardWarningAlert[] {
    const alerts: HazardWarningAlert[] = [];

    for (const h of hazards) {
      if (h.status === 'RESOLVED') continue;

      const dist = this.calculateDistanceMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        h.latitude,
        h.longitude
      );

      if (dist <= warningRadiusMeters) {
        let action = 'Maintain steady grip and proceed with caution.';
        if (h.recommendedSpeedKmh) {
          action = `Suggested speed reduction to ~${h.recommendedSpeedKmh} km/h.`;
        } else if (h.severity === 'HIGH' || h.severity === 'CRITICAL') {
          action = 'Reduce speed immediately and watch road surface ahead.';
        }

        alerts.push({
          hazard: h,
          distanceMeters: Math.round(dist),
          recommendedAction: action,
          severity: h.severity,
        });
      }
    }

    return alerts.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * Apply aging model to road hazards to downgrade stale pothole entries
   */
  public static ageHazards(hazards: RoadHazard[]): RoadHazard[] {
    const now = Date.now();
    return hazards.map((h) => {
      const elapsed = now - h.lastDetected;
      if (elapsed > this.AGING_WINDOW_MS * 2) {
        return { ...h, status: 'RESOLVED', confidence: Math.max(10, h.confidence - 40) };
      } else if (elapsed > this.AGING_WINDOW_MS) {
        return { ...h, status: 'AGED', confidence: Math.max(30, h.confidence - 20) };
      }
      return h;
    });
  }
}
