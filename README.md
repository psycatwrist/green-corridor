# Jaipur Smart Green Corridor & AI Emergency Traffic Management System

An autonomous, centralized, AI-driven Emergency Traffic Coordination platform for Jaipur City, connecting **Ambulances**, **Hospitals**, and the **Jaipur Traffic Police Management Centre (TMC)**.

---

## 🌟 Key Features

### 1. Three Dedicated Specialized Panels + Unified Demonstration Hub
- **Ambulance Driver Cockpit HUD**:
  - Emergency Corridor Dispatcher with patient triage (Level 1 Critical / Golden Hour, Level 2, Level 3).
  - Live speedometer gauge, GPS remaining distance, dynamic ETA (showing time saved).
  - Next traffic signal status countdown with proximity green corridor triggers.
  - Emergency SOS broadcast & simulation speed toggles (1x, 2x, 4x).
- **Hospital Emergency Command**:
  - Secure Medical Authority login with credentials:
    - **Username:** `Hospital`
    - **Password:** `001`
  - Inbound emergency triage request review & patient vitals inspection.
  - One-click **"Authorize Green Corridor"** action transmitting clearance to Jaipur Traffic Control.
  - Trauma Centre readiness checklist (Resuscitation Bay 1, Standby Cath Lab, Cross-matched Blood Bank).
- **Jaipur Traffic Management Centre (TMC / Police Command)**:
  - Master city map with live signal status (🔴 Red / 🟢 Green) and AI priority wave overrides.
  - Police manual override controls (Force Green, Hold Red, Resume AI Auto-Pilot).
  - **AI Computer Vision CCTV Stream Simulation**: Live junction camera feed simulating vehicle detection with YOLO-style bounding boxes, queue length tracking, and corridor clearance verification.
  - Incident injection system: Simulate road blockage/breakdown to trigger instant AI rerouting to alternate corridors.
  - Emergency Response Analytics: Minutes saved, average transit speed, green wave compliance score.
- **Unified 3-Panel View**:
  - All 3 workflows visible on one screen for live demonstrations and testing.

### 2. Real Jaipur Geography & Routing
- Interactive Leaflet map centered on Jaipur (26.9024° N, 75.8050° E).
- Real hospitals: SMS Hospital, Fortis Escorts Hospital Malviya Nagar, EHCC Jawahar Circle, Apex Hospital, Narayana Multispeciality, Santokba Durlabhji (SDMH).
- Real traffic junctions: Sindhi Camp Crossing, Khasa Kothi Circle, Govt Hostel Crossing, Ajmer Puliya, Statue Circle, Albert Hall, Narayan Singh Circle, Rambagh Circle, SMS Hospital Gate, Gandhi Circle, OTS Crossing, Calgiri Marg Circle, Jawahar Circle, Gopalpura Bypass, Gujjar Ki Thadi.

---

## 🚀 How to Run

1. Open your terminal in this directory (`e:\jaipur-green-corridor`).
2. Start the server:
   ```bash
   python server.py
   ```
   *or*
   ```bash
   python run.py
   ```
3. Open your web browser and navigate to:
   **http://localhost:8000**

---

## 🔑 Hospital Login Credentials
- **Username:** `Hospital`
- **Password:** `001`
*(Quick-fill button also available in the UI)*
