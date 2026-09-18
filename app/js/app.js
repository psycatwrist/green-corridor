/**
 * ==========================================================================
 * GREEN+ CORRIDOR - Main Application Entrypoint & Event Orchestrator
 * File: js/app.js
 * Contains: Form submission listeners, modal triggers, UI responsiveness fixes,
 * interactive button bindings, and lifecycle bootstrapping.
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // --- Element Selectors ---
  const hospitalLoginForm = document.getElementById('hospitalLoginForm');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const routeClearanceForm = document.getElementById('routeClearanceForm');
  const routeOverrideForm = document.getElementById('routeOverrideForm');
  const routineRouteForm = document.getElementById('routineRouteForm');

  const hospModalCloseBtn = document.getElementById('hospModalCloseBtn');
  const hospModalCancelBtn = document.getElementById('hospModalCancelBtn');
  const hospModalSignUpBtn = document.getElementById('hospModalSignUpBtn');
  const adminModalCloseBtn = document.getElementById('adminModalCloseBtn');
  const adminModalCancelBtn = document.getElementById('adminModalCancelBtn');
  const clearanceCloseBtn = document.getElementById('clearanceCloseBtn');
  const clearanceCancelBtn = document.getElementById('clearanceCancelBtn');
  const overrideCloseBtn = document.getElementById('overrideCloseBtn');
  const overrideCancelBtn = document.getElementById('overrideCancelBtn');

  const btnSessionSignOut = document.getElementById('btnSessionSignOut');
  const btnExitDashboard = document.getElementById('btnExitDashboard');
  const btnAdminSignOut = document.getElementById('btnAdminSignOut');
  const brandLogoHome = document.getElementById('brandLogoHome');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  const btnDismissAlert = document.getElementById('btnDismissAlert');
  const hudClearanceBtn = document.getElementById('hudClearanceBtn');
  const btnModeEmergency = document.getElementById('btnModeEmergency');
  const btnModeRoutine = document.getElementById('btnModeRoutine');
  const btnResetRoutineRoute = document.getElementById('btnResetRoutineRoute');
  const btnEscalateFromRoutine = document.getElementById('btnEscalateFromRoutine');

  // ==========================================================================
  // 1. Navigation & Login Modal Triggers
  // ==========================================================================
  document.querySelectorAll('[data-login-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-login-target');
      if (target === 'admin') {
        window.GC_STATE.openAdminLoginModal();
      } else {
        window.GC_STATE.openHospitalLoginModal();
      }
    });
  });

  // Preset Buttons on Hospital Modal (1-Click Login for SMS / Apex)
  const hospInputEmail = document.getElementById('hospInputEmail');
  const hospInputPassword = document.getElementById('hospInputPassword');

  document.querySelectorAll('.qas-btn[data-hosp-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.qas-btn[data-hosp-preset]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.getAttribute('data-hosp-preset');
      if (preset === 'sms') {
        if (hospInputEmail) hospInputEmail.value = 'sms@jaipurhealth.gov.in';
        if (hospInputPassword) hospInputPassword.value = 'SMS@Jaipur2026';
      } else if (preset === 'apex') {
        if (hospInputEmail) hospInputEmail.value = 'apex@jaipurhealth.gov.in';
        if (hospInputPassword) hospInputPassword.value = 'Apex@Jaipur2026';
      }
    });
  });

  // Modal Close & Cancel Handlers
  const hospitalLoginModal = document.getElementById('hospitalLoginModal');
  const adminLoginModal = document.getElementById('adminLoginModal');
  const clearanceModal = document.getElementById('clearanceModal');
  const overrideModal = document.getElementById('overrideModal');

  if (hospModalCloseBtn) hospModalCloseBtn.addEventListener('click', () => window.GC_STATE.closeModal(hospitalLoginModal));
  if (hospModalCancelBtn) hospModalCancelBtn.addEventListener('click', () => window.GC_STATE.closeModal(hospitalLoginModal));

  // Hospital Sign Up Modal Selectors
  const hospitalSignUpModal = document.getElementById('hospitalSignUpModal');
  const hospSignUpCloseBtn = document.getElementById('hospSignUpCloseBtn');
  const hospSignUpBackToLoginBtn = document.getElementById('hospSignUpBackToLoginBtn');
  const hospitalSignUpForm = document.getElementById('hospitalSignUpForm');

  if (hospModalSignUpBtn) {
    hospModalSignUpBtn.addEventListener('click', () => {
      window.GC_STATE.closeModal(hospitalLoginModal);
      if (hospitalSignUpModal) window.GC_STATE.openModal(hospitalSignUpModal);
    });
  }

  if (hospSignUpCloseBtn) {
    hospSignUpCloseBtn.addEventListener('click', () => window.GC_STATE.closeModal(hospitalSignUpModal));
  }

  if (hospSignUpBackToLoginBtn) {
    hospSignUpBackToLoginBtn.addEventListener('click', () => {
      window.GC_STATE.closeModal(hospitalSignUpModal);
      window.GC_STATE.openModal(hospitalLoginModal);
    });
  }

  if (hospitalSignUpForm) {
    hospitalSignUpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regWebHospName').value.trim();
      const licenseId = document.getElementById('regWebHospLicense').value.trim();
      const zone = document.getElementById('regWebHospZone').value;
      const email = document.getElementById('regWebHospEmail').value.trim();
      const phone = document.getElementById('regWebHospPhone').value.trim();
      const bays = document.getElementById('regWebHospBays').value;
      const password = document.getElementById('regWebHospPass').value.trim();

      const record = window.GC_DATA.registerHospital({
        name,
        licenseId,
        zone,
        email,
        phone,
        bays,
        password
      });

      if (!record) {
        window.GC_STATE.showToast("Registration failed. Please check form fields.");
        return;
      }

      window.GC_STATE.closeModal(hospitalSignUpModal);
      window.GC_STATE.state.activeRole = 'hospital';
      window.GC_STATE.state.activeHospitalKey = record.hospitalKey;
      window.GC_STATE.switchView('hospital');
      window.GC_STATE.showToast(`Welcome! Registered and authenticated as ${record.name}.`);
    });
  }

  if (adminModalCloseBtn) adminModalCloseBtn.addEventListener('click', () => window.GC_STATE.closeModal(adminLoginModal));
  if (adminModalCancelBtn) adminModalCancelBtn.addEventListener('click', () => window.GC_STATE.closeModal(adminLoginModal));
  if (clearanceCloseBtn) clearanceCloseBtn.addEventListener('click', () => window.GC_STATE.closeModal(clearanceModal));
  if (clearanceCancelBtn) clearanceCancelBtn.addEventListener('click', () => window.GC_STATE.closeModal(clearanceModal));
  if (overrideCloseBtn) overrideCloseBtn.addEventListener('click', () => window.GC_STATE.closeModal(overrideModal));
  if (overrideCancelBtn) overrideCancelBtn.addEventListener('click', () => window.GC_STATE.closeModal(overrideModal));

  // Driver Register Modal Selectors
  const driverRegisterModal = document.getElementById('driverRegisterModal');
  const driverRegisterCloseBtn = document.getElementById('driverRegisterCloseBtn');
  const driverRegisterCancelBtn = document.getElementById('driverRegisterCancelBtn');
  const driverRegisterForm = document.getElementById('driverRegisterForm');
  const btnRegisterDriverTrigger = document.getElementById('btnRegisterDriverTrigger');
  const btnLaunchMobileAppGeneral = document.getElementById('btnLaunchMobileAppGeneral');
  const hospTabFleet = document.getElementById('hospTabFleet');
  const hospTabDrivers = document.getElementById('hospTabDrivers');

  if (driverRegisterCloseBtn) driverRegisterCloseBtn.addEventListener('click', () => window.GC_STATE.closeModal(driverRegisterModal));
  if (driverRegisterCancelBtn) driverRegisterCancelBtn.addEventListener('click', () => window.GC_STATE.closeModal(driverRegisterModal));
  if (btnRegisterDriverTrigger) btnRegisterDriverTrigger.addEventListener('click', () => window.GC_STATE.openDriverRegisterModal());
  if (btnLaunchMobileAppGeneral) btnLaunchMobileAppGeneral.addEventListener('click', () => window.GC_STATE.openDriverMobileApp());
  if (hospTabFleet) hospTabFleet.addEventListener('click', () => window.GC_HOSPITAL.switchHospitalTab('fleet'));
  if (hospTabDrivers) hospTabDrivers.addEventListener('click', () => window.GC_HOSPITAL.switchHospitalTab('drivers'));

  // Close modals on backdrop click & Escape key
  [hospitalLoginModal, adminLoginModal, clearanceModal, overrideModal, driverRegisterModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) window.GC_STATE.closeModal(modal);
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.GC_STATE.closeModal(hospitalLoginModal);
      window.GC_STATE.closeModal(adminLoginModal);
      window.GC_STATE.closeModal(clearanceModal);
      window.GC_STATE.closeModal(overrideModal);
      window.GC_STATE.closeModal(driverRegisterModal);
    }
  });

  // Driver Registration Form Submission
  if (driverRegisterForm) {
    driverRegisterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('regDriverId').value.trim();
      const pass = document.getElementById('regDriverPassword').value.trim();
      const name = document.getElementById('regDriverName').value.trim();
      const phone = document.getElementById('regDriverPhone').value.trim();
      const ambId = document.getElementById('regDriverAmbulance').value;
      const status = document.getElementById('regDriverStatus').value;
      const license = document.getElementById('regDriverLicense').value.trim();
      const hospKey = window.GC_STATE.state.activeHospitalKey || 'sms';

      const amb = window.GC_DATA.ambulances.find(a => a.id === ambId);

      window.GC_DATA.saveDriver({
        id,
        password: pass,
        name,
        phone,
        hospitalKey: hospKey,
        ambulanceId: ambId,
        vehicleType: amb ? amb.type : 'Advanced Life Support',
        status,
        licenseNumber: license
      });

      window.GC_STATE.closeModal(driverRegisterModal);
      window.GC_HOSPITAL.renderHospitalDriversList();
      window.GC_STATE.showToast(`Ambulance Driver registered! Login ID: "${id}". Credentials saved in hospital panel.`);
      driverRegisterForm.reset();
    });
  }

  // ==========================================================================
  // 2. Authentication Form Handlers
  // ==========================================================================
  // Hospital Login Form
  if (hospitalLoginForm) {
    hospitalLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = hospInputEmail.value.trim().toLowerCase();
      const pass = hospInputPassword.value.trim();

      // Check if user entered police credentials in hospital portal
      if (email === window.GC_DATA.policeAdminAccount.email.toLowerCase()) {
        window.GC_STATE.showToast("Notice: This is the Hospital Portal. Please use 'Administrative Login' for Traffic Control Police.");
        return;
      }

      const submitBtn = document.getElementById('hospModalSubmitBtn');
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying hospital session via Fox API...</span>';

      let authSuccess = false;
      let targetHospKey = null;
      let displayName = "Hospital Staff";

      // 1. Authenticate via Fox API (Role Code 9)
      if (window.GC_API) {
        try {
          const apiRes = await window.GC_API.login(9, email, pass);
          if (apiRes && apiRes.code === 100) {
            authSuccess = true;
            displayName = apiRes.entity_name || "Hospital Staff";
            const localAcc = window.GC_DATA.authenticateHospital(email, pass);
            targetHospKey = localAcc ? localAcc.hospitalKey : (email.includes('apex') ? 'apex_hospital' : 'sms_hospital');
          }
        } catch(err) {
          console.warn("Fox API hospital auth error:", err);
        }
      }

      // 2. Fallback to local credential table if API offline
      if (!authSuccess) {
        const localAuth = window.GC_DATA.authenticateHospital(email, pass);
        if (localAuth) {
          authSuccess = true;
          targetHospKey = localAuth.hospitalKey;
          displayName = localAuth.displayName;
        }
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;

      if (!authSuccess) {
        window.GC_STATE.showToast("Invalid credentials! Check your key/password or use 'Sign Up' to register your hospital.");
        return;
      }

      window.GC_STATE.closeModal(hospitalLoginModal);
      window.GC_STATE.state.activeRole = 'hospital';
      window.GC_STATE.state.activeHospitalKey = targetHospKey;
      window.GC_STATE.switchView('hospital');
      window.GC_STATE.showToast(`Authenticated as ${displayName}.`);
    });
  }

  // Police Admin Login Form
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const adminInputEmail = document.getElementById('adminInputEmail');
      const adminInputPassword = document.getElementById('adminInputPassword');

      const email = adminInputEmail.value.trim().toLowerCase();
      const pass = adminInputPassword.value.trim();

      // Guard: Check if hospital staff tried logging in here
      if (window.GC_DATA.hospitalAccounts[email]) {
        window.GC_STATE.showToast("Access Denied: The Administrative Portal is restricted to Jaipur Traffic Control Police.");
        return;
      }

      const submitBtn = document.getElementById('adminModalSubmitBtn');
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying police security token via Fox API...</span>';

      let authSuccess = false;
      let displayName = "Jaipur Traffic Control Police Command";

      // 1. Authenticate via Fox API (Role Code 8)
      if (window.GC_API) {
        try {
          const apiRes = await window.GC_API.login(8, email, pass);
          if (apiRes && apiRes.code === 100) {
            authSuccess = true;
            displayName = apiRes.entity_name || displayName;
          }
        } catch(err) {
          console.warn("Fox API police admin auth error:", err);
        }
      }

      // 2. Fallback to local credential table if API offline
      if (!authSuccess) {
        if ((email === window.GC_DATA.policeAdminAccount.email.toLowerCase() && pass === window.GC_DATA.policeAdminAccount.password) ||
            (window.GC_DATA.adminAccounts && window.GC_DATA.adminAccounts[email] && window.GC_DATA.adminAccounts[email].password === pass)) {
          authSuccess = true;
        }
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;

      if (!authSuccess) {
        window.GC_STATE.showToast("Security Alert: Invalid credentials for Jaipur Traffic Control Police Command.");
        return;
      }

      window.GC_STATE.closeModal(adminLoginModal);
      window.GC_STATE.state.activeRole = 'admin';
      window.GC_STATE.state.activeHospitalKey = null;
      window.GC_STATE.switchView('admin');
      window.GC_STATE.showToast("Security clearance verified: Welcome to Jaipur Traffic Control Police Command.");
    });
  }

  // ==========================================================================
  // 3. Emergency Route Clearance & Override Form Submissions
  // ==========================================================================
  // Hospital Clearance Request Submission
  if (routeClearanceForm) {
    routeClearanceForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const state = window.GC_STATE.state;
      const selectedAmbId = document.getElementById('clearanceAmbulanceSelect').value;
      const severityRadio = document.querySelector('input[name="severityLevel"]:checked');
      const severity = severityRadio ? severityRadio.value : 'code-red';
      const vitals = document.getElementById('patientVitals').value || 'SpO2 88%, Pulse 124 bpm';

      const amb = window.GC_DATA.ambulances.find(a => a.id === selectedAmbId);
      const currentHosp = window.GC_DATA.hospitalProfiles[state.activeHospitalKey];

      const existingReqIndex = state.clearanceRequests.findIndex(r => r.ambulanceId === selectedAmbId);
      const newReq = {
        id: `REQ-${state.activeHospitalKey.toUpperCase()}-${selectedAmbId.split('-').pop()}`,
        hospitalKey: state.activeHospitalKey,
        hospitalName: currentHosp ? currentHosp.name : "Hospital Intake",
        ambulanceId: selectedAmbId,
        type: amb ? amb.type : "Advanced Life Support",
        driver: amb ? `${amb.driver} (${amb.phone})` : "On Duty Paramedic",
        severity: severity,
        severityLabel: severity === 'code-red' ? 'Code Red • Critical' : (severity === 'code-yellow' ? 'Code Yellow • Urgent' : 'Code Green • Stable'),
        vitals: vitals,
        location: amb ? amb.location : "En route",
        routeKey: "optimal",
        routeName: "JLN Marg Corridor",
        eta: amb ? amb.eta : "8 mins",
        status: "pending",
        statusLabel: "PENDING JTP APPROVAL",
        grantedAt: null,
        holdAlertSec: 90
      };

      if (existingReqIndex >= 0) {
        state.clearanceRequests[existingReqIndex] = newReq;
      } else {
        state.clearanceRequests.unshift(newReq);
      }

      // Synchronize with Fox Backend API
      if (window.GC_API && window.GC_API.submitClearance) {
        window.GC_API.submitClearance({
          hospital_key: state.activeHospitalKey || 'sms',
          hospital_name: currentHosp ? currentHosp.name : "Hospital Intake",
          ambulance_id: selectedAmbId,
          vehicle_type: amb ? amb.type : "Advanced Life Support",
          driver_name: amb ? amb.driver : "On Duty Paramedic",
          driver_phone: amb ? amb.phone : "",
          severity: severity,
          severity_label: newReq.severityLabel,
          patient_vitals: vitals,
          location: amb ? amb.location : "En route",
          route_key: "optimal",
          route_name: "JLN Marg Corridor",
          eta: amb ? amb.eta : "8 mins"
        }).then(res => {
          if (res && res.request) {
            console.log("Clearance request synchronized with Fox backend:", res.request.id);
          }
        }).catch(err => console.warn("Fox API clearance sync notice:", err));
      }

      window.GC_STATE.closeModal(clearanceModal);
      window.GC_HOSPITAL.updateHospitalClearanceBanner();
      window.GC_STATE.showToast(`Clearance request for ${selectedAmbId} submitted to JTP Central Command via Fox API.`);
    });
  }

  // Admin Route Override Submission
  if (routeOverrideForm) {
    routeOverrideForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newRouteKey = document.querySelector('input[name="newRouteKey"]:checked').value;
      window.GC_STATE.closeModal(overrideModal);
      window.GC_MAPS.applyRouteOverride(newRouteKey);
    });
  }

  // Routine Route Form Submission (Non-Emergency Local Transit)
  if (routineRouteForm) {
    routineRouteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ambSelect = document.getElementById('routineAmbulanceSelect');
      const originSelect = document.getElementById('routineOriginSelect');
      const destSelect = document.getElementById('routineDestinationSelect');
      const purposeSelect = document.getElementById('routinePurposeSelect');

      const ambId = ambSelect ? ambSelect.value : window.GC_STATE.state.selectedAmbulanceId;
      const originKey = originSelect ? originSelect.value : 'sms';
      const destKey = destSelect ? destSelect.value : 'mansarovar';
      const purpose = purposeSelect ? purposeSelect.options[purposeSelect.selectedIndex].text : 'Standard Transit';

      window.GC_HOSPITAL.calculateRoutineRoute(originKey, destKey, ambId, purpose);
    });
  }

  // ==========================================================================
  // 4. UI Responsiveness & Interactive Button Fixes
  // ==========================================================================
  // Dismiss Emergency Alert Banner
  if (btnDismissAlert) {
    btnDismissAlert.addEventListener('click', () => {
      const bar = document.getElementById('corridorAlertBar');
      if (bar) bar.style.display = 'none';
      window.GC_STATE.showToast("Alert banner dismissed from intake view.");
    });
  }

  // Floating HUD Clearance Request Button
  if (hudClearanceBtn) {
    hudClearanceBtn.addEventListener('click', () => {
      window.GC_STATE.openClearanceModal(window.GC_STATE.state.selectedAmbulanceId);
    });
  }

  // Hospital Map Route Switching Buttons (Optimal / Alt A / Alt B)
  document.querySelectorAll('.route-select-btn[data-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.route-select-btn[data-route]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const routeKey = btn.getAttribute('data-route');
      window.GC_STATE.state.activeOverrideRoute = routeKey;

      const elements = window.GC_MAPS.hospitalMapElements;
      const hudEta = document.getElementById('hudEta');
      const hudDistance = document.getElementById('hudDistance');

      if (routeKey === 'optimal') {
        if (elements.optimalRoute) elements.optimalRoute.setStyle({ color: '#000000', weight: 6, opacity: 0.95 });
        if (elements.altTonk) elements.altTonk.setStyle({ color: '#71717a', weight: 4, dashArray: '8, 8', opacity: 0.7 });
        if (elements.altMi) elements.altMi.setStyle({ color: '#a1a1aa', weight: 3, dashArray: '4, 8', opacity: 0.6 });
        if (hudEta) hudEta.textContent = "7 min 40 sec";
        if (hudDistance) hudDistance.textContent = "3.8 km";
      } else if (routeKey === 'alt-a') {
        if (elements.optimalRoute) elements.optimalRoute.setStyle({ color: '#71717a', weight: 4, dashArray: '8, 8', opacity: 0.7 });
        if (elements.altTonk) elements.altTonk.setStyle({ color: '#000000', weight: 6, dashArray: null, opacity: 0.95 });
        if (elements.altMi) elements.altMi.setStyle({ color: '#a1a1aa', weight: 3, dashArray: '4, 8', opacity: 0.6 });
        if (hudEta) hudEta.textContent = "13 min 15 sec";
        if (hudDistance) hudDistance.textContent = "5.6 km";
      } else if (routeKey === 'alt-b') {
        if (elements.optimalRoute) elements.optimalRoute.setStyle({ color: '#71717a', weight: 4, dashArray: '8, 8', opacity: 0.7 });
        if (elements.altTonk) elements.altTonk.setStyle({ color: '#a1a1aa', weight: 3, dashArray: '4, 8', opacity: 0.6 });
        if (elements.altMi) elements.altMi.setStyle({ color: '#000000', weight: 6, dashArray: null, opacity: 0.95 });
        if (hudEta) hudEta.textContent = "18 min 50 sec";
        if (hudDistance) hudDistance.textContent = "7.2 km";
      }
    });
  });

  // Hospital Fleet Tab Filter Buttons (All / In Service / Out of Service)
  document.querySelectorAll('.fleet-tab-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fleet-tab-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.GC_STATE.state.hospitalFleetFilter = btn.getAttribute('data-filter');
      window.GC_HOSPITAL.renderHospitalFleetList();
    });
  });

  // Dispatch Mode Tabs (Emergency vs Routine Transit)
  if (btnModeEmergency) btnModeEmergency.addEventListener('click', () => window.GC_HOSPITAL.setDispatchMode('emergency'));
  if (btnModeRoutine) btnModeRoutine.addEventListener('click', () => window.GC_HOSPITAL.setDispatchMode('routine'));

  // Reset Routine Route to Emergency View
  if (btnResetRoutineRoute) {
    btnResetRoutineRoute.addEventListener('click', () => {
      window.GC_HOSPITAL.setDispatchMode('emergency');
    });
  }

  // Escalate from Routine to Emergency Green Corridor
  if (btnEscalateFromRoutine) {
    btnEscalateFromRoutine.addEventListener('click', () => {
      const ambSelect = document.getElementById('routineAmbulanceSelect');
      const ambId = ambSelect ? ambSelect.value : window.GC_STATE.state.selectedAmbulanceId;
      window.GC_HOSPITAL.setDispatchMode('emergency');
      window.GC_STATE.openClearanceModal(ambId);
      window.GC_STATE.showToast("Escalating to Emergency Green Corridor: alert transmitting to Jaipur Traffic Police.");
    });
  }

  // Admin Route Override Buttons on Map Header
  document.querySelectorAll('[data-override-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-override-route');
      window.GC_MAPS.applyRouteOverride(key);
    });
  });

  // Admin Category Tabs (Attention / Corridors / Standby / Offline)
  document.querySelectorAll('.admin-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.GC_STATE.state.adminCategoryFilter = btn.getAttribute('data-cat');
      window.GC_ADMIN.renderAdminFleetTable();
    });
  });

  // Severity Card Selection
  document.querySelectorAll('.severity-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.severity-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const r = card.querySelector('input[type="radio"]');
      if (r) r.checked = true;
    });
  });

  // Override Route Card Selection
  document.querySelectorAll('.override-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.override-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const r = card.querySelector('input[type="radio"]');
      if (r) r.checked = true;
    });
  });

  // Sign out buttons
  if (btnSessionSignOut) btnSessionSignOut.addEventListener('click', () => window.GC_STATE.signOut());
  if (btnExitDashboard) btnExitDashboard.addEventListener('click', () => window.GC_STATE.signOut());
  if (btnAdminSignOut) btnAdminSignOut.addEventListener('click', () => window.GC_STATE.signOut());
  if (brandLogoHome) brandLogoHome.addEventListener('click', () => window.GC_STATE.signOut());

  // Mobile Drawer Menu Toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('is-active');
    });

    navMenu.querySelectorAll('.nav-link').forEach(l => {
      l.addEventListener('click', () => navMenu.classList.remove('is-active'));
    });
  }
});
