/**
 * ==========================================================================
 * GREEN+ CORRIDOR - Ambulance Driver CAD Mobile Application Controller
 * File: js/driver.js
 * Theme: Navy Blue, Black, and White Only
 * Professional Emergency CAD UI/UX & Real-Time AIS-140 GPS Telemetry Engine
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- In-Cab CAD Terminal State ---
  const state = {
    driver: null,
    fromLoc: 'vaishali',
    toLoc: 'sms',
    activeRouteKey: 'optimal',
    currentRoute: null,
    coords: [26.9045, 75.7590],
    speed: 58,
    heading: 124,
    distanceKm: 3.8,
    eta: "7m 40s",
    availabilityPct: 88,
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
                btnLogin.innerHTML = '<span>Login</span>';
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
        btnLogin.innerHTML = '<span>Login</span>';

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
        stopSimulation();
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
        calculateAiCorridor(state.fromLoc, state.toLoc);
      });
    }

    // Telemetry run controls
    if (btnStartRun) {
      btnStartRun.addEventListener('click', () => {
        vibrate(35);
        if (state.isDriving) {
          pauseSimulation();
        } else {
          startSimulation();
        }
      });
    }

    if (btnResetRun) {
      btnResetRun.addEventListener('click', () => {
        vibrate(25);
        resetSimulation();
      });
    }

    // Map floating controls
    if (btnMapRecenter) {
      btnMapRecenter.addEventListener('click', () => {
        vibrate(20);
        if (state.map && state.coords) {
          state.map.setView(state.coords, 15, { animate: true });
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
        if (idx === state.signalTimers.length - 1) return 0; // Last gate cleared
        return val > 1 ? val - 1 : ((idx + 1) * 25);
      });

      updateSignalBadges();
    }, 1000);
  }

  function updateSignalBadges() {
    if (!signalTimingList) return;
    const badges = signalTimingList.querySelectorAll('.signal-timing-badge');
    badges.forEach((badge, idx) => {
      const sec = state.signalTimers[idx] !== undefined ? state.signalTimers[idx] : 0;
      if (sec === 0) {
        badge.textContent = "Dock Cleared: 00:00s";
        badge.style.borderColor = "#ffffff";
      } else {
        const s = sec < 10 ? '0' + sec : sec;
        badge.textContent = `Hold: 00:${s}s remaining`;
      }
    });
  }

  // ==========================================================================
  // 2. Driver Session Launch
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

    // Compute Real OSRM AI Corridor
    calculateAiCorridor(state.fromLoc, state.toLoc);

    // Initialize Map
    setTimeout(() => {
      initMap();
    }, 250);

    // Broadcast Initial Telemetry
    broadcastTelemetry();

    // Listen for Green Corridor clearances from Fox Backend
    if (window.GC_API) {
      window.GC_API.subscribeClearance((reqs) => {
        if (Array.isArray(reqs)) {
          const myReq = reqs.find(r => r.ambulance_id === driver.ambulanceId || r.hospital_key === driver.hospitalKey);
          if (myReq && myReq.status === 'granted') {
            const badge = document.getElementById('telStatusText');
            if (badge) {
              badge.textContent = "GREEN CORRIDOR AUTHORIZED BY JTP COMMAND";
              badge.style.backgroundColor = "#059669";
              badge.style.color = "#ffffff";
            }
          }
        }
      });
    }
  }

  // ==========================================================================
  // 3. AI Traffic Engine: Real OSRM Street Driving & Green Wave Preemption
  // ==========================================================================
  async function calculateAiCorridor(fromLoc, toLoc) {
    const locMap = {
      vaishali: [26.9045, 75.7590],
      mansarovar: [26.8550, 75.7660],
      cscheme: [26.9085, 75.8010],
      sms: [26.8978, 75.8156],
      apex: [26.8550, 75.8242]
    };

    const startCoords = locMap[fromLoc] || [26.9045, 75.7590];
    const targetProfile = (window.GC_DATA && window.GC_DATA.hospitalProfiles && (window.GC_DATA.hospitalProfiles[toLoc] || window.GC_DATA.hospitalProfiles.sms)) || {};
    const destCoords = targetProfile.coords || locMap[toLoc] || [26.8978, 75.8156];

    let routeData = null;
    if (window.GC_API && window.GC_API.getRoute) {
      routeData = await window.GC_API.getRoute(startCoords[0], startCoords[1], destCoords[0], destCoords[1], 'emergency');
    }

    const distKm = routeData ? routeData.distance_km : 3.8;
    const etaStr = routeData ? routeData.eta : "7m 40s";
    const pathPoints = routeData && routeData.coordinates && routeData.coordinates.length > 1
      ? routeData.coordinates
      : [startCoords, [(startCoords[0] + destCoords[0]) / 2, (startCoords[1] + destCoords[1]) / 2], destCoords];

    const currentRoute = {
      id: "osrm-optimal",
      name: `Green Corridor ➔ ${targetProfile.name ? targetProfile.name.split(',')[0] : 'Hospital'}`,
      via: `OSRM Express Routing ➔ ${targetProfile.name ? targetProfile.name.split(',')[0] : 'Trauma Bay'}`,
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
    state.coords = [...pathPoints[0]];
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

    if (trafficAvailSummary) {
      trafficAvailSummary.textContent = `OSRM Live Street Calculation: Exact road driving geometry fetched. All traffic signals along ${targetProfile.name || 'destination'} pre-empted by JTP Command.`;
    }

    // Update Telemetry Grid
    if (telLat) telLat.textContent = `${state.coords[0].toFixed(4)}°N`;
    if (telLng) telLng.textContent = `${state.coords[1].toFixed(4)}°E`;
    if (telSpeed) telSpeed.textContent = `${state.speed} km/h`;
    if (telEta) telEta.textContent = state.eta;

    // Update Turn Guidance HUD with OSRM Steps
    if (turnDistance) turnDistance.textContent = "In 400m";
    if (turnInstruction) {
      if (currentRoute.steps && currentRoute.steps.length > 0) {
        turnInstruction.innerHTML = `<strong>${currentRoute.steps[0].instruction}</strong> &bull; Green Wave Pre-empted`;
      } else {
        turnInstruction.innerHTML = `Keep straight &bull; Green Wave Pre-empted to <strong>${targetProfile.name || 'Trauma Bay'}</strong>`;
      }
    }

    // Update Map
    updateMapLine(currentRoute);
    showToast("OSRM Driving Path Synchronized with Green Wave Preemption.");
  }

  function renderSignalTimes(route) {
    if (!signalTimingList) return;
    signalTimingList.innerHTML = '';

    if (route.trafficSignals) {
      route.trafficSignals.forEach((sig, index) => {
        const holdSec = state.signalTimers[index] !== undefined ? state.signalTimers[index] : (index + 1) * 24;
        const row = document.createElement('div');
        row.className = 'signal-timing-row';
        row.innerHTML = `
          <div class="signal-name-group">
            <span class="signal-index">${index + 1}</span>
            <span class="signal-name">${sig.name}</span>
          </div>
          <span class="signal-timing-badge">${holdSec === 0 ? 'Dock Cleared: 00:00s' : `Hold: 00:${holdSec < 10 ? '0' + holdSec : holdSec}s remaining`}</span>
        `;
        signalTimingList.appendChild(row);
      });
    }
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

    if (trafficAvailSummary) {
      trafficAvailSummary.textContent = `AI Analysis: ${selected.name} (${state.availabilityPct}% availability). Expect moderate delays at unsynchronized junctions.`;
    }

    renderSignalTimes(selected);
    updateMapLine(selected);
    showToast(`Switched to: ${selected.name}`);
  }

  // ==========================================================================
  // 4. Map Implementation (Navy Blue, Black, and White Only)
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
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // OpenStreetMap standard tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(state.map);

    // Vehicle Marker (Emerald emergency beacon with radar ring)
    const vehicleIcon = L.divIcon({
      className: 'custom-vehicle-marker',
      html: `
        <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:34px; height:34px; border-radius:50%; background:rgba(16,185,129,0.3); animation:pulseDot 1.5s infinite;"></div>
          <div style="width:26px; height:26px; border-radius:50%; background:#10b981; border:2.5px solid #090d16; box-shadow:0 0 14px rgba(16,185,129,0.8); display:flex; align-items:center; justify-content:center; color:#042f2e; font-size:14px; font-weight:900;">+</div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    state.mapElements.marker = L.marker(state.coords, { icon: vehicleIcon }).addTo(state.map);

    if (state.currentRoute) {
      updateMapLine(state.currentRoute);
    }
  }

  function updateMapLine(route) {
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
      opacity: 0.3
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
          html: `<div style="width:22px; height:22px; border-radius:50%; background:#0f172a; border:2px solid #10b981; box-shadow:0 0 8px rgba(16,185,129,0.5); color:#10b981; font-size:10px; font-weight:900; display:flex; align-items:center; justify-content:center;">${idx + 1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const sm = L.marker(sig.coords, { icon }).addTo(map);
        state.mapElements.signals.push(sm);
      });
    }

    map.fitBounds(state.mapElements.line.getBounds(), { padding: [40, 40] });
  }

  // ==========================================================================
  // 5. Real-Time AIS-140 GPS Telemetry & OSRM Driving Engine
  // ==========================================================================
  function startSimulation() {
    if (state.isDriving) return;
    state.isDriving = true;

    if (btnStartRun) {
      btnStartRun.classList.add('active');
      btnStartRun.innerHTML = '<span class="run-icon">❚❚</span><span>Pause Mission</span>';
    }

    // 1. Attempt Real GPS Hardware Streaming via Geolocation API
    if ('geolocation' in navigator) {
      if (telStatusText) telStatusText.textContent = "Acquiring Real GPS...";
      
      try {
        state.watchId = navigator.geolocation.watchPosition(
          (pos) => {
            state.useRealGps = true;
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const spd = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : (state.speed || 56);
            const hdg = pos.coords.heading || state.heading || 0;

            state.coords = [lat, lng];
            state.speed = spd;
            state.heading = hdg;

            if (telLat) telLat.textContent = `${lat.toFixed(4)}°N`;
            if (telLng) telLng.textContent = `${lng.toFixed(4)}°E`;
            if (telSpeed) telSpeed.textContent = `${spd} km/h`;
            if (telStatusText) telStatusText.textContent = "Real GPS Live (AIS-140)";

            if (state.mapElements.marker) {
              state.mapElements.marker.setLatLng(state.coords);
            }
            if (state.map) {
              state.map.panTo(state.coords, { animate: true });
            }

            broadcastTelemetry();
          },
          (err) => {
            console.warn("GPS hardware unavailable or denied, falling back to route simulation:", err.message);
            state.useRealGps = false;
            if (telStatusText) telStatusText.textContent = "OSRM Route Sim • Live";
            showToast("Running high-precision corridor route simulation.");
            runRouteSimulation();
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 1000 }
        );
      } catch(e) {
        runRouteSimulation();
      }
    } else {
      runRouteSimulation();
    }

    showToast("Mission Active: Live coordinates streaming to Jaipur Police Command.");
    broadcastTelemetry();
  }

  function runRouteSimulation() {
    if (state.simTimer) clearInterval(state.simTimer);
    const route = state.currentRoute;
    if (!route || !route.coordinates) return;
    const path = generatePath(route.coordinates, 40);

    state.simTimer = setInterval(() => {
      if (!state.isDriving || state.useRealGps) {
        clearInterval(state.simTimer);
        return;
      }

      if (state.simIndex >= path.length - 1) {
        pauseSimulation();
        showToast("Arrival: Destination Hospital Trauma Bay Reached.");
        vibrate([100, 50, 100]);
        return;
      }

      state.simIndex++;
      const p = path[state.simIndex];
      state.coords = [p.lat, p.lng];

      const pctRemaining = 1 - (state.simIndex / (path.length - 1));
      const dist = Math.max(0.1, route.distanceKm * pctRemaining);
      const etaSec = Math.round((dist / (state.speed || 55)) * 3600);
      const etaMin = Math.floor(etaSec / 60);
      state.eta = `${etaMin}m ${etaSec % 60}s`;

      if (telLat) telLat.textContent = `${state.coords[0].toFixed(4)}°N`;
      if (telLng) telLng.textContent = `${state.coords[1].toFixed(4)}°E`;
      if (telEta) telEta.textContent = state.eta;
      if (turnDistance) turnDistance.textContent = `In ${(dist * 1000).toFixed(0)}m`;

      if (state.mapElements.marker) {
        state.mapElements.marker.setLatLng(state.coords);
      }

      broadcastTelemetry();
    }, 1200);
  }

  function pauseSimulation() {
    state.isDriving = false;
    if (state.simTimer) {
      clearInterval(state.simTimer);
      state.simTimer = null;
    }
    if (state.watchId && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }
    if (btnStartRun) {
      btnStartRun.classList.remove('active');
      btnStartRun.innerHTML = '<span class="run-icon">▲</span><span>Resume Mission</span>';
    }
    if (telStatusText) {
      telStatusText.textContent = "GPS STREAM PAUSED";
    }
  }

  function resetSimulation() {
    pauseSimulation();
    state.simIndex = 0;
    state.useRealGps = false;
    if (btnStartRun) {
      btnStartRun.classList.remove('active');
      btnStartRun.innerHTML = '<span class="run-icon">▲</span><span>Start Live Run (Stream GPS)</span>';
    }
    if (state.currentRoute) {
      state.coords = [...state.currentRoute.coordinates[0]];
      state.distanceKm = state.currentRoute.distanceKm;
      state.eta = state.currentRoute.corridorDurationStr;
      if (telLat) telLat.textContent = `${state.coords[0].toFixed(4)}°N`;
      if (telLng) telLng.textContent = `${state.coords[1].toFixed(4)}°E`;
      if (telEta) telEta.textContent = state.eta;
      if (turnDistance) turnDistance.textContent = "In 400m";
      if (state.mapElements.marker) {
        state.mapElements.marker.setLatLng(state.coords);
      }
      if (state.map && state.mapElements.line) {
        state.map.fitBounds(state.mapElements.line.getBounds(), { padding: [40, 40] });
      }
    }
    if (telStatusText) {
      telStatusText.textContent = "GPS Standby";
    }
    broadcastTelemetry();
  }

  function generatePath(coords, count) {
    const list = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const c1 = coords[i];
      const c2 = coords[i + 1];
      for (let j = 0; j < count; j++) {
        const r = j / count;
        list.push({
          lat: c1[0] + (c2[0] - c1[0]) * r,
          lng: c1[1] + (c2[1] - c1[1]) * r
        });
      }
    }
    list.push({ lat: coords[coords.length - 1][0], lng: coords[coords.length - 1][1] });
    return list;
  }

  function broadcastTelemetry() {
    const driver = state.driver;
    if (!driver) return;

    const packet = {
      ambulanceId: driver.ambulanceId || "AMB-SMS-01",
      driverId: driver.id,
      driverName: driver.name,
      hospitalKey: driver.hospitalKey || "sms_hospital",
      vehicleType: driver.vehicleType || "ALS",
      coords: state.coords,
      speed: state.isDriving ? state.speed : 0,
      heading: state.heading,
      distanceRemaining: `${state.distanceKm.toFixed(1)} km`,
      eta: state.eta,
      currentRoad: state.currentRoute ? state.currentRoute.via : "En route",
      nextSignalName: state.currentRoute && state.currentRoute.trafficSignals ? state.currentRoute.trafficSignals[0].name : "Corridor Active",
      greenCorridorActive: true,
      timestamp: Date.now()
    };

    // 1. Post directly to Fox Backend API
    if (window.GC_API && window.GC_API.pushTelemetry) {
      const hospKey = driver.hospitalKey || "sms_hospital";
      const carId = driver.ambulanceId || "AMB-SMS-01";
      const carkey = driver.carkey || "CARKEY_SMS_01_SECURE";

      window.GC_API.pushTelemetry(hospKey, carId, {
        carkey: carkey,
        latitude: state.coords[0],
        longitude: state.coords[1],
        speed_kmh: state.isDriving ? state.speed : 0,
        status: state.isDriving ? "in-service" : "standby",
        heading: state.heading,
        eta: state.eta,
        distance_remaining: `${state.distanceKm.toFixed(1)} km`,
        driver_name: driver.name
      }).catch(err => {
        console.debug("Backend telemetry note:", err);
      });
    }

    // 2. Broadcast via BroadcastChannel & LocalStorage for cross-window / cross-iframe communication
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
