# RideShield 🏍️🛡️
### Intelligent Motorcycle Safety, Rider Coaching & Emergency SOS Platform

RideShield is an intelligent motorcycle safety platform that monitors riding conditions using smartphone hardware sensors (or a physical 6-axis IMU garment via Bluetooth), detects dangerous road events and possible crashes, provides personalized rider coaching, and automatically initiates an emergency response with live GPS coordinates if the rider does not confirm they are safe.

---

## 📋 Comprehensive Feature Catalog

### 1. User Authentication & Account Management
- **Email & Password Registration**: Full account sign-up with email validation, phone format check, and password confirmation.
- **Secure Email Login**: Authenticated credential verification with password hashing (`bcryptjs`) and JWT bearer sessions.
- **Google Sign-In Integration**: Supported OpenID Connect flow with account linking (handles `LOCAL`, `GOOGLE`, and `LOCAL_AND_GOOGLE` provider identities without creating duplicate accounts).
- **Persistent Session Handling**: Automatic session restoration upon app reopening via secure local storage (`AsyncStorage`).
- **User Profile Management**: View and update rider profile, contact telephone, and blood group.

### 2. Interactive Onboarding & Device Diagnostics
- **4-Step Onboarding Wizard**: Step-by-step introduction explaining the safety mission, permissions, and confirmation buffer.
- **Hardware Capability Verification**: Real-time diagnostics checking 3-axis Accelerometer, Gyroscope, GPS receiver, Battery level, and Location permissions.
- **Data Source Switcher**: Allows toggling data sources between phone hardware, testing simulator, and Bluetooth garment.

### 3. Continuous Telemetry & Multi-Sensor Event Detection
- **Normalized Sensor Polling (20Hz / 50ms)**: Real-time sampling of 3-axis acceleration ($a_x, a_y, a_z$), angular rate ($\omega_x, \omega_y, \omega_z$), and high-accuracy GPS speed.
- **Mathematical Feature Extraction**: On-the-fly computation of total G-force magnitude, angular rate magnitude, Jerk ($\Delta a / \Delta t$), and dynamic vehicle lean/tilt angle.
- **Multi-Sensor Event Classification**:
  - *Normal Riding*: Baseline pavement vibration filtering.
  - *Hard Braking*: High longitudinal deceleration without rotational tumble.
  - *Hard Cornering*: High angular lean velocity with stable trajectory.
  - *Pothole / Road Surface Jolt*: Sharp vertical acceleration spike ($>3.4\text{G}$) with sustained forward speed and stable orientation.
  - *Possible Crash*: Multi-sensor confluence of high impact ($>3.8\text{G}$), violent angular tumble ($>4.0\text{ rad/s}$), rapid speed drop, and severe lean/rollover tilt ($>65^\circ$).
  - *Advanced Crash Types*: High-side crash and vehicle rollover categorization.
- **False-Positive Suppression**: Dedicated rule-based heuristics that prevent potholes, bumps, hard braking, or phone drops from triggering false crash alarms.
- **Explainable Crash Confidence**: Each detected incident includes an explicit confidence score (0–100%) and plain-English reasons (e.g., *"High impact spike: 4.8G"*, *"Rotational tumble: 5.2 rad/s"*).
- **Pre-Impact Rolling FIFO Buffer**: Continuously retains the last 8 seconds of IMU frames (160 samples at 20Hz) attached to incident reports for forensic accident analysis.

### 4. Emergency Confirmation Buffer & Incident Response
- **Confirmation Buffer (20–30s Countdown)**: Configurable emergency countdown (default 25s) before any external SOS is dispatched.
- **High-Decibel Siren Alarm**: Looping audio siren alarm that overrides device silent mode (`expo-av`).
- **Continuous Haptic Pulses**: High-priority error vibration pulses alerting the rider in their pocket.
- **Prominent "I'M SAFE" Cancellation**: Large, high-visibility green button allowing riders to immediately stop alarms, cancel the countdown, and log the incident as safe with **NO SOS sent**.
- **Automated SOS Dispatcher**: If the timer reaches 0s, the system automatically broadcasts an SOS message containing:
  - Rider name and contact telephone
  - Incident timestamp and accident category
  - Detection confidence and peak impact G-force
  - Exact GPS coordinates with a clickable Google Maps link
