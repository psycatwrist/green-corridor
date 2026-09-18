"""
Automated Test Suite for Fox Backend
Tests all authentication scenarios, response codes (100, 110, 200),
hospital routes, and ambulance fleet endpoints.
"""
import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

passed = 0
failed = 0


def assert_test(condition: bool, description: str):
    global passed, failed
    if condition:
        print(f"  [PASS] {description}")
        passed += 1
    else:
        print(f"  [FAIL] {description}")
        failed += 1


def run_tests():
    print("\n" + "=" * 60)
    print("RUNNING FOX BACKEND TEST SUITE")
    print("=" * 60)

    # ---------------------------------------------------------
    # TEST 1: Root Endpoint
    # ---------------------------------------------------------
    print("\n--- Testing Root Endpoint ---")
    resp = client.get("/")
    assert_test(resp.status_code == 200, "GET / returns 200 OK")
    data = resp.json()
    assert_test(data.get("project") == "Fox Backend", "Root JSON returns correct project name")
    assert_test("endpoints" in data, "Root JSON contains endpoints directory")

    # ---------------------------------------------------------
    # TEST 2: Hospital Authentication (Code 9)
    # ---------------------------------------------------------
    print("\n--- Testing Hospital Auth (Role Code 9) ---")

    # Scenario A: Valid Key + Valid Keypass -> Code 100
    payload_valid = {
        "code": 9,
        "key": "sms_key_jaipur",
        "keypass": "sms_pass_2026"
    }
    resp = client.post("/auth/login", json=payload_valid)
    assert_test(resp.status_code == 200, "POST /auth/login returns HTTP 200")
    data = resp.json()
    assert_test(data.get("code") == 100, "Expected Code 100 for authenticated hospital")
    assert_test(data.get("role") == "hospital", "Expected role 'hospital'")
    assert_test(bool(data.get("token")), "Expected non-empty JWT token")
    hospital_jwt = data.get("token")

    # Scenario B: Valid Key + Wrong Keypass -> Code 110
    payload_wrong_pass = {
        "code": 9,
        "key": "sms_key_jaipur",
        "keypass": "wrong_password_xyz"
    }
    resp = client.post("/auth/login", json=payload_wrong_pass)
    data = resp.json()
    assert_test(data.get("code") == 110, "Expected Code 110 for 'incorrect keypass but true key'")
    assert_test(data.get("token") is None, "Token must be None when keypass is wrong")

    # Scenario C: Non-existent Key -> Code 200 (UNAUTH)
    payload_fake_key = {
        "code": 9,
        "key": "non_existent_hospital_key",
        "keypass": "some_password"
    }
    resp = client.post("/auth/login", json=payload_fake_key)
    data = resp.json()
    assert_test(data.get("code") == 200, "Expected Code 200 UNAUTH for non-existent hospital key")

    # ---------------------------------------------------------
    # TEST 3: Traffic Admin Authentication (Code 8)
    # ---------------------------------------------------------
    print("\n--- Testing Traffic Admin Auth (Role Code 8) ---")

    # Scenario A: Valid Key + Valid Keypass -> Code 100
    admin_valid = {
        "code": 8,
        "key": "jaipur_traffic_hq_admin",
        "keypass": "jaipur_traffic_pass_2026"
    }
    resp = client.post("/auth/login", json=admin_valid)
    data = resp.json()
    assert_test(data.get("code") == 100, "Expected Code 100 for authenticated Traffic Admin")
    assert_test(data.get("role") == "traffic_admin", "Expected role 'traffic_admin'")
    assert_test(bool(data.get("token")), "Admin receives valid JWT token")
    admin_jwt = data.get("token")

    # Scenario B: Valid Key + Wrong Keypass -> Code 110
    admin_wrong_pass = {
        "code": 8,
        "key": "jaipur_traffic_hq_admin",
        "keypass": "incorrect_admin_pass"
    }
    resp = client.post("/auth/login", json=admin_wrong_pass)
    data = resp.json()
    assert_test(data.get("code") == 110, "Expected Code 110 for admin with wrong pass")

    # Scenario C: Non-existent Key -> Code 200 (UNAUTH)
    admin_fake_key = {
        "code": 8,
        "key": "fake_admin_key",
        "keypass": "dummy_pass"
    }
    resp = client.post("/auth/login", json=admin_fake_key)
    data = resp.json()
    assert_test(data.get("code") == 200, "Expected Code 200 UNAUTH for non-existent admin key")

    # ---------------------------------------------------------
    # TEST 4: Invalid Role Code (e.g. 5, 7) -> Code 200
    # ---------------------------------------------------------
    print("\n--- Testing Invalid Role Codes ---")
    resp = client.post("/auth/login", json={"code": 7, "key": "sms_key_jaipur", "keypass": "sms_pass_2026"})
    data = resp.json()
    assert_test(data.get("code") == 200, "Expected Code 200 UNAUTH for unknown role code (7)")

    # ---------------------------------------------------------
    # TEST 5: JWT Token Verification
    # ---------------------------------------------------------
    print("\n--- Testing JWT Token Verification ---")
    resp = client.post("/auth/verify", json={"token": hospital_jwt})
    data = resp.json()
    assert_test(data.get("valid") is True, "Hospital JWT is verified as valid")
    assert_test(data["payload"]["role"] == "hospital", "JWT payload contains correct role")

    resp_fake = client.post("/auth/verify", json={"token": "invalid.jwt.token.string"})
    data_fake = resp_fake.json()
    assert_test(data_fake.get("valid") is False, "Invalid token correctly rejected")

    # ---------------------------------------------------------
    # TEST 6: Lightweight /hospitals Endpoint
    # ---------------------------------------------------------
    print("\n--- Testing /hospitals (Lightweight Index) ---")
    resp = client.get("/hospitals")
    assert_test(resp.status_code == 200, "GET /hospitals returns 200")
    hospitals = resp.json()
    assert_test(isinstance(hospitals, list) and len(hospitals) >= 10, f"Found {len(hospitals)} hospitals")
    first = hospitals[0]
    assert_test("key" in first and "name" in first and "detail_url" in first, "List items contain lightweight summary keys")
    assert_test("coordinates" not in first, "Lightweight list avoids heavy nested data like raw coordinates")

    # ---------------------------------------------------------
    # TEST 7: Deep Hospital Profile /hospitals/{key}
    # ---------------------------------------------------------
    print("\n--- Testing Deep Hospital Profile /hospitals/sms_hospital ---")
    resp = client.get("/hospitals/sms_hospital")
    assert_test(resp.status_code == 200, "GET /hospitals/sms_hospital returns 200")
    sms = resp.json()
    assert_test(sms["name"] == "Sawai Man Singh (SMS) Hospital", "Correct hospital name returned")
    assert_test("coordinates" in sms, "Hospital profile includes coordinates")
    assert_test(sms["coordinates"]["latitude"] == 26.8978, "Correct latitude for SMS Hospital")
    assert_test("contact_details" in sms, "Hospital profile includes contact details")
    assert_test("facilities" in sms and sms["facilities"]["green_corridor_certified"] is True, "Green corridor readiness present")

    # 404 test for non-existent hospital
    resp_404 = client.get("/hospitals/non_existent_hospital")
    assert_test(resp_404.status_code == 404, "Unknown hospital returns 404 Not Found")

    # ---------------------------------------------------------
    # TEST 8: Ambulance Fleet Overview /hospitals/{key}/cars
    # ---------------------------------------------------------
    print("\n--- Testing Ambulance Fleet Overview ---")
    resp = client.get("/hospitals/sms_hospital/cars")
    assert_test(resp.status_code == 200, "GET /hospitals/sms_hospital/cars returns 200")
    fleet = resp.json()
    assert_test(fleet["total_cars"] > 0, "Fleet contains ambulances")
    assert_test(fleet["in_service_count"] > 0, "Fleet contains in-service ambulances")
    assert_test(fleet["out_service_count"] > 0, "Fleet contains out-service ambulances")

    # ---------------------------------------------------------
    # TEST 9: In-Service Ambulances (/in-service)
    # ---------------------------------------------------------
    print("\n--- Testing In-Service Ambulances ---")
    resp = client.get("/hospitals/sms_hospital/cars/in-service")
    assert_test(resp.status_code == 200, "GET /hospitals/sms_hospital/cars/in-service returns 200")
    in_service = resp.json()
    assert_test(len(in_service) >= 1, "At least 1 in-service car returned")
    car = in_service[0]
    assert_test("carkey" in car and len(car["carkey"]) > 20, "Car has secure encrypted carkey")
    assert_test("car_info" in car and "type" in car["car_info"], "Car has car_info specifications")
    assert_test("driver_info" in car and car["driver_info"] is not None, "In-service car has active driver_info")
    assert_test("current_location" in car, "In-service car has live current_location")

    # ---------------------------------------------------------
    # TEST 10: Out-of-Service Ambulances (/out-service)
    # ---------------------------------------------------------
    print("\n--- Testing Out-of-Service Ambulances ---")
    resp = client.get("/hospitals/sms_hospital/cars/out-service")
    assert_test(resp.status_code == 200, "GET /hospitals/sms_hospital/cars/out-service returns 200")
    out_service = resp.json()
    assert_test(len(out_service) >= 1, "At least 1 out-service car returned")
    assert_test(out_service[0]["status"] == "out-service", "Status is out-service")

    # ---------------------------------------------------------
    # TEST 11: Direct URL Nested Access /hospitals/{key}/cars/{car_id}
    # ---------------------------------------------------------
    print("\n--- Testing Direct Nested Car Access by ID ---")
    car_id = in_service[0]["car_id"]
    resp = client.get(f"/hospitals/sms_hospital/cars/{car_id}")
    assert_test(resp.status_code == 200, f"GET /hospitals/sms_hospital/cars/{car_id} returns 200")
    direct_car = resp.json()
    assert_test(direct_car["car_id"] == car_id, "Direct car lookup matches requested car_id")
    target_carkey = direct_car["carkey"]

    # ---------------------------------------------------------
    # TEST 12: POST Telemetry with carkey Verification
    # ---------------------------------------------------------
    print("\n--- Testing POST Telemetry with carkey ---")
    telemetry_payload = {
        "carkey": target_carkey,
        "latitude": 26.9015,
        "longitude": 75.8202,
        "speed_kmh": 45.0,
        "status": "in-service"
    }
    resp = client.post(f"/hospitals/sms_hospital/cars/{car_id}/telemetry", json=telemetry_payload)
    assert_test(resp.status_code == 200, "POST telemetry with valid carkey succeeds (200)")

    # Test invalid carkey rejection
    bad_telemetry = telemetry_payload.copy()
    bad_telemetry["carkey"] = "invalid_fraudulent_key"
    resp_bad = client.post(f"/hospitals/sms_hospital/cars/{car_id}/telemetry", json=bad_telemetry)
    assert_test(resp_bad.status_code == 401, "POST telemetry with invalid carkey rejected (401)")

    # ---------------------------------------------------------
    # TEST 13: Emergency Clearance Lifecycle (Page-to-Backend-to-Page)
    # ---------------------------------------------------------
    print("\n--- Testing Emergency Clearance Lifecycle ---")
    clearance_payload = {
        "hospital_key": "sms_hospital",
        "hospital_name": "Sawai Man Singh (SMS) Hospital",
        "ambulance_id": "AMB-SMS-01",
        "vehicle_type": "ALS",
        "driver_name": "Rajesh Meena",
        "severity": "code-red",
        "patient_vitals": "SpO2 85%, Pulse 130 bpm",
        "location": "Vaishali Nagar Amrapali Circle",
        "destination_hospital_key": "sms_hospital",
        "route_key": "optimal",
        "route_name": "JLN Marg Corridor",
        "eta": "7 min"
    }
    resp = client.post("/clearance/request", json=clearance_payload)
    assert_test(resp.status_code == 201, "POST /clearance/request returns 201 Created")
    created_req = resp.json()
    new_req_id = created_req["id"]
    assert_test(created_req["status"] == "pending", "Initial clearance status is pending")

    # List clearance requests
    resp_list = client.get("/clearance/requests")
    assert_test(resp_list.status_code == 200, "GET /clearance/requests returns 200")
    all_reqs = resp_list.json()
    assert_test(any(r["id"] == new_req_id for r in all_reqs), "Created clearance request exists in queue")

    # Grant clearance (Admin Command)
    resp_grant = client.post(f"/clearance/{new_req_id}/grant", json={"notes": "Traffic police clear all 4 intersections"})
    assert_test(resp_grant.status_code == 200, "POST /clearance/{id}/grant returns 200")
    granted_data = resp_grant.json()
    assert_test(granted_data["status"] == "granted", "Clearance status updated to granted")

    # Override route (Admin Command)
    resp_override = client.post(f"/clearance/{new_req_id}/override", json={
        "new_route_key": "alt-b",
        "new_route_name": "B2 Bypass Emergency Green Wave",
        "reason": "Avoid construction on Tonk Road"
    })
    assert_test(resp_override.status_code == 200, "POST /clearance/{id}/override returns 200")
    override_data = resp_override.json()
    assert_test(override_data["route_key"] == "alt-b", "Route key successfully updated to alt-b")

    # Single clearance status lookup
    resp_status = client.get(f"/clearance/{new_req_id}/status")
    assert_test(resp_status.status_code == 200, "GET /clearance/{id}/status returns 200")

    # ---------------------------------------------------------
    # TEST 14: Live Fleet Telemetry Stream
    # ---------------------------------------------------------
    print("\n--- Testing Live Telemetry Stream ---")
    resp_tel = client.get("/telemetry/live")
    assert_test(resp_tel.status_code == 200, "GET /telemetry/live returns 200")
    live_fleet = resp_tel.json()
    assert_test(len(live_fleet) >= 1, "Live fleet contains telemetry reporting ambulances")

    # ---------------------------------------------------------
    # TEST 15: Ambulance Driver Authentication
    # ---------------------------------------------------------
    print("\n--- Testing Driver Authentication ---")
    driver_login_payload = {
        "id": "driver.rajesh",
        "password": "Ambulance@123"
    }
    resp_drv = client.post("/auth/driver/login", json=driver_login_payload)
    assert_test(resp_drv.status_code == 200, "POST /auth/driver/login returns 200")
    drv_data = resp_drv.json()
    assert_test(drv_data.get("token") is not None, "Driver receives JWT session token")
    assert_test(drv_data.get("profile", {}).get("ambulanceId") == "AMB-SMS-01", "Driver assigned to SMS Ambulance")

    # Test bad driver password
    bad_drv = client.post("/auth/driver/login", json={"id": "driver.rajesh", "password": "wrong"})
    assert_test(bad_drv.status_code == 401, "Bad driver password rejected with 401")

    # ---------------------------------------------------------
    # TEST 16: OSRM Routing Engine & Jaipur Grid Fallback
    # ---------------------------------------------------------
    print("\n--- Testing Routing & ETA Calculation ---")
    resp_route = client.get("/routing/route?start_lat=26.9045&start_lon=75.7590&dest_lat=26.8978&dest_lon=75.8156&mode=emergency")
    assert_test(resp_route.status_code == 200, "GET /routing/route returns 200")
    route_data = resp_route.json()
    assert_test(len(route_data.get("coordinates", [])) > 2, "Route returns polyline coordinates array")
    assert_test(route_data.get("distance_km", 0) > 0, "Route calculates positive distance in km")
    assert_test("eta" in route_data, "Route calculates ETA string")
    assert_test(route_data.get("green_wave_active") is True, "Emergency mode activates green wave preemption")

    # ---------------------------------------------------------
    # TEST 17: Dynamic Hospital Registration
    # ---------------------------------------------------------
    print("\n--- Testing Hospital Facility Registration ---")
    reg_payload = {
        "name": "Jaipur City Heart Institute",
        "license_id": "RAJ-HOSP-2026-9912",
        "zone": "Central Jaipur",
        "password": "Heart@Jaipur2026"
    }
    resp_reg = client.post("/auth/register-hospital", json=reg_payload)
    assert_test(resp_reg.status_code == 200, "POST /auth/register-hospital returns 200")
    reg_data = resp_reg.json()
    assert_test("hospital_key" in reg_data, "Registration returns hospital key slug")

    # ---------------------------------------------------------
    # FINAL RESULTS SUMMARY
    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print("=" * 60)
    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
