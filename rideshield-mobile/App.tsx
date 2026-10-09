import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RideProvider, useRide } from './src/context/RideContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { LiveRideScreen } from './src/screens/LiveRideScreen';
import { EmergencyContactsScreen } from './src/screens/EmergencyContactsScreen';
import { RideHistoryScreen } from './src/screens/RideHistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingWizard } from './src/screens/OnboardingWizard';
import { DeviceDiagnosticsScreen } from './src/screens/DeviceDiagnosticsScreen';
import { MountCalibrationScreen } from './src/screens/MountCalibrationScreen';
import { TripPlannerScreen } from './src/screens/TripPlannerScreen';
import { NavigationScreen } from './src/screens/NavigationScreen';
import { RoadHazardsScreen } from './src/screens/RoadHazardsScreen';
import { MyRidesScreen } from './src/screens/MyRidesScreen';
import { CrashAlertModal } from './src/components/CrashAlertModal';
import { RideSummaryModal } from './src/components/RideSummaryModal';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { RideRecord, RouteOption, TripPlan } from './src/types';

type AppScreen =
  | 'HOME'
  | 'LIVE'
  | 'CONTACTS'
  | 'HISTORY'
  | 'SETTINGS'
  | 'DIAGNOSTICS'
  | 'CALIBRATION'
  | 'TRIP_PLANNER'
  | 'NAVIGATION'
  | 'HAZARDS'
  | 'MY_RIDES';

function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('HOME');
  const [selectedSummaryRide, setSelectedSummaryRide] = useState<RideRecord | null>(null);
  const [activeNavRoute, setActiveNavRoute] = useState<RouteOption | null>(null);
  const [editingTripPlan, setEditingTripPlan] = useState<TripPlan | null>(null);
  const [pendingRideAction, setPendingRideAction] = useState<(() => Promise<void>) | null>(null);
  const { user, startRide, calibrationProfile } = useRide();
  const { theme, isDark } = useAppTheme();

  // 1. If not logged in -> Show Auth Screen
  if (!user) {
    return <AuthScreen />;
  }

  // 2. If onboarding not completed -> Show Onboarding Wizard
  if (!user.onboardingCompleted) {
    return <OnboardingWizard />;
  }

  const handleStartRide = async () => {
    // If phone mount is not calibrated yet, offer calibration before heading out
    if (!calibrationProfile?.calibrated) {
      setPendingRideAction(() => async () => {
        const ok = await startRide();
        if (ok) setCurrentScreen('LIVE');
      });
      setCurrentScreen('CALIBRATION');
      return;
    }

    const ok = await startRide();
    if (ok) {
      setCurrentScreen('LIVE');
    }
  };

  const handleStartNavTrip = (route: RouteOption) => {
    setActiveNavRoute(route);
    if (!calibrationProfile?.calibrated) {
      setPendingRideAction(() => async () => {
        setCurrentScreen('NAVIGATION');
      });
      setCurrentScreen('CALIBRATION');
      return;
    }
    setCurrentScreen('NAVIGATION');
  };


  const handleFinishRide = (savedRide?: RideRecord | null) => {
    setCurrentScreen('HOME');
    if (savedRide) {
      setSelectedSummaryRide(savedRide);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeContainer, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Primary Screens */}
      {currentScreen === 'HOME' && (
        <HomeScreen
          onStartRide={handleStartRide}
          onOpenLive={() => setCurrentScreen('LIVE')}
          onOpenContacts={() => setCurrentScreen('CONTACTS')}
          onOpenHistory={() => setCurrentScreen('HISTORY')}
          onOpenSettings={() => setCurrentScreen('SETTINGS')}
          onOpenDiagnostics={() => setCurrentScreen('DIAGNOSTICS')}
          onOpenCalibration={() => setCurrentScreen('CALIBRATION')}
          onOpenTripPlanner={() => {
            setEditingTripPlan(null);
            setCurrentScreen('TRIP_PLANNER');
          }}
          onOpenMyRides={() => setCurrentScreen('MY_RIDES')}
          onOpenHazards={() => setCurrentScreen('HAZARDS')}
          onSelectRide={(r) => setSelectedSummaryRide(r)}
        />
      )}

      {currentScreen === 'LIVE' && (
        <LiveRideScreen
          onBack={() => setCurrentScreen('HOME')}
          onFinishRide={handleFinishRide}
          onOpenTripPlanner={() => {
            setEditingTripPlan(null);
            setCurrentScreen('TRIP_PLANNER');
          }}
        />
      )}

      {currentScreen === 'MY_RIDES' && (
        <MyRidesScreen
          onBack={() => setCurrentScreen('HOME')}
          onOpenTripPlanner={(plan) => {
            setEditingTripPlan(plan || null);
            setCurrentScreen('TRIP_PLANNER');
          }}
          onStartTripRide={(plan) => {
            const launchAction = async () => {
              if (plan.selectedRoute) {
                setActiveNavRoute(plan.selectedRoute);
                setCurrentScreen('NAVIGATION');
              } else {
                const ok = await startRide();
                if (ok) setCurrentScreen('LIVE');
              }
            };

            if (!calibrationProfile?.calibrated) {
              setPendingRideAction(() => launchAction);
              setCurrentScreen('CALIBRATION');
            } else {
              launchAction();
            }
          }}
          onSelectRideSummary={(r) => setSelectedSummaryRide(r)}
        />
      )}

      {currentScreen === 'CALIBRATION' && (
        <MountCalibrationScreen
          onBack={() => {
            setPendingRideAction(null);
            setCurrentScreen('HOME');
          }}
          onCalibrationComplete={async () => {
            if (pendingRideAction) {
              const action = pendingRideAction;
              setPendingRideAction(null);
              await action();
            } else {
              setCurrentScreen('HOME');
            }
          }}
          onProceedWithoutCalibration={async () => {
            if (pendingRideAction) {
              const action = pendingRideAction;
              setPendingRideAction(null);
              await action();
            } else {
              setCurrentScreen('HOME');
            }
          }}
        />
      )}

      {currentScreen === 'TRIP_PLANNER' && (
        <TripPlannerScreen
          initialPlan={editingTripPlan}
          onBack={() => setCurrentScreen('HOME')}
          onStartTrip={handleStartNavTrip}
        />
      )}

      {currentScreen === 'NAVIGATION' && activeNavRoute && (
        <NavigationScreen
          route={activeNavRoute}
          onEndNavigation={() => setCurrentScreen('HOME')}
        />
      )}

      {currentScreen === 'HAZARDS' && (
        <RoadHazardsScreen onBack={() => setCurrentScreen('HOME')} />
      )}

      {currentScreen === 'CONTACTS' && (
        <EmergencyContactsScreen onBack={() => setCurrentScreen('HOME')} />
      )}

      {currentScreen === 'HISTORY' && (
        <RideHistoryScreen onBack={() => setCurrentScreen('HOME')} />
      )}

      {currentScreen === 'SETTINGS' && (
        <SettingsScreen onBack={() => setCurrentScreen('HOME')} />
      )}

      {currentScreen === 'DIAGNOSTICS' && (
        <DeviceDiagnosticsScreen onBack={() => setCurrentScreen('HOME')} />
      )}

      {/* Crash Confirmation Buffer & Emergency Alert Modal */}
      <CrashAlertModal />

      {/* Ride Summary & Coaching Modal */}
      <RideSummaryModal
        ride={selectedSummaryRide}
        visible={selectedSummaryRide !== null}
        onClose={() => setSelectedSummaryRide(null)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RideProvider>
          <AppNavigator />
        </RideProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
});