- **Multi-Channel Dispatch & Native Fallback**: Dispatches alerts via `expo-sms`, native telephone dialer fallback, and backend cloud webhooks.
- **Explicit Delivery Status Tracking**: Distinguishes between `SOS_GENERATED`, `SOS_SENDING`, `SOS_SENT`, and `SOS_FAILED`.
- **SOS Idempotency Protection**: Enforces strict single-dispatch per incident to prevent duplicate alerts.
- **Manual Emergency SOS**: Instant rider-triggered SOS button on the live ride screen.

### 5. Emergency Contacts Manager (ICE)
- **Contact Management**: Add, edit, and delete emergency contacts with relationship labels (Family, Spouse, Doctor, ICE).
- **Priority Tiering**: Support for Primary contact designation and contact priority ordering.
- **Per-User Contact Isolation**: Strict authorization ensuring users can only manage their own contacts.

### 6. Transparent Rider Safety Scoring & Coaching
- **Mathematical Safety Scoring Formula (0–100)**: Transparent scoring starting at 100 with deterministic deductions:
  - Hard Braking: -4 points per event (max 24 pts)
  - Hard Cornering: -3 points per event (max 18 pts)
  - Road Defects / Potholes: -1 point per event (max 8 pts)
  - Uncancelled Crash: -30 points
  - Clamped score range: 20 to 100 points
- **Personalized Rider Coaching Insights**: Constructive advisories generated per ride (e.g., recommended 3–4 second following distance, cornering throttle stabilization, road surface scanning).
- **Ride Summary Modal**: Comprehensive post-ride breakdown displaying safety grade, deduction itemization, coaching tips, and event counts.

### 7. Smartphone Mount & Relative Orientation Calibration
- **Mount Zeroing Protocol**: Multi-sample resting calibration (5.5s at 20Hz) computing baseline forward/backward pitch and lateral roll angles.
- **Sensor Variance Analysis**: Variance thresholding ($<0.08\text{G}^2$ accel, $<0.15\text{ rad/s}^2$ gyro) rejecting calibration attempts if the bike or phone is vibrating or in motion.
- **Calibrated Lean-Angle Monitoring**: Dynamic motorcycle cornering lean-angle computation corrected against the calibrated mount orientation with low-pass noise filtering.
- **Live Lean Gauge**: Real-time motorcycle lean meter (`LeanAngleGauge`) showing lean angle in degrees, direction (LEFT / RIGHT / CENTER), and safety status (NORMAL / CAUTION / HIGH).
- **Persistent Calibration Profile**: Calibration stored in `AsyncStorage` with one-tap recalibration.

### 8. Road Hazard & Pothole Intelligence
- **Automatic Pothole Detection**: IMU vertical impact jolt detection with spatial clustering ($<35\text{m}$) merging multiple reports into confirmed hazards.
- **Proximity Hazard Warnings**: Real-time auditory and visual distance alerts triggered when approaching confirmed road hazards within 200m.
- **Dynamic Recommended Speed**: Contextual speed reduction advice (e.g. 25–45 km/h) displayed near road defects.
- **Temporal Aging & Resolution**: Automatic confidence degradation and status decay (`TENTATIVE` → `CONFIRMED` → `AGED` → `RESOLVED`).
- **Crowdsourced Hazard Sync**: REST synchronization with backend SQLite `road_hazards` database.

### 9. In-App Google Maps & Turn-by-Turn Navigation
- **In-App Google Maps Surface**: High-performance vector map canvas (`RideMapView`) displaying rider position beacon, route polyline, and colored hazard markers.
- **Turn-by-Turn Motorcycle Guidance**: Maneuver instructions (`turn-left`, `turn-right`, `merge`, `straight`, `arrive`), distance count-downs, and next-turn prompts.
- **Concurrent Sensor & Safety Monitoring**: Crash detection, lean-angle monitoring, and emergency SOS state machines operate uninterrupted during active GPS navigation.
- **Hazard Overlay in Nav**: Impending potholes and road hazards rendered on the navigation track.

