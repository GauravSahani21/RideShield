import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../rideshield.db');
export const db = new Database(dbPath);

// Initialize relational schema for RideShield platform
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    profile_image_url TEXT,
    auth_provider TEXT DEFAULT 'LOCAL',
    google_id TEXT,
    email_verified INTEGER DEFAULT 0,
    blood_group TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT,
    priority INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rides (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    duration_seconds INTEGER DEFAULT 0,
    distance REAL DEFAULT 0,
    max_speed_kmh REAL DEFAULT 0,
    safety_score INTEGER DEFAULT 100,
    status TEXT DEFAULT 'COMPLETED',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ride_events (
    id TEXT PRIMARY KEY,
    ride_id TEXT,
    event_type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    confidence INTEGER,
    severity TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    ride_id TEXT,
    event_type TEXT NOT NULL,
    confidence INTEGER,
    severity TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    countdown_seconds INTEGER DEFAULT 25,
    cancelled INTEGER DEFAULT 0,
    sos_triggered INTEGER DEFAULT 0,
    sos_sent INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sensor_health (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    sensor TEXT NOT NULL,
    status TEXT NOT NULL,
    last_checked INTEGER NOT NULL,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS road_hazards (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    severity TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    report_count INTEGER DEFAULT 1,
    first_detected INTEGER NOT NULL,
    last_detected INTEGER NOT NULL,
    status TEXT DEFAULT 'TENTATIVE',
    source TEXT DEFAULT 'SENSOR_AUTODETECT',
    address TEXT,
    recommended_speed_kmh INTEGER
  );

  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    start_latitude REAL,
    start_longitude REAL,
    dest_name TEXT,
    dest_latitude REAL,
    dest_longitude REAL,
    total_distance_km REAL,
    estimated_duration_min INTEGER,
    route_preference TEXT,
    created_at INTEGER NOT NULL
  );
`);
