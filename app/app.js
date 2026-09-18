/**
 * Green+ Corridor - Clinical Emergency & Municipal Traffic Command Network
 * Strict Role-Based Authentication with Dedicated Traffic Police Command Layer,
 * Isolated Hospital Client Portals (SMS & Apex), Real-World Jaipur Telemetry,
 * and Independent Routine Transit Planning (Local Bypassing of Police Queue).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // --- Core State Store ---
  const state = {
    currentView: 'landing', // 'landing', 'hospital', 'admin'
    activeRole: null, // 'hospital' or 'admin'
    activeHospitalKey: null, // 'sms' or 'apex'
    activeOverrideRoute: 'optimal', // 'optimal', 'alt-a', 'alt-b'
    dispatchMode: 'emergency', // 'emergency' or 'routine'
    adminCategoryFilter: 'all',
    hospitalFleetFilter: 'all',
    selectedAmbulanceId: 'RJ-14-EA-4091',

    // Clearance Requests Queue (Shared across Admin & Hospitals)
    clearanceRequests: [
      {
        id: "REQ-SMS-4091",
        hospitalKey: "sms",
        hospitalName: "Sawai Man Singh (SMS) Hospital",
        ambulanceId: "RJ-14-EA-4091",
        type: "Advanced Life Support (ALS-01)",
        driver: "Rajesh Kumar (+91 98290 44102)",
        severity: "code-red",
        severityLabel: "Code Red &bull; Critical",
        vitals: "SpO2 86%, Pulse 132 bpm, BP 80/50",
        location: "Vaishali Nagar (Near Amrapali Circle)",
        routeKey: "optimal",
        routeName: "JLN Marg Corridor",
        eta: "7 min 40 sec",
        status: "granted", // 'pending', 'granted', 'overridden'
        statusLabel: "CLEARANCE GRANTED",
        grantedAt: "23:45:10",
        holdAlertSec: 90
      },
      {
        id: "REQ-APEX-2204",
        hospitalKey: "apex",
        hospitalName: "Apex Super Speciality Hospital",
        ambulanceId: "RJ-14-UB-2204",
        type: "Basic Life Support (BLS-04)",
        driver: "Vikas Meena (+91 94140 18239)",
        severity: "code-yellow",
        severityLabel: "Code Yellow &bull; Urgent",
        vitals: "SpO2 91%, Pulse 108 bpm",
        location: "Mansarovar (Shipra Path Crossing)",
        routeKey: "alt-a",
        routeName: "Tonk Road Corridor",
        eta: "12 min 15 sec",
        status: "pending",
        statusLabel: "PENDING JTP APPROVAL",
        grantedAt: null,
        holdAlertSec: 150
      }
    ]
  };

  // --- Real Accounts & Passwords ---
  const hospitalAccounts = {
    "sms@jaipurhealth.gov.in": {
      password: "SMS@Jaipur2026",
      hospitalKey: "sms",
      displayName: "Sawai Man Singh (SMS) Hospital"
    },
    "apex@jaipurhealth.gov.in": {
      password: "Apex@Jaipur2026",
      hospitalKey: "apex",
      displayName: "Apex Super Speciality Hospital"
    }
  };

  const policeAdminAccount = {
    email: "admin@jtp-control.gov.in",
    password: "JTP@Admin2026",
    displayName: "Jaipur Traffic Control Police Command"
  };

  // --- Hospital Profiles ---
  const hospitalProfiles = {
    sms: {
      name: "Sawai Man Singh (SMS) Hospital, Jaipur",
      address: "Jawaharlal Nehru Marg, Ashok Nagar, Jaipur, Rajasthan 302004",
      tier: "LEVEL 1 APEX TRAUMA CENTER",
      node: "NODE #04 JAIPUR METRO",
      activeBadge: "LIVE INTAKE CORE",
      beds: "14 / 18 Free",
      ors: "4 Ready",
      coords: [26.8929, 75.8155]
    },
    apex: {
      name: "Apex Super Speciality Hospital, Jaipur",
      address: "Sector 9, Mandir Marg, Malviya Nagar, Jaipur, Rajasthan 302017",
      tier: "TERTIARY EMERGENCY TRAUMA CARE",
      node: "NODE #09 JAIPUR SOUTH",
      activeBadge: "TRAUMA INTAKE ACTIVE",
      beds: "8 / 12 Free",
      ors: "2 Ready",
      coords: [26.8520, 75.8200]
    }
  };

  // --- Ambulance Fleet Dataset ---
  const ambulances = [
    {
      id: "RJ-14-EA-4091",
      hospitalKey: "sms",
      type: "Advanced Life Support (ALS-01)",
      status: "en-route",
      statusLabel: "EN ROUTE (CRITICAL)",
      statusClass: "status-en-route",
      owner: "SMS Trauma Fleet Trust / Dr. M. K. Sharma",
      driver: "Rajesh Kumar",
      phone: "+91 98290 44102",
      location: "Vaishali Nagar (Near Amrapali Circle)",
      eta: "7 min 40 sec",
      distance: "3.8 km",
      speed: "56 km/h",
      coords: [26.9045, 75.7590],
      inService: true,
      equipment: "Defibrillator + Ventilator + Arterial Line",
      hasGreenCorridor: true
    },
    {
      id: "RJ-14-EA-9912",
      hospitalKey: "sms",
      type: "Mobile ICU & Cardiac Telemetry",
      status: "standby",
      statusLabel: "AVAILABLE (STANDBY)",
      statusClass: "status-standby",
      owner: "Jaipur Heart Foundation Network",
      driver: "Amit Verma",
      phone: "+91 98281 77301",
      location: "SMS Hospital Trauma Bay 2",
      eta: "Immediate (0 min)",
      distance: "0.1 km",
      speed: "0 km/h",
      coords: [26.8935, 75.8160],
      inService: true,
      equipment: "12-Lead ECG + Cardiac Pacing + Suction",
      hasGreenCorridor: false
    },
    {
      id: "RJ-14-EA-3341",
      hospitalKey: "sms",
      type: "Pediatric Critical Care Unit",
      status: "standby",
      statusLabel: "AVAILABLE (STANDBY)",
      statusClass: "status-standby",
      owner: "JK Lon Children's Hospital Relief",
      driver: "Pooja Sharma",
      phone: "+91 98292 33412",
      location: "SMS Medical Enclave Gate 3",
      eta: "Immediate (0 min)",
      distance: "0.4 km",
      speed: "0 km/h",
      coords: [26.8950, 75.8180],
      inService: true,
      equipment: "Neonatal Incubator + Pediatric Ventilator",
      hasGreenCorridor: false
    },
    {
      id: "RJ-14-EA-5502",
      hospitalKey: "sms",
      type: "Infection Control / Isolation Unit",
      status: "maintenance",
      statusLabel: "OUT OF SERVICE (SANITIZING)",
      statusClass: "status-maintenance",
      owner: "Jaipur Municipal Health Directorate",
      driver: "Biohazard Protocol Lead: S. Meena",
      phone: "+91 98299 12340",
      location: "SMS Decontamination Dock B",
      eta: "Ready in 35 mins",
      distance: "0.2 km",
      speed: "0 km/h",
      coords: [26.8920, 75.8140],
      inService: false,
      equipment: "UV-C Fogging & HEPA Filter Sterilization",
      hasGreenCorridor: false
    },
    {
      id: "RJ-14-UB-2204",
      hospitalKey: "apex",
      type: "Basic Life Support (BLS-04)",
      status: "transit",
      statusLabel: "IN TRANSIT (STABLE)",
      statusClass: "status-transit",
      owner: "Rajasthan Emergency Relief Services",
      driver: "Vikas Meena",
      phone: "+91 94140 18239",
      location: "Mansarovar (Shipra Path Crossing)",
      eta: "12 min 15 sec",
      distance: "6.2 km",
      speed: "48 km/h",
      coords: [26.8530, 75.7680],
      inService: true,
      equipment: "Oxygen Delivery + Automated External Defibrillator",
      hasGreenCorridor: false
    },
    {
      id: "RJ-14-UB-1188",
      hospitalKey: "apex",
      type: "Advanced Life Support (ALS-02)",
      status: "transit",
      statusLabel: "EN ROUTE (URGENT)",
      statusClass: "status-transit",
      owner: "Aegis Health Response Trust",
      driver: "Suresh Gurjar",
      phone: "+91 97840 55120",
      location: "Malviya Nagar (Calgiri Marg)",
      eta: "14 min 30 sec",
      distance: "7.1 km",
      speed: "52 km/h",
      coords: [26.8520, 75.8190],
      inService: true,
      equipment: "Intubation + Portable Ultrasound + Infusion",
      hasGreenCorridor: false
    },
    {
      id: "RJ-14-UB-7720",
      hospitalKey: "apex",
      type: "Basic Life Support (BLS-08)",
      status: "maintenance",
      statusLabel: "OUT OF SERVICE (MAINTENANCE)",
      statusClass: "status-maintenance",
      owner: "SMS Mechanical Works Depot",
      driver: "Off Duty (Mechanic: Ramesh Jangid)",
      phone: "+91 94142 88201",
      location: "Sanganer Fleet Maintenance Yard",
      eta: "Off Duty (Parts Replacement)",
      distance: "N/A",
      speed: "0 km/h",
      coords: [26.8200, 75.7700],
      inService: false,
      equipment: "Scheduled Service / Brake Overhaul",
      hasGreenCorridor: false
    },
    {
      id: "RJ-14-UB-6619",
      hospitalKey: "apex",
      type: "Standard Transit Unit",
      status: "maintenance",
      statusLabel: "OUT OF SERVICE (SHIFT END)",
      statusClass: "status-maintenance",
      owner: "Private EMS Partner #07",
      driver: "Deepak Singh",
      phone: "+91 99280 11984",
      location: "Vidhyadhar Nagar Sector 4",
      eta: "Next Shift: 06:00 Tomorrow",
      distance: "N/A",
      speed: "0 km/h",
      coords: [26.9600, 75.7800],
      inService: false,
      equipment: "Routine Rest Interval",
      hasGreenCorridor: false
    }
  ];

  // --- Local Police Personnel Deployment Dataset ---
  const policeDeployments = [
    {
      name: "Inspector R. S. Rathore",
      unit: "JTP Mobile Patrol Unit 4",
      location: "Rambagh Circle Crossing",
      coords: [26.8970, 75.8120],
      phone: "+91 94140 33810",
      duty: "Intersection Priority Pre-emption",
      status: "Active on Site &bull; Holding Cross-Traffic"
    },
    {
      name: "Sub-Inspector Vikram Singh",
      unit: "JTP Flying Squad 2",
      location: "Ambedkar Circle Crossing",
      coords: [26.9032, 75.7995],
      phone: "+91 94140 55192",
      duty: "Western Approach Corridor Clearance",
      status: "Active on Site &bull; Signal Override Ready"
    },
    {
      name: "Head Constable Dinesh Kumar",
      unit: "JTP Checkpoint 6",
      location: "Tonk Phatak Crossing",
      coords: [26.8790, 75.7950],
      phone: "+91 98291 44021",
      duty: "Alternate Route A Overseer",
      status: "Standby on Alternate Diversion Corridor"
    },
    {
      name: "Constable Mahendra",
      unit: "Traffic Rapid Bike 12",
      location: "SMS Hospital Trauma Gate 1",
      coords: [26.8932, 75.8152],
      phone: "+91 97830 11928",
      duty: "Emergency Reception Clearance",
      status: "Cleared Inbound Ambulance Reception Dock"
    },
    {
      name: "ASI K. L. Meena",
      unit: "JTP South Division Unit 8",
      location: "Apex Hospital Malviya Nagar",
      coords: [26.8535, 75.8195],
      phone: "+91 94141 77309",
      duty: "South Corridor Liaison",
      status: "Active on Site &bull; Calgiri Road Monitor"
    }
  ];

  // --- Real Jaipur City Coordinates & Routes ---
  const smsHospitalCoords = [26.8929, 75.8155];
  const apexHospitalCoords = [26.8520, 75.8200];

  const optimalRouteCoords = [
    [26.9045, 75.7590], // Vaishali Nagar
    [26.9030, 75.7720], // Ajmer Road
    [26.9020, 75.7860], // Bhawani Singh Road
    [26.9032, 75.7995], // Ambedkar Circle (Signal 1)
    [26.8970, 75.8120], // Rambagh Circle (Signal 2)
    [26.8932, 75.8152], // SMS Trauma Gate 1 (Signal 4)
    [26.8929, 75.8155]  // SMS Hospital Emergency Dock
  ];

  const altRouteTonkCoords = [
    [26.9045, 75.7590],
    [26.8850, 75.7780],
    [26.8790, 75.7950], // Tonk Phatak
    [26.8860, 75.8080],
    [26.8929, 75.8155]
  ];

  const altRouteMiRoadCoords = [
    [26.9045, 75.7590],
    [26.9180, 75.7850],
    [26.9170, 75.8050],
    [26.9080, 75.8160],
    [26.8929, 75.8155]
  ];

  const trafficLightNodes = [
    { id: "sig-ambedkar", name: "Ambedkar Circle Crossing", coords: [26.9032, 75.7995], cleared: true, density: "Low (~18 veh/min)" },
    { id: "sig-rambagh", name: "Rambagh Circle Crossing", coords: [26.8970, 75.8120], cleared: true, density: "Low - Green Wave Override" },
    { id: "sig-narayan", name: "Narayan Singh Circle Junction", coords: [26.9015, 75.8180], cleared: true, density: "Moderate (~34 veh/min)" },
    { id: "sig-smsgate", name: "SMS Trauma Gate 1 Crossing", coords: [26.8932, 75.8152], cleared: true, density: "Immediate Dock Clear" }
  ];

  // --- Map Instances ---
  let hospitalMap = null;
  let adminMap = null;
  let hospitalMapElements = {};
  let adminMapElements = {};

  // --- DOM Elements ---
  const landingView = document.getElementById('landingView');
  const hospitalDashboardView = document.getElementById('hospitalDashboardView');
  const adminDashboardView = document.getElementById('adminDashboardView');
  const activeSessionPill = document.getElementById('activeSessionPill');
  const sessionDot = document.getElementById('sessionDot');
  const sessionRoleText = document.getElementById('sessionRoleText');
  const btnSessionSignOut = document.getElementById('btnSessionSignOut');
  const btnExitDashboard = document.getElementById('btnExitDashboard');
  const btnAdminSignOut = document.getElementById('btnAdminSignOut');
  const brandLogoHome = document.getElementById('brandLogoHome');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  // Modals
  const hospitalLoginModal = document.getElementById('hospitalLoginModal');
  const adminLoginModal = document.getElementById('adminLoginModal');
  const clearanceModal = document.getElementById('clearanceModal');
  const overrideModal = document.getElementById('overrideModal');

  // Forms
  const hospitalLoginForm = document.getElementById('hospitalLoginForm');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const routeClearanceForm = document.getElementById('routeClearanceForm');
  const routeOverrideForm = document.getElementById('routeOverrideForm');

  // Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // --- Strict Access-Controlled View Switcher ---
  function switchView(newView) {
    // Role Enforcement Check
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

    landingView.style.display = 'none';
    hospitalDashboardView.style.display = 'none';
    adminDashboardView.style.display = 'none';

    if (newView === 'landing') {
      landingView.style.display = 'block';
      activeSessionPill.style.display = 'none';
      if (navMenu) navMenu.style.display = 'flex';
    } else if (newView === 'hospital') {
      hospitalDashboardView.style.display = 'block';
      activeSessionPill.style.display = 'flex';
      if (sessionDot) sessionDot.style.backgroundColor = '#22c55e';
      const hosp = hospitalProfiles[state.activeHospitalKey];
      sessionRoleText.textContent = `Hospital Session: ${hosp.name.split(',')[0]}`;
      if (navMenu) navMenu.style.display = 'none';
      renderHospitalDashboard();
    } else if (newView === 'admin') {
      adminDashboardView.style.display = 'block';
      activeSessionPill.style.display = 'flex';
      if (sessionDot) sessionDot.style.backgroundColor = '#3b82f6';
      sessionRoleText.textContent = `Command Session: JTP Central Authority`;
      if (navMenu) navMenu.style.display = 'none';
      renderAdminDashboard();
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

  // --- Render Hospital Dashboard (SMS or Apex) ---
  function renderHospitalDashboard() {
    const profile = hospitalProfiles[state.activeHospitalKey];
    if (!profile) return;

    // Hospital Identity
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

    // Render Hospital Fleet List
    renderHospitalFleetList();

    // Populate Routine Transit Selectors & Mode
    populateRoutineAmbulanceSelect();
    setDispatchMode(state.dispatchMode || 'emergency');

    // Initialize or refresh Hospital Map
    setTimeout(() => {
      initHospitalMap();
      if (hospitalMap) hospitalMap.invalidateSize();
    }, 150);
  }

  // --- Hospital Clearance Banner Live Check ---
  function updateHospitalClearanceBanner() {
    const hospClearanceStat = document.getElementById('hospClearanceStat');
    const corridorAlertBar = document.getElementById('corridorAlertBar');
    const corridorAlertTitle = document.getElementById('corridorAlertTitle');
    const corridorAlertText = document.getElementById('corridorAlertText');

    const req = state.clearanceRequests.find(r => r.hospitalKey === state.activeHospitalKey);

    if (req) {
      corridorAlertBar.style.display = 'block';

      if (req.status === 'granted') {
        if (hospClearanceStat) hospClearanceStat.innerHTML = `<span class="status-text-green">GRANTED</span>`;
        corridorAlertTitle.textContent = "EMERGENCY CLEARANCE GRANTED BY JTP ADMIN:";
        corridorAlertText.textContent = `Unit ${req.ambulanceId} green corridor active via ${req.routeName}. 4 Traffic signals pre-empted with JTP field officer escort.`;
      } else if (req.status === 'pending') {
        if (hospClearanceStat) hospClearanceStat.innerHTML = `<span class="status-text-red">PENDING APPROVAL</span>`;
        corridorAlertTitle.textContent = "CLEARANCE AWAITING JTP AUTHORIZATION:";
        corridorAlertText.textContent = `Request for ${req.ambulanceId} (${req.severity.toUpperCase()}) submitted to Jaipur Traffic Police central command. Standby for override confirmation.`;
      } else if (req.status === 'overridden') {
        if (hospClearanceStat) hospClearanceStat.innerHTML = `<span class="status-text-amber">ROUTE OVERRIDDEN</span>`;
        corridorAlertTitle.textContent = "ALERT: ROUTE OVERRIDE BY JTP COMMAND:";
        corridorAlertText.textContent = `Unit ${req.ambulanceId} diverted to ${req.routeName} to avoid traffic bottleneck. Police units informed.`;
      }
    } else {
      if (hospClearanceStat) hospClearanceStat.innerHTML = `<span class="status-text-green">MONITORING</span>`;
      corridorAlertBar.style.display = 'none';
    }
  }

  // --- Render Hospital Fleet List ---
  function renderHospitalFleetList() {
    const container = document.getElementById('fleetListContainer');
    if (!container) return;

    const hospitalAmbulances = ambulances.filter(a => a.hospitalKey === state.activeHospitalKey);
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
        updateHospitalMapFocus();
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
        openClearanceModal(btn.getAttribute('data-id'));
      });
    });
  }

  // --- Initialize Hospital Map ---
  function initHospitalMap() {
    if (hospitalMap) return;

    const mapElement = document.getElementById('jaipurMap');
    if (!mapElement) return;

    hospitalMap = L.map('jaipurMap', {
      center: [26.8985, 75.7870],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(hospitalMap);

    const currentProfile = hospitalProfiles[state.activeHospitalKey] || hospitalProfiles.sms;
    const hospCoords = currentProfile.coords;
    const hospitalIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `<div class="marker-pin-hospital" title="${currentProfile.name}"><span>+</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    L.marker(hospCoords, { icon: hospitalIcon })
      .addTo(hospitalMap)
      .bindPopup(`<strong>${currentProfile.name}</strong><br>Emergency Intake Reception Dock`);

    // Ambulance Marker
    const ambIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `<div class="marker-pin-ambulance pulsing-red" title="Ambulance RJ-14-EA-4091"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-2.5l-2.5 -4h-4"></path></svg></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    hospitalMapElements.ambulanceMarker = L.marker([26.9045, 75.7590], { icon: ambIcon }).addTo(hospitalMap);

    // Add Police Personnel Markers on Map
    policeDeployments.forEach(pol => {
      const polIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="marker-pin-police" title="${pol.name} (${pol.unit})"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker(pol.coords, { icon: polIcon })
        .addTo(hospitalMap)
        .bindPopup(`
          <strong>${pol.name}</strong><br>
          <em>${pol.unit}</em> &bull; ${pol.location}<br>
          Contact: <strong>${pol.phone}</strong><br>
          Duty: ${pol.duty}<br>
          <span style="color:#16a34a; font-weight:600;">${pol.status}</span>
        `);
    });

    // Traffic Signals on Map
    trafficLightNodes.forEach(sig => {
      const sigIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="marker-pin-signal signal-green" title="${sig.name}"><span class="signal-inner-dot"></span></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      L.marker(sig.coords, { icon: sigIcon })
        .addTo(hospitalMap)
        .bindPopup(`<strong>${sig.name}</strong><br>Status: <span style="color:#16a34a; font-weight:700;">GREEN WAVE OVERRIDE</span><br>Density: ${sig.density}`);
    });

    // Routes
    hospitalMapElements.optimalRoute = L.polyline(optimalRouteCoords, {
      color: '#000000',
      weight: 6,
      opacity: 0.95
    }).addTo(hospitalMap);

    hospitalMapElements.altTonk = L.polyline(altRouteTonkCoords, {
      color: '#71717a',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.7
    }).addTo(hospitalMap);

    hospitalMapElements.altMi = L.polyline(altRouteMiRoadCoords, {
      color: '#a1a1aa',
      weight: 3,
      dashArray: '4, 8',
      opacity: 0.6
    }).addTo(hospitalMap);

    hospitalMap.fitBounds(hospitalMapElements.optimalRoute.getBounds(), { padding: [40, 40] });
  }

  function updateHospitalMapFocus() {
    const amb = ambulances.find(a => a.id === state.selectedAmbulanceId);
    if (!amb || !hospitalMap) return;

    if (amb.coords && hospitalMapElements.ambulanceMarker) {
      hospitalMapElements.ambulanceMarker.setLatLng(amb.coords);
      hospitalMap.flyTo(amb.coords, 14, { duration: 1.2 });
    }

    const hudBadge = document.getElementById('hudUnitBadge');
    const hudEta = document.getElementById('hudEta');
    const hudDistance = document.getElementById('hudDistance');
    const hudSpeed = document.getElementById('hudSpeed');
    const hudType = document.getElementById('hudUnitType');

    if (hudBadge) hudBadge.textContent = amb.id;
    if (hudEta) hudEta.textContent = amb.eta;
    if (hudDistance) hudDistance.textContent = amb.distance;
    if (hudSpeed) hudSpeed.textContent = amb.speed;
    if (hudType) hudType.textContent = amb.type;
  }

  // --- Jaipur Transit Hubs for Standard / Routine Routing ---
  const jaipurLocations = {
    sms: { name: "SMS Hospital Emergency Dock (JLN Marg)", coords: [26.8929, 75.8155], landmark: "SMS Hospital" },
    apex: { name: "Apex Hospital (Malviya Nagar Sector 9)", coords: [26.8520, 75.8200], landmark: "Apex Hospital" },
    vaishali: { name: "Vaishali Nagar (Amrapali Circle)", coords: [26.9045, 75.7590], landmark: "Amrapali Circle" },
    mansarovar: { name: "Mansarovar (Shipra Path Crossing)", coords: [26.8550, 75.7660], landmark: "Shipra Path" },
    cscheme: { name: "C-Scheme (Statue Circle)", coords: [26.9085, 75.8010], landmark: "Statue Circle" },
    jagatpura: { name: "Jagatpura (Mahal Road / RTO)", coords: [26.8180, 75.8390], landmark: "Mahal Road Crossing" },
    tonkphatak: { name: "Tonk Phatak Railway Crossing", coords: [26.8790, 75.7950], landmark: "Tonk Phatak Flyover" },
    rajapark: { name: "Raja Park (LBS College Marg)", coords: [26.8970, 75.8310], landmark: "LBS College Intersection" }
  };

  function getRoutePoints(originKey, destKey) {
    const origin = jaipurLocations[originKey] || jaipurLocations.sms;
    const dest = jaipurLocations[destKey] || jaipurLocations.mansarovar;

    const ambedkarCircle = [26.9032, 75.7995];
    const rambaghCircle = [26.8970, 75.8120];
    const tonkPhatak = [26.8790, 75.7950];
    const gurjarKiThodi = [26.8660, 75.7780];
    const ajmerRoadPillar = [26.9030, 75.7720];
    const otsChauraha = [26.8680, 75.8120];
    const b2Bypass = [26.8480, 75.7850];

    if ((originKey === 'vaishali' && destKey === 'sms') || (originKey === 'sms' && destKey === 'vaishali')) {
      return [origin.coords, ajmerRoadPillar, [26.9020, 75.7860], ambedkarCircle, rambaghCircle, dest.coords];
    }
    if ((originKey === 'sms' && destKey === 'apex') || (originKey === 'apex' && destKey === 'sms')) {
      return [origin.coords, rambaghCircle, [26.8850, 75.8140], otsChauraha, [26.8530, 75.8140], dest.coords];
    }
    if ((originKey === 'mansarovar' && destKey === 'sms') || (originKey === 'sms' && destKey === 'mansarovar')) {
      return [origin.coords, gurjarKiThodi, tonkPhatak, rambaghCircle, dest.coords];
    }
    if ((originKey === 'mansarovar' && destKey === 'apex') || (originKey === 'apex' && destKey === 'mansarovar')) {
      return [origin.coords, [26.8510, 75.7720], b2Bypass, [26.8440, 75.8050], dest.coords];
    }
    if ((originKey === 'cscheme' && destKey === 'sms') || (originKey === 'sms' && destKey === 'cscheme')) {
      return [origin.coords, [26.9040, 75.8050], ambedkarCircle, dest.coords];
    }

    const midPoint = [
      (origin.coords[0] + dest.coords[0]) / 2 + 0.003,
      (origin.coords[1] + dest.coords[1]) / 2 - 0.002
    ];
    return [origin.coords, rambaghCircle, midPoint, dest.coords];
  }

  function calculateRoutineRoute(originKey, destKey, ambId, purpose) {
    const origin = jaipurLocations[originKey];
    const dest = jaipurLocations[destKey];
    if (!origin || !dest) return;

    const points = getRoutePoints(originKey, destKey);

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
      if (hospitalMapElements.optimalRoute && hospitalMap.hasLayer(hospitalMapElements.optimalRoute)) {
        hospitalMap.removeLayer(hospitalMapElements.optimalRoute);
      }
      if (hospitalMapElements.altTonk && hospitalMap.hasLayer(hospitalMapElements.altTonk)) {
        hospitalMap.removeLayer(hospitalMapElements.altTonk);
      }
      if (hospitalMapElements.altMi && hospitalMap.hasLayer(hospitalMapElements.altMi)) {
        hospitalMap.removeLayer(hospitalMapElements.altMi);
      }

      if (hospitalMapElements.routineRouteLine) {
        hospitalMap.removeLayer(hospitalMapElements.routineRouteLine);
      }
      if (hospitalMapElements.routineDestMarker) {
        hospitalMap.removeLayer(hospitalMapElements.routineDestMarker);
      }

      hospitalMapElements.routineRouteLine = L.polyline(points, {
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

      hospitalMapElements.routineDestMarker = L.marker(dest.coords, { icon: destIcon })
        .addTo(hospitalMap)
        .bindPopup(`<strong>Standard Destination</strong><br>${dest.name}<br>Mission: <em>${purpose}</em>`);

      hospitalMap.fitBounds(hospitalMapElements.routineRouteLine.getBounds(), { padding: [40, 40] });
    }

    const hudBadge = document.getElementById('hudUnitBadge');
    const hudType = document.getElementById('hudUnitType');
    const hudStatus = document.getElementById('hudStatusIndicator');
    const hudEta = document.getElementById('hudEta');
    const hudDistance = document.getElementById('hudDistance');
    const hudSpeed = document.getElementById('hudSpeed');
    const hudClearance = document.getElementById('hudClearanceState');
    const hudNextSignal = document.getElementById('hudNextSignal');

    const amb = ambulances.find(a => a.id === ambId);
    if (hudBadge) hudBadge.textContent = ambId;
    if (hudType && amb) hudType.textContent = amb.type;
    if (hudStatus) hudStatus.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-right:5px;"></span> ROUTINE TRANSIT`;
    if (hudEta) hudEta.textContent = durStr;
    if (hudDistance) hudDistance.textContent = distStr;
    if (hudSpeed) hudSpeed.textContent = "38 km/h";
    if (hudClearance) hudClearance.innerHTML = `<span style="color:#16a34a; font-weight:700;">LOCAL ONLY (JTP BYPASSED)</span>`;
    if (hudNextSignal) hudNextSignal.innerHTML = `Signal Status: <strong>Standard City Light Timing</strong> (Police Not Alerted)`;

    showToast(`Optimal transit route calculated for ${ambId}. Note: JTP Emergency Queue bypassed.`);
  }

  function setDispatchMode(mode) {
    state.dispatchMode = mode;
    const btnModeEmergency = document.getElementById('btnModeEmergency');
    const btnModeRoutine = document.getElementById('btnModeRoutine');
    const routinePlannerPanel = document.getElementById('routinePlannerPanel');
    const emergencyMapHeader = document.getElementById('emergencyMapHeader');

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
        if (hospitalMapElements.routineRouteLine) {
          hospitalMap.removeLayer(hospitalMapElements.routineRouteLine);
          hospitalMapElements.routineRouteLine = null;
        }
        if (hospitalMapElements.routineDestMarker) {
          hospitalMap.removeLayer(hospitalMapElements.routineDestMarker);
          hospitalMapElements.routineDestMarker = null;
        }
        if (hospitalMapElements.optimalRoute && !hospitalMap.hasLayer(hospitalMapElements.optimalRoute)) {
          hospitalMap.addLayer(hospitalMapElements.optimalRoute);
        }
        if (hospitalMapElements.altTonk && !hospitalMap.hasLayer(hospitalMapElements.altTonk)) {
          hospitalMap.addLayer(hospitalMapElements.altTonk);
        }
        if (hospitalMapElements.altMi && !hospitalMap.hasLayer(hospitalMapElements.altMi)) {
          hospitalMap.addLayer(hospitalMapElements.altMi);
        }
        if (hospitalMapElements.optimalRoute) {
          hospitalMap.fitBounds(hospitalMapElements.optimalRoute.getBounds(), { padding: [40, 40] });
        }
      }

      updateHospitalMapFocus();
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

  function populateRoutineAmbulanceSelect() {
    const select = document.getElementById('routineAmbulanceSelect');
    if (!select) return;
    const hospAmbs = ambulances.filter(a => a.hospitalKey === state.activeHospitalKey && a.inService);
    select.innerHTML = '';
    hospAmbs.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.id} • ${a.type} (${a.driver})`;
      if (a.id === state.selectedAmbulanceId) opt.selected = true;
      select.appendChild(opt);
    });
  }

  // --- Render Administrative Dashboard (JTP Central Command) ---
  function renderAdminDashboard() {
    renderAdminQueue();
    renderCountdownTimeline();
    renderAdminFleetTable();

    setTimeout(() => {
      initAdminMap();
      if (adminMap) adminMap.invalidateSize();
    }, 150);
  }

  function renderAdminQueue() {
    const queueList = document.getElementById('adminQueueList');
    if (!queueList) return;

    const pendingCount = state.clearanceRequests.filter(r => r.status === 'pending').length;
    const activeCount = state.clearanceRequests.filter(r => r.status === 'granted').length;

    const adminPendingCount = document.getElementById('adminPendingCount');
    const adminActiveCount = document.getElementById('adminActiveCount');

    if (adminPendingCount) adminPendingCount.innerHTML = `${pendingCount} <span class="h-stat-sub">Action Needed</span>`;
    if (adminActiveCount) adminActiveCount.innerHTML = `${activeCount} <span class="h-stat-sub">Green Waves</span>`;

    queueList.innerHTML = '';

    state.clearanceRequests.forEach(req => {
      const isPending = req.status === 'pending';
      const card = document.createElement('div');
      card.className = `queue-item-card ${isPending ? 'queue-pending' : 'queue-granted'}`;
      card.innerHTML = `
        <div class="q-top-row">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="q-hosp-tag">${req.hospitalName}</span>
            <strong>${req.ambulanceId}</strong>
          </div>
          <span class="q-sev-badge ${req.severity === 'code-red' ? 'sev-badge-red' : 'sev-badge-yellow'}">
            ${req.severityLabel}
          </span>
        </div>

        <div class="q-body-grid">
          <div><strong>Vehicle:</strong> ${req.type}</div>
          <div><strong>Driver:</strong> ${req.driver}</div>
          <div><strong>Patient Vitals:</strong> ${req.vitals}</div>
          <div><strong>Location:</strong> ${req.location}</div>
          <div><strong>Target Route:</strong> ${req.routeName}</div>
          <div><strong>ETA:</strong> <strong>${req.eta}</strong></div>
        </div>

        <div class="q-actions-row">
          <span style="font-size:11px; margin-right:auto; font-weight:600; color: ${isPending ? '#dc2626' : '#16a34a'};">
            STATUS: ${req.statusLabel}
          </span>

          ${isPending ? `
            <button type="button" class="btn btn-sm btn-grant-action" data-action="grant" data-id="${req.id}">
              <i data-lucide="check"></i> Grant Green Corridor
            </button>
          ` : `
            <span class="tag-badge" style="background:#dcfce7; color:#166534; font-weight:600;">Corridor Active</span>
          `}

          <button type="button" class="btn btn-sm btn-outline" data-action="override" data-id="${req.id}">
            <i data-lucide="git-branch"></i> Override Route
          </button>
        </div>
      `;

      queueList.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    queueList.querySelectorAll('[data-action="grant"]').forEach(btn => {
      btn.addEventListener('click', () => {
        grantClearance(btn.getAttribute('data-id'));
      });
    });

    queueList.querySelectorAll('[data-action="override"]').forEach(btn => {
      btn.addEventListener('click', () => {
        openOverrideModal();
      });
    });
  }

  function grantClearance(reqId) {
    const req = state.clearanceRequests.find(r => r.id === reqId);
    if (!req) return;

    req.status = 'granted';
    req.statusLabel = 'CLEARANCE GRANTED BY JTP COMMAND';
    req.grantedAt = new Date().toLocaleTimeString();

    const amb = ambulances.find(a => a.id === req.ambulanceId);
    if (amb) amb.hasGreenCorridor = true;

    renderAdminQueue();
    renderCountdownTimeline();
    renderAdminFleetTable();

    showToast(`Green Corridor GRANTED for ${req.ambulanceId} (${req.hospitalName}). All signals pre-empted.`);
  }

  function renderCountdownTimeline() {
    const timeline = document.getElementById('countdownTimeline');
    if (!timeline) return;

    timeline.innerHTML = '';

    trafficLightNodes.forEach((sig, index) => {
      const etaMinutes = [2, 4, 6, 7][index] || 5;
      const row = document.createElement('div');
      row.className = 'timeline-signal-row';
      row.innerHTML = `
        <div class="ts-left">
          <div class="ts-icon">${index + 1}</div>
          <div>
            <div class="ts-name">${sig.name}</div>
            <div class="ts-eta">ETA to arrival: <strong>~${etaMinutes}m</strong> &bull; ${sig.density}</div>
          </div>
        </div>
        <div class="ts-countdown-badge" id="tsCountdown_${sig.id}">
          CLEARANCE: 01:${(45 - index * 20).toString().padStart(2, '0')}
        </div>
      `;
      timeline.appendChild(row);
    });
  }

  function renderAdminFleetTable() {
    const tbody = document.getElementById('adminFleetTableBody');
    if (!tbody) return;

    let list = ambulances;
    if (state.adminCategoryFilter === 'attention') {
      list = ambulances.filter(a => a.status === 'en-route' && !a.hasGreenCorridor);
    } else if (state.adminCategoryFilter === 'cleared') {
      list = ambulances.filter(a => a.hasGreenCorridor);
    } else if (state.adminCategoryFilter === 'routine') {
      list = ambulances.filter(a => a.inService && a.status !== 'en-route');
    } else if (state.adminCategoryFilter === 'offline') {
      list = ambulances.filter(a => !a.inService);
    }

    tbody.innerHTML = '';

    list.forEach(amb => {
      const hosp = hospitalProfiles[amb.hospitalKey];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${amb.id}</strong><br><span style="color:#71717a; font-size:11px;">${amb.type}</span></td>
        <td>${hosp ? hosp.name.split(',')[0] : 'N/A'}</td>
        <td>
          <span class="q-sev-badge ${amb.status === 'en-route' ? 'sev-badge-red' : 'sev-badge-yellow'}">
            ${amb.status === 'en-route' ? 'Code Red' : 'Standard'}
          </span>
        </td>
        <td>
          <span class="amb-status-tag ${amb.statusClass}">
            ${amb.hasGreenCorridor ? 'CORRIDOR CLEARED' : amb.statusLabel}
          </span>
        </td>
        <td>${amb.location}<br><strong>${amb.eta}</strong></td>
        <td>
          <button type="button" class="btn btn-outline btn-sm btn-admin-track" data-id="${amb.id}">
            Inspect
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-admin-track').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const amb = ambulances.find(a => a.id === id);
        if (amb && adminMap && amb.coords) {
          adminMap.flyTo(amb.coords, 14, { duration: 1.2 });
          showToast(`Focusing telemetry on ${amb.id} (${amb.location})`);
        }
      });
    });
  }

  function initAdminMap() {
    if (adminMap) return;

    const mapElement = document.getElementById('adminJaipurMap');
    if (!mapElement) return;

    adminMap = L.map('adminJaipurMap', {
      center: [26.8985, 75.7870],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(adminMap);

    // Both Hospitals
    const hospSMS = L.divIcon({
      className: 'custom-map-icon',
      html: `<div class="marker-pin-hospital" title="SMS Hospital"><span>+</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const hospApex = L.divIcon({
      className: 'custom-map-icon',
      html: `<div class="marker-pin-hospital" style="background:#27272a" title="Apex Hospital"><span>+</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker(smsHospitalCoords, { icon: hospSMS }).addTo(adminMap).bindPopup("<strong>Sawai Man Singh (SMS) Hospital</strong><br>Apex Trauma Center (JLN Marg)");
    L.marker(apexHospitalCoords, { icon: hospApex }).addTo(adminMap).bindPopup("<strong>Apex Super Speciality Hospital</strong><br>Malviya Nagar Division");

    // Police Deployment Markers
    policeDeployments.forEach(pol => {
      const polIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="marker-pin-police" title="${pol.name} (${pol.unit})"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker(pol.coords, { icon: polIcon })
        .addTo(adminMap)
        .bindPopup(`
          <div style="font-size:12px;">
            <strong>${pol.name}</strong><br>
            <span style="color:#1e3a8a; font-weight:700;">${pol.unit}</span> &bull; ${pol.location}<br>
            Direct Police Radio: <strong>${pol.phone}</strong><br>
            Mission Duty: ${pol.duty}<br>
            <span style="color:#16a34a; font-weight:600;">${pol.status}</span>
          </div>
        `);
    });

    // Traffic Signals
    trafficLightNodes.forEach(sig => {
      const sigIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="marker-pin-signal signal-green" title="${sig.name}"><span class="signal-inner-dot"></span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker(sig.coords, { icon: sigIcon })
        .addTo(adminMap)
        .bindPopup(`<strong>${sig.name}</strong><br>Status: <span style="color:#16a34a; font-weight:700;">OVERRIDE ACTIVE</span><br>Vehicle Density: ${sig.density}`);
    });

    // Ambulances on Admin Map
    ambulances.forEach(amb => {
      if (amb.inService && amb.coords) {
        const isGranted = amb.hasGreenCorridor;
        const iconClass = isGranted ? 'marker-pin-ambulance cleared-green' : 'marker-pin-ambulance pulsing-red';
        const icon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div class="${iconClass}" title="${amb.id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-2.5l-2.5 -4h-4"></path></svg></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        L.marker(amb.coords, { icon: icon })
          .addTo(adminMap)
          .bindPopup(`
            <strong>Unit: ${amb.id}</strong><br>
            Hospital: ${amb.hospitalKey === 'sms' ? 'SMS Hospital' : 'Apex Hospital'}<br>
            Driver: ${amb.driver} &bull; ${amb.phone}<br>
            Status: ${isGranted ? '<span style="color:#16a34a; font-weight:700;">GREEN CORRIDOR ACTIVE</span>' : '<span style="color:#dc2626; font-weight:700;">CLEARANCE PENDING</span>'}<br>
            ETA: ${amb.eta}
          `);
      }
    });

    adminMapElements.optimalPolyline = L.polyline(optimalRouteCoords, {
      color: '#000000',
      weight: 6,
      opacity: 0.95
    }).addTo(adminMap);

    adminMapElements.altTonkPolyline = L.polyline(altRouteTonkCoords, {
      color: '#71717a',
      weight: 4,
      dashArray: '6, 6',
      opacity: 0.7
    }).addTo(adminMap);

    adminMapElements.altMiPolyline = L.polyline(altRouteMiRoadCoords, {
      color: '#a1a1aa',
      weight: 3,
      dashArray: '4, 8',
      opacity: 0.6
    }).addTo(adminMap);

    adminMap.fitBounds(adminMapElements.optimalPolyline.getBounds(), { padding: [40, 40] });
  }

  function applyRouteOverride(newRouteKey) {
    state.activeOverrideRoute = newRouteKey;

    const req = state.clearanceRequests.find(r => r.id === 'REQ-SMS-4091');
    const adminRouteDensity = document.getElementById('adminRouteDensity');
    const adminHudCorridorState = document.getElementById('adminHudCorridorState');

    document.querySelectorAll('[data-override-route]').forEach(btn => {
      if (btn.getAttribute('data-override-route') === newRouteKey) {
        btn.classList.add('active-override-btn');
      } else {
        btn.classList.remove('active-override-btn');
      }
    });

    if (newRouteKey === 'alt-a') {
      if (req) {
        req.status = 'overridden';
        req.routeKey = 'alt-a';
        req.routeName = 'Tonk Road Corridor';
        req.statusLabel = 'OVERRIDDEN TO TONK ROAD';
        req.eta = '13 min 15 sec';
      }
      if (adminRouteDensity) adminRouteDensity.textContent = 'Moderate (~48 veh/min on Tonk Road)';
      if (adminHudCorridorState) adminHudCorridorState.textContent = 'OVERRIDE: TONK ROAD DIVERSION';
      if (adminMap && adminMapElements.altTonkPolyline) {
        adminMap.fitBounds(adminMapElements.altTonkPolyline.getBounds(), { padding: [50, 50] });
      }
      showToast('Route override deployed: Unit RJ-14-EA-4091 diverted to Tonk Road Corridor.');
    } else if (newRouteKey === 'alt-b') {
      if (req) {
        req.status = 'overridden';
        req.routeKey = 'alt-b';
        req.routeName = 'MI Road Corridor';
        req.statusLabel = 'OVERRIDDEN TO MI ROAD';
        req.eta = '18 min 50 sec';
      }
      if (adminRouteDensity) adminRouteDensity.textContent = 'Heavy Congestion (~86 veh/min on MI Road)';
      if (adminHudCorridorState) adminHudCorridorState.textContent = 'OVERRIDE: MI ROAD DIVERSION';
      if (adminMap && adminMapElements.altMiPolyline) {
        adminMap.fitBounds(adminMapElements.altMiPolyline.getBounds(), { padding: [50, 50] });
      }
      showToast('Route override deployed: Unit RJ-14-EA-4091 diverted to MI Road Corridor.');
    } else {
      if (req) {
        req.status = 'granted';
        req.routeKey = 'optimal';
        req.routeName = 'JLN Marg Corridor';
        req.statusLabel = 'CLEARANCE GRANTED';
        req.eta = '7 min 40 sec';
      }
      if (adminRouteDensity) adminRouteDensity.textContent = 'Low (~18 veh/min on JLN Marg)';
      if (adminHudCorridorState) adminHudCorridorState.textContent = 'CORRIDOR GRANTED';
      if (adminMap && adminMapElements.optimalPolyline) {
        adminMap.fitBounds(adminMapElements.optimalPolyline.getBounds(), { padding: [50, 50] });
      }
      showToast('Route reset: Optimal JLN Marg corridor restored.');
    }

    renderAdminQueue();
  }

  // --- Modal Helpers ---
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
    openModal(hospitalLoginModal);
  }

  function openAdminLoginModal() {
    openModal(adminLoginModal);
  }

  function openClearanceModal(ambId) {
    const select = document.getElementById('clearanceAmbulanceSelect');
    const destInput = document.getElementById('clearanceDestInput');
    const currentHosp = hospitalProfiles[state.activeHospitalKey];

    if (destInput && currentHosp) {
      destInput.value = currentHosp.name;
    }

    if (select) {
      const hospAmbs = ambulances.filter(a => a.hospitalKey === state.activeHospitalKey && a.inService);
      select.innerHTML = '';
      hospAmbs.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `${a.id} • ${a.type} (${a.driver})`;
        if (a.id === ambId) opt.selected = true;
        select.appendChild(opt);
      });
    }

    openModal(clearanceModal);
  }

  function openOverrideModal() {
    openModal(overrideModal);
  }

  // --- Navigation & Login Click Handlers ---
  document.querySelectorAll('[data-login-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-login-target');
      if (target === 'admin') {
        openAdminLoginModal();
      } else {
        openHospitalLoginModal();
      }
    });
  });

  // Preset Buttons on Hospital Modal
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

  // Modal Close Buttons
  const hospModalCloseBtn = document.getElementById('hospModalCloseBtn');
  const hospModalCancelBtn = document.getElementById('hospModalCancelBtn');
  if (hospModalCloseBtn) hospModalCloseBtn.addEventListener('click', () => closeModal(hospitalLoginModal));
  if (hospModalCancelBtn) hospModalCancelBtn.addEventListener('click', () => closeModal(hospitalLoginModal));

  const adminModalCloseBtn = document.getElementById('adminModalCloseBtn');
  const adminModalCancelBtn = document.getElementById('adminModalCancelBtn');
  if (adminModalCloseBtn) adminModalCloseBtn.addEventListener('click', () => closeModal(adminLoginModal));
  if (adminModalCancelBtn) adminModalCancelBtn.addEventListener('click', () => closeModal(adminLoginModal));

  const clearanceCloseBtn = document.getElementById('clearanceCloseBtn');
  const clearanceCancelBtn = document.getElementById('clearanceCancelBtn');
  if (clearanceCloseBtn) clearanceCloseBtn.addEventListener('click', () => closeModal(clearanceModal));
  if (clearanceCancelBtn) clearanceCancelBtn.addEventListener('click', () => closeModal(clearanceModal));

  const overrideCloseBtn = document.getElementById('overrideCloseBtn');
  const overrideCancelBtn = document.getElementById('overrideCancelBtn');
  if (overrideCloseBtn) overrideCloseBtn.addEventListener('click', () => closeModal(overrideModal));
  if (overrideCancelBtn) overrideCancelBtn.addEventListener('click', () => closeModal(overrideModal));

  // Close modals on backdrop & Escape
  [hospitalLoginModal, adminLoginModal, clearanceModal, overrideModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(hospitalLoginModal);
      closeModal(adminLoginModal);
      closeModal(clearanceModal);
      closeModal(overrideModal);
    }
  });

  // --- Form 1: Hospital Login Submission ---
  if (hospitalLoginForm) {
    hospitalLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = hospInputEmail.value.trim().toLowerCase();
      const pass = hospInputPassword.value.trim();

      // Check if user accidentally entered police credentials here
      if (email === policeAdminAccount.email.toLowerCase()) {
        showToast("Notice: This is the Hospital Clinical Portal. Please use 'Administrative Login' for Traffic Control Police.");
        return;
      }

      const account = hospitalAccounts[email];
      if (!account || account.password !== pass) {
        showToast("Invalid hospital credentials! Please use the authorized SMS or Apex Hospital credentials.");
        return;
      }

      const submitBtn = document.getElementById('hospModalSubmitBtn');
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying hospital session...</span>';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
        closeModal(hospitalLoginModal);

        state.activeRole = 'hospital';
        state.activeHospitalKey = account.hospitalKey;
        switchView('hospital');
        showToast(`Authenticated as ${account.displayName}.`);
      }, 350);
    });
  }

  // --- Form 2: Dedicated Traffic Control Police Login Submission ---
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const adminInputEmail = document.getElementById('adminInputEmail');
      const adminInputPassword = document.getElementById('adminInputPassword');

      const email = adminInputEmail.value.trim().toLowerCase();
      const pass = adminInputPassword.value.trim();

      // Check if user entered a hospital email
      if (hospitalAccounts[email]) {
        showToast("Access Denied: The Administrative Portal is restricted to Jaipur Traffic Control Police. Hospital accounts have no clearance.");
        return;
      }

      if (email !== policeAdminAccount.email.toLowerCase() || pass !== policeAdminAccount.password) {
        showToast("Security Alert: Invalid credentials for Jaipur Traffic Control Police Central Command.");
        return;
      }

      const submitBtn = document.getElementById('adminModalSubmitBtn');
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying police security token...</span>';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
        closeModal(adminLoginModal);

        state.activeRole = 'admin';
        state.activeHospitalKey = null; // Admin has no single hospital locking
        switchView('admin');
        showToast("Security clearance verified: Welcome to Jaipur Traffic Control Police Command.");
      }, 400);
    });
  }

  // --- Route Clearance Request from Hospital ---
  if (routeClearanceForm) {
    routeClearanceForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const selectedAmbId = document.getElementById('clearanceAmbulanceSelect').value;
      const severityRadio = document.querySelector('input[name="severityLevel"]:checked');
      const severity = severityRadio ? severityRadio.value : 'code-red';
      const vitals = document.getElementById('patientVitals').value || 'SpO2 88%, Pulse 124 bpm';

      const amb = ambulances.find(a => a.id === selectedAmbId);
      const currentHosp = hospitalProfiles[state.activeHospitalKey];

      const existingReqIndex = state.clearanceRequests.findIndex(r => r.ambulanceId === selectedAmbId);
      const newReq = {
        id: `REQ-${state.activeHospitalKey.toUpperCase()}-${selectedAmbId.split('-').pop()}`,
        hospitalKey: state.activeHospitalKey,
        hospitalName: currentHosp ? currentHosp.name : "Hospital Intake",
        ambulanceId: selectedAmbId,
        type: amb ? amb.type : "Advanced Life Support",
        driver: amb ? `${amb.driver} (${amb.phone})` : "On Duty Paramedic",
        severity: severity,
        severityLabel: severity === 'code-red' ? 'Code Red &bull; Critical' : (severity === 'code-yellow' ? 'Code Yellow &bull; Urgent' : 'Code Green &bull; Stable'),
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

      closeModal(clearanceModal);
      updateHospitalClearanceBanner();
      showToast(`Clearance request for ${selectedAmbId} submitted to JTP Central Command.`);
    });
  }

  // --- Route Override Submission from Modal (Admin only) ---
  if (routeOverrideForm) {
    routeOverrideForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newRouteKey = document.querySelector('input[name="newRouteKey"]:checked').value;
      closeModal(overrideModal);
      applyRouteOverride(newRouteKey);
    });
  }

  // Admin Route Override Buttons on Map Header
  document.querySelectorAll('[data-override-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-override-route');
      applyRouteOverride(key);
    });
  });

  // Admin Category Tabs
  document.querySelectorAll('.admin-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.adminCategoryFilter = btn.getAttribute('data-cat');
      renderAdminFleetTable();
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

  // Dispatch Mode Tabs (Emergency vs Routine Transit)
  const btnModeEmergency = document.getElementById('btnModeEmergency');
  const btnModeRoutine = document.getElementById('btnModeRoutine');
  if (btnModeEmergency) btnModeEmergency.addEventListener('click', () => setDispatchMode('emergency'));
  if (btnModeRoutine) btnModeRoutine.addEventListener('click', () => setDispatchMode('routine'));

  // Routine Route Form Submission
  const routineRouteForm = document.getElementById('routineRouteForm');
  if (routineRouteForm) {
    routineRouteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ambSelect = document.getElementById('routineAmbulanceSelect');
      const originSelect = document.getElementById('routineOriginSelect');
      const destSelect = document.getElementById('routineDestinationSelect');
      const purposeSelect = document.getElementById('routinePurposeSelect');

      const ambId = ambSelect ? ambSelect.value : state.selectedAmbulanceId;
      const originKey = originSelect ? originSelect.value : 'sms';
      const destKey = destSelect ? destSelect.value : 'mansarovar';
      const purpose = purposeSelect ? purposeSelect.options[purposeSelect.selectedIndex].text : 'Standard Transit';

      calculateRoutineRoute(originKey, destKey, ambId, purpose);
    });
  }

  // Reset Routine Route to Emergency Corridor
  const btnResetRoutineRoute = document.getElementById('btnResetRoutineRoute');
  if (btnResetRoutineRoute) {
    btnResetRoutineRoute.addEventListener('click', () => {
      setDispatchMode('emergency');
    });
  }

  // Escalate from Routine to Emergency Green Corridor
  const btnEscalateFromRoutine = document.getElementById('btnEscalateFromRoutine');
  if (btnEscalateFromRoutine) {
    btnEscalateFromRoutine.addEventListener('click', () => {
      const ambSelect = document.getElementById('routineAmbulanceSelect');
      const ambId = ambSelect ? ambSelect.value : state.selectedAmbulanceId;
      setDispatchMode('emergency');
      openClearanceModal(ambId);
      showToast(`Escalating to Emergency Green Corridor: alert transmitting to Jaipur Traffic Police.`);
    });
  }

  // Dismiss Emergency Alert Banner
  const btnDismissAlert = document.getElementById('btnDismissAlert');
  if (btnDismissAlert) {
    btnDismissAlert.addEventListener('click', () => {
      const bar = document.getElementById('corridorAlertBar');
      if (bar) bar.style.display = 'none';
      showToast("Alert banner dismissed from intake view.");
    });
  }

  // Floating HUD Clearance Request Button
  const hudClearanceBtn = document.getElementById('hudClearanceBtn');
  if (hudClearanceBtn) {
    hudClearanceBtn.addEventListener('click', () => {
      openClearanceModal(state.selectedAmbulanceId);
    });
  }

  // Hospital Map Route Switching Buttons (Optimal / Alt A / Alt B)
  document.querySelectorAll('.route-select-btn[data-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.route-select-btn[data-route]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const routeKey = btn.getAttribute('data-route');
      state.activeOverrideRoute = routeKey;

      if (!hospitalMap) return;

      const elements = hospitalMapElements;
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
      state.hospitalFleetFilter = btn.getAttribute('data-filter');
      renderHospitalFleetList();
    });
  });

  // Sign out buttons (Explicitly signs out from session)
  if (btnSessionSignOut) btnSessionSignOut.addEventListener('click', signOut);
  if (btnExitDashboard) btnExitDashboard.addEventListener('click', signOut);
  if (btnAdminSignOut) btnAdminSignOut.addEventListener('click', signOut);
  if (brandLogoHome) brandLogoHome.addEventListener('click', signOut);

  // Mobile menu
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('is-active');
    });

    navMenu.querySelectorAll('.nav-link').forEach(l => {
      l.addEventListener('click', () => navMenu.classList.remove('is-active'));
    });
  }

  // Toast Notification Helper
  function showToast(msg) {
    if (!toastNotification || !toastMessage) return;
    toastMessage.textContent = msg;
    toastNotification.style.display = 'block';

    setTimeout(() => {
      toastNotification.style.display = 'none';
    }, 4000);
  }
});
