# Green+ Corridor: Production Technology Stack & Municipal Rollout Roadmap

## 1. Executive Summary

This roadmap outlines the transition of the **Green+ Corridor** UI prototype into a production-grade, mission-critical emergency transit operating system. The platform will bridge clinical hospital emergency departments, Jaipur Traffic Police (JTP) central command, municipal traffic signal controllers (SCATS/ITCS), and field traffic police officers across the Jaipur metropolitan area and Rajasthan state.

---

## 2. Production Technology Stack Recommendation

```
+----------------------------------------------------------------------------------------------------+
|                                    RECOMMENDED PRODUCTION STACK                                    |
+----------------------------------------------------------------------------------------------------+
| TIER                    | TECHNOLOGY                   | RATIONALE                                 |
+-------------------------+------------------------------+-------------------------------------------+
| Web Dispatch Frontend   | React 19 / Next.js 15        | SSR performance, component isolation,     |
|                         | TypeScript, TailwindCSS      | enterprise type safety, rapid iteration   |
+-------------------------+------------------------------+-------------------------------------------+
| Mapping & Spatial Viz   | Mapbox GL JS / Deck.gl       | 60 FPS vector tile rendering, GPU-accel.  |
|                         | Leaflet (fallback)           | traffic density heatmaps, 3D building data|
+-------------------------+------------------------------+-------------------------------------------+
| Mobile Apps (Crews/Ops) | Flutter (Dart)               | Cross-platform (Android rugged tablets &  |
|                         |                              | iOS), offline GPS caching, high frame rate|
+-------------------------+------------------------------+-------------------------------------------+
| API Gateway             | Envoy / Kong Gateway         | High throughput, rate limiting, mTLS,     |
|                         |                              | WAF, distributed OpenTelemetry tracing    |
+-------------------------+------------------------------+-------------------------------------------+
| Microservices Backend   | Go (Golang)                  | Ultra-low latency, small memory footprint,|
|                         | Python 3.12 (FastAPI)        | concurrency for high-rate GPS telemetry,  |
|                         |                              | AI routing & ETA neural estimations       |
+-------------------------+------------------------------+-------------------------------------------+
| Inter-Service Comms     | gRPC + Protocol Buffers      | Binary serialization, microsecond RPC,   |
|                         |                              | strict schema contract enforcement        |
+-------------------------+------------------------------+-------------------------------------------+
| Event Streaming         | Apache Kafka                 | Partitioned by city traffic sectors,      |
|                         |                              | zero data loss, AIS-140 GPS stream ingest |
+-------------------------+------------------------------+-------------------------------------------+
| Signal IoT Protocol     | MQTT 5.0 (EMQX Broker)       | Lightweight bidirectional telemetry to    |
|                         |                              | roadside ITCS cabinets & in-vehicle units |
+-------------------------+------------------------------+-------------------------------------------+
| Relational / Spatial DB | PostgreSQL 16 + PostGIS 3.4  | Spatial indexing (R-Tree), pgRouting,     |
|                         |                              | ISO-compliant geographic queries          |
+-------------------------+------------------------------+-------------------------------------------+
| Time-Series DB          | TimescaleDB                  | High-cardinality GPS telemetry, signal    |
|                         |                              | state audit logs, sub-second query agg.   |
+-------------------------+------------------------------+-------------------------------------------+
| Fast Cache & Pub/Sub    | Redis Cluster 7.2            | Real-time corridor locks, active session  |
|                         |                              | state, ephemeral signal preemption keys   |
+-------------------------+------------------------------+-------------------------------------------+
| Identity & RBAC         | Keycloak 24 / Ory Kratos     | OAuth2 / OIDC, Multi-factor Auth (MFA),   |
|                         |                              | Fine-grained role separation (Police/Med) |
+-------------------------+------------------------------+-------------------------------------------+
| Cloud / Datacenter      | Hybrid: Jaipur Smart City    | Local data sovereignty (DPDPA 2023),     |
|                         | Datacenter + AWS GovCloud    | low-latency municipal interconnect        |
+-------------------------+------------------------------+-------------------------------------------+
| Container Orchestration | Kubernetes (EKS / Bare-metal)| Auto-scaling on mass-casualty incidents,  |
|                         | Helm, ArgoCD GitOps          | rolling zero-downtime updates             |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Microservice Decomposition

```
                                  +----------------------+
                                  |     Kong Gateway     |
                                  +----------+-----------+
                                             |
            +--------------------+-----------+-----------+--------------------+
            |                    |                       |                    |
            v                    v                       v                    v
  +------------------+ +-------------------+ +--------------------+ +-------------------+
  |  Identity & RBAC | | Hospital Intake   | | Corridor Preempt   | | In-Vehicle Fleet  |
  |  Service (Go)    | | Service (FastAPI) | | Orchestrator (Go)  | | Gateway (Go)      |
  +------------------+ +-------------------+ +--------------------+ +-------------------+
            |                    |                       |                    |
            +--------------------+-----------+-----------+--------------------+
                                             |
                                             v
                                  +----------------------+
                                  |  Apache Kafka Bus    |
                                  +----------+-----------+
                                             |
            +--------------------+-----------+-----------+--------------------+
            |                    |                       |                    |
            v                    v                       v                    v
  +------------------+ +-------------------+ +--------------------+ +-------------------+
  | Signal Cabinet   | | Real-Time Routing | | Notification &     | | Audit & Compliance|
  | Adapter (C++/Go) | | Engine (Valhalla) | | Alerting (Node/Go) | | Service (Python)  |
  +------------------+ +-------------------+ +--------------------+ +-------------------+
