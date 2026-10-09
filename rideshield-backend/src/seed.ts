import { db } from './db';
import bcrypt from 'bcryptjs';

export function seedDatabase() {
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get('gaurav@rideshield.com');
  if (existingUser) return; // already seeded

  console.log('🌱 Seeding RideShield demo database...');

  const now = Date.now();
  const userId = 'user-demo-01';
  const hashedPass = bcrypt.hashSync('demo1234', 10);

  // 1. Demo User
  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, auth_provider, blood_group, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    'Gaurav Sahani',
    'gaurav@rideshield.com',
    '+1 555-0199',
    hashedPass,
    'LOCAL',
    'O+',
    now - 86400000 * 7,
    now
  );

  // 2. Demo Emergency Contacts
  db.prepare(`
    INSERT INTO emergency_contacts (id, user_id, name, phone, relationship, priority, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('c-1', userId, 'Dr. Sarah (ICE)', '+1 555-0199', 'Primary Emergency', 1, 1, now);

  db.prepare(`
    INSERT INTO emergency_contacts (id, user_id, name, phone, relationship, priority, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('c-2', userId, 'Home / Family', '+1 555-0188', 'Family', 2, 1, now);

  // 3. Demo Rides
  const ride1 = 'ride-demo-101';
  db.prepare(`
    INSERT INTO rides (id, user_id, start_time, end_time, duration_seconds, distance, max_speed_kmh, safety_score, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ride1, userId, now - 3600000 * 24, now - 3600000 * 23, 2400, 28.5, 68.0, 92, 'COMPLETED', now);

  // 4. Demo Ride Events
  db.prepare(`
    INSERT INTO ride_events (id, ride_id, event_type, timestamp, confidence, severity, latitude, longitude, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('ev-1', ride1, 'HARD_BRAKING', now - 3600000 * 23.5, 85, 'MEDIUM', 37.7749, -122.4194, '{"decel": 1.4}');

  db.prepare(`
    INSERT INTO ride_events (id, ride_id, event_type, timestamp, confidence, severity, latitude, longitude, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('ev-2', ride1, 'POTHOLE', now - 3600000 * 23.2, 90, 'LOW', 37.7755, -122.4180, '{"impact": 3.2}');

  // 5. Demo Incident (Cancelled False Alarm)
  db.prepare(`
    INSERT INTO incidents (id, ride_id, event_type, confidence, severity, latitude, longitude, countdown_seconds, cancelled, sos_triggered, sos_sent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('inc-demo-1', ride1, 'POSSIBLE_CRASH', 92, 'CRITICAL', 37.7749, -122.4194, 25, 1, 0, 0, now - 3600000 * 23.1);

  console.log('✅ RideShield demo seed loaded.');
}
