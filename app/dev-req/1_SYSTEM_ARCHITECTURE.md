# Green+ Corridor: Production System Architecture & Enterprise Engineering Spec

## 1. Executive Overview

**Green+ Corridor** is a municipal-grade, mission-critical emergency traffic management platform connecting clinical hospital intake departments (e.g., Level 1 Trauma Centers) directly with city Traffic Control Police (JTP) central command.

The platform coordinates two primary workflows:
1. **Emergency Green Corridor**: Automated pre-emption of municipal traffic signals, dynamic route clearances, and field officer deployment for critical (Code Red / Code Yellow) emergency ambulances.
2. **Routine Clinical Transit**: Non-emergency patient transfer, organ specimen retrieval, and vehicle relocation calculated locally through real-time traffic density engines without consuming municipal police clearance resources.

---

## 2. High-Level Architectural Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                         ACTORS & CLIENT TIER                                       |
+----------------------------------------------------------------------------------------------------+
|  [SMS & Apex Hospital]       [Jaipur Traffic Police (JTP)]       [Ambulance Crew]    [Field Police]|
|  Clinical Intake Web UI       Central Command Web UI / CAD       In-Cab AIS-140 Tablet  Mobile App |
+----------------------------------------------------------------------------------------------------+
                                                | (HTTPS / WSS / TLS 1.3)
                                                v
+----------------------------------------------------------------------------------------------------+
|                                    API GATEWAY & LOAD BALANCER                                     |
|  - Reverse Proxy (Kong / Envoy)       - Rate Limiting           - OAuth2 / JWT Validator           |
|  - WAF (Web Application Firewall)     - TLS Termination         - Request Trace ID Ingestion       |
+----------------------------------------------------------------------------------------------------+
                                                |
                                                v
+----------------------------------------------------------------------------------------------------+
|                                       MICROSERVICES LAYER                                          |
+----------------------------------------------------------------------------------------------------+
| [Auth & RBAC Service]      [Hospital Dispatch Service]       [Corridor Preemption Orchestrator]    |
| - Keycloak / Go Service     - Bed & OR Intake availability    - Signal Green Wave algorithm        |
| - Multi-tenant authority    - Fleet allocation & readiness    - ETA countdown & hold-window logic  |
| - Traffic Police vs Medic   - Patient severity triage engine  - Route Override & Bypass Controller |
+----------------------------------------------------------------------------------------------------+
| [Geo-Tracking & Telemetry] [Signal Controller Gateway]       [Notification & Broadcast Service]   |
| - AIS-140 GPS Ingestion     - SCATS / ITCS / MQTT Broker      - Police Radio (TETRA / VHF CAD)     |
| - Dead-reckoning map match  - Opticom / C-V2X pre-emption     - WebSocket push to dispatchers      |
| - Speed & congestion stats  - Signal lock fail-safe watchdog  - SMS / WhatsApp emergency alerts    |
+----------------------------------------------------------------------------------------------------+
                                                |
                                                v
+----------------------------------------------------------------------------------------------------+
|                                    EVENT STREAMING & MESSAGE BUS                                   |
|                        Apache Kafka (Partitioned by Municipal Traffic Sectors)                     |
+----------------------------------------------------------------------------------------------------+
                                                |
                                                v
+----------------------------------------------------------------------------------------------------+
|                                      DATA STORAGE LAYER                                            |
+----------------------------------------------------------------------------------------------------+
|  [PostgreSQL + PostGIS]     [TimescaleDB]                 [Redis Cluster]          [S3 / MinIO]    |
|  - Hospital accounts        - High-frequency GPS pings    - Active signal locks    - Tamper-proof  |
|  - Police officer roster    - Traffic density logs        - Session tokens         - Clearance     |
|  - Corridor geometries      - Speed telemetry histories   - Real-time pub/sub      - Audit receipts|
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Microservice Specifications

### 3.1. Authentication & RBAC Service
- **Role Isolation**:
  - `ROLE_HOSPITAL_MEDIC`: Read/write local hospital fleet, request emergency green corridors, calculate routine transit routes.
  - `ROLE_POLICE_COMMAND`: Full administrative override authority. Can grant clearances, divert routes, execute manual signal overrides, and deploy field personnel.
  - `ROLE_FIELD_OFFICER`: Read-only access to assigned intersection bottleneck alerts and incoming ambulance ETA countdowns.
- **Security**: OAuth2 with JWT access tokens (15m expiry) and rotating HTTP-only refresh tokens (7 days). Multi-factor authentication (MFA via TOTP or Govt GovID SSO).

### 3.2. Corridor Preemption Orchestrator
- Responsible for calculating the **Signal Hold Window**:
  $$\text{Hold Window} = \text{ETA}(\text{Signal}_n) - \Delta t_{\text{clear}}$$
  where $\Delta t_{\text{clear}}$ is the mandatory clearance interval (typically 45–90 seconds) needed to flush perpendicular pedestrian and vehicular traffic.
- **Fail-Safe Watchdog Timer**: If an ambulance halts, breaks down, or loses GPS connectivity for more than 120 seconds, the orchestrator automatically releases held signals back to adaptive municipal cycling to prevent catastrophic city gridlock.

### 3.3. Signal Controller Gateway
- Connects municipal traffic signal controllers (SCATS, SCOOT, or CoActive ITCS) via encrypted cellular IoT modems (MQTT over TLS).
- Issues prioritized NTCIP 1202 / NTCIP 1211 emergency vehicle preemption commands.
- Implements hardware heartbeat checks every 2 seconds.

---

## 4. Operational Redundancy & Disaster Recovery

1. **Dual Cellular Multi-SIM**: Ambulance AIS-140 tracking units use dual SIMs (Airtel + Jio) with automated failover to ensure uninterrupted telemetry even in congested telecom zones.
2. **Manual Police Radio Override**: In the event of network disruption, JTP central dispatch maintains dedicated VHF radio channel (156.800 MHz) with field officers at Ambedkar, Rambagh, and Tonk Phatak intersections.
3. **Graceful Signal Recovery**: Any green wave signal automatically times out after a maximum ceiling of 180 seconds, returning to local controller vehicle-actuation.