### 10. Dedicated Ride Planner & Multi-Stop Optimization
- **Trip Planner Workflow**: Complete motorcycle journey planning screen accessible via `[ PLAN A RIDE ]` on the Home screen or main navigation.
- **Departure Origin Selection**: Defaults to live GPS coordinates with options to change via place search, coordinates, or saved locations.
- **Multi-Stop Itinerary Management**: Add intermediate stops (`+ ADD STOP`), reorder waypoints, delete stops, and toggle individual waypoint order locks (🔒).
- **Waypoint Route Optimization (TSP)**: Greedy nearest-neighbor optimization recalculating intermediate stop sequences for shortest distance and time while **strictly preserving locked stops**.
- **Route Preferences**: Filter routes by Fastest route, Safer route (fewer hazards), Avoid Tolls, and Avoid Highways.
- **Hazard Safety Scoring**: Computes total route hazard count, high-risk corridor segments, and an overall Route Safety Score (0–100).
- **Trip Persistence & "My Rides" Screen**: Save trips to persistent storage (`savePlannedTrip`) and manage them in a dedicated **My Rides** hub featuring:
  - *PLANNED Tab*: List of saved itineraries with waypoint chains, estimated distance/ETA, safety score, and one-tap `[ START RIDE ]`.
  - *COMPLETED Tab*: Comprehensive ride history with **Planned vs Actual Telematics** (Planned vs Actual distance, duration, and hazards encountered).

### 11. Testing Lab & Reusable Demo Simulator
- **Interactive Simulation Lab**: Built-in testing rig accessible with 1 tap from the live ride screen.
- **Deterministic Test Scenarios**:
  - *Simulate Crash (4.8G + Tumble)*: Exercises the real alarm siren, 25s countdown, and SOS dispatch.
  - *Pothole Jolt (3.4G)*: Verifies that road surface impacts do not trigger alarms.
  - *Hard Braking (-25 km/h)*: Verifies deceleration logging without triggering alarms.
  - *Hard Cornering*: Verifies lean angle logging without triggering alarms.
- **Shared Pipeline Guarantee**: Simulations feed the identical sensor processing and state-machine pipeline as real phone sensors.

### 12. Cloud Fleet Dashboard
- **Web Telematics Overview**: React + Vite dashboard displaying fleet metrics (total rides, average fleet safety score, cancelled false alarms, and active SOS events).
- **Live Incident Table**: Real-time table showing incident types, severity, confidence, cancellation state, and direct map links.

---

## ⚙️ Technical Specifications

### Sensor Telemetry & Calibration
| Parameter | Specification |
| :--- | :--- |
| **Sampling Frequency** | 20 Hz (50 ms interval) |
| **Accelerometer Units** | G-force ($1\text{G} = 9.81\text{ m/s}^2$) |
| **Gyroscope Units** | Radians per second ($\text{rad/s}$) |
| **GPS Tracking Accuracy** | High Precision (`Location.Accuracy.High`), 1-second interval |
| **Pre-Impact Buffer Depth**| 160 frames ($\sim 8$ seconds FIFO window) |
| **Countdown Duration** | Configurable: 15s, 20s, 25s (default), 35s |
| **Sensitivity Profiles** | `LOW` (4.5G), `MEDIUM` (3.5G default), `HIGH` (2.8G) |

### Technology Stack
| Layer | Technologies |
| :--- | :--- |
| **Mobile Client** | React Native, Expo SDK 57, TypeScript, React Navigation |
| **Sensor & Location APIs** | `expo-sensors`, `expo-location` |
| **Audio & Alerts** | `expo-av`, `expo-haptics`, `expo-sms` |
| **Local Storage** | `@react-native-async-storage/async-storage` |
| **Backend API** | Node.js, Express.js, TypeScript, `better-sqlite3` (MySQL-compatible) |
| **Authentication & Crypto** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password hashing |
| **Machine Learning** | Python 3, Scikit-learn (Random Forest Classifier, 100 trees), NumPy, Pandas |
| **Web Dashboard** | React 18, Vite, Lucide Icons |

