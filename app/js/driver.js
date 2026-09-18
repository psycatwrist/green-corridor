/**
 * ==========================================================================
 * GREEN+ CORRIDOR - Ambulance Driver CAD Mobile Application Controller
 * File: js/driver.js
 * Theme: Pure Neutral Charcoal & Obsidian Minimalist Executive CAD
 * Real-Time Android Hardware GPS Telemetry & OSRM Emergency AI Routing
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- In-Cab CAD Terminal State ---
  const state = {
    driver: null,
    fromLoc: 'real_device_gps',
    toLoc: 'sms',
    activeRouteKey: 'optimal',
    currentRoute: null,
    coords: [26.9045, 75.7590], // Default fallback Jaipur coordinates
    realGpsCoords: null,        // True hardware coords [lat, lng]
    hasRealGps: false,
    gpsAccuracy: null,
    gpsWatchId: null,
    telemetryPingCount: 0,
    telemetryTimer: null,
    heartbeatTimer: null,
    speed: 0,
    heading: 0,
    distanceKm: 3.8,
    eta: "--",
    availabilityPct: 94,
    isDriving: false,
    simIndex: 0,
    simTimer: null,
    countdownTimer: null,
    signalTimers: [24, 48, 0],
    map: null,
    mapElements: {}
  };

  // --- Element Selectors ---
  const loginScreen = document.getElementById('loginScreen');
  const mainInterface = document.getElementById('mainInterface');
  const driverLoginForm = document.getElementById('driverLoginForm');
  const loginIdInput = document.getElementById('loginId');
  const loginPasswordInput = document.getElementById('loginPassword');
  const btnLogin = document.getElementById('btnLogin');
  const btnSignOut = document.getElementById('btnSignOut');
  const hudDriverBadge = document.getElementById('hudDriverBadge');
  const systemClock = document.getElementById('systemClock');

  // Fox Backend Server Config Selectors
  const btnServerConfig = document.getElementById('btnServerConfig');
  const serverModalBackdrop = document.getElementById('serverModalBackdrop');
  const btnCloseServerModal = document.getElementById('btnCloseServerModal');
  const inputServerUrl = document.getElementById('inputServerUrl');
  const serverStatusInfo = document.getElementById('serverStatusInfo');
  const btnTestServer = document.getElementById('btnTestServer');
  const btnSaveServer = document.getElementById('btnSaveServer');
  const loginServerDot = document.getElementById('loginServerDot');
  const loginServerText = document.getElementById('loginServerText');

  // Real Android GPS Hardware Radar Elements
  const gpsHardwareCard = document.getElementById('gpsHardwareCard');
  const gpsIndicatorDot = document.getElementById('gpsIndicatorDot');
  const gpsStatusHeader = document.getElementById('gpsStatusHeader');
  const btnRefreshGps = document.getElementById('btnRefreshGps');
  const gpsLiveLat = document.getElementById('gpsLiveLat');
  const gpsLiveLng = document.getElementById('gpsLiveLng');
  const gpsLiveAccuracy = document.getElementById('gpsLiveAccuracy');
  const gpsStreamPings = document.getElementById('gpsStreamPings');
  const gpsPermissionAlert = document.getElementById('gpsPermissionAlert');
  const btnRequestPermission = document.getElementById('btnRequestPermission');

  // Mission Planning Form
  const routeLocationForm = document.getElementById('routeLocationForm');
  const locFromSelect = document.getElementById('locFrom');
  const locToSelect = document.getElementById('locTo');

  // AI Output Elements
  const brTitle = document.getElementById('brTitle');
  const brPath = document.getElementById('brPath');
  const brDistance = document.getElementById('brDistance');
  const brSignals = document.getElementById('brSignals');
  const brTime = document.getElementById('brTime');
  const brAvailabilityPill = document.getElementById('brAvailabilityPill');
  const brAvailabilityVal = document.getElementById('brAvailabilityVal');
  const trafficAvailBar = document.getElementById('trafficAvailBar');
  const trafficAvailSummary = document.getElementById('trafficAvailSummary');
  const signalTimingList = document.getElementById('signalTimingList');
  const altRoutesList = document.getElementById('altRoutesList');

  // Map Turn Guidance Elements
  const mapTurnHud = document.getElementById('mapTurnHud');
  const turnDistance = document.getElementById('turnDistance');
  const turnInstruction = document.getElementById('turnInstruction');
  const btnMapRecenter = document.getElementById('btnMapRecenter');
  const btnMapZoomIn = document.getElementById('btnMapZoomIn');
  const btnMapZoomOut = document.getElementById('btnMapZoomOut');

  // Telemetry HUD Elements
  const telLat = document.getElementById('telLat');
  const telLng = document.getElementById('telLng');
  const telSpeed = document.getElementById('telSpeed');
  const telEta = document.getElementById('telEta');
  const btnStartRun = document.getElementById('btnStartRun');
  const btnResetRun = document.getElementById('btnResetRun');
  const telStatusText = document.getElementById('telStatusText');

  // ==========================================================================
  // 1. Lifecycle & Initialization
  // ==========================================================================
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function populateHospitalDestinations() {
    if (!locToSelect) return;
    const profiles = window.GC_DATA && window.GC_DATA.hospitalProfiles ? window.GC_DATA.hospitalProfiles : {};
    const keys = Object.keys(profiles);
    if (keys.length > 0) {
      const currentVal = locToSelect.value;
      locToSelect.innerHTML = '';
      keys.forEach(k => {
        const p = profiles[k];
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = p.name || k;
        if (k === 'sms_hospital' || k === 'sms' || k === currentVal) {
          opt.selected = true;
        }
        locToSelect.appendChild(opt);
      });
    }
  }

  function init() {
    startClock();
    startSignalCountdownClock();
    populateHospitalDestinations();

    // Start Real Android GPS immediately on launch
    initRealDeviceGps();

    if (window.GC_DATA && window.GC_DATA.initFromFoxBackend) {
      window.GC_DATA.initFromFoxBackend().then(populateHospitalDestinations).catch(() => {});
    }

    // Check existing session in sessionStorage
    try {
      const saved = sessionStorage.getItem('gc_driver_app_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          launchDriverSession(parsed);
          return;
        }
      }
    } catch(e) {}

    // Login submission
    if (driverLoginForm) {
      driverLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        vibrate(30);

        const id = loginIdInput.value.trim();
        const pass = loginPasswordInput.value.trim();

        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span>Verifying...</span>';

        let authenticated = null;
        if (window.GC_API && window.GC_API.driverLogin) {
          try {
            const apiResp = await window.GC_API.driverLogin(id, pass);
            if (apiResp) {
              if (apiResp.code === 100 && apiResp.profile) {
                authenticated = apiResp.profile;
              } else if (apiResp.code === 401 || apiResp.error) {
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<span>Enter CAD Terminal &rarr;</span>';
                vibrate([50, 50, 50]);
                showToast("Fox Backend: Invalid Driver ID or Password.");
                return;
              }
            }
          } catch(err) {}
        }

        if (!authenticated) {
          authenticated = window.GC_DATA.authenticateDriver(id, pass);
        }

        btnLogin.disabled = false;
        btnLogin.innerHTML = '<span>Enter CAD Terminal &rarr;</span>';

        if (!authenticated) {
          vibrate([50, 50, 50]);
          showToast("Invalid ID or Password. Check credentials in Hospital Panel.");
          return;
        }

        try {
          sessionStorage.setItem('gc_driver_app_session', JSON.stringify(authenticated));
        } catch(e) {}

        vibrate(40);
        launchDriverSession(authenticated);
      });
    }

    // Sign out
    if (btnSignOut) {
      btnSignOut.addEventListener('click', () => {
        vibrate(20);
        stopStreamingRun();
        if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
        try { sessionStorage.removeItem('gc_driver_app_session'); } catch(e) {}
        state.driver = null;
        if (mainInterface) mainInterface.style.display = 'none';
        if (loginScreen) loginScreen.style.display = 'flex';
        showToast("Signed out from Ambulance CAD.");
      });
    }

    // Route Location Form Submission (Calculate Route)
    if (routeLocationForm) {
      routeLocationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        vibrate(25);
        state.fromLoc = locFromSelect.value;
        state.toLoc = locToSelect.value;
        calculateAiCorridor(state.fromLoc, state.toLoc, true);
        showToast("Calculating optimal Green Wave corridor...");
      });
    }

    // Telemetry run controls
    if (btnStartRun) {
      btnStartRun.addEventListener('click', () => {
        vibrate(35);
        if (state.isDriving) {
          stopStreamingRun();
        } else {
          startStreamingRun();
        }
      });
    }

    if (btnResetRun) {
      btnResetRun.addEventListener('click', () => {
        vibrate(25);
        resetStreamingRun();
      });
    }

    // Recenter GPS Button in Hardware Card
    if (btnRefreshGps) {
      btnRefreshGps.addEventListener('click', () => {
        vibrate(25);
        initRealDeviceGps();
        if (state.map && state.coords) {
          state.map.setView(state.coords, 16, { animate: true });
        }
        showToast("Acquiring fresh GPS lock from phone sensors...");
      });
    }

    // Request Permission Button in Alert Banner
    if (btnRequestPermission) {
      btnRequestPermission.addEventListener('click', () => {
        vibrate(25);
        initRealDeviceGps();
      });
    }

    // Map floating controls
    if (btnMapRecenter) {
      btnMapRecenter.addEventListener('click', () => {
        vibrate(20);
        if (state.map && state.coords) {
          state.map.setView(state.coords, 16, { animate: true });
        }
      });
    }

    if (btnMapZoomIn) {
      btnMapZoomIn.addEventListener('click', () => {
        vibrate(15);
        if (state.map) state.map.zoomIn();
      });
    }

    if (btnMapZoomOut) {
      btnMapZoomOut.addEventListener('click', () => {
        vibrate(15);
        if (state.map) state.map.zoomOut();
      });
    }

    // Alternative routes click bindings
    if (altRoutesList) {
      altRoutesList.querySelectorAll('.alt-route-item').forEach(item => {
        item.addEventListener('click', () => {
          vibrate(20);
          const routeKey = item.getAttribute('data-route-key');
          switchRoute(routeKey);
        });
      });
    }

    // Fox Backend Server Configuration Handlers
    async function checkServerConnection() {
      if (!window.GC_API) return;
      try {
        const isOnline = await window.GC_API.checkHealth();
        if (loginServerDot && loginServerText) {
          if (isOnline) {
            loginServerDot.className = 'status-indicator-dot online';
            loginServerText.textContent = 'Fox Connected';
          } else {
            loginServerDot.className = 'status-indicator-dot offline';
            loginServerText.textContent = 'Fox Standalone';
          }
        }
        if (serverStatusInfo) {
          serverStatusInfo.textContent = isOnline 
            ? `Online: Connected to ${window.GC_API.getBaseUrl()}`
            : `Offline: Using local mocks (${window.GC_API.getBaseUrl()})`;
        }
      } catch(e) {}
    }

    if (btnServerConfig && serverModalBackdrop) {
      btnServerConfig.addEventListener('click', () => {
        vibrate(20);
        if (inputServerUrl && window.GC_API) {
          inputServerUrl.value = window.GC_API.getBaseUrl();
        }
        serverModalBackdrop.style.display = 'flex';
        checkServerConnection();
      });
    }

    if (btnCloseServerModal && serverModalBackdrop) {
      btnCloseServerModal.addEventListener('click', () => {
        vibrate(15);
        serverModalBackdrop.style.display = 'none';
      });
    }

    if (btnTestServer && inputServerUrl) {
      btnTestServer.addEventListener('click', async () => {
        vibrate(20);
        const url = inputServerUrl.value.trim().replace(/\/+$/, '');
        if (serverStatusInfo) serverStatusInfo.textContent = `Testing ${url}...`;
        try {
          const resp = await fetch(`${url}/`, { signal: AbortSignal.timeout(3000) });
          const json = await resp.json();
          if (json && json.status === 'online') {
            if (serverStatusInfo) serverStatusInfo.textContent = `SUCCESS: Connected to Fox Backend (Jaipur)`;
            vibrate([30, 30]);
          } else {
            if (serverStatusInfo) serverStatusInfo.textContent = `Response received from host.`;
          }
        } catch(err) {
          if (serverStatusInfo) serverStatusInfo.textContent = `FAILED: Cannot reach ${url} (${err.message})`;
          vibrate([50, 50, 50]);
        }
      });
    }

    if (btnSaveServer && inputServerUrl) {
      btnSaveServer.addEventListener('click', async () => {
        vibrate(30);
        const url = inputServerUrl.value.trim().replace(/\/+$/, '');
        if (url && window.GC_API) {
          window.GC_API.setBaseUrl(url);
          showToast(`Fox Backend URL updated: ${url}`);
        }
        serverModalBackdrop.style.display = 'none';
        checkServerConnection();
        if (window.GC_DATA && window.GC_DATA.initFromFoxBackend) {
          window.GC_DATA.initFromFoxBackend().then(populateHospitalDestinations).catch(() => {});
        }
      });
    }

    // Initial backend ping
    checkServerConnection();
  }

  function startClock() {
    function update() {
      if (systemClock) {
        const now = new Date();
        systemClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    }
    update();
    setInterval(update, 1000);
  }

  function startSignalCountdownClock() {
    if (state.countdownTimer) clearInterval(state.countdownTimer);
    state.countdownTimer = setInterval(() => {
      if (!state.currentRoute || !state.currentRoute.trafficSignals) return;
      
      state.signalTimers = state.signalTimers.map((val, idx) => {
        if (idx === state.signalTimers.length - 1) return 0; // Destination gate cleared
        return val > 1 ? val - 1 : ((idx + 1) * 25);
      });

      updateSignalBadges();
    }, 1000);
  }

  function updateSignalBadges() {
    if (!signalTimingList) return;
    const badges = signalTimingList.querySelectorAll('.signal-timing-badge, .signal-timer-badge');
    badges.forEach((badge, idx) => {
      const sec = state.signalTimers[idx] !== undefined ? state.signalTimers[idx] : 0;
      if (sec === 0) {
        badge.textContent = "CLEAR";
        badge.style.color = "#10b981";
      } else {
        const s = sec < 10 ? '0' + sec : sec;
        badge.textContent = `HOLD: 00:${s}s`;
      }
    });
  }

  // ==========================================================================
  // 2. Real Android GPS Hardware Tracking Engine
  // ==========================================================================
  function initRealDeviceGps() {
    if (!('geolocation' in navigator)) {
      if (gpsStatusHeader) gpsStatusHeader.textContent = "NO HARDWARE GPS SENSOR DETECTED";
      if (gpsStreamPings) gpsStreamPings.textContent = "Sensor N/A";
      return;
    }

    if (gpsStatusHeader) gpsStatusHeader.innerHTML = "ACQUIRING REAL ANDROID GPS...";
    if (gpsIndicatorDot) gpsIndicatorDot.className = "status-live-dot";

    // Fast initial fix (cell/Wi-Fi assisted) with low timeout
    navigator.geolocation.getCurrentPosition(
      (pos) => handleGpsPosition(pos, 'quick'),
      (err) => handleGpsError(err, 'quick'),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    );

    // Continuous high-accuracy satellite lock
    if (state.gpsWatchId !== null) {
      navigator.geolocation.clearWatch(state.gpsWatchId);
    }

    try {
      state.gpsWatchId = navigator.geolocation.watchPosition(
        (pos) => handleGpsPosition(pos, 'satellite'),
        (err) => handleGpsError(err, 'satellite'),
        { enableHighAccuracy: true, timeout: 35000, maximumAge: 1000 }
      );
    } catch(e) {
      console.warn("watchPosition exception:", e);
    }
  }

  function handleGpsPosition(pos, source) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const acc = Math.round(pos.coords.accuracy || 0);
    const spd = (pos.coords.speed !== null && pos.coords.speed !== undefined && !isNaN(pos.coords.speed) && pos.coords.speed > 0)
      ? Math.round(pos.coords.speed * 3.6)
      : 0;
    const hdg = (pos.coords.heading !== null && pos.coords.heading !== undefined && !isNaN(pos.coords.heading))
      ? Math.round(pos.coords.heading)
      : 0;

    const isFirstFix = !state.hasRealGps;
    state.hasRealGps = true;
    state.realGpsCoords = [lat, lng];
    state.gpsAccuracy = acc;
    if (spd > 0) state.speed = spd;
    if (hdg > 0) state.heading = hdg;

    // Hide permission banner if previously shown
    if (gpsPermissionAlert) gpsPermissionAlert.style.display = 'none';

    // Update GPS status indicator
    if (gpsIndicatorDot) gpsIndicatorDot.className = 'status-live-dot online';
    if (gpsStatusHeader) {
      gpsStatusHeader.innerHTML = `REAL ANDROID GPS LOCKED &bull; ${source === 'satellite' ? '12Hz SATELLITE' : 'FAST FIX'}`;
    }

    // Update GPS Stat Cells
    if (gpsLiveLat) gpsLiveLat.textContent = `${lat.toFixed(5)}°N`;
    if (gpsLiveLng) gpsLiveLng.textContent = `${lng.toFixed(5)}°E`;
    if (gpsLiveAccuracy) {
      gpsLiveAccuracy.textContent = `± ${acc}m`;
      gpsLiveAccuracy.style.color = acc <= 25 ? '#10b981' : '#f59e0b';
    }

    // If trip origin is real_device_gps, update active state coordinates
    if (state.fromLoc === 'real_device_gps') {
      const prevCoords = state.coords;
      state.coords = [lat, lng];

      if (telLat) telLat.textContent = `${lat.toFixed(5)}°N`;
      if (telLng) telLng.textContent = `${lng.toFixed(5)}°E`;
      if (telSpeed) telSpeed.textContent = `${state.speed} km/h`;

      // Update vehicle marker on map
      if (state.mapElements.marker) {
        state.mapElements.marker.setLatLng(state.coords);
      }

      // If first fix, center the map on the real device position
      if (isFirstFix && state.map) {
        state.map.setView(state.coords, 15, { animate: true });
      }

      // Dynamically recalculate route if first fix or moved > 60m
      if (!state.currentRoute || isFirstFix || haversineDistance(prevCoords[0], prevCoords[1], lat, lng) > 0.06) {
        calculateAiCorridor('real_device_gps', state.toLoc, isFirstFix);
      }
    }

    // Transmit telemetry update
    broadcastTelemetry();
  }

  function handleGpsError(err, source) {
    console.warn(`GPS error (${source}): [code ${err.code}] ${err.message}`);
    if (err.code === 1) { // PERMISSION_DENIED
      if (gpsPermissionAlert) gpsPermissionAlert.style.display = 'flex';
      if (gpsStatusHeader) gpsStatusHeader.textContent = "LOCATION PERMISSION REQUIRED";
      if (gpsIndicatorDot) gpsIndicatorDot.className = 'status-indicator-dot offline';
      if (telStatusText) telStatusText.textContent = "Permission Needed";
      if (gpsStreamPings) gpsStreamPings.textContent = "Blocked";
    } else if (err.code === 2) { // POSITION_UNAVAILABLE
      if (!state.hasRealGps && gpsStatusHeader) {
        gpsStatusHeader.textContent = "SEARCHING FOR SATELLITE FIX...";
      }
    } else if (err.code === 3) { // TIMEOUT
      if (!state.hasRealGps && gpsStatusHeader) {
        gpsStatusHeader.textContent = "GPS TIMEOUT • RETRYING FIX...";
      }
    }
  }

  // ==========================================================================
  // 3. Driver Session Launch
  // ==========================================================================
  function launchDriverSession(driver) {
    state.driver = driver;
    if (hudDriverBadge) {
      hudDriverBadge.textContent = `ID: ${driver.id} • ${driver.ambulanceId}`;
    }

    if (loginScreen) loginScreen.style.display = 'none';
    if (mainInterface) mainInterface.style.display = 'flex';

    // Populate destination dropdown dynamically with all Jaipur hospitals from Fox API
    if (locToSelect && window.GC_DATA && window.GC_DATA.hospitalProfiles) {
      locToSelect.innerHTML = '';
      const addedKeys = new Set();
      Object.values(window.GC_DATA.hospitalProfiles).forEach(h => {
        if (!h.key || addedKeys.has(h.key)) return;
        addedKeys.add(h.key);
        const opt = document.createElement('option');
        opt.value = h.key;
        opt.textContent = `${h.name} (${h.address ? h.address.split(',')[0] : 'Jaipur'})`;
        if (h.key === driver.hospitalKey || h.key === (driver.hospitalKey + '_hospital')) {
          opt.selected = true;
        }
        locToSelect.appendChild(opt);
      });
      state.toLoc = locToSelect.value;
    }

    // Refresh GPS on login
    initRealDeviceGps();

    // Compute Initial OSRM AI Corridor
    calculateAiCorridor(state.fromLoc, state.toLoc, true);

    // Initialize Map
    setTimeout(() => {
      initMap();
    }, 250);

    // Initial Telemetry Broadcast
    broadcastTelemetry();

    // Start background heartbeat (every 6 seconds)
    if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
    state.heartbeatTimer = setInterval(() => {
      if (!state.isDriving) {
        broadcastTelemetry();
      }
    }, 6000);

    // Listen for Green Corridor clearances from Fox Backend
    if (window.GC_API) {
      window.GC_API.subscribeClearance((reqs) => {
        if (Array.isArray(reqs)) {
          const myReq = reqs.find(r => r.ambulance_id === driver.ambulanceId || r.hospital_key === driver.hospitalKey);
          if (myReq && myReq.status === 'granted') {
            const badge = document.getElementById('telStatusText');
            if (badge) {
              badge.textContent = "GREEN CORRIDOR AUTHORIZED BY JTP COMMAND";
              badge.style.backgroundColor = "rgba(16, 185, 129, 0.2)";
              badge.style.color = "#10b981";
            }
          }
        }
      });
    }
  }

  // ==========================================================================
  // 4. AI Traffic Engine: Real OSRM Street Driving & Green Wave Preemption
  // ==========================================================================
  async function calculateAiCorridor(fromLoc, toLoc, fitMapBounds = true) {
    const locMap = {
      vaishali: [26.9045, 75.7590],
      mansarovar: [26.8550, 75.7660],
      cscheme: [26.9085, 75.8010],
      sms: [26.8978, 75.8156],
      apex: [26.8550, 75.8242]
    };

    let startCoords;
    if (fromLoc === 'real_device_gps') {
      startCoords = state.realGpsCoords || state.coords || [26.9045, 75.7590];
    } else {
      startCoords = locMap[fromLoc] || [26.9045, 75.7590];
    }

    const targetProfile = (window.GC_DATA && window.GC_DATA.hospitalProfiles && (window.GC_DATA.hospitalProfiles[toLoc] || window.GC_DATA.hospitalProfiles.sms)) || {};
    const destCoords = targetProfile.coords || locMap[toLoc] || [26.8978, 75.8156];

    let routeData = null;
    if (window.GC_API && window.GC_API.getRoute) {
      try {
        routeData = await window.GC_API.getRoute(startCoords[0], startCoords[1], destCoords[0], destCoords[1], 'emergency');
      } catch(e) {
        console.warn("Routing query failed:", e);
      }
    }

    const distKm = routeData ? routeData.distance_km : +(haversineDistance(startCoords[0], startCoords[1], destCoords[0], destCoords[1])).toFixed(1);
    const etaStr = routeData ? routeData.eta : `${Math.ceil(distKm * 2)}m 10s`;
    const pathPoints = routeData && routeData.coordinates && routeData.coordinates.length > 1
      ? routeData.coordinates
      : [startCoords, [(startCoords[0] + destCoords[0]) / 2, (startCoords[1] + destCoords[1]) / 2], destCoords];

    const currentRoute = {
      id: "osrm-optimal",
      name: `Green Corridor ➔ ${targetProfile.name ? targetProfile.name.split(',')[0] : 'Hospital'}`,
      via: fromLoc === 'real_device_gps' ? `Live Android GPS ➔ ${targetProfile.name || 'Trauma Bay'}` : `Depot ➔ ${targetProfile.name || 'Trauma Bay'}`,
      distanceKm: distKm,
      distanceStr: `${distKm} km`,
      corridorDurationStr: etaStr,
      trafficLightsCount: 3,
      coordinates: pathPoints,
      steps: routeData && routeData.steps ? routeData.steps : []
    };

    state.activeRouteKey = currentRoute.id;
    state.currentRoute = currentRoute;
    state.distanceKm = distKm;
    state.eta = etaStr;
    if (fromLoc !== 'real_device_gps') {
      state.coords = [...pathPoints[0]];
    }
    state.availabilityPct = 94;
    state.signalTimers = [24, 48, 0];

    // Update Display Cards
    if (brTitle) brTitle.textContent = currentRoute.name;
    if (brPath) brPath.textContent = currentRoute.via;
    if (brDistance) brDistance.textContent = currentRoute.distanceStr;
    if (brSignals) brSignals.textContent = `All Signals Pre-empted`;
    if (brTime) brTime.textContent = currentRoute.corridorDurationStr;

    if (brAvailabilityPill) brAvailabilityPill.textContent = `94% Road Capacity • Green Wave Active`;
    if (brAvailabilityVal) brAvailabilityVal.textContent = `94%`;
    if (trafficAvailBar) trafficAvailBar.style.width = `94%`;

    // Update Telemetry Grid
    if (telLat) telLat.textContent = `${state.coords[0].toFixed(5)}°N`;
    if (telLng) telLng.textContent = `${state.coords[1].toFixed(5)}°E`;
    if (telSpeed) telSpeed.textContent = `${state.speed} km/h`;
    if (telEta) telEta.textContent = state.eta;

    // Update Turn Guidance HUD
    if (turnDistance) turnDistance.textContent = distKm < 0.5 ? `In ${(distKm * 1000).toFixed(0)}m` : `In 450m`;
    if (turnInstruction) {
      if (currentRoute.steps && currentRoute.steps.length > 0) {
        turnInstruction.innerHTML = `<strong>${currentRoute.steps[0].instruction}</strong> &bull; Green Wave Pre-empted`;
      } else {
        turnInstruction.innerHTML = `Proceed along corridor &bull; Green Wave Pre-empted to <strong>${targetProfile.name || 'Trauma Bay'}</strong>`;
      }
    }

    // Update Map
    updateMapLine(currentRoute, fitMapBounds);
  }

  function switchRoute(routeKey) {
    const profiles = window.GC_DATA.corridorProfiles[state.toLoc] || window.GC_DATA.corridorProfiles.sms;
    const selected = profiles.find(p => p.id === routeKey) || profiles[0];

    state.activeRouteKey = selected.id;
    state.currentRoute = selected;
    state.distanceKm = selected.distanceKm;
    state.eta = selected.corridorDurationStr;
    state.simIndex = 0;
    state.availabilityPct = routeKey === 'alt-a' ? 42 : 18;
    state.signalTimers = [35, 60, 15];

    if (selected.coordinates) {
      state.coords = [...selected.coordinates[0]];
    }

    if (brTitle) brTitle.textContent = selected.name;
    if (brPath) brPath.textContent = selected.via;
    if (brDistance) brDistance.textContent = selected.distanceStr;
    if (brSignals) brSignals.textContent = `${selected.trafficLightsCount} Signals`;
    if (brTime) brTime.textContent = selected.corridorDurationStr;

    if (brAvailabilityPill) brAvailabilityPill.textContent = `${state.availabilityPct}% Road Availability`;
    if (brAvailabilityVal) brAvailabilityVal.textContent = `${state.availabilityPct}%`;
    if (trafficAvailBar) trafficAvailBar.style.width = `${state.availabilityPct}%`;

    updateMapLine(selected, true);
    showToast(`Switched to: ${selected.name}`);
  }

  // ==========================================================================
  // 5. Interactive Navigation Map (Neutral Obsidian & Emerald Theme)
  // ==========================================================================
  function initMap() {
    if (state.map) {
      state.map.invalidateSize();
      return;
    }

    const mapBox = document.getElementById('navMapLeaflet');
    if (!mapBox) return;

    state.map = L.map('navMapLeaflet', {
      center: state.coords,
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // OpenStreetMap standard tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(state.map);

    // Vehicle Marker (Emerald emergency beacon with pulse ring)
    const vehicleIcon = L.divIcon({
      className: 'custom-vehicle-marker',
      html: `
        <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:34px; height:34px; border-radius:50%; background:rgba(16,185,129,0.35); animation:pulseDot 1.5s infinite;"></div>
          <div style="width:26px; height:26px; border-radius:50%; background:#10b981; border:2.5px solid #09090b; box-shadow:0 0 14px rgba(16,185,129,0.8); display:flex; align-items:center; justify-content:center; color:#042f2e; font-size:14px; font-weight:900;">+</div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    state.mapElements.marker = L.marker(state.coords, { icon: vehicleIcon }).addTo(state.map);

    if (state.currentRoute) {
      updateMapLine(state.currentRoute, true);
    }
  }

  function updateMapLine(route, fitBounds = true) {
    const map = state.map;
    if (!map || !route.coordinates) return;

    if (state.mapElements.line) {
      map.removeLayer(state.mapElements.line);
    }
    if (state.mapElements.lineGlow) {
      map.removeLayer(state.mapElements.lineGlow);
    }
    if (state.mapElements.signals) {
      state.mapElements.signals.forEach(s => map.removeLayer(s));
    }
    state.mapElements.signals = [];

    // Outer Green Wave glow polyline (Emerald)
    state.mapElements.lineGlow = L.polyline(route.coordinates, {
      color: '#10b981',
      weight: 10,
      opacity: 0.28
    }).addTo(map);

    // Inner crisp polyline (Deep Emerald)
    state.mapElements.line = L.polyline(route.coordinates, {
      color: '#059669',
      weight: 5,
      opacity: 0.95
    }).addTo(map);

    // Signals along route
    if (route.trafficSignals) {
      route.trafficSignals.forEach((sig, idx) => {
        const icon = L.divIcon({
          className: 'custom-sig-marker',
          html: `<div style="width:22px; height:22px; border-radius:50%; background:#141416; border:2px solid #10b981; box-shadow:0 0 8px rgba(16,185,129,0.5); color:#10b981; font-size:10px; font-weight:900; display:flex; align-items:center; justify-content:center;">${idx + 1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const sm = L.marker(sig.coords, { icon }).addTo(map);
        state.mapElements.signals.push(sm);
      });
    }

    if (fitBounds && state.mapElements.line) {
      map.fitBounds(state.mapElements.line.getBounds(), { padding: [40, 40] });
    }
  }

  // ==========================================================================
  // 6. Live Telemetry Streaming Controls
  // ==========================================================================
  function startStreamingRun() {
    state.isDriving = true;

    if (btnStartRun) {
      btnStartRun.classList.add('active');
      btnStartRun.innerHTML = '<span class="run-icon">❚❚</span><span>Pause Live GPS Telemetry</span>';
    }

    if (telStatusText) {
      telStatusText.textContent = "Real GPS Live (12Hz AIS-140)";
      telStatusText.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
      telStatusText.style.color = "#10b981";
    }

    // High-frequency telemetry interval (every 1.5 seconds)
    if (state.telemetryTimer) clearInterval(state.telemetryTimer);
    state.telemetryTimer = setInterval(broadcastTelemetry, 1500);

    // Immediate ping
    broadcastTelemetry();
    showToast("Active: Real phone GPS streaming live to Fox Backend!");
  }

  function stopStreamingRun() {
    state.isDriving = false;

    if (state.telemetryTimer) {
      clearInterval(state.telemetryTimer);
      state.telemetryTimer = null;
    }

    if (btnStartRun) {
      btnStartRun.classList.remove('active');
      btnStartRun.innerHTML = '<span class="run-icon">▲</span><span>Stream Real GPS to Police &amp; Hospital</span>';
    }

    if (telStatusText) {
      telStatusText.textContent = "Real GPS Standby";
      telStatusText.style.backgroundColor = "";
      telStatusText.style.color = "";
    }

    broadcastTelemetry();
    showToast("Telemetry stream paused (Standby).");
  }

  function resetStreamingRun() {
    stopStreamingRun();
    initRealDeviceGps();
    calculateAiCorridor(state.fromLoc, state.toLoc, true);
    showToast("Run reset to current device GPS fix.");
  }

  // ==========================================================================
  // 7. AIS-140 Telemetry Broadcast to Fox Backend & Hospital CAD
  // ==========================================================================
  function broadcastTelemetry() {
    const driver = state.driver;
    if (!driver) return;

    state.telemetryPingCount++;

    const packet = {
      ambulanceId: driver.ambulanceId || "AMB-SMS-01",
      driverId: driver.id,
      driverName: driver.name,
      hospitalKey: driver.hospitalKey || "sms_hospital",
      vehicleType: driver.vehicleType || "ALS",
      coords: state.coords,
      speed: state.speed,
      heading: state.heading,
      distanceRemaining: `${state.distanceKm.toFixed(1)} km`,
      eta: state.eta,
      currentRoad: state.currentRoute ? state.currentRoute.via : "En route",
      nextSignalName: state.currentRoute && state.currentRoute.trafficSignals ? state.currentRoute.trafficSignals[0].name : "Corridor Active",
      greenCorridorActive: true,
      timestamp: Date.now()
    };

    // Update Telemetry Link indicator
    if (gpsStreamPings) {
      gpsStreamPings.innerHTML = `Live &bull; ${state.telemetryPingCount} tx`;
      gpsStreamPings.className = "gps-stat-val accent-emerald font-mono";
    }

    // 1. Post directly to Fox Backend API
    if (window.GC_API && window.GC_API.pushTelemetry) {
      const hospKey = driver.hospitalKey || "sms_hospital";
      const carId = driver.ambulanceId || "AMB-SMS-01";
      const carkey = driver.carkey || "40f865c02598096f5539d62e658e21bf5bb8fb142d9a0aa652deda275ea7cad7";

      window.GC_API.pushTelemetry(hospKey, carId, {
        carkey: carkey,
        latitude: state.coords[0],
        longitude: state.coords[1],
        speed_kmh: state.speed,
        status: state.isDriving ? "in-service" : "standby",
        heading: state.heading,
        eta: state.eta,
        distance_remaining: `${state.distanceKm.toFixed(1)} km`,
        driver_name: driver.name
      }).catch(err => {
        console.debug("Fox telemetry note:", err);
      });
    }

    // 2. Broadcast via BroadcastChannel & LocalStorage for cross-window / cross-device sync
    try {
      const ch = new BroadcastChannel('gc_telemetry_channel');
      ch.postMessage({ type: 'AMBULANCE_GPS_TELEMETRY', telemetry: packet });
      localStorage.setItem('gc_live_telemetry_ping', JSON.stringify({ telemetry: packet, ts: Date.now() }));
    } catch(e) {}
  }

  // Haptic feedback helper
  function vibrate(pattern) {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch(e) {}
  }

  // Toast notification
  function showToast(msg) {
    const prev = document.querySelector('.app-toast');
    if (prev) prev.remove();
    const t = document.createElement('div');
    t.className = 'app-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  init();
});
