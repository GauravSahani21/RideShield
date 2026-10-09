import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Shield,
  Activity,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Moon,
  Sun,
  Layers,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Bell,
  Cpu,
  BarChart3,
  Users,
  Flame,
} from 'lucide-react';

const themes = {
  light: {
    bg: '#f8fafc',
    sidebarBg: '#ffffff',
    sidebarBorder: '#e2e8f0',
    topbarBg: '#ffffff',
    topbarBorder: '#e2e8f0',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    cardHover: '#f8fafc',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    primary: '#0284c7',
    primaryLight: '#e0f2fe',
    success: '#10b981',
    successLight: '#ecfdf5',
    warning: '#f59e0b',
    warningLight: '#fffbeb',
    danger: '#ef4444',
    dangerLight: '#fef2f2',
    tableHeadBg: '#f1f5f9',
    tableRowBorder: '#f1f5f9',
    navActiveBg: '#e0f2fe',
    navActiveText: '#0284c7',
  },
  dark: {
    bg: '#090d16',
    sidebarBg: '#0f172a',
    sidebarBorder: '#1e293b',
    topbarBg: '#0f172a',
    topbarBorder: '#1e293b',
    cardBg: '#131d33',
    cardBorder: '#1e293b',
    cardHover: '#17233e',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    primary: '#38bdf8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    success: '#10b981',
    successLight: 'rgba(16, 185, 129, 0.15)',
    warning: '#f59e0b',
    warningLight: 'rgba(245, 158, 11, 0.15)',
    danger: '#ef4444',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    tableHeadBg: '#0b1120',
    tableRowBorder: '#1e293b',
    navActiveBg: 'rgba(56, 189, 248, 0.12)',
    navActiveText: '#38bdf8',
  },
};

