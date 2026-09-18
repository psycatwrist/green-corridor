# Green+ Corridor: Security Architecture, Data Privacy & Regulatory Compliance

## 1. Regulatory Governance Framework

**Green+ Corridor** operates at the intersection of emergency healthcare dispatch and municipal law enforcement. As such, production deployment must comply with:
- **Digital Personal Data Protection Act (DPDPA 2023)**: Indian statutory privacy standard for citizen and patient health records.
- **MoRTH AIS-140 Guidelines**: Automotive telemetry and national emergency tracking standards.
- **ISO 27001 & CERT-In Guidelines**: Information security management and incident reporting protocols.

---

## 2. Strict Role-Based Access Control (RBAC)

The system enforces strict multi-tenant jurisdictional isolation:

| Operational Dimension | Hospital Clinical Staff (`ROLE_HOSPITAL_MEDIC`) | Jaipur Traffic Police (`ROLE_POLICE_COMMAND`) |
| :--- | :--- | :--- |
| **Facility Scope** | Scoped strictly to their own hospital (e.g. SMS vs Apex) | Municipal-wide oversight across all hospitals |
| **Fleet Tracking** | Can track and dispatch assigned ambulance fleet | Can view and monitor all ambulances across Jaipur |
| **Emergency Clearance** | Can **request** green corridor clearance | Can **grant, reject, or override** clearance |
| **Route Modification** | Cannot override municipal signals | Can **force divert** route corridors to bypass traffic |
| **Routine Navigation** | Can query optimal non-emergency transit | Not visible (police queues are not burdened) |
| **Signal Controls** | Zero access to municipal signal hardware | Authorized to trigger preemption cycles |

---

## 3. Patient Privacy & Health Data Anonymization (DPDPA Compliance)

To protect patient dignity while providing sufficient triage context to police and clinical intake:
1. **Zero PII Exposure to Police Dispatch**:
   - Traffic police officers only see triage severity category (**Code Red**, **Code Yellow**, **Code Green**) and general emergency category (e.g., "Polytrauma", "Cardiac Stroke Window").
   - Names, Aadhaar numbers, and personal identifiers are strictly encrypted at the hospital edge and **never stored or rendered on JTP Admin consoles**.
2. **Data Minimization**:
   - Vitals telemetry (SpO2, BP, Pulse) is transmitted over an encrypted channel accessible only to the receiving hospital trauma dock.
3. **Data Retention Policy**:
   - Transient patient vitals are automatically purged from active databases 72 hours post-admission.
   - Vehicle transit telemetry (speed, route coordinates, signal hold timestamps) is retained in anonymized form for municipal traffic planning analytics.

---

## 4. Cryptographic Transport & IoT Cabinet Security

- **Web & Mobile Tier**: Mandatory TLS 1.3 with HSTS (Strict-Transport-Security: `max-age=63072000; includeSubDomains; preload`).
- **Signal Cabinet IoT Gateway**: Mutual TLS (mTLS) authentication. Every physical intersection controller has a unique X.509 cryptographic client certificate issued by the Rajasthan State Data Center (RSDC) Private Certificate Authority (CA).
- **Brute Force & DDoS Mitigation**: Cloudflare / AWS Shield WAF with rate limiting on login gateways (max 5 failed attempts per IP per 15 minutes before lockout).

---

## 5. Tamper-Proof Audit Logging (Accountability Ledger)

Every critical corridor action generates an immutable audit record stored in an append-only PostgreSQL ledger with SHA-256 integrity hashing:
```json
{
  "audit_event_id": "AUD-20260912-00412",
  "timestamp": "2026-09-12T00:15:10.412Z",
  "actor_id": "JTP-OFFICER-04",
  "actor_ip": "10.14.22.8",
  "action": "GRANT_GREEN_CORRIDOR",
  "clearance_id": "REQ-SMS-4091",
  "ambulance_id": "RJ-14-EA-4091",
  "affected_signals": ["sig-ambedkar", "sig-rambagh", "sig-narayan", "sig-smsgate"],
  "payload_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```
*This ensures complete legal accountability in the event of an intersection traffic accident or municipal inquiry.*