```

### Microservice Responsibilities:
1. **Identity & RBAC Service**: Manages hospital certificates, police digital credentials, JWT minting, role enforcement.
2. **Hospital Intake Service**: Manages hospital fleet inventory, in-service/out-of-service status, trauma bay readiness, clearance request submission.
3. **Corridor Preemption Orchestrator**: Heart of Green+ Corridor. Calculates dynamic green wave cascade, ETA windows, holds, safety clearance gaps, and route overrides.
4. **In-Vehicle Fleet Gateway**: Ingests high-frequency AIS-140 GPS packets, siren active flags, vehicle diagnostics.
5. **Signal Cabinet Adapter**: Translates preemption triggers into vendor-specific NTCIP 1202 / SCATS / ITCS protocols over mTLS VPN.
6. **Real-Time Routing Engine**: Open-source Valhalla / OSRM engine with real-time TomTom/Google traffic tiles for routine non-emergency route calculations.
7. **Notification & Alerting Service**: Delivers CAD alerts to police patrol handsets, WhatsApp/SMS notices, audio sirens at traffic junctions.
8. **Audit & Compliance Service**: Writes cryptographic SHA-256 hashed activity logs to TimescaleDB and WORM storage for legal scrutiny.

---

## 4. Municipal Rollout Roadmap (14 Months)

```
2026                 Q1                  Q2                  Q3                  Q4            2027 Q1
Phase:         [--- Phase 1 ---]   [--- Phase 2 ---]   [--- Phase 3 ---]   [--- Phase 4 ---]
Milestone:       MVP & Pilot         JLN Physical         SCATS Auto        Statewide (108)
```

### Phase 1: MVP Hardening, Telemetry Ingestion & Cloud Pilot (Months 1–3)
- **Goal**: Production-ready software foundations with live vehicle tracking and simulated traffic signal integration.
- **Key Deliverables**:
  - Deploy Go microservices on Kubernetes staging cluster in Jaipur Smart City Datacenter.
  - Implement AIS-140 GPS ingestion gateway consuming live data from 20 ambulances (10 SMS Hospital + 10 Apex Hospital).
  - Web dashboards deployed to SMS Trauma Center and Apex Emergency department with Keycloak RBAC.
  - Integration with Jaipur Traffic Police (JTP) Central Control Room monitoring screens (read-only pilot).
  - Validation: 99.9% telemetry ingestion reliability, <1 second latency on live map movement.

### Phase 2: Jaipur Smart City & JLN Marg Physical Interconnect (Months 4–6)
- **Goal**: First physical green corridor deployment along the primary JLN Marg medical corridor.
- **Key Deliverables**:
  - Hardware installation of industrial IoT edge gateways inside 5 critical signal junction cabinets:
    1. JKJ Roundabout
    2. OTS Junction
    3. Jawahar Kala Kendra Crossing
    4. Gandhi Nagar Crossing
    5. SMS Hospital Emergency Gate
  - Direct fiber-optic interconnect with JTP Traffic Command Center (Police Lines, Jaipur).
  - Native Flutter mobile application distributed to 40 field traffic police officers stationed along JLN Marg.
  - Fail-safe watchdog deployment: In-cabinet hardware timer ensuring signals never freeze on green past 180 seconds.
  - Validation: Conduct 15 live controlled mock ambulance runs with physical signal preemption. Target: 45% reduction in transit time.

### Phase 3: Automated SCATS / ITCS Pre-emption & Multi-Hospital Scaling (Months 7–10)
- **Goal**: City-wide coverage across all primary and secondary arterial corridors in Jaipur.
- **Key Deliverables**:
  - Integration with Jaipur Municipal Corporation (JMC) central SCATS / ITCS traffic server via NTCIP 1202 protocol.
  - Expand to Tonk Road, MI Road, Ajmer Road, and Sikar Road intersections (50+ traffic junctions).
  - Onboard additional tertiary hospitals: Fortis Escorts (Malviya Nagar), Manipal Hospital (Vidhyadhar Nagar), RUHS Medical College (Pratap Nagar).
  - Implementation of dynamic Route Override: JTP command can reroute ambulances mid-transit if an unexpected road blockade or VIP movement occurs.
  - Integration of automated audio-visual VMS (Variable Message Sign) boards along corridors to instruct public motorists to merge left.
  - Validation: City-wide live emergency clearances with zero human intervention required at roadside signal cabinets.

### Phase 4: State-wide Emergency Transit Network (Months 11–14)
- **Goal**: Scale across Rajasthan State with highway toll bypass and inter-city referral corridors.
- **Key Deliverables**:
  - Full integration with Rajasthan State Government's **108 Ambulance Fleet** (1,500+ vehicles across 33 districts).
  - High-speed inter-city green corridor support: Automated fast-track transit on National Highways (e.g., NH-48 Jaipur–Delhi, NH-21 Jaipur–Agra).
  - Integration with FASTag / NHAI toll plaza barrier systems for automated pre-opening of toll lanes 500 meters prior to ambulance arrival.
  - Organ Transplant Express Protocol: Multi-agency coordination between Jaipur Airport (Sanganer), state civil aviation, SMS Medical College, and Rajasthan Police.
  - Handover to Rajasthan Department of Information Technology & Communication (DoIT&C) for ongoing 24/7 SLA maintenance.

---

## 5. Performance Metrics & Service Level Agreements (SLAs)

| Metric | Production Target | Prototype Baseline | Measurement Method |
| :--- | :--- | :--- | :--- |
| **System Uptime** | **99.999%** ("Five Nines") | Best effort | Prometheus multi-region synthetic probes |
| **Signal Preemption Latency** | **< 250 milliseconds** | Instant (mocked) | End-to-end event timestamp to cabinet relay |
| **GPS Telemetry Update Rate** | **1.0 Hz (1 ping/sec)** | 3.0 sec poll | In-vehicle AIS-140 MQTT payload ingestion |
| **Route Calculation Engine** | **< 150 ms** for Jaipur metro | Instant (client-side) | Valhalla spatial pathfinding API benchmark |
| **Fail-Safe Watchdog Timeout** | **180 seconds hard cut** | 60 sec simulation | In-cabinet hardware relay cut-off test |
| **Database Recovery Point (RPO)**| **0 seconds** (Sync replica) | N/A | PostgreSQL synchronous WAL replication |
| **Database Recovery Time (RTO)**| **< 15 seconds** | N/A | Automated Kubernetes Patroni failover |

---

## 6. Budgetary & Resource Allocation Guidelines

```
+----------------------------------------------------------------------------------------------------+
|                                    ESTIMATED RESOURCE ALLOCATION                                   |
+----------------------------------------------------------------------------------------------------+
| DOMAIN                         | HEADCOUNT / SPECIALIZATION               | DURATION               |
+--------------------------------+------------------------------------------+------------------------+
| Backend & Microservices        | 2 Senior Go Engineers                    | Full Project (14 mos)  |
|                                | 1 Python / Geospatial Specialist         |                        |
+--------------------------------+------------------------------------------+------------------------+
| Frontend & Mobile Apps         | 2 React / Next.js Engineers              | Full Project (14 mos)  |
|                                | 1 Flutter Mobile Developer               |                        |
+--------------------------------+------------------------------------------+------------------------+
| Traffic & Hardware IoT         | 2 Embedded Systems Engineers             | Months 3–10 (8 mos)    |
|                                | (NTCIP / SCATS / CAN Bus / GPIO)         |                        |
+--------------------------------+------------------------------------------+------------------------+
| DevOps & Security              | 1 DevSecOps / K8s Infrastructure Lead    | Full Project (14 mos)  |
|                                | 1 Cybersecurity Auditor (CERT-In)        | Months 3, 6, 10, 14    |
+--------------------------------+------------------------------------------+------------------------+
| Municipal Liaison & Operations | 1 Police CAD Integration Specialist      | Months 4–12 (9 mos)    |
|                                | 1 Clinical Workflow Field Coordinator    |                        |
+----------------------------------------------------------------------------------------------------+
```

---

## 7. Next Steps for Municipal Deployment

1. **Sign MoU**: Formalize trilateral Memorandum of Understanding between Jaipur Traffic Police (JTP), Department of Medical, Health & Family Welfare (DMH&FW), and Jaipur Smart City Limited (JSCL).
2. **JLN Marg Hardware Survey**: Inspect 5 roadside traffic signal controller cabinets (make, model, firmware, fiber connectivity).
3. **AIS-140 Telemetry Feed**: Obtain direct API/broker credentials for the 20 SMS & Apex hospital ambulances.
4. **Deploy Staging Server**: Provision 3 dedicated nodes in Jaipur Smart City Datacenter for Phase 1 testing.