---

## 🏛️ System Architecture

### 1. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SOURCE LAYER (DECOUPLED)                │
│  ┌───────────────────────┐ ┌───────────────────┐ ┌────────────┐ │
│  │  PhoneSensorProvider  │ │ SimulatedProvider │ │ BLEGarment │ │
│  │ (Accel, Gyro, GPS)    │ │   (Testing Rig)   │ │  (Future)  │ │
│  └───────────┬───────────┘ └─────────┬─────────┘ └─────┬──────┘ │
└──────────────┼───────────────────────┼─────────────────┼────────┘
               │                       │                 │
               ▼                       ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              ISensorProvider INTERFACE (NORMALIZATION)           │
│  - Formats: timestamp, ax, ay, az, gx, gy, gz, speed, lat, lng  │
│  - Feature Extraction: Jerk (Δa/Δt), Tilt Angle, G-Magnitude    │
│  - Pre-Impact Rolling Buffer (160 frames / 8 seconds FIFO)      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              EVENT CLASSIFIER & CRASH DETECTION ENGINE          │
│  - Rules: Impact Spike + Angular Tumble + Sudden Deceleration   │
│  - False-Positive Filters: Pothole & Hard Braking Isolation     │
│  - Output: Event Type, Confidence (0-100%), Explainable Reasons │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EMERGENCY STATE MACHINE                        │
│                                                                 │
│   IDLE ──> RIDE_ACTIVE ──> MONITORING ──> POSSIBLE_CRASH        │
│                                                 │               │
│                                                 ▼               │
│                                      EMERGENCY_COUNTDOWN (25s)  │
│                                      (Loud Siren + Vibration)   │
│                                                 │               │
│                        ┌────────────────────────┴───────────────┐
│                        ▼                                        ▼
│            Rider Taps "I'M SAFE"                        Timer Reaches 0s
│                        │                                        │
│                        ▼                                        ▼
│                    CANCELLED                               SOS_PENDING
│             (Stop Alarm, No SOS)                                │
│                        │                                        ▼
│                        ▼                                  SOS_TRIGGERED
│                 INCIDENT_LOGGED                       (SMS, Dial, Webhook)
│                                                                 │
│                                                                 ▼
│                                                          INCIDENT_LOGGED
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
┌─────────────────────────────────┐ ┌─────────────────────────────┐
│       LOCAL STORAGE (OFFLINE)   │ │   CLOUD BACKEND & DASHBOARD │
│  - User Session & Auth Tokens   │ │  - Node.js Express REST API │
│  - Emergency Contacts Cache     │ │  - SQLite / MySQL Database  │
│  - Offline Ride & Incident Log  │ │  - Fleet Web Dashboard      │
└─────────────────────────────────┘ └─────────────────────────────┘
```

### 2. Decoupled Hardware Design (`ISensorProvider`)
The core crash detection engine never calls concrete mobile sensor APIs directly. It depends exclusively on the `ISensorProvider` contract. This ensures:
1. Smartphone sensors act as the immediate, zero-hardware MVP entry point.
2. The exact same detection engine runs in automated simulation and unit testing.
3. Future smart garments with physical 6-axis IMU chips and microcontrollers connect over Bluetooth Low Energy (BLE) without changing a single line of crash detection code.

---

## 📂 Project Directory Structure

```
agenticProject/
├── rideshield-mobile/               # React Native (Expo) Mobile App
│   ├── App.tsx                      # Root screen router (Auth, Wizard, Diagnostics, Home)
│   ├── app.json                     # Native permissions and app metadata
│   ├── src/
│   │   ├── types/                   # Normalized sensor records, state machine types
│   │   ├── services/
│   │   │   ├── sensors/             # SensorProvider implementations
│   │   │   │   ├── ISensorProvider.ts        # Provider abstraction interface
│   │   │   │   ├── PhoneSensorProvider.ts    # Hardware IMU & GPS provider
│   │   │   │   ├── SimulatedSensorProvider.ts# Bench test scenario generator
│   │   │   │   └── BluetoothIMUProvider.ts   # BLE smart garment stub
│   │   │   ├── CrashDetectionEngine.ts       # Multi-sensor fusion with buffer
│   │   │   ├── EmergencyAlertService.ts      # Loud siren, haptics & SMS dispatcher
│   │   │   ├── RiderCoachingEngine.ts        # Mathematical safety scoring & tips
│   │   │   ├── AuthService.ts                # Email/Pass and Google authentication
│   │   │   ├── StorageService.ts             # AsyncStorage persistence
│   │   │   └── ApiService.ts                 # Backend sync & emergency webhooks
│   │   ├── context/
│   │   │   └── RideContext.tsx               # Global state machine & ride lifecycle
│   │   ├── components/
│   │   │   ├── CrashAlertModal.tsx           # Countdown circle & I'M SAFE overlay
│   │   │   ├── LiveSensorGauges.tsx          # Real-time 6-axis IMU bars
│   │   │   └── RideSummaryModal.tsx          # Score breakdown & coaching tips
│   │   └── screens/
│   │       ├── AuthScreen.tsx                # Login, Register, Google Sign-In
│   │       ├── OnboardingWizard.tsx          # 4-step interactive onboarding
│   │       ├── DeviceDiagnosticsScreen.tsx   # Hardware health & data source switch
│   │       ├── HomeScreen.tsx                # Status, safety score, quick actions
│   │       ├── LiveRideScreen.tsx            # Digital speedometer & simulation rig
│   │       ├── EmergencyContactsScreen.tsx   # ICE contact manager
│   │       ├── RideHistoryScreen.tsx         # Past trips & incident map pins
│   │       └── SettingsScreen.tsx            # Calibration & sirens
├── rideshield-backend/              # Node.js + Express REST API
│   ├── src/
│   │   ├── db.ts                    # Relational schema (Users, Contacts, Rides, Incidents)
│   │   ├── seed.ts                  # Seed script loading demo rider, trips & events
│   │   └── server.ts                # REST API with JWT authorization
├── rideshield-ml/                   # Python Machine Learning Pipeline
│   ├── train_classifier.py          # Random Forest 6-axis IMU classifier trainer
│   └── models/
│       └── model_metadata.json      # Exported metrics & feature importances
├── rideshield-dashboard/            # React + Vite Web Dashboard
│   └── src/
│       └── main.jsx                 # Fleet telematics, safety scores & incident table
└── tests/
    └── e2e_regression.test.ts       # 35-point automated regression test suite
