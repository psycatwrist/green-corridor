# Green+ Corridor: Production REST & WebSocket API Specification

## 1. Overview & Protocol Standards

- **Base URL**: `https://api.greencorridor.jaipurhealth.gov.in/v1`
- **Protocol**: HTTP/2 over TLS 1.3 (REST), WebSocket (WSS for telemetry)
- **Data Format**: JSON (`Content-Type: application/json; charset=utf-8`)
- **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 2. REST Endpoints

### 2.1. Authentication & Session Management

#### `POST /auth/login`
Authenticates a user and issues role-scoped tokens.

- **Request Body**:
```json
{
  "email": "sms@jaipurhealth.gov.in",
  "password": "SMS@Jaipur2026",
  "portal_target": "hospital" // "hospital" | "admin"
}
```

- **Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "d7a83f10-9b45-48b2-b5e1-8849204859a1",
    "expires_in": 900,
    "user": {
      "id": "USR-HOSP-001",
      "email": "sms@jaipurhealth.gov.in",
      "role": "hospital_medic",
      "hospital_key": "sms",
      "display_name": "Sawai Man Singh (SMS) Hospital"
    }
  }
}
```

---

### 2.2. Hospital Intake & Fleet Management

#### `GET /hospitals/{hospital_id}/dashboard`
Returns live trauma bed stats, ready ORs, and active clearance alerts.

- **Response (200 OK)**:
```json
{
  "hospital_id": "sms",
  "name": "Sawai Man Singh (SMS) Hospital, Jaipur",
  "tier": "LEVEL 1 APEX TRAUMA CENTER",
  "trauma_beds": {
    "total": 18,
    "available": 14
  },
  "emergency_ors": {
    "ready": 4
  },
  "active_corridor": {
    "status": "granted",
    "ambulance_id": "RJ-14-EA-4091",
    "route_name": "JLN Marg Corridor",
    "eta_seconds": 460
  }
}
```

#### `GET /hospitals/{hospital_id}/fleet`
Query ambulance fleet with optional filtering (`in_service=true`).

---

### 2.3. Emergency Green Corridor Clearance Lifecycle

#### `POST /clearance/request`
Initiated by hospital intake triage when a critical ambulance requires municipal traffic override. **Triggers real-time alerts to the Jaipur Traffic Police Central Command.**

- **Request Body**:
```json
{
  "hospital_id": "sms",
  "ambulance_id": "RJ-14-EA-4091",
  "severity": "code_red", // "code_red" | "code_yellow" | "code_green"
  "patient_vitals": {
    "age_gender": "54 Yrs, Male",
    "spo2": 86,
    "pulse_bpm": 132,
    "bp": "80/50",
    "diagnosis": "Severe Polytrauma with Hypovolemic Shock"
  },
  "current_location": {
    "latitude": 26.9045,
    "longitude": 75.7590,
    "address": "Vaishali Nagar, Amrapali Circle"
  }
}
```

- **Response (201 Created)**:
```json
{
  "clearance_id": "REQ-SMS-4091",
  "status": "pending_jtp_review",
  "created_at": "2026-09-12T00:15:04Z",
  "target_hospital": "Sawai Man Singh (SMS) Hospital",
  "proposed_corridor": "JLN Marg Corridor",
  "police_queue_notified": true
}
```

#### `GET /clearance/queue`
*(Admin Only)* Jaipur Traffic Police central command view of incoming requests.

#### `PATCH /clearance/{clearance_id}/grant`
*(Admin Only)* JTP officer authorizes green corridor, pre-empting all traffic signals along the route.

- **Response (200 OK)**:
```json
{
  "clearance_id": "REQ-SMS-4091",
  "status": "granted",
  "authorized_by": "JTP-DISPATCH-OFFICER-04",
  "signals_preempted": [
    "sig-ambedkar",
    "sig-rambagh",
    "sig-narayan",
    "sig-smsgate"
  ],
  "police_escort_unit": "JTP Unit 4 (Inspector R. S. Rathore)",
  "granted_at": "2026-09-12T00:15:10Z"
}
```

#### `PATCH /clearance/{clearance_id}/override`
*(Admin Only)* Diverts inbound ambulance to an alternate route corridor.

- **Request Body**:
```json
{
  "new_route_key": "alt-a",
  "reason": "Sudden congestion spike at Rambagh Circle",
  "field_officers_notified": ["HC Dinesh (Tonk Phatak)"]
}
```

---

### 2.4. Routine Transit & Route Planner (Local / No Police Alert)

#### `POST /navigation/routine-route`
Calculates optimal path across Jaipur without alerting the Traffic Police Admin queue.

- **Request Body**:
```json
{
  "ambulance_id": "RJ-14-EA-9912",
  "origin_key": "sms",
  "destination_key": "mansarovar",
  "purpose": "Inter-Hospital Patient Transfer (Non-Critical)"
}
```

- **Response (200 OK)**:
```json
{
  "route_name": "SMS Hospital ➔ Shipra Path Junction",
  "distance_km": 6.4,
  "duration_minutes": 14,
  "road_density": "Moderate (~32 veh/min)",
  "signals_on_route": 3,
  "standard_cycle": true,
  "jtp_police_alerted": false,
  "corridor_type": "standard_municipal_transit",
  "waypoints": [
    [26.8929, 75.8155],
    [26.8830, 75.7950],
    [26.8660, 75.7780],
    [26.8550, 75.7660]
  ]
}
```

---

## 3. Real-Time WebSocket Specifications

### 3.1. Fleet Telemetry Stream
- **URL**: `wss://api.greencorridor.jaipurhealth.gov.in/v1/ws/telemetry`
- **Direction**: Server ➔ Client (Broadcast)
- **Message Payload**:
```json
{
  "event": "AMBULANCE_TELEMETRY_UPDATE",
  "timestamp": 1789172105,
  "ambulance_id": "RJ-14-EA-4091",
  "coords": [26.9030, 75.7720],
  "speed_kmh": 58.4,
  "heading_degrees": 124,
  "has_green_corridor": true,
  "distance_remaining_m": 3400,
  "eta_seconds": 420
}
```

### 3.2. Signal Hold Countdown Stream
- **URL**: `wss://api.greencorridor.jaipurhealth.gov.in/v1/ws/signals`
- **Message Payload**:
```json
{
  "event": "SIGNAL_COUNTDOWN_TICK",
  "signal_id": "sig-rambagh",
  "signal_name": "Rambagh Circle Crossing",
  "ambulance_id": "RJ-14-EA-4091",
  "hold_window_remaining_sec": 84,
  "perpendicular_locked": true,
  "responsible_officer": "Inspector R. S. Rathore (JTP Unit 4)"
}
```
