# Fox Backend - Credentials & Auth Directory 🔑

> [!NOTE]
> **Practice Project Directory**: This document contains all test credentials, role codes, keys, and keypasses for local testing and development of the **Fox** backend.

---

## 🏥 Hospital Accounts (Role Code `9`)

Use these credentials to authenticate against the hospital panel via `POST /auth/login`.

| Hospital Name | Hospital Key Slug | Auth `code` | Auth `key` | Auth `keypass` |
| :--- | :--- | :---: | :--- | :--- |
| **The Dictator Apex Trauma & Super-Speciality Hospital** | `dictator_hospital` | **`9`** | `dictator` | `dictatorIsPsycatwrist` |
| **Sawai Man Singh (SMS) Hospital** | `sms_hospital` | **`9`** | `sms_key_jaipur` | `sms_pass_2026` |
| **Fortis Escorts Hospital** | `fortis_escorts` | **`9`** | `fortis_key_jaipur` | `fortis_pass_2026` |
| **Eternal Hospital (EHCC)** | `ehcc_hospital` | **`9`** | `ehcc_key_jaipur` | `ehcc_pass_2026` |
| **Narayana Multispeciality Hospital** | `narayana_hospital` | **`9`** | `narayana_key_jaipur` | `narayana_pass_2026` |
| **Manipal Hospital Jaipur** | `manipal_hospital` | **`9`** | `manipal_key_jaipur` | `manipal_pass_2026` |
| **Santokba Durlabhji Memorial Hospital (SDMH)** | `sdmh_hospital` | **`9`** | `sdmh_key_jaipur` | `sdmh_pass_2026` |
| **Rukmani Birla Hospital (CK Birla)** | `ck_birla_hospital` | **`9`** | `ckbirla_key_jaipur` | `ckbirla_pass_2026` |
| **Mahatma Gandhi Hospital & Medical College** | `mahatma_gandhi_hospital` | **`9`** | `mgmch_key_jaipur` | `mgmch_pass_2026` |
| **Apex Hospital Malviya Nagar** | `apex_hospital` | **`9`** | `apex_key_jaipur` | `apex_pass_2026` |
| **Shalby Multispeciality Hospital** | `shalby_hospital` | **`9`** | `shalby_key_jaipur` | `shalby_pass_2026` |
| **Bhagwan Mahaveer Cancer Hospital (BMCHRC)** | `bmchrc_hospital` | **`9`** | `bmchrc_key_jaipur` | `bmchrc_pass_2026` |
| **Metro MAS Hospital** | `metro_mas_hospital` | **`9`** | `metromas_key_jaipur` | `metromas_pass_2026` |

---

## 🚦 Traffic Admin Accounts (Role Code `8`)

Use these credentials to authenticate traffic authority dispatchers and control rooms via `POST /auth/login`.

| Admin Command Unit | Admin ID | Auth `code` | Auth `key` | Auth `keypass` |
| :--- | :--- | :---: | :--- | :--- |
| **The Dictator Supreme Traffic Command & Green Corridor Control** | `ADM-DICTATOR-SUPREME-01` | **`8`** | `dictator` | `dictatorIsPsycatwrist` |
| **Jaipur Police Traffic Control HQ (Yadgar, Ajmeri Gate)** | `ADM-JPR-HQ-01` | **`8`** | `jaipur_traffic_hq_admin` | `jaipur_traffic_pass_2026` |
| **Jaipur Green Corridor Emergency Dispatch Unit** | `ADM-JPR-GC-02` | **`8`** | `green_corridor_dispatch_admin` | `corridor_pass_2026` |
| **South Zone Traffic Command (Malviya Nagar & Sanganer)** | `ADM-JPR-SOUTH-03` | **`8`** | `south_zone_traffic_admin` | `south_traffic_pass_2026` |

---

## 🚑 Special Car Authentication Keys (`carkey`)

Each ambulance has a unique secret `carkey` used to transmit telemetry coordinates to `POST /hospitals/{key}/cars/{car_id}/telemetry`.

### Sample Ambulances (`The Dictator Hospital`):
| Ambulance ID | Vehicle Reg | Model | `carkey` |
| :--- | :--- | :--- | :--- |
| `AMB-DICT-01` | `RJ-14-PA-9991` | Mercedes-Benz Sprinter 519 CDI | `2a17248bd0fb95750a935e5e483ee97bae1b245c119a36751c830ead2d1c8d98` |
| `AMB-DICT-02` | `RJ-14-PA-9992` | Force Motors Traveller 3700 Super-ALS | `c74b5032871a402543746fee43536feff8dc2e4105a83a660f64c9216e65edde` |
| `AMB-DICT-03` | `RJ-14-PA-9993` | Tata Winger Fast-Response BLS | `4fba22ffc8a380f2ef3016143ed11acc197bad0982f670b4567acaeea178a24d` |
| `AMB-DICT-04` | `RJ-14-PA-9994` | Force Gurkha 4x4 Disaster Unit | `583aa67197e52d2e89f8b580f168897bf7e7c24a57f34f000a37c797b7e07f3f` |

### Sample Ambulances (`SMS Hospital`):
| Ambulance ID | Vehicle Reg | Model | `carkey` |
| :--- | :--- | :--- | :--- |
| `AMB-SMS-01` | `RJ-14-PA-1001` | Force Motors Traveller 3350 ALS | `40f865c02598096f5539d62e658e21bf5bb8fb142d9a0aa652deda275ea7cad7` |
| `AMB-SMS-02` | `RJ-14-PA-1002` | Tata Winger Ambulance BLS | `3053b7d1fadc48a979640a1ef286fb474f320ddca69c76c77817898a370f1aac` |
| `AMB-SMS-03` | `RJ-14-PA-1003` | Force Motors Traveller 3050 ALS | `15e5c3eef5aeec6696dbf2ebfc5bb2b45cf544c7f535ad0e2c842b4749f1dbfa` |

---

## 📋 Testing Examples

### 1. Authenticate as Hospital (`100` Authenticated)
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "code": 9,
    "key": "dictator",
    "keypass": "dictatorIsPsycatwrist"
  }'
```

### 2. Authenticate as Traffic Admin (`100` Authenticated)
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "code": 8,
    "key": "dictator",
    "keypass": "dictatorIsPsycatwrist"
  }'
```

### 3. Test Incorrect Password (`110` Incorrect Keypass)
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "code": 9,
    "key": "sms_key_jaipur",
    "keypass": "wrong_password_here"
  }'
```

### 4. Test Unregistered Key (`200` UNAUTH)
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "code": 9,
    "key": "non_existent_key",
    "keypass": "any_pass"
  }'
```
