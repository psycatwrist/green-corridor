# Green+ Corridor: Hardware & Municipal IoT Integration Specification

## 1. Overview

To transition from this prototype to physical city infrastructure in Jaipur, **Green+ Corridor** requires bidirectional interfacing across three hardware tiers:
1. **Emergency Ambulances**: Vehicle telemetry, siren sensors, and rugged mobile dispatch tablets.
2. **Municipal Traffic Signals**: Intersection controllers (SCATS / SCOOT / ITCS) and cellular IoT preemption actuators.
3. **Police Communications**: Municipal CAD (Computer Aided Dispatch) and handheld digital radio gateways (TETRA / VHF).

---

## 2. In-Vehicle Telemetry: AIS-140 Standard

Under the Ministry of Road Transport and Highways (MoRTH) regulations in India, all emergency public service vehicles must adhere to **Automotive Industry Standard (AIS) 140**.

```
+-------------------------------------------------------------------------------+
|                       AMBULANCE IN-VEHICLE ARCHITECTURE                       |
+-------------------------------------------------------------------------------+
|  [AIS-140 Telematics Gateway]                                                 |
|    - High-gain GNSS Receiver (GPS + NavIC Indian Satellite Constellation)    |
|    - Dual 4G/5G eSIM (Auto-roaming across Airtel & Reliance Jio)              |
|    - 3-Axis Accelerometer & Gyroscope (Dead-reckoning inside underpasses)     |
|    - IP67 Waterproof & Ruggedized Chassis                                     |
+-------------------------------------------------------------------------------+
       |                                     |                     |
       v (GPIO Input)                        v (CAN Bus)           v (Bluetooth / Wi-Fi)
[Emergency Siren Sensor]             [OBD-II Telemetry]   [In-Cab Rugged Tablet]
- Detects physical siren toggle      - Speed, Fuel, Vitals - Hospital intake sync
- Auto-flags priority on CAD         - Engine diagnostics  - Driver turn-by-turn HUD
```

### Siren Actuation Trigger
When the ambulance driver flips the physical siren switch:
- A digital GPIO high signal (+12V DC via optocoupler) triggers the telematics unit.
- The unit transmits an instant MQTT priority burst:
  `TOPIC: jaipur/fleet/RJ-14-EA-4091/siren_state` ➔ `{"active": true, "timestamp": 1789172100}`
- The Green+ Corridor backend flags the vehicle on both Hospital and JTP Admin dashboards.

---

## 3. Municipal Traffic Signal Controller Integration

Jaipur Municipal Corporation and Jaipur Development Authority (JDA) employ Adaptive Traffic Control Systems (ATCS) such as **SCATS** or indigenous **CoActive ITCS**.

### 3.1. Pre-emption Gateway Architecture

```
[Green+ Corridor Cloud]
         | (Encrypted MQTT over TLS / mTLS)
         v
[Municipal Traffic Command Data Center]
         | (NTCIP 1202 / NTCIP 1211 Priority Protocol)
         v
[Master Traffic Controller Engine (SCATS / ITCS)]
         | (Optic Fiber / 4G Cellular Industrial Modem)
         v
+-------------------------------------------------------------------------------+
|                       INTERSECTION SIGNAL CONTROLLER CABINET                  |
|  - Microprocessor Logic Board (Type 170 / Type 2070 / ATC Standard)           |
|  - Conflict Monitor Unit (CMU / MMU) - Hardware safety interlock              |
|  - Phase Selector Card (Opticom / C-V2X / Dry Contact Relay)                 |
|  - LED Signal Heads (North, South, East, West Carriageways)                   |
+-------------------------------------------------------------------------------+
```

### 3.2. Fail-Safe Conflict Monitor Interlock (CMU)
- **Hardwired Safety**: The software system cannot physically command opposing green lights. The hardware Conflict Monitor Unit (CMU) drops to yellow flash if any contradictory phase is attempted.
- **Graceful Yellow Clearance**: Preemption commands mandate a minimum 4.5-second amber phase on cross-traffic before locking the corridor green.
- **Maximum Green Limit**: Hard ceiling of 180 seconds. If the ambulance is delayed beyond 180 seconds, the signal cabinet resets to normal vehicle actuation.

---

## 4. Police CAD & Handheld Digital Radio Gateway

- **TETRA Radio Integration**: Transmits text dispatch telemetry to on-duty officers' handheld terminals (e.g. Motorola MTP850 / Sepura STP9000).
- **Automated Broadcast**: When JTP Admin authorizes a corridor:
  - *Automated Voice Dispatch*: Synthesized radio announcement broadcast on Frequency 156.800 MHz:
    > "Attention JTP South Unit 4, Inspector Rathore: Code Red clearance authorized for Unit RJ-14-EA-4091 approaching Rambagh Circle in 4 minutes. Hold north carriageway."