```

---

## 🚀 Getting Started & Execution

### 1. Mobile Application (React Native / Expo)
```bash
cd rideshield-mobile
npx expo start
```
- Scan the displayed QR code with the **Expo Go** app on iOS or Android.
- **Testing the Flow**:
  1. Log in or tap **CONTINUE WITH GOOGLE**.
  2. Complete the onboarding wizard and sensor diagnostics.
  3. Tap **START NEW RIDE**.
  4. Tap the flask icon at the top right to open the **Simulation Lab**.
  5. Tap **Simulate Crash**: listen to the siren alarm, view the 25s circular countdown, and either tap **I'M SAFE** or let it expire to trigger SOS.

### 2. Backend Server (Node.js & Express)
```bash
cd rideshield-backend
node dist/server.js
# or for development:
npx tsx src/server.ts
```
The server will start on `http://localhost:4000`. Demo data is automatically seeded on launch.

### 3. Machine Learning Pipeline
```bash
python3 rideshield-ml/train_classifier.py
```
Trains a 100-tree Scikit-learn Random Forest model on 6-axis IMU feature vectors and exports model evaluation metrics to `rideshield-ml/models/model_metadata.json`.

### 4. Cloud Web Dashboard
```bash
cd rideshield-dashboard
npm run dev
```
Open `http://localhost:5173` in any browser to monitor real-time fleet telematics, safety scores, and incoming emergency crash logs.

### 5. Automated Regression Test Suite
```bash
npx --yes tsx tests/e2e_regression.test.ts
```
Runs the full 35-point automated regression test suite verifying mathematical feature extraction, false-positive suppression, the emergency state machine, countdown cancellation, and cross-user data isolation.
