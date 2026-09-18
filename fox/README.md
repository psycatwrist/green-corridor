# Fox Backend 🦊🚑
**Open FastAPI for Jaipur Hospitals & Green Corridor Emergency Ambulance Network**

Fox is a high-performance, modular Python backend built with **FastAPI**. It serves two core purposes:
1. **Open Healthcare & Fleet Registry**: Exposes lightweight indexes and deep nested profiles for almost every major hospital in Jaipur, along with active/inactive ambulance fleets, driver profiles, and encrypted `carkey` vehicle credentials.
2. **Dual-Role Authentication**: Securely authenticates **Hospitals (Code 9)** and **Traffic Admins (Code 8)** against modular JSON databases, returning custom status codes (`100`, `110`, `200`) and signed **JWT (JSON Web Tokens)**.

---

## 📁 Project Architecture & Clean JSON Database

Rather than stuffing all records into a single monolithic file, operational data and security credentials are split into modular directories:

```
fox/
├── app/
│   ├── config.py                 # Paths, secret keys, token expirations
│   ├── core/
│   │   └── security.py           # JWT generation/decoding, SHA-256 keypass hashing
│   ├── models/
│   │   ├── auth.py               # Schemas for AuthRequest, AuthResponse, TokenVerify
│   │   └── hospital.py           # Schemas for Hospital, Car, Driver, Telemetry
│   ├── routers/
│   │   ├── auth.py               # POST /auth/login, POST /auth/verify
│   │   └── hospitals.py          # GET /hospitals, /{key}, /{key}/cars/*, POST telemetry
│   ├── services/
│   │   ├── auth_service.py       # Authentication against JSON stores
│   │   └── hospital_service.py   # Loader & query service for hospital & car JSON files
│   └── main.py                   # FastAPI app, CORS middleware, root routing
├── data/
│   ├── auth/
│   │   ├── hospitals_auth.json   # Role 9 credentials (key, hashed keypass)
│   │   └── admins_auth.json      # Role 8 credentials (key, hashed keypass)
│   ├── hospitals/
│   │   ├── index.json            # Lightweight hospital index (prevents heavy payloads)
│   │   ├── sms_hospital.json     # Sawai Man Singh Hospital
│   │   ├── fortis_escorts.json   # Fortis Escorts Hospital
│   │   ├── ehcc_hospital.json    # Eternal Hospital (EHCC)
│   │   ├── narayana_hospital.json# Narayana Multispeciality Hospital
│   │   ├── manipal_hospital.json # Manipal Hospital Jaipur
│   │   ├── sdmh_hospital.json    # Santokba Durlabhji Memorial Hospital
│   │   ├── ck_birla_hospital.json# Rukmani Birla Hospital (CK Birla)
│   │   ├── mahatma_gandhi_hospital.json # Mahatma Gandhi Hospital
│   │   ├── apex_hospital.json    # Apex Hospital Malviya Nagar
│   │   ├── shalby_hospital.json  # Shalby Multispeciality Hospital
│   │   ├── bmchrc_hospital.json  # Bhagwan Mahaveer Cancer Hospital
│   │   └── metro_mas_hospital.json # Metro MAS Hospital
│   └── cars/
│       ├── sms_hospital_cars.json
│       ├── fortis_escorts_cars.json
│       └── ...                   # Dedicated fleet files for each hospital
├── scripts/
│   └── generate_data.py          # Generator to populate realistic Jaipur data
├── requirements.txt              # Dependencies
├── test_api.py                   # 47 automated tests covering all features
└── README.md
```

---

## 🔐 Dual-Role Authentication Specification

### 1. Request Format (`POST /auth/login`)
Send a POST request with `code`, `key`, and `keypass`:
```json
{
  "code": 9,
  "key": "sms_key_jaipur",
  "keypass": "sms_pass_2026"
}
```

- **`code`**:
  - `9`: Hospital Authentication (checks `data/auth/hospitals_auth.json`)
  - `8`: Traffic Admin Authentication (checks `data/auth/admins_auth.json`)
- **`key`**: Assigned public or entity identifier (e.g. `sms_key_jaipur`)
- **`keypass`**: Secret credential (can be sent plain or pre-hashed with SHA-256)

### 2. Custom Response Status Codes
| Code | Status | Meaning |
| :---: | :--- | :--- |
| **`100`** | `Authenticated` | Key & keypass valid. Returns a signed JWT token in `"token"`. |
| **`110`** | `Incorrect keypass but true key` | Key exists, but the password/keypass was wrong. |
| **`200`** | `UNAUTH` | Key not found in JSON store, invalid role code, or deactivated. |

