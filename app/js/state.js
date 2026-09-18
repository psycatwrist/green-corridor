/**
 * ==========================================================================
 * GREEN+ CORRIDOR - Central State Store & Session Security Layer
 * File: js/state.js
 * Contains: Active role, view switching with strict RBAC guards,
 * modal dialog controls, and toast notifications.
 * ==========================================================================
 */

window.GC_STATE = (function() {
  // Core reactive application state
  const state = {
    currentView: 'landing', // 'landing', 'hospital', 'admin'
    activeRole: null, // 'hospital' or 'admin'
    activeHospitalKey: null, // 'sms_hospital' or 'apex_hospital'
    activeOverrideRoute: 'optimal', // 'optimal', 'alt-a', 'alt-b'
    dispatchMode: 'emergency', // 'emergency' or 'routine'
    adminCategoryFilter: 'all',
    hospitalActiveTab: 'fleet', // 'fleet' or 'drivers'
    liveTelemetry: null,
    telemetrySubscribers: [],
    clearanceRequests: []
  };

  // --- Real-Time Telemetry Broadcast Channel & Cross-Tab Sync ---
  let telemetryChannel = null;
  try {
    telemetryChannel = new BroadcastChannel('gc_telemetry_channel');
    telemetryChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data.type === 'AMBULANCE_GPS_TELEMETRY') {
        state.liveTelemetry = data.telemetry;
        notifyTelemetrySubscribers(data.telemetry);
      }
    };
  } catch (e) {
    console.warn("BroadcastChannel not available:", e);
  }

  // Cross-tab storage fallback
  window.addEventListener('storage', (e) => {
    if (e.key === 'gc_live_telemetry_ping' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload && payload.telemetry) {
          state.liveTelemetry = payload.telemetry;
          notifyTelemetrySubscribers(payload.telemetry);
        }
      } catch(err) {}
    }
  });

  function subscribeTelemetry(callback) {
    if (typeof callback === 'function') {
      state.telemetrySubscribers.push(callback);
    }
  }

  function notifyTelemetrySubscribers(telemetry) {
    state.telemetrySubscribers.forEach(cb => {
      try { cb(telemetry); } catch(e) { console.error("Telemetry cb error", e); }
    });
  }

  function broadcastTelemetry(telemetry) {
    state.liveTelemetry = telemetry;
    notifyTelemetrySubscribers(telemetry);

    // 1. Post to Fox Backend API (Page -> Backend -> Another Page)
    if (window.GC_API && window.GC_API.pushTelemetry && telemetry.hospitalKey && telemetry.ambulanceId) {
      try {
        const carkey = telemetry.carkey || "40f865c02598096f5539d62e658e21bf5bb8fb142d9a0aa652deda275ea7cad7";
        window.GC_API.pushTelemetry(telemetry.hospitalKey, telemetry.ambulanceId, {
          carkey: carkey,
          latitude: telemetry.coords ? telemetry.coords[0] : (telemetry.latitude || 26.9045),
          longitude: telemetry.coords ? telemetry.coords[1] : (telemetry.longitude || 75.7590),
          speed_kmh: telemetry.speed !== undefined ? telemetry.speed : (telemetry.speed_kmh || 0),
          status: "in-service",
          heading: telemetry.heading || 0,
          eta: telemetry.eta || "En route",
          distance_remaining: telemetry.distanceRemaining || telemetry.distance_remaining || "",
          driver_name: telemetry.driverName || telemetry.driver_name || ""
        }).catch(() => {});
      } catch(e) {}
    }

    // 2. BroadcastChannel & local storage fallback for instant local tab responsiveness
    try {
      if (telemetryChannel) {
        telemetryChannel.postMessage({ type: 'AMBULANCE_GPS_TELEMETRY', telemetry });
      }
      localStorage.setItem('gc_live_telemetry_ping', JSON.stringify({
        telemetry,
        ts: Date.now()
      }));
    } catch(e) {}
  }

  // --- Backend Sync Listener (Page -> Fox Backend -> Another Page) ---
  if (window.GC_API) {
    window.GC_API.subscribeClearance((reqs) => {
      if (Array.isArray(reqs) && reqs.length > 0) {
        state.clearanceRequests = reqs.map(r => ({
          id: r.id,
          hospitalKey: r.hospital_key,
          hospitalName: r.hospital_name,
          ambulanceId: r.ambulance_id,
          type: r.vehicle_type,
          driver: r.driver_name,
          severity: r.severity,
          severityLabel: r.severity_label,
          vitals: r.patient_vitals,
          location: r.location,
          routeKey: r.route_key,
          routeName: r.route_name,
          eta: r.eta,
          status: r.status,
          statusLabel: r.status_label,
          grantedAt: r.granted_at,
          holdAlertSec: r.hold_alert_sec
        }));
        if (state.currentView === 'admin' && window.GC_ADMIN && window.GC_ADMIN.renderAdminQueue) {
          window.GC_ADMIN.renderAdminQueue();
        }
        if (state.currentView === 'hospital' && window.GC_HOSPITAL && window.GC_HOSPITAL.updateHospitalClearanceBanner) {
          window.GC_HOSPITAL.updateHospitalClearanceBanner();
        }
      }
    });

    window.GC_API.subscribeTelemetry((fleet) => {
      if (Array.isArray(fleet) && fleet.length > 0) {
        fleet.forEach(t => {
          const packet = {
            ambulanceId: t.car_id,
            hospitalKey: t.hospital_key,
            coords: [t.latitude, t.longitude],
            speed: t.speed_kmh,
            heading: t.heading,
            eta: t.eta,
            driverName: t.driver_name,
            timestamp: t.last_ping
          };
          state.liveTelemetry = packet;
          notifyTelemetrySubscribers(packet);
        });
      }
    });

    window.GC_API.startBackgroundSync(1500);
  }

  // Toast Notification Helper
  function showToast(msg) {
    const toastNotification = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    if (!toastNotification || !toastMessage) return;

    toastMessage.textContent = msg;
    toastNotification.style.display = 'block';

    setTimeout(() => {
      toastNotification.style.display = 'none';
    }, 4000);
  }

  // Generic Modal Helpers
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function openHospitalLoginModal() {
    openModal(document.getElementById('hospitalLoginModal'));
  }

  function openAdminLoginModal() {
    openModal(document.getElementById('adminLoginModal'));
  }

  function openDriverRegisterModal() {
    const modal = document.getElementById('driverRegisterModal');
    const hospitalSelect = document.getElementById('regDriverHospital');
    const ambulanceSelect = document.getElementById('regDriverAmbulance');

    if (hospitalSelect) {
      hospitalSelect.value = state.activeHospitalKey || 'sms';
    }

    if (ambulanceSelect) {
      ambulanceSelect.innerHTML = '';
      const hospKey = state.activeHospitalKey || 'sms';
      const ambs = window.GC_DATA.ambulances.filter(a => a.hospitalKey === hospKey);
      ambs.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `${a.id} • ${a.type}`;
        ambulanceSelect.appendChild(opt);
      });
    }

    openModal(modal);
  }

  function openDriverMobileApp(driverId) {
    const url = driverId ? `driver.html?driver=${encodeURIComponent(driverId)}` : 'driver.html';
    window.open(url, '_blank');
  }

  function openClearanceModal(ambId) {
    const select = document.getElementById('clearanceAmbulanceSelect');
    const destInput = document.getElementById('clearanceDestInput');
    const currentHosp = window.GC_DATA.hospitalProfiles[state.activeHospitalKey];

    if (destInput && currentHosp) {
      destInput.value = currentHosp.name;
    }

    if (select) {
      const hospAmbs = window.GC_DATA.ambulances.filter(a => a.hospitalKey === state.activeHospitalKey && a.inService);
      select.innerHTML = '';
      hospAmbs.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `${a.id} • ${a.type} (${a.driver})`;
        if (a.id === ambId) opt.selected = true;
        select.appendChild(opt);
      });
    }

    openModal(document.getElementById('clearanceModal'));
  }

  function openOverrideModal() {
    openModal(document.getElementById('overrideModal'));
  }

  // --- Strict Access-Controlled View Switcher ---
  function switchView(newView) {
    // Role Enforcement Security Guard
    if (newView === 'admin' && state.activeRole !== 'admin') {
      showToast("Access Denied: Administrative portal requires Jaipur Traffic Police authentication.");
      openAdminLoginModal();
      return;
    }

    if (newView === 'hospital' && state.activeRole !== 'hospital') {
      showToast("Authentication required for Hospital Clinical Intake Portal.");
      openHospitalLoginModal();
      return;
    }

    state.currentView = newView;

    const landingView = document.getElementById('landingView');
    const hospitalDashboardView = document.getElementById('hospitalDashboardView');
    const adminDashboardView = document.getElementById('adminDashboardView');
    const activeSessionPill = document.getElementById('activeSessionPill');
    const sessionDot = document.getElementById('sessionDot');
    const sessionRoleText = document.getElementById('sessionRoleText');
    const navMenu = document.getElementById('navMenu');

    if (landingView) landingView.style.display = 'none';
    if (hospitalDashboardView) hospitalDashboardView.style.display = 'none';
    if (adminDashboardView) adminDashboardView.style.display = 'none';

    if (newView === 'landing') {
      if (landingView) landingView.style.display = 'block';
      if (activeSessionPill) activeSessionPill.style.display = 'none';
      if (navMenu) navMenu.style.display = 'flex';
    } else if (newView === 'hospital') {
      if (hospitalDashboardView) hospitalDashboardView.style.display = 'block';
      if (activeSessionPill) activeSessionPill.style.display = 'flex';
      if (sessionDot) sessionDot.style.backgroundColor = '#22c55e';
      const hosp = window.GC_DATA.hospitalProfiles[state.activeHospitalKey];
      if (sessionRoleText && hosp) {
        sessionRoleText.textContent = `Hospital Session: ${hosp.name.split(',')[0]}`;
      }
      if (navMenu) navMenu.style.display = 'none';
      if (window.GC_HOSPITAL) {
        window.GC_HOSPITAL.renderHospitalDashboard();
      }
    } else if (newView === 'admin') {
      if (adminDashboardView) adminDashboardView.style.display = 'block';
      if (activeSessionPill) activeSessionPill.style.display = 'flex';
      if (sessionDot) sessionDot.style.backgroundColor = '#3b82f6';
      if (sessionRoleText) {
        sessionRoleText.textContent = `Command Session: JTP Central Authority`;
      }
      if (navMenu) navMenu.style.display = 'none';
      if (window.GC_ADMIN) {
        window.GC_ADMIN.renderAdminDashboard();
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- Sign Out Function ---
  function signOut() {
    const prevRole = state.activeRole;
    state.activeRole = null;
    state.activeHospitalKey = null;
    switchView('landing');
    showToast(`Signed out from ${prevRole === 'admin' ? 'Jaipur Traffic Control Police Command' : 'Hospital Portal'}.`);
  }

  return {
    state,
    showToast,
    openModal,
    closeModal,
    openHospitalLoginModal,
    openAdminLoginModal,
    openDriverRegisterModal,
    openDriverMobileApp,
    openClearanceModal,
    openOverrideModal,
    switchView,
    signOut,
    subscribeTelemetry,
    broadcastTelemetry
  };
})();
