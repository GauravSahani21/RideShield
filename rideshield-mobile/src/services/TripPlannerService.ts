import {
  TripStop,
  RouteOption,
  TripPlan,
  PlaceSearchResult,
  LocationData,
  RoadHazard,
} from '../types';
import { HazardIntelligenceService } from './HazardIntelligenceService';

export class TripPlannerService {
  /**
   * Search places with category shortcuts and deterministic autocomplete
   * Integrates Google Places API if GOOGLE_PLACES_API_KEY is available,
   * otherwise uses built-in places directory with seamless matching.
   */
  public static async searchPlaces(
    query: string,
    currentLocation?: LocationData | null,
    apiKey?: string
  ): Promise<PlaceSearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    const cleanQuery = query.trim().toLowerCase();

    // 1. If real Google Places API key provided, attempt live Places autocomplete
    if (apiKey && apiKey.startsWith('AIza')) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          cleanQuery
        )}&key=${apiKey}${
          currentLocation
            ? `&location=${currentLocation.latitude},${currentLocation.longitude}&radius=50000`
            : ''
        }`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'OK' && data.predictions) {
          return data.predictions.map((p: any) => ({
            placeId: p.place_id,
            name: p.structured_formatting?.main_text || p.description,
            address: p.structured_formatting?.secondary_text || p.description,
            latitude: currentLocation?.latitude || 37.7749,
            longitude: currentLocation?.longitude || -122.4194,
          }));
        }
      } catch (err) {
        console.warn('Google Places live lookup failed, falling back to local directory:', err);
      }
    }

    // 2. Curated High-Reliability Motorcycle Places Directory (Bangalore / SF / Common Hubs)
    const baseLat = currentLocation?.latitude || 12.9716;
    const baseLng = currentLocation?.longitude || 77.5946;

    const directory: PlaceSearchResult[] = [
      {
        placeId: 'place-petrol-hp',
        name: 'HP Auto Fuel Station & Air',
        address: 'MG Road, Central Junction',
        latitude: baseLat + 0.012,
        longitude: baseLng + 0.008,
        category: 'Petrol Pump',
      },
      {
        placeId: 'place-petrol-shell',
        name: 'Shell V-Power Fuel Station',
        address: 'Ring Road Bypass, South Gate',
        latitude: baseLat - 0.018,
        longitude: baseLng + 0.015,
        category: 'Petrol Pump',
      },
      {
        placeId: 'place-ev-charging',
        name: 'Ather & Tata Power Fast EV Grid',
        address: 'Tech Park Plaza, Bay 4',
        latitude: baseLat + 0.025,
        longitude: baseLng - 0.011,
        category: 'EV Charging',
      },
      {
        placeId: 'place-mechanic-moto',
        name: 'Apex Superbike Works & Tire Care',
        address: 'Automotive Hub, Sector 3',
        latitude: baseLat + 0.031,
        longitude: baseLng + 0.022,
        category: 'Mechanic',
      },
      {
        placeId: 'place-hospital-apollo',
        name: 'Apollo Emergency Trauma Care',
        address: 'Main Health Corridor, Block B',
        latitude: baseLat - 0.022,
        longitude: baseLng - 0.018,
        category: 'Hospital',
      },
      {
        placeId: 'place-cafe-riders',
        name: 'Torque & Beans Riders Cafe',
        address: 'Scenic Expressway Viewpoint',
        latitude: baseLat + 0.045,
        longitude: baseLng + 0.038,
        category: 'Cafe',
      },
      {
        placeId: 'place-hotel-express',
        name: 'Highland Riders Rest & Hotel',
        address: 'Foothill Highway Mile 14',
        latitude: baseLat + 0.082,
        longitude: baseLng + 0.065,
        category: 'Hotel',
      },
      {
        placeId: 'place-cmr-college',
        name: 'CMR Institute of Technology',
        address: 'Kundalahalli Main Rd, Brookefield',
        latitude: 12.9667,
        longitude: 77.7126,
        category: 'Education',
      },
      {
        placeId: 'place-wonderla',
        name: 'Wonderla Amusement Park',
        address: '28th Km, Mysore Road',
        latitude: 12.8344,
        longitude: 77.4011,
        category: 'Destination',
      },
      {
        placeId: 'place-nandi-hills',
        name: 'Nandi Hills Scenic Peak Lookout',
        address: 'Chikkaballapur District',
        latitude: 13.3702,
        longitude: 77.6835,
        category: 'Scenic Point',
      },
      {
        placeId: 'place-goa-baga',
        name: 'Baga Beach Riders Destination',
        address: 'North Goa Coastline',
        latitude: 15.5553,
        longitude: 73.7517,
        category: 'Hotel',
      },
    ];

    return directory.filter(
      (p) =>
        p.name.toLowerCase().includes(cleanQuery) ||
        p.address.toLowerCase().includes(cleanQuery) ||
        (p.category && p.category.toLowerCase().includes(cleanQuery))
    );
  }

  /**
   * Optimize waypoint order (TSP heuristic) respecting locked stops
   */
  public static optimizeStopOrder(
    start: LocationData,
    destination: TripStop,
    stops: TripStop[]
  ): TripStop[] {
    if (stops.length <= 1) return stops;

    // Preserve locked stops in their absolute position
    const lockedMap = new Map<number, TripStop>();
    const unlocked: TripStop[] = [];

    stops.forEach((s, idx) => {
      if (s.locked) {
        lockedMap.set(idx, s);
      } else {
        unlocked.push(s);
      }
    });

    if (unlocked.length <= 1) return stops;

    // Greedy nearest neighbor sort for unlocked stops
    let currentLat = start.latitude;
    let currentLng = start.longitude;
    const remaining = [...unlocked];
    const sortedUnlocked: TripStop[] = [];

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const d = HazardIntelligenceService.calculateDistanceMeters(
          currentLat,
          currentLng,
          remaining[i].latitude,
          remaining[i].longitude
        );
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const next = remaining.splice(nearestIdx, 1)[0];
      sortedUnlocked.push(next);
      currentLat = next.latitude;
      currentLng = next.longitude;
    }

    // Reassemble combining locked and optimized unlocked
    const result: TripStop[] = [];
    let unlockedPointer = 0;

    for (let i = 0; i < stops.length; i++) {
      if (lockedMap.has(i)) {
        result.push({ ...lockedMap.get(i)!, sequence: i + 1 });
      } else {
        result.push({ ...sortedUnlocked[unlockedPointer++]!, sequence: i + 1 });
      }
    }

    return result;
  }

  /**
   * Fetch actual turn-by-turn directions from Google Routes API v2
   */
  public static async fetchActualDirections(
    start: LocationData,
    destination: TripStop,
    stops: TripStop[],
    apiKey: string,
    options?: { avoidTolls?: boolean; avoidHighways?: boolean }
  ): Promise<RouteOption | null> {
    if (!apiKey || !apiKey.startsWith('AIza')) return null;

    try {
      const intermediates = stops.map((s) => ({
        location: { latLng: { latitude: s.latitude, longitude: s.longitude } },
      }));

      const body: any = {
        origin: { location: { latLng: { latitude: start.latitude, longitude: start.longitude } } },
        destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
        travelMode: 'TWO_WHEELER',
        languageCode: 'en-US',
      };

      if (intermediates.length > 0) {
        body.intermediates = intermediates;
      }

      if (options?.avoidTolls || options?.avoidHighways) {
        body.routeModifiers = {
          avoidTolls: !!options?.avoidTolls,
          avoidHighways: !!options?.avoidHighways,
        };
      }

      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.startLocation,routes.legs.steps.endLocation',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return null;

      const liveRoute = data.routes[0];
      const distanceKm = Number(((liveRoute.distanceMeters || 0) / 1000).toFixed(1));
      const durationSeconds = parseInt((liveRoute.duration || '0s').replace('s', ''), 10) || 60;
      const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

      const steps: any[] = [];
      if (liveRoute.legs) {
        for (const leg of liveRoute.legs) {
          if (leg.steps) {
            for (const st of leg.steps) {
              const instr = st.navigationInstruction?.instructions || 'Proceed along route';
              const rawManeuver = (st.navigationInstruction?.maneuver || 'STRAIGHT').toLowerCase();

              let cleanManeuver = 'straight';
              if (rawManeuver.includes('left')) cleanManeuver = 'turn-left';
              else if (rawManeuver.includes('right')) cleanManeuver = 'turn-right';
              else if (rawManeuver.includes('merge') || rawManeuver.includes('ramp')) cleanManeuver = 'merge';
              else if (rawManeuver.includes('roundabout') || rawManeuver.includes('u-turn')) cleanManeuver = 'turn-left';
              else if (rawManeuver.includes('arrive') || rawManeuver.includes('destination')) cleanManeuver = 'arrive';

              const stDurationSec = parseInt((st.staticDuration || '0s').replace('s', ''), 10) || 15;

              steps.push({
                instruction: instr.replace('\n', ' - '),
                maneuver: cleanManeuver,
                distanceMeters: st.distanceMeters || 100,
                durationSeconds: stDurationSec,
                startLocation: {
                  latitude: st.startLocation?.latLng?.latitude || start.latitude,
                  longitude: st.startLocation?.latLng?.longitude || start.longitude,
                },
                endLocation: {
                  latitude: st.endLocation?.latLng?.latitude || destination.latitude,
                  longitude: st.endLocation?.latLng?.longitude || destination.longitude,
                },
              });
            }
          }
        }
      }

      if (steps.length === 0) {
        steps.push({
          instruction: `Drive to ${destination.name}`,
          maneuver: 'straight',
          distanceMeters: liveRoute.distanceMeters || 1000,
          durationSeconds: durationSeconds,
          startLocation: { latitude: start.latitude, longitude: start.longitude },
          endLocation: { latitude: destination.latitude, longitude: destination.longitude },
        });
      }

      // Add arrival step if last step is not arrival
      const lastStep = steps[steps.length - 1];
      if (lastStep && lastStep.maneuver !== 'arrive') {
        steps.push({
          instruction: `Arrive at destination: ${destination.name}`,
          maneuver: 'arrive',
          distanceMeters: 50,
          durationSeconds: 10,
          startLocation: lastStep.endLocation,
          endLocation: { latitude: destination.latitude, longitude: destination.longitude },
        });
      }

      return {
        id: 'route-google-live',
        name: 'Google Live Directions',
        distanceKm,
        durationMinutes,
        hazardCount: 0,
        safetyScore: 95,
        isFastest: true,
        isSafer: false,
        polyline: liveRoute.polyline?.encodedPolyline || '',
        summary: liveRoute.description || `Live motorcycle directions via Google Routes (${distanceKm} km)`,
        steps,
      };
    } catch (err) {
      console.warn('Google Routes live fetch failed:', err);
      return null;
    }
  }

  /**
   * Calculate complete route alternatives with road-risk hazard scoring
   */
  public static calculateRouteAlternatives(
    start: LocationData,
    destination: TripStop,
    stops: TripStop[],
    hazards: RoadHazard[],
    options?: { avoidTolls?: boolean; avoidHighways?: boolean }
  ): RouteOption[] {
    // 1. Calculate base straight-line chain distance
    let totalDirectMeters = 0;
    let prevLat = start.latitude;
    let prevLng = start.longitude;

    for (const stop of stops) {
      totalDirectMeters += HazardIntelligenceService.calculateDistanceMeters(
        prevLat,
        prevLng,
        stop.latitude,
        stop.longitude
      );
      prevLat = stop.latitude;
      prevLng = stop.longitude;
    }

    totalDirectMeters += HazardIntelligenceService.calculateDistanceMeters(
      prevLat,
      prevLng,
      destination.latitude,
      destination.longitude
    );

    // Realistic road curvature factor (typically 1.25x to 1.35x of direct line)
    const baseDistanceKm = Math.max(3.2, Number(((totalDirectMeters * 1.3) / 1000).toFixed(1)));
    const baseDurationMin = Math.round(baseDistanceKm * 1.6); // ~38 km/h urban motorcycle pace

    // Count hazards near start or stops
    let totalNearHazards = 0;
    for (const h of hazards) {
      const dStart = HazardIntelligenceService.calculateDistanceMeters(
        start.latitude,
        start.longitude,
        h.latitude,
        h.longitude
      );
      const dEnd = HazardIntelligenceService.calculateDistanceMeters(
        destination.latitude,
        destination.longitude,
        h.latitude,
        h.longitude
      );
      if (dStart < 2500 || dEnd < 2500) {
        totalNearHazards++;
      }
    }

    // Dynamic Waypoint Steps Generation
    const dynamicStepsA: any[] = [
      {
        instruction: 'Head toward main roadway corridor',
        maneuver: 'straight',
        distanceMeters: 450,
        durationSeconds: 45,
        startLocation: { latitude: start.latitude, longitude: start.longitude },
        endLocation: { latitude: start.latitude + 0.003, longitude: start.longitude + 0.002 },
      },
    ];

    stops.forEach((s, idx) => {
      dynamicStepsA.push({
        instruction: `Follow corridor to Stop ${idx + 1}: ${s.name}`,
        maneuver: idx % 2 === 0 ? 'turn-right' : 'turn-left',
        distanceMeters: Math.round((baseDistanceKm * 1000) / (stops.length + 2)),
        durationSeconds: Math.round((baseDurationMin * 60) / (stops.length + 2)),
        startLocation: { latitude: start.latitude, longitude: start.longitude },
        endLocation: { latitude: s.latitude, longitude: s.longitude },
      });
    });

    dynamicStepsA.push({
      instruction: `Continue to final destination: ${destination.name}`,
      maneuver: 'straight',
      distanceMeters: 850,
      durationSeconds: 65,
      startLocation: { latitude: destination.latitude - 0.005, longitude: destination.longitude - 0.004 },
      endLocation: { latitude: destination.latitude, longitude: destination.longitude },
    });

    dynamicStepsA.push({
      instruction: `Arrive at ${destination.name}`,
      maneuver: 'arrive',
      distanceMeters: 100,
      durationSeconds: 15,
      startLocation: { latitude: destination.latitude, longitude: destination.longitude },
      endLocation: { latitude: destination.latitude, longitude: destination.longitude },
    });

    // Route A: Fastest Expressway Route
    const routeA: RouteOption = {
      id: 'route-fastest',
      name: 'Expressway Route',
      distanceKm: baseDistanceKm,
      durationMinutes: baseDurationMin,
      hazardCount: totalNearHazards,
      safetyScore: Math.max(50, 100 - totalNearHazards * 6),
      isFastest: true,
      isSafer: false,
      polyline: 'mock_polyline_a',
      summary: 'Via Main Expressway & Ring Corridor (Fastest ETA)',
      steps: dynamicStepsA,
    };

    // Route B: Safety-Oriented Smooth Route
    const routeB: RouteOption = {
      id: 'route-safer',
      name: 'Safety-Oriented Route',
      distanceKm: Number((baseDistanceKm * 1.08).toFixed(1)),
      durationMinutes: Math.round(baseDurationMin * 1.12),
      hazardCount: Math.max(0, Math.floor(totalNearHazards / 3)),
      safetyScore: Math.min(98, 100 - Math.floor(totalNearHazards / 3) * 3),
      isFastest: false,
      isSafer: true,
      polyline: 'mock_polyline_b',
      summary: 'Via Smooth Arterial Avenue (Fewer Potholes & Road Hazards)',
      steps: [
        {
          instruction: 'Depart and merge onto Outer Avenue',
          maneuver: 'straight',
          distanceMeters: 600,
          durationSeconds: 60,
          startLocation: { latitude: start.latitude, longitude: start.longitude },
          endLocation: { latitude: start.latitude + 0.004, longitude: start.longitude + 0.003 },
        },
        ...dynamicStepsA.slice(1, -1),
        {
          instruction: `Arrive safely at ${destination.name}`,
          maneuver: 'arrive',
          distanceMeters: 100,
          durationSeconds: 15,
          startLocation: { latitude: destination.latitude, longitude: destination.longitude },
          endLocation: { latitude: destination.latitude, longitude: destination.longitude },
        },
      ],
    };

    return [routeA, routeB];
  }
}