#### Example Response (Code 100):
```json
{
  "code": 100,
  "message": "Authenticated",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "hospital",
  "entity_name": "Sawai Man Singh (SMS) Hospital"
}
```

### 3. JWT Token Verification (`POST /auth/verify`)
Send:
```json
{
  "token": "<JWT_TOKEN>"
}
```
Verifies the cryptographic signature and returns the decoded claims (`role`, `sub`, `exp`, `iat`).

---

## 🚑 Open Hospital & Fleet API Structure

### 1. Lightweight Hospital Registry
- **`GET /hospitals`**
  - Returns a lightweight summary array `[{"key": "sms_hospital", "name": "...", "zone": "...", "detail_url": "/hospitals/sms_hospital"}]`.
  - **Performance Design**: Avoids serializing huge nested data when a frontend just needs a hospital picker or dropdown.

### 2. Deep Nested Hospital Profile
- **`GET /hospitals/{key}`**
  - Returns full nested profile:
    - `name`, `estd`, `overview`
    - `coordinates`: exact GPS latitude & longitude in Jaipur
    - `contact_details`: emergency helpline, reception, ambulance direct
    - `address`: street, landmark, pin code
    - `facilities`: ICU beds, organ transplant unit, green corridor certified

### 3. Ambulance (Car) Fleet Routes
- **`GET /hospitals/{key}/cars`**
  - Complete fleet overview with counts for `in_service` and `out_service`.
- **`GET /hospitals/{key}/cars/in-service`**
  - All currently available ambulances. Includes:
    - **`carkey`**: Unique encrypted/hashed secret key for vehicle-side authorization.
    - **`car_info`**: Make/model, registration (e.g. `RJ-14-PA-1001`), equipment (ALS/BLS, ventilator, defibrillator).
    - **`driver_info`**: Driver name, phone, license number, shift.
    - **`current_location`**: Live GPS coordinates, speed, and timestamp.
- **`GET /hospitals/{key}/cars/out-service`**
  - Out-of-service units (maintenance/standby) with the identical schema.
- **`GET /hospitals/{key}/cars/{car_id}`**
  - Direct drill-down by ambulance ID (e.g. `/hospitals/sms_hospital/cars/AMB-SMS-01`).

### 4. Telemetry POST Endpoint
- **`POST /hospitals/{key}/cars/{car_id}/telemetry`**
  - Ambulances securely transmit updated GPS coordinates and speed using their `carkey`:
  ```json
  {
    "carkey": "40f865c02598096f5539d62e658e21bf5bb8fb142d9a0aa652deda275ea7cad7",
    "latitude": 26.8995,
    "longitude": 75.8180,
    "speed_kmh": 35.5,
    "status": "in-service"
  }
  ```

---

## 🔑 Demo Credentials for Testing

> For the full directory of all accounts and ambulance `carkey` secrets, see **[CREDENTIALS.md](CREDENTIALS.md)**.

### Hospital Credentials (Code `9`):
| Hospital | Key | Keypass |
| :--- | :--- | :--- |
| **Dictator Apex Trauma Hospital** | `dictator` | `dictatorIsPsycatwrist` |
| Sawai Man Singh (SMS) | `sms_key_jaipur` | `sms_pass_2026` |
| Fortis Escorts | `fortis_key_jaipur` | `fortis_pass_2026` |
| Eternal Hospital (EHCC) | `ehcc_key_jaipur` | `ehcc_pass_2026` |
| Narayana Multispeciality | `narayana_key_jaipur` | `narayana_pass_2026` |
| Manipal Hospital | `manipal_key_jaipur` | `manipal_pass_2026` |
| Santokba Durlabhji (SDMH) | `sdmh_key_jaipur` | `sdmh_pass_2026` |
| CK Birla (RBH) | `ckbirla_key_jaipur` | `ckbirla_pass_2026` |
| Mahatma Gandhi | `mgmch_key_jaipur` | `mgmch_pass_2026` |

### Traffic Admin Credentials (Code `8`):
| Admin Unit | Key | Keypass |
| :--- | :--- | :--- |
| **Dictator Supreme Traffic Command** | `dictator` | `dictatorIsPsycatwrist` |
| Jaipur Traffic Police HQ | `jaipur_traffic_hq_admin` | `jaipur_traffic_pass_2026` |
| Green Corridor Dispatch | `green_corridor_dispatch_admin` | `corridor_pass_2026` |
| South Zone Traffic | `south_zone_traffic_admin` | `south_traffic_pass_2026` |

---

## 🚀 How to Run the Server

1. **Install Requirements**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Or run:
   ```bash
   python app/main.py
   ```

3. **Interactive Documentation**:
   - Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

4. **Run Automated Test Suite**:
   ```bash
   python test_api.py
   ```
