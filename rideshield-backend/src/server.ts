import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { seedDatabase } from './seed';

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'rideshield-hackathon-secret-jwt-key-2026';

app.use(cors());
app.use(express.json());

// Seed demo database on launch
seedDatabase();

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------
export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

// ----------------------------------------------------
// SYSTEM / HEALTH
// ----------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'RideShield Emergency & Telematics Gateway',
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// AUTH ENDPOINTS (Point 46)
// ----------------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required registration parameters' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userId = `user-${Date.now()}`;
    const hash = bcrypt.hashSync(password, 10);
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, auth_provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'LOCAL', ?, ?)
    `).run(userId, name, email.toLowerCase(), phone || null, hash, now, now);

    const token = jwt.sign({ userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      success: true,
      user: { id: userId, name, email: email.toLowerCase(), phone, authProvider: 'LOCAL' },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, authProvider: user.auth_provider },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name, googleId, profileImageUrl } = req.body;
  const targetEmail = (email || 'rider.google@gmail.com').toLowerCase();

  try {
    let user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail);
    const now = Date.now();

    if (!user) {
      const userId = `google-${Date.now()}`;
      db.prepare(`
        INSERT INTO users (id, name, email, profile_image_url, auth_provider, google_id, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'GOOGLE', ?, 1, ?, ?)
      `).run(userId, name || 'Google Rider', targetEmail, profileImageUrl || null, googleId || null, now, now);
      user = { id: userId, name: name || 'Google Rider', email: targetEmail, auth_provider: 'GOOGLE' };
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, authProvider: user.auth_provider },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  res.json({ success: true, message: 'Password reset link sent if account exists.' });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password required' });
  try {
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?').run(hash, Date.now(), email.toLowerCase());
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ----------------------------------------------------
// USER PROFILE ENDPOINTS
// ----------------------------------------------------
app.get('/api/users/me', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // Return default seeded user for seamless testing
    const defaultUser = db.prepare('SELECT id, name, email, phone, auth_provider, blood_group FROM users LIMIT 1').get();
    return res.json({ user: defaultUser });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, phone, auth_provider, blood_group FROM users WHERE id = ?').get(decoded.userId);
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.put('/api/users/me', (req: Request, res: Response) => {
  const { id, name, phone, bloodGroup } = req.body;
  try {
    db.prepare('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), blood_group = COALESCE(?, blood_group), updated_at = ? WHERE id = ?')
      .run(name || null, phone || null, bloodGroup || null, Date.now(), id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// EMERGENCY CONTACTS ENDPOINTS (Point 11, 44, 46)
// ----------------------------------------------------
app.get('/api/contacts', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  try {
    let contacts;
    if (userId) {
      contacts = db.prepare('SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY priority ASC').all(userId);
    } else {
      contacts = db.prepare('SELECT * FROM emergency_contacts ORDER BY priority ASC').all();
    }
    res.json({ contacts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contacts', (req: Request, res: Response) => {
  const { id, userId, name, phone, relationship, priority } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }
  try {
    db.prepare(`
      INSERT OR REPLACE INTO emergency_contacts (id, user_id, name, phone, relationship, priority, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id || `contact-${Date.now()}`, userId || null, name, phone, relationship || 'Family', priority || 1, Date.now());
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contacts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, name, phone, relationship, priority, active } = req.body;
  try {
    // Check ownership if userId provided
    const contact: any = db.prepare('SELECT user_id FROM emergency_contacts WHERE id = ?').get(id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (userId && contact.user_id && contact.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify another user contact' });
    }

    db.prepare(`
      UPDATE emergency_contacts
      SET name = COALESCE(?, name), phone = COALESCE(?, phone), relationship = COALESCE(?, relationship), priority = COALESCE(?, priority), active = COALESCE(?, active)
      WHERE id = ?
    `).run(name || null, phone || null, relationship || null, priority !== undefined ? priority : null, active !== undefined ? active : null, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contacts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUserId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  try {
    const contact: any = db.prepare('SELECT user_id FROM emergency_contacts WHERE id = ?').get(id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (requestingUserId && contact.user_id && contact.user_id !== requestingUserId) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete another user contact' });
    }

    db.prepare('DELETE FROM emergency_contacts WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// RIDES & TELEMETRY ENDPOINTS
// ----------------------------------------------------
app.post('/api/rides/start', (req: Request, res: Response) => {
  const { id, userId } = req.body;
  const rideId = id || `ride-${Date.now()}`;
  try {
    db.prepare(`
      INSERT INTO rides (id, user_id, start_time, duration_seconds, distance, max_speed_kmh, safety_score, status, created_at)
      VALUES (?, ?, ?, 0, 0, 0, 100, 'IN_PROGRESS', ?)
    `).run(rideId, userId || null, Date.now(), Date.now());
    res.status(201).json({ success: true, rideId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rides/:id/end', (req: Request, res: Response) => {
  const { id } = req.params;
  const { durationSeconds, maxSpeedKmh, safetyScore, distance } = req.body;
  try {
    db.prepare(`
      UPDATE rides
      SET end_time = ?, duration_seconds = ?, max_speed_kmh = ?, safety_score = ?, distance = ?, status = 'COMPLETED'
      WHERE id = ?
    `).run(Date.now(), durationSeconds || 0, maxSpeedKmh || 0, safetyScore || 100, distance || 0, id);
    res.json({ success: true, message: 'Ride completed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rides', (req: Request, res: Response) => {
  const { id, userId, startTime, endTime, durationSeconds, maxSpeedKmh, safetyScore, incidents } = req.body;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO rides (id, user_id, start_time, end_time, duration_seconds, max_speed_kmh, safety_score, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
    `).run(
      id,
      userId || null,
      startTime,
      endTime || Date.now(),
      durationSeconds || 0,
      maxSpeedKmh || 0,
      safetyScore || 100,
      Date.now()
    );

    if (Array.isArray(incidents)) {
      const insertInc = db.prepare(`
        INSERT OR REPLACE INTO incidents (id, ride_id, event_type, confidence, severity, latitude, longitude, countdown_seconds, cancelled, sos_triggered, sos_sent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const inc of incidents) {
        insertInc.run(
          inc.id,
          id,
          inc.type,
          inc.confidence || 0,
          inc.severity,
          inc.location?.latitude || null,
          inc.location?.longitude || null,
          inc.countdownSeconds || 25,
          inc.wasCancelled ? 1 : 0,
          inc.sosTriggered ? 1 : 0,
          inc.sosDeliveryStatus === 'SOS_SENT' ? 1 : 0,
          inc.timestamp || Date.now()
        );
      }
    }

    res.status(201).json({ success: true, message: 'Ride synced successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rides', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  try {
    let rides;
    if (userId) {
      rides = db.prepare('SELECT * FROM rides WHERE user_id = ? ORDER BY start_time DESC LIMIT 50').all(userId);
    } else {
      rides = db.prepare('SELECT * FROM rides ORDER BY start_time DESC LIMIT 50').all();
    }
    res.json({ rides });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rides/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUserId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  try {
    const ride: any = db.prepare('SELECT * FROM rides WHERE id = ?').get(id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (requestingUserId && ride.user_id && ride.user_id !== requestingUserId) {
      return res.status(403).json({ error: 'Forbidden: Access to another user ride is denied' });
    }
    const events = db.prepare('SELECT * FROM ride_events WHERE ride_id = ?').all(id);
    const incidents = db.prepare('SELECT * FROM incidents WHERE ride_id = ?').all(id);
    res.json({ ride, events, incidents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// RIDE EVENTS ENDPOINTS
// ----------------------------------------------------
app.post('/api/events', (req: Request, res: Response) => {
  const { id, rideId, eventType, timestamp, confidence, severity, latitude, longitude, metadata } = req.body;
  try {
    db.prepare(`
      INSERT INTO ride_events (id, ride_id, event_type, timestamp, confidence, severity, latitude, longitude, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id || `ev-${Date.now()}`,
      rideId,
      eventType,
      timestamp || Date.now(),
      confidence || 0,
      severity || 'LOW',
      latitude || null,
      longitude || null,
      typeof metadata === 'object' ? JSON.stringify(metadata) : metadata || null
    );
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rides/:id/events', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const events = db.prepare('SELECT * FROM ride_events WHERE ride_id = ? ORDER BY timestamp ASC').all(id);
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// INCIDENTS ENDPOINTS
// ----------------------------------------------------
app.post('/api/incidents', (req: Request, res: Response) => {
  const { id, rideId, eventType, confidence, severity, latitude, longitude, countdownSeconds, cancelled, sosTriggered, sosSent } = req.body;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO incidents (id, ride_id, event_type, confidence, severity, latitude, longitude, countdown_seconds, cancelled, sos_triggered, sos_sent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id || `inc-${Date.now()}`,
      rideId || null,
      eventType || 'POSSIBLE_CRASH',
      confidence || 90,
      severity || 'CRITICAL',
      latitude || null,
      longitude || null,
      countdownSeconds || 25,
      cancelled ? 1 : 0,
      sosTriggered ? 1 : 0,
      sosSent ? 1 : 0,
      Date.now()
    );
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/incidents', (req: Request, res: Response) => {
  try {
    const incidents = db.prepare('SELECT * FROM incidents ORDER BY created_at DESC LIMIT 50').all();
    res.json({ incidents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ incident });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// DEVICE & SENSOR HEALTH (Point 46)
// ----------------------------------------------------
app.post('/api/device/register', (req: Request, res: Response) => {
  const { userId, sensor, status, metadata } = req.body;
  try {
    const id = `sh-${Date.now()}`;
    db.prepare(`
      INSERT INTO sensor_health (id, user_id, sensor, status, last_checked, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId || null, sensor, status, Date.now(), metadata ? JSON.stringify(metadata) : null);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/device/status', (req: Request, res: Response) => {
  try {
    const statuses = db.prepare('SELECT * FROM sensor_health ORDER BY last_checked DESC LIMIT 10').all();
    res.json({
      overallStatus: 'HEALTHY',
      sensors: statuses,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// EMERGENCY SOS WEBHOOK
// ----------------------------------------------------
app.post('/api/sos', (req: Request, res: Response) => {
  const { incident, location, contacts } = req.body;

  console.log('🚨 [EMERGENCY SOS WEBHOOK DISPATCH] 🚨');
  console.log(`Incident Type: ${incident?.type}, Impact: ${incident?.peakAccelG || incident?.accelPeakG}G`);
  console.log(`GPS: ${location?.latitude}, ${location?.longitude}`);
  console.log(`Target Emergency Contacts: ${contacts?.length || 0}`);

  if (incident) {
    try {
      db.prepare(`
        INSERT OR REPLACE INTO incidents (id, ride_id, event_type, confidence, severity, latitude, longitude, countdown_seconds, cancelled, sos_triggered, sos_sent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
      `).run(
        incident.id,
        incident.rideId || null,
        incident.type || 'POSSIBLE_CRASH',
        incident.confidence || 95,
        incident.severity || 'CRITICAL',
        location?.latitude || null,
        location?.longitude || null,
        incident.countdownSeconds || 25,
        incident.wasCancelled ? 1 : 0,
        Date.now()
      );
    } catch (e) {
      console.warn('Incident record error:', e);
    }
  }

  res.status(200).json({
    success: true,
    status: 'SOS_SENT',
    dispatchedAt: new Date().toISOString(),
    broadcastCount: contacts?.length || 0,
    trackingMap: location
      ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
      : null,
  });
});

// ----------------------------------------------------
// ANALYTICS & FLEET DASHBOARD SUMMARY
// ----------------------------------------------------
app.get('/api/analytics/summary', (req: Request, res: Response) => {
  try {
    const totalRides: any = db.prepare('SELECT COUNT(*) as count, AVG(safety_score) as avgScore FROM rides').get();
    const totalIncidents: any = db.prepare('SELECT COUNT(*) as count FROM incidents').get();
    const cancelledAlerts: any = db.prepare('SELECT COUNT(*) as count FROM incidents WHERE cancelled = 1').get();
    const sosEvents: any = db.prepare('SELECT COUNT(*) as count FROM incidents WHERE sos_triggered = 1').get();
    const recentIncidents = db.prepare('SELECT * FROM incidents ORDER BY created_at DESC LIMIT 10').all();

    res.json({
      totalRides: totalRides?.count || 0,
      avgSafetyScore: Math.round(totalRides?.avgScore || 90),
      totalIncidents: totalIncidents?.count || 0,
      cancelledAlerts: cancelledAlerts?.count || 0,
      sosEvents: sosEvents?.count || 0,
      recentIncidents,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/safety-score', (req: Request, res: Response) => {
  try {
    const stats: any = db.prepare('SELECT AVG(safety_score) as fleetAverage, MIN(safety_score) as minScore, MAX(safety_score) as maxScore FROM rides').get();
    res.json({
      fleetAverage: Math.round(stats?.fleetAverage || 90),
      minScore: stats?.minScore || 80,
      maxScore: stats?.maxScore || 100,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// ROAD HAZARDS & CLUSTERING ENDPOINTS
// ----------------------------------------------------
app.get('/api/hazards', (req: Request, res: Response) => {
  try {
    const hazards = db.prepare('SELECT * FROM road_hazards ORDER BY report_count DESC, last_detected DESC').all();
    res.json(hazards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hazards', (req: Request, res: Response) => {
  const { type, latitude, longitude, severity, confidence, source, address, recommendedSpeedKmh } = req.body;
  if (!type || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Hazard type, latitude, and longitude required' });
  }

  try {
    const id = `hazard-${Date.now()}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO road_hazards (id, type, latitude, longitude, severity, confidence, report_count, first_detected, last_detected, status, source, address, recommended_speed_kmh)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 'TENTATIVE', ?, ?, ?)
    `).run(
      id,
      type,
      latitude,
      longitude,
      severity || 'MEDIUM',
      confidence || 85,
      now,
      now,
      source || 'SENSOR_AUTODETECT',
      address || null,
      recommendedSpeedKmh || 35
    );

    res.status(201).json({ success: true, hazardId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// TRIP PLANNER ENDPOINTS
// ----------------------------------------------------
app.get('/api/trips', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  try {
    const trips = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json(trips);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { name, startLocation, destination, totalDistanceKm, estimatedDurationMin, routePreference } = req.body;

  try {
    const tripId = `trip-${Date.now()}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO trips (id, user_id, name, start_latitude, start_longitude, dest_name, dest_latitude, dest_longitude, total_distance_km, estimated_duration_min, route_preference, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tripId,
      userId,
      name || 'Trip to ' + (destination?.name || 'Destination'),
      startLocation?.latitude || 0,
      startLocation?.longitude || 0,
      destination?.name || '',
      destination?.latitude || 0,
      destination?.longitude || 0,
      totalDistanceKm || 0,
      estimatedDurationMin || 0,
      routePreference || 'FASTEST',
      now
    );

    res.status(201).json({ success: true, tripId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🛡️ RideShield Backend & Emergency Gateway running on port ${PORT}`);
});

