/**
 * ==========================================================================
 * GREEN+ CORRIDOR - Mock Data Store & City Geo-Coordinates
 * File: js/data.js
 * Contains: Real hospital accounts, traffic police credentials, fleet data,
 * Jaipur city intersection coordinates, police units, and signal nodes.
 * ==========================================================================
 */

window.GC_DATA = (function() {
  // --- Authorized Accounts & Passwords (Synced with Fox Backend data/auth/) ---
  const hospitalAccounts = {
    // Official Fox Backend Accounts
    "sms_key_jaipur": { password: "sms_pass_2026", hospitalKey: "sms_hospital", displayName: "Sawai Man Singh (SMS) Hospital" },
    "sms@jaipurhealth.gov.in": { password: "SMS@Jaipur2026", hospitalKey: "sms_hospital", displayName: "Sawai Man Singh (SMS) Hospital" },
    "fortis_key_jaipur": { password: "fortis_pass_2026", hospitalKey: "fortis_escorts", displayName: "Fortis Escorts Hospital" },
    "ehcc_key_jaipur": { password: "ehcc_pass_2026", hospitalKey: "ehcc_hospital", displayName: "Eternal Hospital (EHCC)" },
    "narayana_key_jaipur": { password: "narayana_pass_2026", hospitalKey: "narayana_hospital", displayName: "Narayana Multispeciality Hospital" },
    "manipal_key_jaipur": { password: "manipal_pass_2026", hospitalKey: "manipal_hospital", displayName: "Manipal Hospital Jaipur" },
    "sdmh_key_jaipur": { password: "sdmh_pass_2026", hospitalKey: "sdmh_hospital", displayName: "Santokba Durlabhji Memorial Hospital (SDMH)" },
    "ckbirla_key_jaipur": { password: "ckbirla_pass_2026", hospitalKey: "ck_birla_hospital", displayName: "Rukmani Birla Hospital (CK Birla)" },
    "mgmch_key_jaipur": { password: "mgmch_pass_2026", hospitalKey: "mahatma_gandhi_hospital", displayName: "Mahatma Gandhi Hospital & Medical College" },
    "apex_key_jaipur": { password: "apex_pass_2026", hospitalKey: "apex_hospital", displayName: "Apex Hospital Malviya Nagar" },
    "apex@jaipurhealth.gov.in": { password: "Apex@Jaipur2026", hospitalKey: "apex_hospital", displayName: "Apex Hospital Malviya Nagar" },
    "shalby_key_jaipur": { password: "shalby_pass_2026", hospitalKey: "shalby_hospital", displayName: "Shalby Multispeciality Hospital" },
    "bmchrc_key_jaipur": { password: "bmchrc_pass_2026", hospitalKey: "bmchrc_hospital", displayName: "Bhagwan Mahaveer Cancer Hospital (BMCHRC)" },
    "metromas_key_jaipur": { password: "metromas_pass_2026", hospitalKey: "metro_mas_hospital", displayName: "Metro MAS Hospital" },
    "dictator": { password: "dictatorIsPsycatwrist", hospitalKey: "dictator_hospital", displayName: "The Dictator Apex Trauma Hospital" }
  };

  const policeAdminAccount = {
    key: "jaipur_traffic_hq_admin",
    email: "admin@jtp-control.gov.in",
    password: "jaipur_traffic_pass_2026",
    displayName: "Jaipur Traffic Control Police Command"
  };

  const adminAccounts = {
    "jaipur_traffic_hq_admin": { password: "jaipur_traffic_pass_2026", displayName: "Jaipur Traffic Control Police HQ" },
    "green_corridor_dispatch_admin": { password: "corridor_pass_2026", displayName: "Green Corridor Dispatch Center" },
    "south_zone_traffic_admin": { password: "south_traffic_pass_2026", displayName: "South Zone Traffic Police Command" },
    "dictator": { password: "dictatorIsPsycatwrist", displayName: "The Dictator Supreme Traffic Command" },
    "admin@jtp-control.gov.in": { password: "JTP@Admin2026", displayName: "Jaipur Traffic Control Police Command" }
  };

  // --- Hospital Facility Profiles (All 13 Major Jaipur Centers with Exact GPS Coordinates) ---
  const hospitalProfiles = {
    sms_hospital: {
      key: "sms_hospital",
      name: "Sawai Man Singh (SMS) Hospital, Jaipur",
      address: "JLN Marg, Ashok Nagar, Jaipur, Rajasthan 302004",
      tier: "LEVEL 1 APEX TRAUMA CENTER",
      node: "NODE #04 JAIPUR METRO",
      activeBadge: "LIVE INTAKE CORE",
      beds: "380 ICU / 3,250 Total",
      ors: "12 Ready",
      phone: "+91-141-2560291",
      ambulanceDirect: "108",
      coords: [26.8978, 75.8156],
      greenCorridorCertified: true
    },
    fortis_escorts: {
      key: "fortis_escorts",
      name: "Fortis Escorts Hospital",
      address: "JLN Marg, Malviya Nagar, Jaipur, Rajasthan 302017",
      tier: "LEVEL 1 QUATERNARY CARDIAC CENTER",
      node: "NODE #09 SOUTH JAIPUR",
      activeBadge: "ACTIVE CORRIDOR",
      beds: "85 ICU / 275 Total",
      ors: "6 Ready",
      phone: "+91-141-2547000",
      ambulanceDirect: "105010",
      coords: [26.8524, 75.8079],
      greenCorridorCertified: true
    },
    ehcc_hospital: {
      key: "ehcc_hospital",
      name: "Eternal Hospital (EHCC)",
      address: "3 A, Jagatpura Road, Near Jawahar Circle, Jaipur 302017",
      tier: "LEVEL 1 QUATERNARY SUPER-SPECIALITY",
      node: "NODE #12 JAWAHAR CIRCLE",
      activeBadge: "CONNECTED INTAKE",
      beds: "70 ICU / 250 Total",
      ors: "5 Ready",
      phone: "+91-141-5174000",
      ambulanceDirect: "+91-95491-58888",
      coords: [26.8385, 75.8038],
      greenCorridorCertified: true
    },
    narayana_hospital: {
      key: "narayana_hospital",
      name: "Narayana Multispeciality Hospital",
      address: "Sector 28, Kumbha Marg, Pratap Nagar, Jaipur 302033",
      tier: "LEVEL 2 SUPERSPECIALITY CENTER",
      node: "NODE #18 SOUTH-EAST PRATAP NAGAR",
      activeBadge: "CONNECTED INTAKE",
      beds: "65 ICU / 330 Total",
      ors: "5 Ready",
      phone: "+91-141-7122222",
      ambulanceDirect: "+91-99280-99999",
      coords: [26.8042, 75.8219],
      greenCorridorCertified: true
    },
    manipal_hospital: {
      key: "manipal_hospital",
      name: "Manipal Hospital Jaipur",
      address: "Sector 5, Main Sikar Road, Vidhyadhar Nagar, Jaipur 302039",
      tier: "LEVEL 1 SUPERSPECIALITY CENTER",
      node: "NODE #02 NORTH JAIPUR",
      activeBadge: "NORTH GRID HUB",
      beds: "60 ICU / 280 Total",
      ors: "6 Ready",
      phone: "+91-141-5164000",
      ambulanceDirect: "+91-141-5164111",
      coords: [26.9632, 75.7725],
      greenCorridorCertified: true
    },
    sdmh_hospital: {
      key: "sdmh_hospital",
      name: "Santokba Durlabhji Memorial Hospital (SDMH)",
      address: "Bhawani Singh Road, Near Rambagh Circle, Jaipur 302015",
      tier: "LEVEL 1 MULTIDISCIPLINARY HOSPITAL",
      node: "NODE #06 RAMBAGH CIRCLE",
      activeBadge: "CENTRAL DISPATCH",
      beds: "90 ICU / 450 Total",
      ors: "8 Ready",
      phone: "+91-141-2566251",
      ambulanceDirect: "+91-141-2566255",
      coords: [26.8942, 75.8041],
      greenCorridorCertified: true
    },
    ck_birla_hospital: {
      key: "ck_birla_hospital",
      name: "Rukmani Birla Hospital (CK Birla)",
      address: "Gopalpura Bypass, Near Triveni Nagar Flyover, Jaipur 302018",
      tier: "LEVEL 2 TERTIARY CARE",
      node: "NODE #14 GOPALPURA BYPASS",
      activeBadge: "CONNECTED INTAKE",
      beds: "45 ICU / 200 Total",
      ors: "4 Ready",
      phone: "+91-141-3091300",
      ambulanceDirect: "+91-141-3091333",
      coords: [26.8665, 75.7834],
      greenCorridorCertified: true
    },
    mahatma_gandhi_hospital: {
      key: "mahatma_gandhi_hospital",
      name: "Mahatma Gandhi Hospital & Medical College",
      address: "RIICO Institutional Area, Sitapura, Jaipur 302022",
      tier: "LEVEL 1 UNIVERSITY HOSPITAL",
      node: "NODE #22 SITAPURA TRAUMA CORE",
      activeBadge: "SOUTH CORRIDOR CORE",
      beds: "150 ICU / 1,450 Total",
      ors: "10 Ready",
      phone: "+91-141-2771777",
      ambulanceDirect: "108",
      coords: [26.7728, 75.8451],
      greenCorridorCertified: true
    },
    apex_hospital: {
      key: "apex_hospital",
      name: "Apex Hospital Malviya Nagar, Jaipur",
      address: "Sector 9, Mandir Marg, Malviya Nagar, Jaipur, Rajasthan 302017",
      tier: "TERTIARY CARDIAC & NEURO CARE",
      node: "NODE #11 SOUTH SUB-GRID",
      activeBadge: "CONNECTED INTAKE",
      beds: "40 ICU / 180 Total",
      ors: "4 Ready",
      phone: "+91-141-4101111",
      ambulanceDirect: "+91-98290-00108",
      coords: [26.8550, 75.8242],
      greenCorridorCertified: true
    },
    shalby_hospital: {
      key: "shalby_hospital",
      name: "Shalby Multispeciality Hospital",
      address: "Underpass, Delhi-Ajmer Bypass, Chitrakoot Sector 3, Vaishali Nagar, Jaipur 302021",
      tier: "LEVEL 2 MULTISPECIALITY CENTER",
      node: "NODE #08 WEST VAISHALI NAGAR",
      activeBadge: "WEST GRID HUB",
      beds: "45 ICU / 220 Total",
      ors: "4 Ready",
      phone: "+91-141-7123888",
      ambulanceDirect: "+91-141-7123999",
      coords: [26.9031, 75.7352],
      greenCorridorCertified: true
    },
    bmchrc_hospital: {
      key: "bmchrc_hospital",
      name: "Bhagwan Mahaveer Cancer Hospital (BMCHRC)",
      address: "Jawahar Lal Nehru Marg, Bajaj Nagar, Jaipur 302015",
      tier: "COMPREHENSIVE ONCOLOGY INSTITUTE",
      node: "NODE #10 BAJAJ NAGAR",
      activeBadge: "SPECIALTY INTAKE",
      beds: "50 ICU / 300 Total",
      ors: "5 Ready",
      phone: "+91-141-2700107",
      ambulanceDirect: "+91-141-2702899",
      coords: [26.8540, 75.8090],
      greenCorridorCertified: true
    },
    metro_mas_hospital: {
      key: "metro_mas_hospital",
      name: "Metro MAS Hospital",
      address: "Shipra Path, Near Technology Park, Mansarovar, Jaipur 302020",
      tier: "LEVEL 2 MULTISPECIALITY CENTER",
      node: "NODE #16 MANSAROVAR HUB",
      activeBadge: "CONNECTED INTAKE",
      beds: "48 ICU / 220 Total",
      ors: "4 Ready",
      phone: "+91-141-6644444",
      ambulanceDirect: "+91-141-6644400",
      coords: [26.8583, 75.7621],
      greenCorridorCertified: true
    },
    dictator_hospital: {
      key: "dictator_hospital",
      name: "The Dictator Apex Trauma & Super-Speciality Hospital",
      address: "Civil Lines & Secretariat VIP Sector, Jaipur 302006",
      tier: "LEVEL 1 SUPER-QUATERNARY TRAUMA & RESEARCH",
      node: "NODE #01 SUPREME VIP CORRIDOR",
      activeBadge: "SUPREME DISPATCH ACTIVE",
      beds: "120 ICU / 600 Total",
      ors: "8 Ready",
      phone: "+91-141-9999000",
      ambulanceDirect: "+91-141-9999108",
      coords: [26.9075, 75.7890],
      greenCorridorCertified: true
    }
  };

  // Backward compatibility alias pointers
  hospitalProfiles.sms = hospitalProfiles.sms_hospital;
  hospitalProfiles.apex = hospitalProfiles.apex_hospital;
  hospitalProfiles.fortis = hospitalProfiles.fortis_escorts;
  hospitalProfiles.ehcc = hospitalProfiles.ehcc_hospital;
  hospitalProfiles.narayana = hospitalProfiles.narayana_hospital;
  hospitalProfiles.manipal = hospitalProfiles.manipal_hospital;
  hospitalProfiles.sdmh = hospitalProfiles.sdmh_hospital;
  hospitalProfiles.ckbirla = hospitalProfiles.ck_birla_hospital;
  hospitalProfiles.mgmch = hospitalProfiles.mahatma_gandhi_hospital;
  hospitalProfiles.shalby = hospitalProfiles.shalby_hospital;
  hospitalProfiles.bmchrc = hospitalProfiles.bmchrc_hospital;
  hospitalProfiles.metromas = hospitalProfiles.metro_mas_hospital;
  hospitalProfiles.dictator = hospitalProfiles.dictator_hospital;

  // --- Ambulance Fleets Assigned to Jaipur Facilities ---
  const ambulances = [
    // SMS Hospital Fleet
    {
      id: "RJ-14-EA-4091",
      hospitalKey: "sms",
      type: "Advanced Life Support (ALS-01)",
      driver: "Rajesh Kumar",
      phone: "+91 98290 44102",
      owner: "SMS Trauma Rapid Response Corps",
      inService: true,
      hasGreenCorridor: true,
      statusLabel: "EN ROUTE • CODE RED",
      statusClass: "status-in-transit",
      location: "Vaishali Nagar (Near Amrapali Circle)",
      eta: "7 min 40 sec",
      distance: "3.8 km",
      speed: "56 km/h",
      coords: [26.9045, 75.7590],
      currentRoute: "optimal"
    },
    {
      id: "RJ-14-EA-9912",
      hospitalKey: "sms",
      type: "Basic Life Support (BLS-03)",
      driver: "Manoj Sharma",
      phone: "+91 94140 33819",
      owner: "Rajasthan Govt Emergency Medical Service",
      inService: true,
      hasGreenCorridor: false,
      statusLabel: "IN SERVICE • STANDBY",
      statusClass: "status-in-service",
      location: "C-Scheme (Statue Circle Station)",
      eta: "4 min 10 sec",
      distance: "2.1 km",
      speed: "0 km/h",
      coords: [26.9085, 75.8010],
      currentRoute: "optimal"
    },
    {
      id: "RJ-14-EA-3341",
      hospitalKey: "sms",
      type: "Neonatal Intensive Care (NICU-02)",
      driver: "Gopal Saini",
      phone: "+91 97830 55190",
      owner: "SMS Pediatric Emergency Division",
      inService: true,
      hasGreenCorridor: false,
      statusLabel: "IN SERVICE • AVAILABLE",
      statusClass: "status-in-service",
      location: "SMS Hospital Dock Bay 2",
      eta: "0 min",
      distance: "0 km",
      speed: "0 km/h",
      coords: [26.8929, 75.8155],
      currentRoute: "optimal"
    },
    {
      id: "RJ-14-EA-5502",
      hospitalKey: "sms",
      type: "Advanced Life Support (ALS-04)",
      driver: "Harish Meena",
      phone: "+91 98288 12903",
      owner: "SMS Trauma Rapid Response Corps",
      inService: false,
      hasGreenCorridor: false,
      statusLabel: "OUT OF SERVICE • SANITIZATION",
      statusClass: "status-offline",
      location: "SMS Central Maintenance Depot",
      eta: "Offline",
      distance: "--",
      speed: "0 km/h",
      coords: [26.8910, 75.8170],
      currentRoute: "optimal"
    },

    // Apex Hospital Fleet
    {
      id: "RJ-14-UB-2204",
      hospitalKey: "apex",
      type: "Basic Life Support (BLS-04)",
      driver: "Vikas Meena",
      phone: "+91 94140 18239",
      owner: "Apex Heart & Critical Care Logistics",
      inService: true,
      hasGreenCorridor: false,
      statusLabel: "EN ROUTE • CODE YELLOW",
      statusClass: "status-in-transit",
      location: "Mansarovar (Shipra Path Crossing)",
      eta: "12 min 15 sec",
      distance: "6.2 km",
      speed: "48 km/h",
      coords: [26.8550, 75.7660],
      currentRoute: "alt-a"
    },
    {
      id: "RJ-14-UB-1188",
      hospitalKey: "apex",
      type: "Advanced Cardiac Life Support (ACLS-02)",
      driver: "Rameshwar Gurjar",
      phone: "+91 99280 77411",
      owner: "Apex Healthcare Fleet Management",
      inService: true,
      hasGreenCorridor: false,
      statusLabel: "IN SERVICE • STANDBY",
      statusClass: "status-in-service",
      location: "Malviya Nagar (Calgiri Road Crossing)",
      eta: "3 min 00 sec",
      distance: "1.4 km",
      speed: "0 km/h",
      coords: [26.8540, 75.8190],
      currentRoute: "optimal"
    },
    {
      id: "RJ-14-UB-7720",
      hospitalKey: "apex",
      type: "Patient Transport Service (PTS-01)",
      driver: "Sanjay Verma",
      phone: "+91 98299 66012",
      owner: "Apex Auxiliary Medical Services",
      inService: true,
      hasGreenCorridor: false,
      statusLabel: "IN SERVICE • AVAILABLE",
      statusClass: "status-in-service",
      location: "Apex Hospital Dock Bay 1",
      eta: "0 min",
      distance: "0 km",
      speed: "0 km/h",
      coords: [26.8520, 75.8200],
      currentRoute: "optimal"
    },
    {
      id: "RJ-14-UB-6619",
      hospitalKey: "apex",
      type: "Basic Life Support (BLS-02)",
      driver: "Sunil Choudhary",
      phone: "+91 94142 90123",
      owner: "Apex Heart & Critical Care Logistics",
      inService: false,
      hasGreenCorridor: false,
      statusLabel: "OUT OF SERVICE • ENGINE REPAIR",
      statusClass: "status-offline",
      location: "Apex Malviya Nagar Workshop",
      eta: "Offline",
      distance: "--",
      speed: "0 km/h",
      coords: [26.8505, 75.8220],
      currentRoute: "optimal"
    }
  ];

  // --- On-Duty Traffic Police Personnel Deployed at Bottlenecks ---
  const policeDeployments = [
    {
      name: "Inspector R. S. Rathore",
      unit: "JTP Central Division Unit 4",
      location: "Rambagh Circle Crossing",
      coords: [26.8970, 75.8120],
      phone: "+91 98290 12345",
      duty: "Green Wave Hold & Perpendicular Traffic Lock",
      status: "Holding Northbound Traffic &bull; Lane 2 Cleared"
    },
    {
      name: "Sub-Inspector Vikram Singh",
      unit: "JTP Central Division Unit 2",
      location: "Ambedkar Circle Crossing",
      coords: [26.9032, 75.7995],
      phone: "+91 94140 67890",
      duty: "Flyover Entry Pre-emption",
      status: "Signal Cycle Overridden &bull; Corridors Green"
    },
    {
      name: "Head Constable Dinesh",
      unit: "JTP South Traffic Cell",
      location: "Tonk Phatak Railway Crossing",
      coords: [26.8790, 75.7950],
      phone: "+91 98281 33456",
      duty: "Alternative Corridor Traffic Diverter",
      status: "Standing By on Police Radio 156.800 MHz"
    },
    {
      name: "Constable Mahendra (Traffic Bike 12)",
      unit: "JTP Mobile Escort Squad",
      location: "SMS Trauma Gate 1 Crossing",
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

  // --- Real-World Jaipur Road Coordinates ---
  const smsHospitalCoords = [26.8929, 75.8155];
  const apexHospitalCoords = [26.8520, 75.8200];

  const optimalRouteCoords = [
    [26.9045, 75.7590], // Vaishali Nagar
    [26.9030, 75.7720], // Ajmer Road
    [26.9020, 75.7860], // Bhawani Singh Road
    [26.9032, 75.7995], // Ambedkar Circle
    [26.8970, 75.8120], // Rambagh Circle
    [26.8932, 75.8152], // SMS Trauma Gate 1
    [26.8929, 75.8155]  // SMS Emergency Dock
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

  // --- Initial Clearance Requests Queue ---
  const initialClearanceRequests = [
    {
      id: "REQ-SMS-4091",
      hospitalKey: "sms",
      hospitalName: "Sawai Man Singh (SMS) Hospital",
      ambulanceId: "RJ-14-EA-4091",
      type: "Advanced Life Support (ALS-01)",
      driver: "Rajesh Kumar (+91 98290 44102)",
      severity: "code-red",
      severityLabel: "Code Red • Critical",
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
      severityLabel: "Code Yellow • Urgent",
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
  ];

  // --- Initial Ambulance Driver Credentials (Managed & Saved in Hospital Panel) ---
  const initialDriverAccounts = [
    {
      id: "driver.rajesh",
      password: "Ambulance@123",
      name: "Rajesh Kumar",
      phone: "+91 98290 44102",
      hospitalKey: "sms",
      ambulanceId: "RJ-14-EA-4091",
      vehicleType: "Advanced Life Support (ALS-01)",
      status: "on-duty",
      badgeNumber: "JPR-MEDIC-4091",
      licenseNumber: "RJ-14-2018-009412",
      lastActive: "Active Now"
    },
    {
      id: "driver.manoj",
      password: "Ambulance@123",
      name: "Manoj Sharma",
      phone: "+91 94140 33819",
      hospitalKey: "sms",
      ambulanceId: "RJ-14-EA-9912",
      vehicleType: "Basic Life Support (BLS-03)",
      status: "on-duty",
      badgeNumber: "JPR-MEDIC-9912",
      licenseNumber: "RJ-14-2019-011283",
      lastActive: "Active Now"
    },
    {
      id: "driver.gopal",
      password: "Ambulance@123",
      name: "Gopal Saini",
      phone: "+91 97830 55190",
      hospitalKey: "sms",
      ambulanceId: "RJ-14-EA-3341",
      vehicleType: "Neonatal Intensive Care (NICU-02)",
      status: "standby",
      badgeNumber: "JPR-MEDIC-3341",
      licenseNumber: "RJ-14-2020-004811",
      lastActive: "15 min ago"
    },
    {
      id: "driver.harish",
      password: "Ambulance@123",
      name: "Harish Meena",
      phone: "+91 98288 12903",
      hospitalKey: "sms",
      ambulanceId: "RJ-14-EA-5502",
      vehicleType: "Advanced Life Support (ALS-04)",
      status: "maintenance",
      badgeNumber: "JPR-MEDIC-5502",
      licenseNumber: "RJ-14-2017-003291",
      lastActive: "Offline (Depot)"
    },
    {
      id: "driver.vikas",
      password: "Ambulance@123",
      name: "Vikas Meena",
      phone: "+91 94140 18239",
      hospitalKey: "apex",
      ambulanceId: "RJ-14-UB-2204",
      vehicleType: "Basic Life Support (BLS-04)",
      status: "on-duty",
      badgeNumber: "APX-MEDIC-2204",
      licenseNumber: "RJ-14-2021-008320",
      lastActive: "Active Now"
    },
    {
      id: "driver.ramesh",
      password: "Ambulance@123",
      name: "Rameshwar Gurjar",
      phone: "+91 99280 77411",
      hospitalKey: "apex",
      ambulanceId: "RJ-14-UB-1188",
      vehicleType: "Advanced Cardiac Life Support (ACLS-02)",
      status: "standby",
      badgeNumber: "APX-MEDIC-1188",
      licenseNumber: "RJ-14-2019-006241",
      lastActive: "30 min ago"
    },
    {
      id: "driver.sanjay",
      password: "Ambulance@123",
      name: "Sanjay Verma",
      phone: "+91 98299 66012",
      hospitalKey: "apex",
      ambulanceId: "RJ-14-UB-7720",
      vehicleType: "Patient Transport Service (PTS-01)",
      status: "on-duty",
      badgeNumber: "APX-MEDIC-7720",
      licenseNumber: "RJ-14-2022-001944",
      lastActive: "Active Now"
    }
  ];

  // --- Driver Persistent Storage (Syncs Hospital Panel <-> Driver Mobile App) ---
  const DRIVERS_STORAGE_KEY = 'gc_ambulance_drivers_v1';

  function getDrivers() {
    try {
      const stored = localStorage.getItem(DRIVERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Storage read failed for drivers:", e);
    }
    // Seed initial drivers
    try {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(initialDriverAccounts));
    } catch(e) {}
    return [...initialDriverAccounts];
  }

  function getHospitalDrivers(hospitalKey) {
    const drivers = getDrivers();
    return drivers.filter(d => d.hospitalKey === hospitalKey);
  }

  function saveDriver(driverData) {
    const drivers = getDrivers();
    const cleanId = driverData.id.trim().toLowerCase();
    const existingIndex = drivers.findIndex(d => d.id.trim().toLowerCase() === cleanId);

    const record = {
      id: cleanId,
      password: driverData.password || "Ambulance@123",
      name: driverData.name || "Ambulance Operator",
      phone: driverData.phone || "+91 98000 00000",
      hospitalKey: driverData.hospitalKey || "sms",
      ambulanceId: driverData.ambulanceId || "RJ-14-EA-4091",
      vehicleType: driverData.vehicleType || "Advanced Life Support",
      status: driverData.status || "on-duty",
      badgeNumber: driverData.badgeNumber || `MEDIC-${Math.floor(1000 + Math.random() * 9000)}`,
      licenseNumber: driverData.licenseNumber || `RJ-14-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      lastActive: "Updated in Hospital Panel"
    };

    if (existingIndex >= 0) {
      drivers[existingIndex] = { ...drivers[existingIndex], ...record };
    } else {
      drivers.unshift(record);
    }

    try {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(drivers));
      // Notify other tabs (Driver Mobile App, etc.)
      const ch = new BroadcastChannel('gc_telemetry_channel');
      ch.postMessage({ type: 'DRIVER_RECORD_UPDATED', driver: record });
    } catch(e) {}

    return record;
  }

  function deleteDriver(driverId) {
    let drivers = getDrivers();
    const cleanId = driverId.trim().toLowerCase();
    drivers = drivers.filter(d => d.id.trim().toLowerCase() !== cleanId);
    try {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(drivers));
      const ch = new BroadcastChannel('gc_telemetry_channel');
      ch.postMessage({ type: 'DRIVER_RECORD_DELETED', driverId: cleanId });
    } catch(e) {}
    return true;
  }

  function authenticateDriver(loginId, password) {
    if (!loginId || !password) return null;
    const drivers = getDrivers();
    const cleanId = loginId.trim().toLowerCase();
    const match = drivers.find(d => d.id.trim().toLowerCase() === cleanId && d.password === password);
    return match || null;
  }

  // --- Enrolled Hospital Registry Cache ---
  const REGISTERED_HOSPITALS_KEY = 'gc_registered_hospitals_v1';

  function getRegisteredHospitals() {
    try {
      const stored = localStorage.getItem(REGISTERED_HOSPITALS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e) {}
    return [];
  }

  function syncRegisteredHospitals() {
    const list = getRegisteredHospitals();
    list.forEach(h => {
      hospitalAccounts[h.email.toLowerCase()] = {
        password: h.password,
        hospitalKey: h.hospitalKey,
        displayName: h.name
      };
      if (!hospitalProfiles[h.hospitalKey]) {
        hospitalProfiles[h.hospitalKey] = {
          name: h.name,
          address: h.address || `${h.zone || 'Jaipur City'}, Rajasthan 302001`,
          tier: h.tier || "TERTIARY EMERGENCY TRAUMA CENTER",
          node: `NODE #${Math.floor(10 + Math.random() * 80)} CAD GRID`,
          activeBadge: "ENROLLED INTAKE",
          beds: `${h.bays || 12} / ${h.bays || 12} Ready`,
          ors: "2 Ready",
          coords: h.coords || [26.8850, 75.8050]
        };
      }
    });
  }

  syncRegisteredHospitals();



  function authenticateHospital(emailOrKey, password) {
    if (!emailOrKey || !password) return null;
    syncRegisteredHospitals();
    const clean = emailOrKey.trim().toLowerCase();
    let acc = hospitalAccounts[clean];
    if (!acc) {
      for (const k of Object.keys(hospitalAccounts)) {
        if (k.toLowerCase() === clean || hospitalAccounts[k].hospitalKey.toLowerCase() === clean) {
          acc = hospitalAccounts[k];
          break;
        }
      }
    }
    if (acc && acc.password === password) {
      return {
        email: clean,
        hospitalKey: acc.hospitalKey,
        displayName: acc.displayName,
        profile: hospitalProfiles[acc.hospitalKey] || hospitalProfiles.sms
      };
    }
    return null;
  }

  function authenticateAdmin(emailOrKey, password) {
    if (!emailOrKey || !password) return null;
    const clean = emailOrKey.trim().toLowerCase();
    let acc = adminAccounts[clean];
    if (!acc && (clean === policeAdminAccount.email.toLowerCase() || clean === policeAdminAccount.key)) {
      acc = policeAdminAccount;
    }
    if (acc && acc.password === password) {
      return {
        key: clean,
        displayName: acc.displayName || "Jaipur Traffic Control Police Command"
      };
    }
    return null;
  }

  async function initFromFoxBackend() {
    if (!window.GC_API) return;
    try {
      const list = await window.GC_API.getHospitals();
      if (Array.isArray(list) && list.length > 0) {
        for (const h of list) {
          try {
            const detail = await window.GC_API.getHospitalDetail(h.key);
            if (detail && detail.coordinates) {
              hospitalProfiles[h.key] = {
                key: h.key,
                name: detail.name,
                address: `${detail.address.street}, ${detail.address.locality}`,
                tier: h.trauma_level || "TRAUMA CARE CENTER",
                node: `NODE ${h.zone.toUpperCase()}`,
                activeBadge: "CONNECTED INTAKE",
                beds: `${detail.facilities.icu_beds_count} ICU / ${detail.facilities.total_beds} Total`,
                ors: "Ready",
                phone: detail.contact_details.emergency_helpline,
                ambulanceDirect: detail.contact_details.ambulance_direct,
                coords: [detail.coordinates.latitude, detail.coordinates.longitude],
                greenCorridorCertified: detail.facilities.green_corridor_certified
              };
            }

            // Sync ambulance cars for this hospital from Fox backend
            const fleet = await window.GC_API.getHospitalCars(h.key);
            if (fleet && (fleet.in_service_cars || fleet.out_service_cars)) {
              const allCars = [...(fleet.in_service_cars || []), ...(fleet.out_service_cars || [])];
              allCars.forEach(car => {
                const ambId = car.car_id || (car.car_info && car.car_info.registration_number);
                if (!ambId) return;
                const existingIndex = ambulances.findIndex(a => a.id === ambId);
                const isInService = car.status === 'in-service';
                const ambObj = {
                  id: ambId,
                  carkey: car.carkey,
                  hospitalKey: h.key,
                  type: (car.car_info && car.car_info.type) || "Advanced Life Support",
                  driver: (car.driver_info && car.driver_info.name) || "On Duty Paramedic",
                  phone: (car.driver_info && car.driver_info.phone) || "+91-141-2560291",
                  status: isInService ? "en-route" : "maintenance",
                  statusLabel: isInService ? "Active • En Route" : "Out of Service",
                  statusClass: isInService ? "amb-status-enroute" : "amb-status-maintenance",
                  inService: isInService,
                  location: (car.current_location && car.current_location.address) || "Jaipur Grid",
                  coords: car.current_location ? [car.current_location.latitude, car.current_location.longitude] : [26.9045, 75.7590],
                  eta: "7 mins",
                  speed: car.current_location ? car.current_location.speed_kmh : 54,
                  hasGreenCorridor: false
                };
                if (existingIndex >= 0) {
                  ambulances[existingIndex] = { ...ambulances[existingIndex], ...ambObj };
                } else {
                  ambulances.push(ambObj);
                }
              });
            }
          } catch(err) {}
        }
      }

      // Sync active clearance requests queue from Fox backend
      const reqs = await window.GC_API.getClearanceRequests();
      if (Array.isArray(reqs) && reqs.length > 0 && window.GC_STATE) {
        window.GC_STATE.state.clearanceRequests = reqs.map(r => ({
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
      }

      // Redraw hospital markers on active Leaflet maps if ready
      if (window.GC_MAPS && window.GC_MAPS.drawHospitalMarkers) {
        window.GC_MAPS.drawHospitalMarkers();
      }
    } catch(e) {
      console.warn("Backend init notice:", e);
    }
  }

  // --- Route Intelligence Graph: Shortest Route & Least Traffic Signals Analysis ---
  const corridorProfiles = {
    sms: [
      {
        id: "optimal",
        name: "JLN Marg Emergency Green Corridor",
        corridorCode: "GC-JLN-01",
        via: "Vaishali Nagar ➔ Ajmer Road ➔ Ambedkar Circle ➔ Rambagh Circle ➔ SMS Trauma Gate 1",
        distanceKm: 3.8,
        distanceStr: "3.8 km",
        standardDurationMin: 18,
        corridorDurationStr: "7 min 40 sec",
        trafficLightsCount: 3, // LEAST SIGNALS
        isShortest: true,
        isLeastSignals: true,
        clearanceStatus: "GREEN WAVE ARMED (3 of 3 Pre-empted)",
        policeEscortUnit: "JTP Central Division Unit 4 (Insp. R. S. Rathore)",
        recommendationBadge: "RECOMMENDED • SHORTEST PATH • LEAST SIGNALS",
        whyBest: "Shortest physical route (3.8 km) with minimum traffic intersections (only 3 signals vs 5 on Tonk Rd and 7 on MI Rd). All 3 traffic signals are synchronized with JTP Central Police Green Wave pre-emption.",
        trafficSignals: [
          {
            id: "sig-ambedkar",
            name: "Ambedkar Circle Crossing",
            coords: [26.9032, 75.7995],
            distanceFromOrigin: "1.8 km",
            etaSec: 150,
            status: "GREEN_WAVE_ARMED",
            statusLabel: "Pre-empted Green Wave",
            cycleTime: 90,
            officerInCharge: "Sub-Inspector Vikram Singh (JTP Unit 2)",
            officerPhone: "+91 94140 67890",
            laneAction: "Flyover and perpendicular traffic locked; lane 1 cleared"
          },
          {
            id: "sig-rambagh",
            name: "Rambagh Circle Crossing",
            coords: [26.8970, 75.8120],
            distanceFromOrigin: "3.1 km",
            etaSec: 320,
            status: "GREEN_WAVE_ARMED",
            statusLabel: "Pre-empted Green Wave",
            cycleTime: 120,
            officerInCharge: "Inspector R. S. Rathore (JTP Unit 4)",
            officerPhone: "+91 98290 12345",
            laneAction: "Holding Northbound and Bhavani Singh Rd traffic; Lane 2 cleared"
          },
          {
            id: "sig-smsgate",
            name: "SMS Trauma Gate 1 Crossing",
            coords: [26.8932, 75.8152],
            distanceFromOrigin: "3.7 km",
            etaSec: 430,
            status: "DIRECT_DOCK_CLEAR",
            statusLabel: "Dock Reception Cleared",
            cycleTime: 60,
            officerInCharge: "Constable Mahendra (Traffic Bike 12)",
            officerPhone: "+91 97830 11928",
            laneAction: "Direct ambulance bay ramp held clear of civilian vehicles"
          }
        ],
        coordinates: optimalRouteCoords
      },
      {
        id: "alt-a",
        name: "Tonk Road Alternative Corridor",
        corridorCode: "SEC-TONK-02",
        via: "Vaishali Nagar ➔ Sodala Flyover ➔ Gurjar Ki Thodi ➔ Tonk Phatak Overbridge ➔ Rambagh ➔ SMS",
        distanceKm: 5.6,
        distanceStr: "5.6 km (+1.8 km)",
        standardDurationMin: 22,
        corridorDurationStr: "13 min 15 sec",
        trafficLightsCount: 5,
        isShortest: false,
        isLeastSignals: false,
        clearanceStatus: "2 Signals Standard Cycle • 3 Pre-empted",
        policeEscortUnit: "JTP South Traffic Cell (HC Dinesh)",
        recommendationBadge: "SECONDARY CORRIDOR (+1.8 km Longer)",
        whyBest: "Secondary evacuation corridor. Has 5 traffic lights and railway overbridge queue; used primarily if JLN Marg is obstructed.",
        trafficSignals: [
          {
            id: "sig-sodala",
            name: "Sodala / Hawa Sadak Crossing",
            coords: [26.8910, 75.7720],
            distanceFromOrigin: "1.9 km",
            etaSec: 210,
            status: "STANDARD_CYCLE",
            statusLabel: "Standard Cycle (~42s wait)",
            cycleTime: 90,
            officerInCharge: "JTP Central Traffic Post",
            laneAction: "Standard traffic queue"
          },
          {
            id: "sig-gurjar",
            name: "Gurjar Ki Thodi Junction",
            coords: [26.8660, 75.7780],
            distanceFromOrigin: "3.2 km",
            etaSec: 360,
            status: "STANDARD_CYCLE",
            statusLabel: "Standard Cycle (~35s wait)",
            cycleTime: 90,
            officerInCharge: "JTP South Patrol",
            laneAction: "Underpass flow"
          },
          {
            id: "sig-tonkphatak",
            name: "Tonk Phatak Railway Crossing",
            coords: [26.8790, 75.7950],
            distanceFromOrigin: "4.3 km",
            etaSec: 490,
            status: "MANUAL_HOLD",
            statusLabel: "Police Radio Hold",
            cycleTime: 120,
            officerInCharge: "Head Constable Dinesh (JTP South)",
            laneAction: "Police diverter at railway crossing"
          },
          {
            id: "sig-rambagh",
            name: "Rambagh Circle Crossing",
            coords: [26.8970, 75.8120],
            distanceFromOrigin: "5.1 km",
            etaSec: 640,
            status: "GREEN_WAVE_ARMED",
            statusLabel: "Pre-empted Green Wave",
            cycleTime: 120,
            officerInCharge: "Inspector R. S. Rathore",
            laneAction: "Lane 2 cleared"
          },
          {
            id: "sig-smsgate",
            name: "SMS Trauma Gate 1 Crossing",
            coords: [26.8932, 75.8152],
            distanceFromOrigin: "5.5 km",
            etaSec: 750,
            status: "DIRECT_DOCK_CLEAR",
            statusLabel: "Dock Reception Cleared",
            cycleTime: 60,
            officerInCharge: "Constable Mahendra",
            laneAction: "Direct ambulance bay"
          }
        ],
        coordinates: altRouteTonkCoords
      },
      {
        id: "alt-b",
        name: "MI Road Commercial Corridor",
        corridorCode: "CONG-MI-03",
        via: "Vaishali Nagar ➔ Railway Station ➔ Khasa Kothi ➔ MI Road ➔ Albert Hall ➔ SMS",
        distanceKm: 7.2,
        distanceStr: "7.2 km (+3.4 km)",
        standardDurationMin: 29,
        corridorDurationStr: "18 min 50 sec",
        trafficLightsCount: 7,
        isShortest: false,
        isLeastSignals: false,
        clearanceStatus: "7 Cyclic Signals • High Commercial Density",
        policeEscortUnit: "JTP City North Cell",
        recommendationBadge: "CONGESTED ROUTE (+3.4 km Longer • 7 Signals)",
        whyBest: "Longest route with 7 traffic signals and high market pedestrian density. Recommended only during major city arterial closures.",
        trafficSignals: [
          { id: "sig-ajmerrd", name: "Ajmer Road Pillar Junction", coords: [26.9030, 75.7720], statusLabel: "Dense Cyclic Light", cycleTime: 90 },
          { id: "sig-khasakothi", name: "Khasa Kothi Circle", coords: [26.9180, 75.7850], statusLabel: "Railway Station Bottleneck", cycleTime: 120 },
          { id: "sig-panchbatti", name: "Panch Batti / MI Road Junction", coords: [26.9170, 75.8050], statusLabel: "Commercial Market Congestion", cycleTime: 110 },
          { id: "sig-ajmerigate", name: "Ajmeri Gate Crossing", coords: [26.9140, 75.8120], statusLabel: "Walled City Pedestrian Flow", cycleTime: 90 },
          { id: "sig-sanganerigate", name: "Sanganeri Gate Crossing", coords: [26.9100, 75.8150], statusLabel: "Cyclic Signal", cycleTime: 90 },
          { id: "sig-alberthall", name: "Albert Hall Museum Crossing", coords: [26.9080, 75.8160], statusLabel: "Tourist Plaza Intersection", cycleTime: 80 },
          { id: "sig-smsgate", name: "SMS Trauma Gate 1 Crossing", coords: [26.8932, 75.8152], statusLabel: "Dock Reception Cleared", cycleTime: 60 }
        ],
        coordinates: altRouteMiRoadCoords
      }
    ],
    apex: [
      {
        id: "optimal-apex",
        name: "JLN Marg South to Apex Hospital Corridor",
        corridorCode: "GC-APEX-01",
        via: "Mansarovar ➔ B2 Bypass ➔ Jawahar Circle ➔ Calgiri Marg ➔ Apex Trauma Dock",
        distanceKm: 4.2,
        distanceStr: "4.2 km",
        standardDurationMin: 17,
        corridorDurationStr: "8 min 15 sec",
        trafficLightsCount: 3, // LEAST SIGNALS
        isShortest: true,
        isLeastSignals: true,
        clearanceStatus: "GREEN WAVE ARMED (3 Signals)",
        policeEscortUnit: "JTP South Division Unit 8 (ASI K. L. Meena)",
        recommendationBadge: "RECOMMENDED • SHORTEST PATH • LEAST SIGNALS",
        whyBest: "Shortest route to Apex Hospital (4.2 km) with only 3 intersections via B2 Bypass and Calgiri Marg. All 3 intersections have green corridor pre-emption.",
        trafficSignals: [
          {
            id: "sig-b2bypass",
            name: "B2 Bypass Intersection",
            coords: [26.8480, 75.7850],
            distanceFromOrigin: "1.4 km",
            etaSec: 160,
            status: "GREEN_WAVE_ARMED",
            statusLabel: "Pre-empted Green Wave",
            cycleTime: 90,
            officerInCharge: "JTP South Traffic Patrol",
            laneAction: "Underpass lane held clear"
          },
          {
            id: "sig-jawahar",
            name: "Jawahar Circle Southern Gate",
            coords: [26.8440, 75.8050],
            distanceFromOrigin: "2.9 km",
            etaSec: 330,
            status: "GREEN_WAVE_ARMED",
            statusLabel: "Pre-empted Green Wave",
            cycleTime: 100,
            officerInCharge: "JTP Unit 8 Officer",
            laneAction: "Rotary perimeter cleared"
          },
          {
            id: "sig-apexcalgiri",
            name: "Calgiri Marg & Sector 9 Crossing",
            coords: [26.8535, 75.8195],
            distanceFromOrigin: "4.1 km",
            etaSec: 460,
            status: "DIRECT_DOCK_CLEAR",
            statusLabel: "Hospital Dock Reception",
            cycleTime: 60,
            officerInCharge: "ASI K. L. Meena (JTP South Unit 8)",
            laneAction: "Ambulance reception clear"
          }
        ],
        coordinates: [
          [26.8550, 75.7660],
          [26.8510, 75.7720],
          [26.8480, 75.7850],
          [26.8440, 75.8050],
          [26.8520, 75.8200]
        ]
      },
      {
        id: "alt-apex",
        name: "Tonk Road to Malviya Nagar Alternative",
        corridorCode: "SEC-APEX-02",
        via: "Mansarovar ➔ Shipra Path ➔ Gopalpura Flyover ➔ Mahaveer Nagar ➔ Apex Hospital",
        distanceKm: 6.8,
        distanceStr: "6.8 km (+2.6 km)",
        standardDurationMin: 24,
        corridorDurationStr: "15 min 20 sec",
        trafficLightsCount: 5,
        isShortest: false,
        isLeastSignals: false,
        clearanceStatus: "5 Cyclic Intersections",
        policeEscortUnit: "JTP South Patrol",
        recommendationBadge: "SECONDARY ROUTE (+2.6 km Longer • 5 Signals)",
        whyBest: "Longer alternative (6.8 km) with 5 busy commercial intersections along Gopalpura Bypass coaching hub.",
        trafficSignals: [
          { id: "sig-shipra", name: "Shipra Path Crossing", coords: [26.8550, 75.7660], statusLabel: "Local Cycle", cycleTime: 80 },
          { id: "sig-gopalpura", name: "Gopalpura Bypass Flyover", coords: [26.8620, 75.7830], statusLabel: "Heavy Traffic Node", cycleTime: 120 },
          { id: "sig-mahaveer", name: "Mahaveer Nagar Crossing", coords: [26.8600, 75.7950], statusLabel: "Standard Cycle", cycleTime: 90 },
          { id: "sig-ots", name: "OTS Chauraha Junction", coords: [26.8680, 75.8120], statusLabel: "Police Radio Hold", cycleTime: 100 },
          { id: "sig-apexcalgiri", name: "Calgiri Marg Crossing", coords: [26.8535, 75.8195], statusLabel: "Hospital Gate", cycleTime: 60 }
        ],
        coordinates: [
          [26.8550, 75.7660],
          [26.8620, 75.7830],
          [26.8600, 75.7950],
          [26.8680, 75.8120],
          [26.8520, 75.8200]
        ]
      }
    ]
  };

  return {
    hospitalAccounts,
    policeAdminAccount,
    adminAccounts,
    hospitalProfiles,
    ambulances,
    policeDeployments,
    smsHospitalCoords,
    apexHospitalCoords,
    optimalRouteCoords,
    altRouteTonkCoords,
    altRouteMiRoadCoords,
    trafficLightNodes,
    jaipurLocations,
    initialClearanceRequests,
    initialDriverAccounts,
    getDrivers,
    getHospitalDrivers,
    saveDriver,
    deleteDriver,
    authenticateDriver,
    getRegisteredHospitals,
    authenticateHospital,
    authenticateAdmin,
    initFromFoxBackend,
    syncRegisteredHospitals,
    corridorProfiles
  };
})();