function Dashboard() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('incidents');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState({
    totalRides: 12,
    avgSafetyScore: 91,
    totalIncidents: 4,
    cancelledAlerts: 3,
    sosEvents: 1,
    recentIncidents: [
      {
        id: 'inc-demo-1',
        event_type: 'POSSIBLE_CRASH',
        confidence: 94,
        severity: 'CRITICAL',
        countdown_seconds: 25,
        cancelled: 1,
        created_at: Date.now() - 3600000 * 2,
        latitude: 37.7749,
        longitude: -122.4194,
      },
      {
        id: 'inc-demo-2',
        event_type: 'HIGH_SIDE_CRASH',
        confidence: 96,
        severity: 'CRITICAL',
        countdown_seconds: 25,
        cancelled: 0,
        sos_triggered: 1,
        created_at: Date.now() - 3600000 * 5,
        latitude: 37.7760,
        longitude: -122.417,
      },
    ],
  });

  const t = isDark ? themes.dark : themes.light;

  const fetchData = () => {
    setIsRefreshing(true);
    fetch('http://localhost:4000/api/analytics/summary')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setIsRefreshing(false);
      })
      .catch(() => {
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 10000);
    return () => clearInterval(timer);
  }, []);

  const filteredIncidents = (data.recentIncidents || []).filter(
    (inc) =>
      inc.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.severity && inc.severity.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: t.bg,
        color: t.textPrimary,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* ----------------- SIDEBAR ----------------- */}
      <aside
        style={{
          width: 250,
          backgroundColor: t.sidebarBg,
          borderRight: `1px solid ${t.sidebarBorder}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Brand header */}
        <div
          style={{
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${t.sidebarBorder}`,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: t.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={22} color={t.primary} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>
              RideShield
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500 }}>
              Cloud Safety Console
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: 0.8, padding: '8px 10px' }}>
            TELEMETRY & OPERATIONS
          </div>

          <button
            onClick={() => setActiveTab('incidents')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: activeTab === 'incidents' ? t.navActiveBg : 'transparent',
              color: activeTab === 'incidents' ? t.navActiveText : t.textSecondary,
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'incidents' ? 700 : 500,
              fontSize: 13,
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Radio size={16} color={activeTab === 'incidents' ? t.primary : t.textMuted} />
              <span>Crash Incidents</span>
            </div>
            {data.totalIncidents > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 10,
                  backgroundColor: t.dangerLight,
                  color: t.danger,
                }}
              >
                {data.totalIncidents}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: activeTab === 'fleet' ? t.navActiveBg : 'transparent',
              color: activeTab === 'fleet' ? t.navActiveText : t.textSecondary,
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'fleet' ? 700 : 500,
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            <Activity size={16} color={activeTab === 'fleet' ? t.primary : t.textMuted} />
            <span>Active Fleet Status</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: activeTab === 'diagnostics' ? t.navActiveBg : 'transparent',
              color: activeTab === 'diagnostics' ? t.navActiveText : t.textSecondary,
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'diagnostics' ? 700 : 500,
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            <Cpu size={16} color={activeTab === 'diagnostics' ? t.primary : t.textMuted} />
            <span>Sensor Pipelines</span>
          </button>

          <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: 0.8, padding: '16px 10px 8px' }}>
            INTELLIGENCE
          </div>

          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: activeTab === 'analytics' ? t.navActiveBg : 'transparent',
              color: activeTab === 'analytics' ? t.navActiveText : t.textSecondary,
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'analytics' ? 700 : 500,
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            <BarChart3 size={16} color={activeTab === 'analytics' ? t.primary : t.textMuted} />
            <span>Safety Analytics</span>
          </button>
        </nav>

        {/* Sidebar footer telemetry pill */}
        <div
          style={{
            padding: 16,
            borderTop: `1px solid ${t.sidebarBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: t.success,
              boxShadow: `0 0 8px ${t.success}`,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700 }}>Telemetry Stream</div>
            <div style={{ fontSize: 10, color: t.textMuted }}>Port 4000 Connected</div>
          </div>
          <button
            onClick={fetchData}
            style={{
              background: 'none',
              border: 'none',
              color: t.textMuted,
              cursor: 'pointer',
              padding: 4,
            }}
            title="Refresh now"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </aside>

      {/* ----------------- MAIN AREA ----------------- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* TOP BAR */}
        <header
          style={{
            height: 64,
            backgroundColor: t.topbarBg,
            borderBottom: `1px solid ${t.topbarBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            flexShrink: 0,
          }}
        >
          {/* Breadcrumb / Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>
              Operations
            </span>
            <ChevronRight size={14} color={t.textMuted} />
            <span style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>
              Emergency SOS & Telematics Center
            </span>
          </div>

          {/* Right utilities: Search + Theme toggle + Gateway badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: isDark ? '#0b1120' : '#f1f5f9',
                borderRadius: 8,
                padding: '6px 12px',
                border: `1px solid ${t.cardBorder}`,
              }}
            >
              <Search size={14} color={t.textMuted} />
              <input
                type="text"
                placeholder="Search events, IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: t.textPrimary,
                  fontSize: 12,
                  width: 170,
                }}
              />
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                backgroundColor: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
                color: t.textSecondary,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
              title="Toggle Light / Dark mode"
            >
              {isDark ? <Sun size={14} color={t.warning} /> : <Moon size={14} color={t.primary} />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {/* Gateway Status Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: t.successLight,
                padding: '6px 12px',
                borderRadius: 20,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: t.success,
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: t.success }}>
                GATEWAY 4000 ONLINE
              </span>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main style={{ padding: '28px', flex: 1, overflowY: 'auto' }}>
          {/* Key Metric Highlights Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 16,
              marginBottom: 28,
            }}
          >
            {/* Metric 1 */}
            <div
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: '18px 20px',
                border: `1px solid ${t.cardBorder}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: 0.6 }}>
                  TOTAL MONITORED RIDES
                </span>
                <Activity size={16} color={t.primary} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: t.textPrimary }}>
                {data.totalRides}
              </div>
              <div style={{ fontSize: 11, color: t.primary, fontWeight: 600, marginTop: 4 }}>
                Active telematics telemetry
              </div>
            </div>

            {/* Metric 2 */}
            <div
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: '18px 20px',
                border: `1px solid ${t.cardBorder}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: 0.6 }}>
                  AVERAGE SAFETY SCORE
                </span>
                <Shield size={16} color={t.success} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: t.success }}>
                {data.avgSafetyScore}
                <span style={{ fontSize: 16, color: t.textMuted, fontWeight: 600 }}>/100</span>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, marginTop: 4 }}>
                Fleet low-risk profile
              </div>
            </div>

            {/* Metric 3 */}
            <div
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: '18px 20px',
                border: `1px solid ${t.cardBorder}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: 0.6 }}>
                  FALSE ALARMS CANCELLED
                </span>
                <CheckCircle2 size={16} color={t.primary} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: t.primary }}>
                {data.cancelledAlerts}
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, marginTop: 4 }}>
                Rider confirmed "I'M SAFE"
              </div>
            </div>

            {/* Metric 4 */}
            <div
              style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                padding: '18px 20px',
                border: `1px solid ${t.cardBorder}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: 0.6 }}>
                  AUTOMATED SOS SENT
                </span>
                <AlertTriangle size={16} color={t.danger} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: t.danger }}>
                {data.sosEvents}
              </div>
              <div style={{ fontSize: 11, color: t.danger, fontWeight: 600, marginTop: 4 }}>
                Unresponsive 25s timers
              </div>
            </div>
          </div>

          {/* Incidents Data Table Card */}
          <div
            style={{
              backgroundColor: t.cardBg,
              borderRadius: 14,
              border: `1px solid ${t.cardBorder}`,
              overflow: 'hidden',
            }}
          >
            {/* Table Card Header */}
            <div
              style={{
                padding: '18px 22px',
                borderBottom: `1px solid ${t.cardBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                  Live Incident & Telemetry Stream
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: t.textMuted }}>
                  Real-time feed of multi-axis crash signatures, buffer countdowns, and automated SOS broadcasts
                </p>
              </div>

              <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>
                Showing {filteredIncidents.length} recorded events
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: t.tableHeadBg,
                      borderBottom: `1px solid ${t.cardBorder}`,
                      color: t.textMuted,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                    }}
                  >
                    <th style={{ padding: '12px 20px' }}>TIMESTAMP</th>
                    <th style={{ padding: '12px 20px' }}>EVENT SIGNATURE</th>
                    <th style={{ padding: '12px 20px' }}>SEVERITY</th>
                    <th style={{ padding: '12px 20px' }}>CONFIDENCE</th>
                    <th style={{ padding: '12px 20px' }}>BUFFER STATE</th>
                    <th style={{ padding: '12px 20px' }}>GPS LOCATION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: t.textMuted }}>
                        No matching incidents recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((inc, i) => {
                      const isCrash =
                        inc.event_type.includes('CRASH') || inc.event_type.includes('ROLLOVER');
                      const isCancelled = inc.cancelled === 1;

                      return (
                        <tr
                          key={inc.id || i}
                          style={{
                            borderBottom: `1px solid ${t.tableRowBorder}`,
                            transition: 'background-color 0.1s ease',
                          }}
                        >
                          <td style={{ padding: '14px 20px', color: t.textSecondary, fontWeight: 500 }}>
                            {new Date(inc.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: isCrash ? t.danger : t.warning,
                                }}
                              />
                              <span style={{ fontWeight: 700, color: isCrash ? t.danger : t.warning }}>
                                {inc.event_type}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 6,
                                backgroundColor:
                                  inc.severity === 'CRITICAL' ? t.dangerLight : t.warningLight,
                                color: inc.severity === 'CRITICAL' ? t.danger : t.warning,
                              }}
                            >
                              {inc.severity || 'HIGH'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 20px', fontWeight: 700, color: t.primary }}>
                            {inc.confidence}%
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            {isCancelled ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  backgroundColor: t.successLight,
                                  color: t.success,
                                  padding: '4px 10px',
                                  borderRadius: 20,
                                  fontWeight: 700,
                                  fontSize: 11,
                                }}
                              >
                                <CheckCircle2 size={12} />
                                CANCELLED (SAFE)
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  backgroundColor: t.dangerLight,
                                  color: t.danger,
                                  padding: '4px 10px',
                                  borderRadius: 20,
                                  fontWeight: 700,
                                  fontSize: 11,
                                }}
                              >
                                <AlertTriangle size={12} />
                                SOS BROADCASTED
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            {inc.latitude ? (
                              <a
                                href={`https://maps.google.com/?q=${inc.latitude},${inc.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  color: t.primary,
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  fontSize: 12,
                                }}
                              >
                                <MapPin size={13} />
                                <span>
                                  {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                                </span>
                                <ExternalLink size={11} />
                              </a>
                            ) : (
                              <span style={{ color: t.textMuted }}>No GPS Lock</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard />);
