/**
 * ==========================================================================
 * GREEN+ CORRIDOR - Hospital Clinical Intake Controller
 * File: js/hospital.js
 * Contains: Hospital dashboard rendering (SMS / Apex), fleet cards,
 * clearance status check, and the local Routine Transit Route Finder.
 * ==========================================================================
 */

window.GC_HOSPITAL = (function() {

  // --- Render Hospital Dashboard (SMS or Apex) ---
  function renderHospitalDashboard() {
    const state = window.GC_STATE.state;
    const profile = window.GC_DATA.hospitalProfiles[state.activeHospitalKey];
    if (!profile) return;

    // Hospital Identity Elements
    const hospMainName = document.getElementById('hospMainName');
    const hospAddressText = document.getElementById('hospAddressText');
    const hospTierBadge = document.getElementById('hospTierBadge');
    const hospNodeBadge = document.getElementById('hospNodeBadge');
    const hospActiveBadge = document.getElementById('hospActiveBadge');
    const hospBedsStat = document.getElementById('hospBedsStat');
    const hospOrStat = document.getElementById('hospOrStat');
    const fleetSubTitle = document.getElementById('fleetSubTitle');

    if (hospMainName) hospMainName.textContent = profile.name;
    if (hospAddressText) hospAddressText.innerHTML = `<i data-lucide="map-pin"></i> ${profile.address}`;
    if (hospTierBadge) hospTierBadge.textContent = profile.tier;
    if (hospNodeBadge) hospNodeBadge.textContent = profile.node;
    if (hospActiveBadge) hospActiveBadge.textContent = profile.activeBadge;
    if (hospBedsStat) hospBedsStat.innerHTML = `${profile.beds}`;
    if (hospOrStat) hospOrStat.innerHTML = `${profile.ors}`;
    if (fleetSubTitle) fleetSubTitle.textContent = `Active & reserve units assigned to ${profile.name.split(',')[0]}`;

    // Update Live Clearance Banner
    updateHospitalClearanceBanner();

    // Render Hospital Fleet List & Driver Accounts List
    renderHospitalFleetList();
    renderHospitalDriversList();
    updateHospitalActiveTab();

    // Populate Routine Transit Selectors & Mode
    populateRoutineAmbulanceSelect();
    setDispatchMode(state.dispatchMode || 'emergency');

    // Initialize or refresh Hospital Map
    setTimeout(() => {
      window.GC_MAPS.initHospitalMap();
      if (window.GC_MAPS.hospitalMap) {
        window.GC_MAPS.hospitalMap.invalidateSize();
      }
    }, 150);
  }

  // --- Tab Switcher: Ambulance Fleet vs Mobile Driver Accounts ---
  function switchHospitalTab(tabName) {
    const state = window.GC_STATE.state;
    state.hospitalActiveTab = tabName;
    updateHospitalActiveTab();
  }

  function updateHospitalActiveTab() {
    const state = window.GC_STATE.state;
    const tabFleet = document.getElementById('hospTabFleet');
    const tabDrivers = document.getElementById('hospTabDrivers');
    const panelFleet = document.getElementById('hospPanelFleet');
    const panelDrivers = document.getElementById('hospPanelDrivers');

    if (state.hospitalActiveTab === 'drivers') {
      if (tabFleet) tabFleet.classList.remove('active');
      if (tabDrivers) tabDrivers.classList.add('active');
      if (panelFleet) panelFleet.style.display = 'none';
      if (panelDrivers) panelDrivers.style.display = 'block';
      renderHospitalDriversList();
    } else {
      if (tabFleet) tabFleet.classList.add('active');
      if (tabDrivers) tabDrivers.classList.remove('active');
      if (panelFleet) panelFleet.style.display = 'block';
      if (panelDrivers) panelDrivers.style.display = 'none';
      renderHospitalFleetList();
    }
  }

  // --- Hospital Clearance Banner Live Check ---
  function updateHospitalClearanceBanner() {
    const state = window.GC_STATE.state;
    const hospClearanceStat = document.getElementById('hospClearanceStat');
    const corridorAlertBar = document.getElementById('corridorAlertBar');
    const corridorAlertTitle = document.getElementById('corridorAlertTitle');
    const corridorAlertText = document.getElementById('corridorAlertText');

    const req = state.clearanceRequests.find(r => r.hospitalKey === state.activeHospitalKey);

    if (req && corridorAlertBar) {
      corridorAlertBar.style.display = 'block';

      if (req.status === 'granted') {
        if (hospClearanceStat) hospClearanceStat.innerHTML = `<span class="status-text-green">GRANTED</span>`;
        if (corridorAlertTitle) corridorAlertTitle.textContent = "EMERGENCY CLEARANCE GRANTED BY JTP ADMIN:";
        if (corridorAlertText) corridorAlertText.textContent = `Unit ${req.ambulanceId} green corridor active via ${req.routeName}. 4 Traffic signals pre-empted with JTP field officer escort.`;
      } else if (req.status === 'pending') {
        if (hospClearanceStat) hospClearanceStat.innerHTML = `<span class="status-text-red">PENDING APPROVAL</span>`;
        if (corridorAlertTitle) corridorAlertTitle.textContent = "CLEARANCE AWAITING JTP AUTHORIZATION:";
        if (corridorAlertText) corridorAlertText.textContent = `Request for ${req.ambulanceId} (${req.severity.toUpperCase()}) submitted to Jaipur Traffic Police central command. Standby for override confirmation.`;
      } else if (req.status === 'overridden') {
        if (hospClearanceStat) hospClearanceStat.innerHTML = `<span class="status-text-amber">ROUTE OVERRIDDEN</span>`;
        if (corridorAlertTitle) corridorAlertTitle.textContent = "ALERT: ROUTE OVERRIDE BY JTP COMMAND:";
        if (corridorAlertText) corridorAlertText.textContent = `Unit ${req.ambulanceId} diverted to ${req.routeName} to avoid traffic bottleneck. Police units informed.`;
      }
    } else {
      if (hospClearanceStat) hospClearanceStat.innerHTML = `<span class="status-text-green">MONITORING</span>`;
      if (corridorAlertBar) corridorAlertBar.style.display = 'none';
    }
  }

  // --- Render Hospital Fleet List ---
  function renderHospitalFleetList() {
    const state = window.GC_STATE.state;
    const container = document.getElementById('fleetListContainer');
    if (!container) return;

    const hospitalAmbulances = window.GC_DATA.ambulances.filter(a => a.hospitalKey === state.activeHospitalKey);
    let filtered = hospitalAmbulances;

    if (state.hospitalFleetFilter === 'in-service') {
      filtered = hospitalAmbulances.filter(a => a.inService);
    } else if (state.hospitalFleetFilter === 'out-of-service') {
      filtered = hospitalAmbulances.filter(a => !a.inService);
    }

    const countAll = document.getElementById('countAll');
    const countInService = document.getElementById('countInService');
    const countOutOfService = document.getElementById('countOutOfService');

    if (countAll) countAll.textContent = hospitalAmbulances.length;
    if (countInService) countInService.textContent = hospitalAmbulances.filter(a => a.inService).length;
    if (countOutOfService) countOutOfService.textContent = hospitalAmbulances.filter(a => !a.inService).length;

    container.innerHTML = '';

    filtered.forEach(amb => {
      const isSelected = amb.id === state.selectedAmbulanceId;
      const card = document.createElement('div');
      card.className = `ambulance-card ${isSelected ? 'is-active-focus' : ''}`;
      card.innerHTML = `
        <div class="amb-header-row">
          <div class="amb-id-wrap">
            <span class="amb-id-badge">${amb.id}</span>
            <span class="amb-type-tag">${amb.type}</span>
          </div>
          <span class="amb-status-tag ${amb.statusClass}">${amb.statusLabel}</span>
        </div>

        <div class="amb-body-details">
          <div class="detail-line" title="Driver: ${amb.driver}">
            <i data-lucide="user"></i>
            <span>${amb.driver} (${amb.phone})</span>
          </div>
          <div class="detail-line" title="Location: ${amb.location}">
            <i data-lucide="map-pin"></i>
            <span>${amb.location}</span>
          </div>
          <div class="detail-line" title="Owner: ${amb.owner}">
            <i data-lucide="building"></i>
            <span>${amb.owner}</span>
          </div>
          <div class="detail-line" title="ETA: ${amb.eta}">
            <i data-lucide="clock"></i>
            <span><strong>ETA: ${amb.eta}</strong></span>
          </div>
        </div>

        <div class="amb-action-row">
          <button type="button" class="btn btn-outline btn-sm btn-track" data-id="${amb.id}">
            <i data-lucide="navigation"></i>
            <span>Track</span>
          </button>
          <button type="button" class="btn btn-outline btn-sm btn-plan-route" data-id="${amb.id}" title="Plan non-emergency transit route locally">
            <i data-lucide="compass"></i>
            <span>Route Planner</span>
          </button>
          ${amb.inService ? `
            <button type="button" class="btn btn-sm btn-clearance-trigger" data-id="${amb.id}">
              <i data-lucide="zap"></i>
              <span>Request Clearance</span>
            </button>
          ` : `
            <span class="tag-badge">Asset Offline</span>
          `}
        </div>
      `;

      container.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    container.querySelectorAll('.btn-track').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedAmbulanceId = btn.getAttribute('data-id');
        renderHospitalFleetList();
        window.GC_MAPS.updateHospitalMapFocus();
      });
    });

    container.querySelectorAll('.btn-plan-route').forEach(btn => {
      btn.addEventListener('click', () => {
        const ambId = btn.getAttribute('data-id');
        state.selectedAmbulanceId = ambId;
        setDispatchMode('routine');
        const routineSelect = document.getElementById('routineAmbulanceSelect');
        if (routineSelect) routineSelect.value = ambId;
        const panel = document.getElementById('routinePlannerPanel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });

    container.querySelectorAll('.btn-clearance-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        window.GC_STATE.openClearanceModal(btn.getAttribute('data-id'));
      });
    });
  }

  // --- Populate Routine Ambulance Dropdown ---
  function populateRoutineAmbulanceSelect() {
    const state = window.GC_STATE.state;
    const select = document.getElementById('routineAmbulanceSelect');
    if (!select) return;
    const hospAmbs = window.GC_DATA.ambulances.filter(a => a.hospitalKey === state.activeHospitalKey && a.inService);
    select.innerHTML = '';
    hospAmbs.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.id} • ${a.type} (${a.driver})`;
      if (a.id === state.selectedAmbulanceId) opt.selected = true;
      select.appendChild(opt);
    });
  }

  // --- Dispatch Mode Switcher (Emergency Corridor vs Routine Route Finder) ---
  function setDispatchMode(mode) {
    const state = window.GC_STATE.state;
    state.dispatchMode = mode;
    const btnModeEmergency = document.getElementById('btnModeEmergency');
    const btnModeRoutine = document.getElementById('btnModeRoutine');
    const routinePlannerPanel = document.getElementById('routinePlannerPanel');
    const emergencyMapHeader = document.getElementById('emergencyMapHeader');
    const hospitalMap = window.GC_MAPS.hospitalMap;
    const elements = window.GC_MAPS.hospitalMapElements;

    if (mode === 'routine') {
      if (btnModeEmergency) btnModeEmergency.classList.remove('active');
      if (btnModeRoutine) btnModeRoutine.classList.add('active');
      if (routinePlannerPanel) routinePlannerPanel.style.display = 'block';
      if (emergencyMapHeader) emergencyMapHeader.style.display = 'none';
      populateRoutineAmbulanceSelect();
    } else {
      if (btnModeEmergency) btnModeEmergency.classList.add('active');
      if (btnModeRoutine) btnModeRoutine.classList.remove('active');
      if (routinePlannerPanel) routinePlannerPanel.style.display = 'none';
      if (emergencyMapHeader) emergencyMapHeader.style.display = 'flex';

      if (hospitalMap) {
        if (elements.routineRouteLine) {
          hospitalMap.removeLayer(elements.routineRouteLine);
          elements.routineRouteLine = null;
        }
        if (elements.routineDestMarker) {
          hospitalMap.removeLayer(elements.routineDestMarker);
          elements.routineDestMarker = null;
        }
        if (elements.optimalRoute && !hospitalMap.hasLayer(elements.optimalRoute)) {
          hospitalMap.addLayer(elements.optimalRoute);
        }
        if (elements.altTonk && !hospitalMap.hasLayer(elements.altTonk)) {
          hospitalMap.addLayer(elements.altTonk);
        }
        if (elements.altMi && !hospitalMap.hasLayer(elements.altMi)) {
          hospitalMap.addLayer(elements.altMi);
        }
        if (elements.optimalRoute) {
          hospitalMap.fitBounds(elements.optimalRoute.getBounds(), { padding: [40, 40] });
        }
      }

      window.GC_MAPS.updateHospitalMapFocus();
      const hudStatus = document.getElementById('hudStatusIndicator');
      const hudClearance = document.getElementById('hudClearanceState');
      const hudNextSignal = document.getElementById('hudNextSignal');
      if (hudStatus) hudStatus.innerHTML = `<span class="status-pulse-dot"></span> EN ROUTE (CODE RED)`;
      if (hudClearance) hudClearance.innerHTML = `<span class="hm-highlight">GRANTED (GREEN WAVE)</span>`;
      if (hudNextSignal) hudNextSignal.innerHTML = `Next Signal: <strong>Rambagh Circle</strong> (Cleared by JTP Unit 4)`;
    }

    setTimeout(() => {
      if (hospitalMap) hospitalMap.invalidateSize();
    }, 100);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- Calculate Routine Route Locally (Bypassing Police Admin Queue) ---
  function calculateRoutineRoute(originKey, destKey, ambId, purpose) {
    const origin = window.GC_DATA.jaipurLocations[originKey];
    const dest = window.GC_DATA.jaipurLocations[destKey];
    if (!origin || !dest) return;

    const points = window.GC_MAPS.getRoutePoints(originKey, destKey);
    const hospitalMap = window.GC_MAPS.hospitalMap;
    const elements = window.GC_MAPS.hospitalMapElements;

    // Haversine/winding distance approximation
    const latDiff = Math.abs(origin.coords[0] - dest.coords[0]) * 111;
    const lngDiff = Math.abs(origin.coords[1] - dest.coords[1]) * 102;
    let distKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 1.35;
    if (distKm < 1.8) distKm = 2.4;
    const distStr = distKm.toFixed(1) + " km";

    const durationMin = Math.round(distKm * 2.2 + 3);
    const durStr = `${durationMin} mins`;

    let densityStr = "Moderate (~32 veh/min)";
    let signalCount = "3 Signals (Standard Cycle)";
    if (distKm > 7.5) {
      densityStr = "Moderate to High (~46 veh/min)";
      signalCount = "5 Signals (Normal Cycle)";
    } else if (distKm < 3.5) {
      densityStr = "Normal Flow (~22 veh/min)";
      signalCount = "2 Signals (Normal Cycle)";
    }

    const routeName = `${origin.landmark} ➔ ${dest.landmark}`;

    // Update Result Card
    const resultCard = document.getElementById('routineResultCard');
    const resRouteName = document.getElementById('resRouteName');
    const resDistance = document.getElementById('resDistance');
    const resDuration = document.getElementById('resDuration');
    const resDensity = document.getElementById('resDensity');
    const resSignals = document.getElementById('resSignals');

    if (resRouteName) resRouteName.textContent = routeName;
    if (resDistance) resDistance.textContent = distStr;
    if (resDuration) resDuration.textContent = durStr;
    if (resDensity) resDensity.textContent = densityStr;
    if (resSignals) resSignals.textContent = signalCount;
    if (resultCard) resultCard.style.display = 'block';

    if (hospitalMap) {
      if (elements.optimalRoute && hospitalMap.hasLayer(elements.optimalRoute)) {
        hospitalMap.removeLayer(elements.optimalRoute);
      }
      if (elements.altTonk && hospitalMap.hasLayer(elements.altTonk)) {
        hospitalMap.removeLayer(elements.altTonk);
      }
      if (elements.altMi && hospitalMap.hasLayer(elements.altMi)) {
        hospitalMap.removeLayer(elements.altMi);
      }

      if (elements.routineRouteLine) {
        hospitalMap.removeLayer(elements.routineRouteLine);
      }
      if (elements.routineDestMarker) {
        hospitalMap.removeLayer(elements.routineDestMarker);
      }

      elements.routineRouteLine = L.polyline(points, {
        color: '#27272a',
        weight: 6,
        opacity: 0.95
      }).addTo(hospitalMap);

      const destIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="marker-pin-hospital" style="background:#141416; border-color:#71717a;" title="${dest.name}"><span>⚑</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      elements.routineDestMarker = L.marker(dest.coords, { icon: destIcon })
        .addTo(hospitalMap)
        .bindPopup(`<strong>Standard Destination</strong><br>${dest.name}<br>Mission: <em>${purpose}</em>`);

      hospitalMap.fitBounds(elements.routineRouteLine.getBounds(), { padding: [40, 40] });
    }

    // Update Map HUD overlay to reflect Routine Transit
    const hudBadge = document.getElementById('hudUnitBadge');
    const hudType = document.getElementById('hudUnitType');
    const hudStatus = document.getElementById('hudStatusIndicator');
    const hudEta = document.getElementById('hudEta');
    const hudDistance = document.getElementById('hudDistance');
    const hudSpeed = document.getElementById('hudSpeed');
    const hudClearance = document.getElementById('hudClearanceState');
    const hudNextSignal = document.getElementById('hudNextSignal');

    const amb = window.GC_DATA.ambulances.find(a => a.id === ambId);
    if (hudBadge) hudBadge.textContent = ambId;
    if (hudType && amb) hudType.textContent = amb.type;
    if (hudStatus) hudStatus.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-right:5px;"></span> ROUTINE TRANSIT`;
    if (hudEta) hudEta.textContent = durStr;
    if (hudDistance) hudDistance.textContent = distStr;
    if (hudSpeed) hudSpeed.textContent = "38 km/h";
    if (hudClearance) hudClearance.innerHTML = `<span style="color:#16a34a; font-weight:700;">LOCAL ONLY (JTP BYPASSED)</span>`;
    if (hudNextSignal) hudNextSignal.innerHTML = `Signal Status: <strong>Standard City Light Timing</strong> (Police Not Alerted)`;

    window.GC_STATE.showToast(`Optimal transit route calculated for ${ambId}. Note: JTP Emergency Queue bypassed.`);
  }

  // --- Render Hospital Drivers & Mobile Accounts List ---
  function renderHospitalDriversList() {
    const state = window.GC_STATE.state;
    const container = document.getElementById('hospitalDriversListContainer');
    const countDrivers = document.getElementById('countHospitalDrivers');
    if (!container) return;

    const drivers = window.GC_DATA.getHospitalDrivers(state.activeHospitalKey);
    if (countDrivers) countDrivers.textContent = drivers.length;

    container.innerHTML = '';

    if (drivers.length === 0) {
      container.innerHTML = `
        <div class="empty-drivers-state">
          <i data-lucide="users" style="width:36px; height:36px; stroke:#a1a1aa; margin-bottom:8px;"></i>
          <p>No ambulance drivers registered for this hospital facility yet.</p>
          <button type="button" class="btn btn-primary btn-sm" id="btnEmptyRegisterDriver" style="margin-top:10px;">
            <i data-lucide="user-plus"></i> Register First Driver
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      const btn = document.getElementById('btnEmptyRegisterDriver');
      if (btn) btn.addEventListener('click', () => window.GC_STATE.openDriverRegisterModal());
      return;
    }

    const liveTelemetry = state.liveTelemetry;

    drivers.forEach(drv => {
      const isTransmitting = liveTelemetry && (
        (liveTelemetry.driverId && liveTelemetry.driverId.toLowerCase() === drv.id.toLowerCase()) ||
        (liveTelemetry.ambulanceId && liveTelemetry.ambulanceId === drv.ambulanceId)
      );

      const card = document.createElement('div');
      card.className = `driver-account-card ${isTransmitting ? 'is-live-gps-transmitting' : ''}`;
      card.innerHTML = `
        <div class="drv-top-row">
          <div class="drv-title-wrap">
            <div class="drv-avatar"><i data-lucide="user"></i></div>
            <div>
              <h4 class="drv-name">${drv.name}</h4>
              <span class="drv-badge">${drv.badgeNumber || 'MEDIC'} &bull; ${drv.status.toUpperCase()}</span>
            </div>
          </div>
          <span class="drv-status-pill ${isTransmitting ? 'drv-status-live' : 'drv-status-standby'}">
            <span class="pulse-dot"></span>
            ${isTransmitting ? `GPS ACTIVE (${liveTelemetry.speed} km/h)` : 'MOBILE CAD READY'}
          </span>
        </div>

        <div class="drv-credentials-box">
          <div class="cred-item">
            <span class="cred-label">Mobile Unique ID:</span>
            <code class="cred-value" title="Unique ID used on mobile app login">${drv.id}</code>
          </div>
          <div class="cred-item">
            <span class="cred-label">Passkey:</span>
            <span class="cred-value-masked" id="passView_${drv.id}">••••••••</span>
            <button type="button" class="btn-cred-reveal" data-reveal-id="${drv.id}" title="Show / Hide Password">
              <i data-lucide="eye" style="width:13px; height:13px;"></i>
            </button>
          </div>
        </div>

        <div class="drv-details-grid">
          <div class="drv-detail-item">
            <i data-lucide="truck"></i>
            <span>Assigned: <strong>${drv.ambulanceId}</strong> (${drv.vehicleType})</span>
          </div>
          <div class="drv-detail-item">
            <i data-lucide="phone"></i>
            <span>Phone: <strong>${drv.phone}</strong></span>
          </div>
          <div class="drv-detail-item">
            <i data-lucide="award"></i>
            <span>Lic: ${drv.licenseNumber || 'Verified'}</span>
          </div>
        </div>

        <div class="drv-actions-row">
          <button type="button" class="btn btn-primary btn-sm btn-open-driver-app" data-driver-id="${drv.id}">
            <i data-lucide="smartphone"></i>
            <span>Launch Mobile Terminal</span>
          </button>
          <button type="button" class="btn btn-outline btn-sm btn-delete-driver" data-driver-id="${drv.id}" title="Remove driver record">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;

      container.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Bind reveal buttons
    container.querySelectorAll('.btn-cred-reveal').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-reveal-id');
        const drv = drivers.find(d => d.id === id);
        const el = document.getElementById(`passView_${id}`);
        if (!drv || !el) return;
        if (el.textContent === '••••••••') {
          el.textContent = drv.password;
          el.classList.add('is-revealed');
        } else {
          el.textContent = '••••••••';
          el.classList.remove('is-revealed');
        }
      });
    });

    // Bind launch buttons
    container.querySelectorAll('.btn-open-driver-app').forEach(btn => {
      btn.addEventListener('click', () => {
        const driverId = btn.getAttribute('data-driver-id');
        window.GC_STATE.openDriverMobileApp(driverId);
      });
    });

    // Bind delete buttons
    container.querySelectorAll('.btn-delete-driver').forEach(btn => {
      btn.addEventListener('click', () => {
        const driverId = btn.getAttribute('data-driver-id');
        if (confirm(`Remove mobile credentials for driver "${driverId}"?`)) {
          window.GC_DATA.deleteDriver(driverId);
          renderHospitalDriversList();
          window.GC_STATE.showToast(`Driver ${driverId} deleted from hospital roster.`);
        }
      });
    });
  }

  // --- Real-Time Telemetry Tracking for Hospital Panel ---
  function handleIncomingHospitalTelemetry(telemetry) {
    if (!telemetry) return;
    const state = window.GC_STATE.state;

    // Check if this telemetry matches an ambulance from this hospital
    const amb = window.GC_DATA.ambulances.find(a => a.id === telemetry.ambulanceId);
    if (!amb || amb.hospitalKey !== state.activeHospitalKey) return;

    // Update state & coordinates
    amb.coords = telemetry.coords;
    amb.speed = `${telemetry.speed} km/h`;
    amb.eta = telemetry.eta || amb.eta;
    amb.distance = telemetry.distanceRemaining || amb.distance;
    amb.location = telemetry.currentRoad || amb.location;
    amb.hasGreenCorridor = !!telemetry.greenCorridorActive;

    // Update Hospital Leaflet Map marker if active
    const map = window.GC_MAPS.hospitalMap;
    const elements = window.GC_MAPS.hospitalMapElements;
    if (map && elements.ambulanceMarker && telemetry.coords) {
      elements.ambulanceMarker.setLatLng(telemetry.coords);
    }

    // Update Map HUD
    const hudBadge = document.getElementById('hudUnitBadge');
    const hudEta = document.getElementById('hudEta');
    const hudDistance = document.getElementById('hudDistance');
    const hudSpeed = document.getElementById('hudSpeed');
    const hudStatus = document.getElementById('hudStatusIndicator');

    if (hudBadge) hudBadge.textContent = amb.id;
    if (hudEta) hudEta.textContent = telemetry.eta;
    if (hudDistance) hudDistance.textContent = telemetry.distanceRemaining;
    if (hudSpeed) hudSpeed.textContent = `${telemetry.speed} km/h`;
    if (hudStatus) {
      hudStatus.innerHTML = `<span class="status-pulse-dot" style="background:#22c55e;"></span> LIVE GPS STREAM &bull; ${telemetry.driverName}`;
    }

    // Re-render driver card badges if drivers tab is visible
    if (state.hospitalActiveTab === 'drivers') {
      const livePill = document.querySelector(`.driver-account-card[data-driver="${telemetry.driverId}"] .drv-status-pill`);
      if (livePill) {
        livePill.className = "drv-status-pill drv-status-live";
        livePill.innerHTML = `<span class="pulse-dot"></span> GPS ACTIVE (${telemetry.speed} km/h)`;
      }
    }
  }

  // Subscribe to telemetry channel
  window.GC_STATE.subscribeTelemetry((telemetry) => {
    handleIncomingHospitalTelemetry(telemetry);
  });

  return {
    renderHospitalDashboard,
    updateHospitalClearanceBanner,
    renderHospitalFleetList,
    renderHospitalDriversList,
    switchHospitalTab,
    setDispatchMode,
    populateRoutineAmbulanceSelect,
    calculateRoutineRoute,
    handleIncomingHospitalTelemetry
  };
})();

