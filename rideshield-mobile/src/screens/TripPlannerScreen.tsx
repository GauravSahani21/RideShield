import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRide } from '../context/RideContext';
import { useAppTheme } from '../theme/ThemeContext';
import { TripStop, RouteOption, PlaceSearchResult, TripPlan, LocationData } from '../types';
import { TripPlannerService } from '../services/TripPlannerService';
import { StorageService } from '../services/StorageService';
import { AppPageHeader, AppCard, AppButton, AppBadge } from '../components/UIComponents';
import { RideMapView } from '../components/RideMapView';
import { spacing, radius, typography } from '../theme';

interface TripPlannerScreenProps {
  onBack: () => void;
  onStartTrip: (route: RouteOption) => void;
  initialPlan?: TripPlan | null;
}

export const TripPlannerScreen: React.FC<TripPlannerScreenProps> = ({
  onBack,
  onStartTrip,
  initialPlan,
}) => {
  const { currentLocation, hazards, saveTripPlan, startRideFromPlan } = useRide();
  const { theme } = useAppTheme();

  // Start Location state
  const defaultOrigin: LocationData = currentLocation || {
    latitude: 12.9716,
    longitude: 77.5946,
    timestamp: Date.now(),
  };

  const [startLocation, setStartLocation] = useState<LocationData>(
    initialPlan?.startLocation || defaultOrigin
  );
  const [startLocationName, setStartLocationName] = useState<string>(
    initialPlan ? 'Custom Origin Point' : 'Current Location (GPS)'
  );
  const [selectingStartLocation, setSelectingStartLocation] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<PlaceSearchResult[]>([]);
  const [showSavedPlacesModal, setShowSavedPlacesModal] = useState(false);

  // Destination & Waypoints state
  const [destination, setDestination] = useState<TripStop>(
    initialPlan?.destination || {
      id: 'dest-cmr',
      sequence: 2,
      name: 'CMR Institute of Technology',
      address: 'Kundalahalli Main Rd, Brookefield',
      latitude: 12.9667,
      longitude: 77.7126,
      locked: true,
    }
  );

  const [stops, setStops] = useState<TripStop[]>(
    initialPlan?.stops || [
      {
        id: 'stop-1',
        sequence: 1,
        name: 'HP Auto Fuel Station & Air',
        address: 'MG Road, Central Junction',
        latitude: 12.975,
        longitude: 77.605,
        locked: false,
      },
    ]
  );

  // Optimization comparison state
  const [originalStops, setOriginalStops] = useState<TripStop[] | null>(null);
  const [isOptimized, setIsOptimized] = useState(false);

  // Routing preferences
  const [avoidTolls, setAvoidTolls] = useState(initialPlan?.avoidTolls || false);
  const [avoidHighways, setAvoidHighways] = useState(initialPlan?.avoidHighways || false);
  const [preferSaferRoutes, setPreferSaferRoutes] = useState(initialPlan?.preferSaferRoutes ?? true);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Save Trip modal
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [tripPlanName, setTripPlanName] = useState(initialPlan?.name || 'My Motorcycle Trip');

  // Load saved places on mount
  React.useEffect(() => {
    StorageService.getSavedPlaces().then(setSavedPlaces);
  }, []);

  const googleMapsKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyA8SEFUFFnGQvxUzG8ZY4TlBXo4EVs6m_g';

  const [liveGoogleRoute, setLiveGoogleRoute] = useState<RouteOption | null>(null);

  // Compute offline baseline alternative routes
  const baselineRoutes = TripPlannerService.calculateRouteAlternatives(
    startLocation,
    destination,
    stops,
    hazards,
    { avoidTolls, avoidHighways }
  );

  // Query live Google Routes API v2 whenever origin, destination, or stops change
  React.useEffect(() => {
    let cancelled = false;
    TripPlannerService.fetchActualDirections(
      startLocation,
      destination,
      stops,
      googleMapsKey,
      { avoidTolls, avoidHighways }
    ).then((live) => {
      if (!cancelled && live) {
        setLiveGoogleRoute(live);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [startLocation.latitude, startLocation.longitude, destination.latitude, destination.longitude, stops.length, avoidTolls, avoidHighways]);

  const calculatedRoutes = liveGoogleRoute ? [liveGoogleRoute, ...baselineRoutes] : baselineRoutes;
  const activeRoute = calculatedRoutes[selectedRouteIndex] || calculatedRoutes[0];

  // Calculate stats comparison for optimization
  const currentTotalDistance = activeRoute.distanceKm;
  const currentDurationMinutes = activeRoute.durationMinutes;

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length > 1) {
      const res = await TripPlannerService.searchPlaces(text, startLocation, googleMapsKey);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  };


  const handleSelectPlace = (place: PlaceSearchResult) => {
    if (selectingStartLocation) {
      setStartLocation({
        latitude: place.latitude,
        longitude: place.longitude,
        timestamp: Date.now(),
      });
      setStartLocationName(place.name);
      setSelectingStartLocation(false);
    } else {
      const newStop: TripStop = {
        id: `stop-${Date.now()}`,
        sequence: stops.length + 1,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId,
        locked: false,
      };
      setStops([...stops, newStop]);
      setIsOptimized(false);
      setOriginalStops(null);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSetDestination = (place: PlaceSearchResult) => {
    setDestination({
      id: `dest-${Date.now()}`,
      sequence: stops.length + 2,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      placeId: place.placeId,
      locked: true,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveStop = (id: string) => {
    setStops(stops.filter((s) => s.id !== id));
    setIsOptimized(false);
    setOriginalStops(null);
  };

  const handleToggleLockStop = (id: string) => {
    setStops(
      stops.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s))
    );
  };

  const handleMoveStop = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stops.length) return;
    const newStops = [...stops];
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;
    // update sequence numbers
    const updated = newStops.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setStops(updated);
    setIsOptimized(false);
    setOriginalStops(null);
  };

  // Optimize stop order (TSP heuristic) preserving locked positions
  const handleOptimizeStops = () => {
    setOriginalStops([...stops]);
    const optimized = TripPlannerService.optimizeStopOrder(startLocation, destination, stops);
    setStops(optimized);
    setIsOptimized(true);
    Alert.alert(
      'Route Optimized',
      'Stops have been reordered for the shortest and fastest motorcycle path while preserving your locked stops.'
    );
  };

  const handleKeepOriginalOrder = () => {
    if (originalStops) {
      setStops(originalStops);
      setOriginalStops(null);
      setIsOptimized(false);
    }
  };

  const handleResetToGpsOrigin = () => {
    if (currentLocation) {
      setStartLocation(currentLocation);
      setStartLocationName('Current Location (GPS)');
    }
  };

  const handleCategorySelect = async (cat: string) => {
    setSearchQuery(cat);
    const res = await TripPlannerService.searchPlaces(cat, startLocation, googleMapsKey);
    setSearchResults(res);
  };

  // Build TripPlan object
  const buildCurrentTripPlan = (): TripPlan => {
    return {
      id: initialPlan?.id || `trip-plan-${Date.now()}`,
      name: tripPlanName.trim() || 'My Motorcycle Trip',
      startLocation,
      destination,
      stops,
      selectedRoute: activeRoute,
      availableRoutes: calculatedRoutes,
      avoidTolls,
      avoidHighways,
      preferSaferRoutes,
      createdAt: Date.now(),
    };
  };

  const handleSaveTrip = async () => {
    const plan = buildCurrentTripPlan();
    await saveTripPlan(plan);
    setSaveModalVisible(false);
    Alert.alert('Trip Saved', `"${plan.name}" has been stored to your Planned Rides.`);
  };

  const handleStartRideDirectly = async () => {
    const plan = buildCurrentTripPlan();
    await saveTripPlan(plan);
    await startRideFromPlan(plan, activeRoute);
    onStartTrip(activeRoute);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AppPageHeader
        title="Trip & Route Planner"
        subtitle="Multi-stop route planning, places search, and road hazard intelligence"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1. Start Location & Origin Selector */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.cardHeader, { color: theme.textMuted }]}>
              START LOCATION (ORIGIN)
            </Text>
            {startLocationName !== 'Current Location (GPS)' && (
              <TouchableOpacity onPress={handleResetToGpsOrigin} style={styles.resetGpsBtn}>
                <MaterialCommunityIcons name="crosshairs-gps" size={14} color={theme.primary} />
                <Text style={[styles.resetGpsText, { color: theme.primary }]}>Use Current GPS</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.originCard, { backgroundColor: theme.surfaceHover, borderColor: theme.border }]}>
            <View style={[styles.waypointDot, { backgroundColor: theme.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.originName, { color: theme.textPrimary }]}>{startLocationName}</Text>
              <Text style={[styles.originCoords, { color: theme.textMuted }]}>
                {startLocation.latitude.toFixed(4)}°N, {startLocation.longitude.toFixed(4)}°E
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.changeOriginBtn, { borderColor: theme.border }]}
              onPress={() => {
                setSelectingStartLocation(true);
                setShowSavedPlacesModal(true);
              }}
            >
              <Text style={[styles.changeOriginText, { color: theme.primary }]}>Change</Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* 2. Destination & Places Search Bar */}
        <AppCard style={styles.card}>
          <Text style={[styles.cardHeader, { color: theme.textMuted }]}>
            SEARCH DESTINATION OR INTERMEDIATE STOP
          </Text>

          <View style={[styles.searchInputRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.inputText }]}
              placeholder="Search address, petrol pump, hotel, cafe..."
              placeholderTextColor={theme.inputPlaceholder}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Categories Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {['Petrol Pump', 'EV Charging', 'Mechanic', 'Cafe', 'Hotel', 'Hospital', 'Scenic Point'].map(
              (cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, { backgroundColor: theme.surfaceHover, borderColor: theme.border }]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <Text style={[styles.catText, { color: theme.textSecondary }]}>{cat}</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          {/* Autocomplete Search Results */}
          {searchResults.length > 0 && (
            <View style={[styles.resultsList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {searchResults.slice(0, 5).map((p) => (
                <View
                  key={p.placeId}
                  style={[styles.resultItem, { borderBottomColor: theme.border }]}
                >
                  <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resName, { color: theme.textPrimary }]}>{p.name}</Text>
                    <Text style={[styles.resAddr, { color: theme.textMuted }]}>{p.address}</Text>
                  </View>
                  <View style={styles.addBtnGroup}>
                    <TouchableOpacity
                      style={[styles.addOptionBtn, { backgroundColor: theme.primaryLight }]}
                      onPress={() => handleSelectPlace(p)}
                    >
                      <Text style={[styles.addOptionText, { color: theme.primary }]}>+ STOP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addOptionBtn, { backgroundColor: theme.dangerLight }]}
                      onPress={() => handleSetDestination(p)}
                    >
                      <Text style={[styles.addOptionText, { color: theme.danger }]}>DEST</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </AppCard>

        {/* 3. Multi-Stop Sequence Chain Card with Reordering & Lock */}
        <AppCard style={styles.card}>
          <View style={styles.stopsHeader}>
            <Text style={[styles.cardHeader, { color: theme.textMuted }]}>
              TRIP WAYPOINTS & STOPS ({stops.length + 2})
            </Text>

            <View style={styles.optimizeBtnWrap}>
              {isOptimized ? (
                <TouchableOpacity
                  style={[styles.optBtn, { backgroundColor: theme.warningLight, borderColor: theme.warning }]}
                  onPress={handleKeepOriginalOrder}
                >
                  <MaterialCommunityIcons name="undo" size={14} color={theme.warning} />
                  <Text style={[styles.optText, { color: theme.warning }]}>KEEP MY ORDER</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.optBtn, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
                  onPress={handleOptimizeStops}
                  disabled={stops.length <= 1}
                >
                  <MaterialCommunityIcons name="routes" size={14} color={theme.primary} />
                  <Text style={[styles.optText, { color: theme.primary }]}>OPTIMIZE ROUTE</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Start Origin Row */}
          <View style={styles.waypointRow}>
            <View style={[styles.waypointDot, { backgroundColor: theme.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.waypointTitle, { color: theme.textPrimary }]}>
                {startLocationName}
              </Text>
              <Text style={[styles.waypointSub, { color: theme.textMuted }]}>Departure Origin</Text>
            </View>
            <AppBadge label="START" variant="success" size="sm" />
          </View>

          {/* Intermediate Stops */}
          {stops.map((stop, index) => (
            <View key={stop.id} style={[styles.waypointRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
              <View style={[styles.waypointDot, { backgroundColor: theme.primary }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.stopNameRow}>
                  <Text style={[styles.waypointTitle, { color: theme.textPrimary }]}>
                    Stop {index + 1}: {stop.name}
                  </Text>
                  {stop.locked && (
                    <AppBadge label="LOCKED" variant="warning" size="sm" />
                  )}
                </View>
                <Text style={[styles.waypointSub, { color: theme.textMuted }]}>{stop.address}</Text>
              </View>

              {/* Stop Actions: Lock, Reorder Up/Down, Delete */}
              <View style={styles.stopActions}>
                <TouchableOpacity
                  onPress={() => handleMoveStop(index, 'UP')}
                  disabled={index === 0}
                  style={{ opacity: index === 0 ? 0.3 : 1 }}
                >
                  <MaterialCommunityIcons name="chevron-up" size={18} color={theme.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleMoveStop(index, 'DOWN')}
                  disabled={index === stops.length - 1}
                  style={{ opacity: index === stops.length - 1 ? 0.3 : 1 }}
                >
                  <MaterialCommunityIcons name="chevron-down" size={18} color={theme.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleToggleLockStop(stop.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name={stop.locked ? 'lock' : 'lock-open-outline'}
                    size={16}
                    color={stop.locked ? theme.warning : theme.textMuted}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRemoveStop(stop.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close" size={16} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Final Destination Row */}
          <View style={[styles.waypointRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
            <View style={[styles.waypointDot, { backgroundColor: theme.danger }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.waypointTitle, { color: theme.textPrimary }]}>
                Destination: {destination.name}
              </Text>
              <Text style={[styles.waypointSub, { color: theme.textMuted }]}>{destination.address}</Text>
            </View>
            <AppBadge label="END" variant="danger" size="sm" />
          </View>
        </AppCard>

        {/* 4. Route Preferences (Tolls, Highways, Safer) */}
        <AppCard style={styles.card}>
          <Text style={[styles.cardHeader, { color: theme.textMuted }]}>
            ROUTE PREFERENCES
          </Text>
          <View style={styles.preferencesRow}>
            <TouchableOpacity
              style={[
                styles.prefPill,
                avoidTolls && { backgroundColor: theme.primary, borderColor: theme.primary },
                !avoidTolls && { backgroundColor: theme.surfaceHover, borderColor: theme.border },
              ]}
              onPress={() => setAvoidTolls(!avoidTolls)}
            >
              <MaterialCommunityIcons
                name="cash-remove"
                size={14}
                color={avoidTolls ? '#FFF' : theme.textPrimary}
              />
              <Text style={[styles.prefText, { color: avoidTolls ? '#FFF' : theme.textPrimary }]}>
                Avoid Tolls
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.prefPill,
                avoidHighways && { backgroundColor: theme.primary, borderColor: theme.primary },
                !avoidHighways && { backgroundColor: theme.surfaceHover, borderColor: theme.border },
              ]}
              onPress={() => setAvoidHighways(!avoidHighways)}
            >
              <MaterialCommunityIcons
                name="highway"
                size={14}
                color={avoidHighways ? '#FFF' : theme.textPrimary}
              />
              <Text style={[styles.prefText, { color: avoidHighways ? '#FFF' : theme.textPrimary }]}>
                Avoid Highways
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.prefPill,
                preferSaferRoutes && { backgroundColor: theme.success, borderColor: theme.success },
                !preferSaferRoutes && { backgroundColor: theme.surfaceHover, borderColor: theme.border },
              ]}
              onPress={() => setPreferSaferRoutes(!preferSaferRoutes)}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color={preferSaferRoutes ? '#FFF' : theme.textPrimary}
              />
              <Text style={[styles.prefText, { color: preferSaferRoutes ? '#FFF' : theme.textPrimary }]}>
                Safer Route
              </Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* 5. Route Preview Map View */}
        <RideMapView
          currentLocation={startLocation}
          hazards={hazards}
          route={activeRoute}
          height={200}
        />

        {/* 6. Route Alternatives Selection & Hazard Safety Score */}
        <AppCard style={styles.card}>
          <Text style={[styles.cardHeader, { color: theme.textMuted }]}>
            ROUTE ALTERNATIVES & HAZARD SCORING
          </Text>

          <View style={styles.routesGrid}>
            {calculatedRoutes.map((rt, idx) => {
              const isSelected = selectedRouteIndex === idx;
              return (
                <TouchableOpacity
                  key={rt.id}
                  style={[
                    styles.routeCard,
                    {
                      backgroundColor: isSelected ? theme.primaryLight : theme.surfaceHover,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedRouteIndex(idx)}
                  activeOpacity={0.7}
                >
                  <View style={styles.routeHeaderRow}>
                    <Text style={[styles.routeName, { color: theme.textPrimary }]}>{rt.name}</Text>
                    <AppBadge
                      label={rt.isFastest ? 'FASTEST' : 'SAFER'}
                      variant={rt.isFastest ? 'info' : 'success'}
                      size="sm"
                    />
                  </View>

                  <Text style={[styles.routeMetrics, { color: theme.textPrimary }]}>
                    {rt.distanceKm} km • {rt.durationMinutes} min
                  </Text>
                  <Text style={[styles.routeSummary, { color: theme.textMuted }]}>
                    {rt.summary}
                  </Text>

                  <View style={[styles.scoreBadgeRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>
                      SAFETY SCORE: <Text style={{ color: theme.success, fontWeight: '700' }}>{rt.safetyScore}/100</Text>
                    </Text>
                    <Text
                      style={[
                        styles.hazardCountText,
                        { color: rt.hazardCount > 0 ? theme.warning : theme.success },
                      ]}
                    >
                      {rt.hazardCount} Hazards on route
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>

        {/* 7. Action Bar: Save Trip & Start Navigation CTAs */}
        <View style={styles.ctaRow}>
          <View style={styles.dualBtnRow}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setSaveModalVisible(true)}
            >
              <MaterialCommunityIcons name="bookmark-outline" size={18} color={theme.textPrimary} />
              <Text style={[styles.saveBtnText, { color: theme.textPrimary }]}>SAVE TRIP</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <AppButton
                title={`START RIDE (${activeRoute.durationMinutes} MIN)`}
                variant="primary"
                icon="navigation"
                onPress={handleStartRideDirectly}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Trip Modal */}
      <Modal visible={saveModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Save Planned Trip</Text>
            <Text style={[styles.modalSub, { color: theme.textMuted }]}>
              Name your itinerary to quickly reopen or launch navigation from My Rides.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText },
              ]}
              value={tripPlanName}
              onChangeText={setTripPlanName}
              placeholder="e.g. Bangalore to Mysore Heritage Route"
              placeholderTextColor={theme.inputPlaceholder}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={{ color: theme.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveTrip}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save Trip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saved Places Selector Modal */}
      <Modal visible={showSavedPlacesModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {selectingStartLocation ? 'Select Start Location' : 'Select Saved Place'}
            </Text>

            <TouchableOpacity
              style={[styles.savedPlaceItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                handleResetToGpsOrigin();
                setShowSavedPlacesModal(false);
                setSelectingStartLocation(false);
              }}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.success} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.resName, { color: theme.textPrimary }]}>Current GPS Location</Text>
                <Text style={[styles.resAddr, { color: theme.textMuted }]}>High-accuracy mobile telematics origin</Text>
              </View>
            </TouchableOpacity>

            {savedPlaces.map((sp) => (
              <TouchableOpacity
                key={sp.placeId}
                style={[styles.savedPlaceItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  handleSelectPlace(sp);
                  setShowSavedPlacesModal(false);
                }}
              >
                <MaterialCommunityIcons name="bookmark-check" size={18} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resName, { color: theme.textPrimary }]}>{sp.name}</Text>
                  <Text style={[styles.resAddr, { color: theme.textMuted }]}>{sp.address}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor: theme.border, marginTop: 12 }]}
              onPress={() => {
                setShowSavedPlacesModal(false);
                setSelectingStartLocation(false);
              }}
            >
              <Text style={{ color: theme.textMuted, fontWeight: '600', textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resetGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetGpsText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  originCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  originName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  originCoords: {
    fontSize: 10,
    marginTop: 2,
  },
  changeOriginBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  changeOriginText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    padding: 0,
  },
  catScroll: {
    marginTop: 8,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: 6,
  },
  catText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  resultsList: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderBottomWidth: 1,
  },
  resName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  resAddr: {
    fontSize: 10,
    marginTop: 1,
  },
  addBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  addOptionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  addOptionText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  stopsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optimizeBtnWrap: {},
  optBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  optText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  stopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waypointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  waypointTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  waypointSub: {
    fontSize: 10,
    marginTop: 1,
  },
  stopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preferencesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  prefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  prefText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  routesGrid: {
    gap: 8,
    marginTop: 6,
  },
  routeCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  routeMetrics: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    marginTop: 4,
  },
  routeSummary: {
    fontSize: 10,
    marginTop: 2,
  },
  scoreBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  hazardCountText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  ctaRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  dualBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  saveBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  modalSub: {
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    fontSize: typography.sizes.sm,
    marginTop: 4,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  modalConfirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  savedPlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
