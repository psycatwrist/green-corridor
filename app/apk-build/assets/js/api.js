/**
 * ==========================================================================
 * GREEN+ CORRIDOR - Central Fox Backend API Integration & Security Layer
 * File: js/api.js
 * Connects Web, Desktop CAD, and Android Mobile Terminals directly to the
 * Fox FastAPI backend (http://localhost:8000) with cryptographic tokens,
 * vehicle carkey security, live telemetry, and clearance queue synchronization.
 * ==========================================================================
 */

window.GC_API = (function() {
  const API_BASE = window.FOX_API_URL || 'http://localhost:8000';
  let isBackendReachable = true;
  let token = null;

  // Load existing token from session
  try {
    token = sessionStorage.getItem('gc_jwt_token');
  } catch(e) {}

  // Cryptographic SHA-256 helper for client-side hashing
  async function sha256(message) {
    if (!window.crypto || !window.crypto.subtle) {
      return message; // Fallback to plain if subtle crypto is not available in legacy environment
    }
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Request wrapper with timeout, CORS, and auth headers
  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 6000);

    try {
      const resp = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      isBackendReachable = true;

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.detail || `HTTP ${resp.status}`);
      }
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        isBackendReachable = false;
      }
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // 1. HEALTH & CONNECTIVITY
  // --------------------------------------------------------------------------
  async function checkHealth() {
    try {
      const data = await request('/', { timeout: 2000 });
      return data && data.status === 'online';
    } catch (e) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 2. DUAL-ROLE & DRIVER AUTHENTICATION
  // --------------------------------------------------------------------------
  async function login(code, key, keypass) {
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ code: parseInt(code), key, keypass })
      });

      if (data && data.code === 100 && data.token) {
        token = data.token;
        try {
          sessionStorage.setItem('gc_jwt_token', token);
          sessionStorage.setItem('gc_auth_role', data.role);
          sessionStorage.setItem('gc_entity_name', data.entity_name || '');
        } catch(e) {}
      }
      return data;
    } catch (err) {
      console.warn("Backend login failed, using resilient baseline", err);
      return null;
    }
  }

  async function driverLogin(id, password) {
    try {
      const data = await request('/auth/driver/login', {
        method: 'POST',
        body: JSON.stringify({ id, password })
      });

      if (data && data.code === 100 && data.token) {
        token = data.token;
        try {
          sessionStorage.setItem('gc_jwt_token', token);
          sessionStorage.setItem('gc_driver_app_session', JSON.stringify(data.profile));
        } catch(e) {}
      }
      return data;
    } catch (err) {
      if (isBackendReachable) {
        return { code: 401, error: err.message || "Invalid Driver ID or Password." };
      }
      console.warn("Driver login API unreachable", err);
      return null;
    }
  }

  async function verifyToken(jwtToken) {
    try {
      return await request('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token: jwtToken || token })
      });
    } catch (err) {
      return { valid: false, message: err.message };
    }
  }

  function setToken(newToken) {
    token = newToken;
    if (newToken) {
      try { sessionStorage.setItem('gc_jwt_token', newToken); } catch(e) {}
    } else {
      try { sessionStorage.removeItem('gc_jwt_token'); } catch(e) {}
    }
  }

  function getToken() {
    return token;
  }

  // --------------------------------------------------------------------------
  // 3. HOSPITALS & AMBULANCES REGISTRY
  // --------------------------------------------------------------------------
  async function getHospitals() {
    try {
      return await request('/hospitals');
    } catch (err) {
      console.warn("Could not fetch /hospitals from Fox API", err);
      return null;
    }
  }

  async function getHospitalDetail(key) {
    try {
      return await request(`/hospitals/${encodeURIComponent(key)}`);
    } catch (err) {
      console.warn(`Could not fetch hospital detail for '${key}'`, err);
      return null;
    }
  }

  async function getHospitalCars(key) {
    try {
      return await request(`/hospitals/${encodeURIComponent(key)}/cars`);
    } catch (err) {
      console.warn(`Could not fetch cars for '${key}'`, err);
      return null;
    }
  }

  async function getInServiceCars(key) {
    try {
      return await request(`/hospitals/${encodeURIComponent(key)}/cars/in-service`);
    } catch (err) {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // 4. EMERGENCY CLEARANCE LIFECYCLE (Page -> Fox Backend -> Another Page)
  // --------------------------------------------------------------------------
  async function submitClearance(payload) {
    try {
      return await request('/clearance/request', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Could not post clearance request to backend", err);
      return null;
    }
  }

  async function getClearanceRequests(filters = {}) {
    try {
      let query = '';
      if (filters.hospital_key) query += `?hospital_key=${encodeURIComponent(filters.hospital_key)}`;
      return await request(`/clearance/requests${query}`);
    } catch (err) {
      console.warn("Could not load clearance requests from backend", err);
      return null;
    }
  }

  async function grantClearance(requestId, notes = '') {
    try {
      return await request(`/clearance/${encodeURIComponent(requestId)}/grant`, {
        method: 'POST',
        body: JSON.stringify({ notes })
      });
    } catch (err) {
      console.warn(`Could not grant clearance for '${requestId}'`, err);
      return null;
    }
  }

  async function overrideClearance(requestId, newRouteKey, newRouteName, reason = '') {
    try {
      return await request(`/clearance/${encodeURIComponent(requestId)}/override`, {
        method: 'POST',
        body: JSON.stringify({
          new_route_key: newRouteKey,
          new_route_name: newRouteName,
          reason
        })
      });
    } catch (err) {
      console.warn(`Could not override clearance for '${requestId}'`, err);
      return null;
    }
  }

  async function getClearanceStatus(requestId) {
    try {
      return await request(`/clearance/${encodeURIComponent(requestId)}/status`);
    } catch (err) {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // 5. LIVE GPS TELEMETRY STREAM
  // --------------------------------------------------------------------------
  async function pushTelemetry(hospitalKey, carId, payload) {
    try {
      return await request(`/hospitals/${encodeURIComponent(hospitalKey)}/cars/${encodeURIComponent(carId)}/telemetry`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn(`Could not push telemetry for car '${carId}'`, err);
      return null;
    }
  }

  async function getLiveTelemetry() {
    try {
      return await request('/telemetry/live');
    } catch (err) {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // 6. OSRM DRIVING ROUTING & GREEN WAVE ETA
  // --------------------------------------------------------------------------
  async function getRoute(startLat, startLon, destLat, destLon, mode = 'emergency') {
    try {
      const q = `start_lat=${startLat}&start_lon=${startLon}&dest_lat=${destLat}&dest_lon=${destLon}&mode=${mode}`;
      return await request(`/routing/route?${q}`);
    } catch (err) {
      console.warn("Fox routing proxy unreachable, using direct OSRM with fallback", err);
      // Fallback: Query OSRM directly from browser
      return await directOsrmRoute(startLat, startLon, destLat, destLon, mode);
    }
  }

  async function directOsrmRoute(startLat, startLon, destLat, destLon, mode) {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${destLon},${destLat}?overview=full&geometries=geojson&steps=true`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("OSRM error");
      const data = await resp.json();
      if (data.routes && data.routes[0]) {
        const r = data.routes[0];
        const coords = r.geometry.coordinates.map(c => [c[1], c[0]]);
        const distKm = +(r.distance / 1000).toFixed(2);
        const durationSec = mode === 'emergency' ? Math.round(r.duration * 0.60) : Math.round(r.duration);
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        return {
          status: 'success',
          source: 'direct_osrm',
          coordinates: coords,
          distance_km: distKm,
          duration_seconds: durationSec,
          eta: `${mins}m ${secs}s`,
          mode
        };
      }
    } catch(e) {}

    // Resilient Jaipur straight curve fallback
    return {
      status: 'fallback',
      coordinates: [[startLat, startLon], [startLat + 0.005, startLon + 0.005], [destLat, destLon]],
      distance_km: 4.2,
      duration_seconds: 420,
      eta: "7m 0s",
      mode
    };
  }

  // --------------------------------------------------------------------------
  // 7. BACKGROUND SYNC POLLER (Page -> Backend -> Another Page Synchronization)
  // --------------------------------------------------------------------------
  let syncTimer = null;
  const syncListeners = {
    clearance: [],
    telemetry: []
  };

  function subscribeClearance(cb) {
    if (typeof cb === 'function') syncListeners.clearance.push(cb);
  }

  function subscribeTelemetry(cb) {
    if (typeof cb === 'function') syncListeners.telemetry.push(cb);
  }

  function startBackgroundSync(intervalMs = 2000) {
    if (syncTimer) return;
    syncTimer = setInterval(async () => {
      // 1. Sync Clearance Queue
      if (syncListeners.clearance.length > 0) {
        try {
          const reqs = await getClearanceRequests();
          if (reqs) {
            syncListeners.clearance.forEach(cb => {
              try { cb(reqs); } catch(e) {}
            });
          }
        } catch(e) {}
      }

      // 2. Sync Live Telemetry
      if (syncListeners.telemetry.length > 0) {
        try {
          const fleet = await getLiveTelemetry();
          if (fleet) {
            syncListeners.telemetry.forEach(cb => {
              try { cb(fleet); } catch(e) {}
            });
          }
        } catch(e) {}
      }
    }, intervalMs);
  }

  function stopBackgroundSync() {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  }

  return {
    API_BASE,
    sha256,
    checkHealth,
    login,
    driverLogin,
    verifyToken,
    setToken,
    getToken,
    getHospitals,
    getHospitalDetail,
    getHospitalCars,
    getInServiceCars,
    submitClearance,
    getClearanceRequests,
    grantClearance,
    overrideClearance,
    getClearanceStatus,
    pushTelemetry,
    getLiveTelemetry,
    getRoute,
    subscribeClearance,
    subscribeTelemetry,
    startBackgroundSync,
    stopBackgroundSync,
    isReachable: () => isBackendReachable
  };
})();
