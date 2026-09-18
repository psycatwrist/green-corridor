"""
Data Generator Script for Fox Backend
Populates data/auth, data/hospitals, and data/cars with comprehensive Jaipur hospital data.
"""
import os
import json
import hashlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
AUTH_DIR = DATA_DIR / "auth"
HOSPITALS_DIR = DATA_DIR / "hospitals"
CARS_DIR = DATA_DIR / "cars"

for d in [AUTH_DIR, HOSPITALS_DIR, CARS_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def sha256_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# --------------------------------------------------------------------------
# 1. AUTH DATA
# --------------------------------------------------------------------------
hospitals_auth_data = {
    "hospitals": [
        {
            "key": "sms_key_jaipur",
            "keypass_hash": sha256_hash("sms_pass_2026"),
            "raw_keypass_for_reference": "sms_pass_2026",
            "hospital_key": "sms_hospital",
            "hospital_name": "Sawai Man Singh (SMS) Hospital",
            "is_active": True
        },
        {
            "key": "fortis_key_jaipur",
            "keypass_hash": sha256_hash("fortis_pass_2026"),
            "raw_keypass_for_reference": "fortis_pass_2026",
            "hospital_key": "fortis_escorts",
            "hospital_name": "Fortis Escorts Hospital",
            "is_active": True
        },
        {
            "key": "ehcc_key_jaipur",
            "keypass_hash": sha256_hash("ehcc_pass_2026"),
            "raw_keypass_for_reference": "ehcc_pass_2026",
            "hospital_key": "ehcc_hospital",
            "hospital_name": "Eternal Hospital (EHCC)",
            "is_active": True
        },
        {
            "key": "narayana_key_jaipur",
            "keypass_hash": sha256_hash("narayana_pass_2026"),
            "raw_keypass_for_reference": "narayana_pass_2026",
            "hospital_key": "narayana_hospital",
            "hospital_name": "Narayana Multispeciality Hospital",
            "is_active": True
        },
        {
            "key": "manipal_key_jaipur",
            "keypass_hash": sha256_hash("manipal_pass_2026"),
            "raw_keypass_for_reference": "manipal_pass_2026",
            "hospital_key": "manipal_hospital",
            "hospital_name": "Manipal Hospital Jaipur",
            "is_active": True
        },
        {
            "key": "sdmh_key_jaipur",
            "keypass_hash": sha256_hash("sdmh_pass_2026"),
            "raw_keypass_for_reference": "sdmh_pass_2026",
            "hospital_key": "sdmh_hospital",
            "hospital_name": "Santokba Durlabhji Memorial Hospital",
            "is_active": True
        },
        {
            "key": "ckbirla_key_jaipur",
            "keypass_hash": sha256_hash("ckbirla_pass_2026"),
            "raw_keypass_for_reference": "ckbirla_pass_2026",
            "hospital_key": "ck_birla_hospital",
            "hospital_name": "Rukmani Birla Hospital (CK Birla)",
            "is_active": True
        },
        {
            "key": "mgmch_key_jaipur",
            "keypass_hash": sha256_hash("mgmch_pass_2026"),
            "raw_keypass_for_reference": "mgmch_pass_2026",
            "hospital_key": "mahatma_gandhi_hospital",
            "hospital_name": "Mahatma Gandhi Hospital & Medical College",
            "is_active": True
        },
        {
            "key": "apex_key_jaipur",
            "keypass_hash": sha256_hash("apex_pass_2026"),
            "raw_keypass_for_reference": "apex_pass_2026",
            "hospital_key": "apex_hospital",
            "hospital_name": "Apex Hospital Malviya Nagar",
            "is_active": True
        },
        {
            "key": "shalby_key_jaipur",
            "keypass_hash": sha256_hash("shalby_pass_2026"),
            "raw_keypass_for_reference": "shalby_pass_2026",
            "hospital_key": "shalby_hospital",
            "hospital_name": "Shalby Multispeciality Hospital",
            "is_active": True
        },
        {
            "key": "bmchrc_key_jaipur",
            "keypass_hash": sha256_hash("bmchrc_pass_2026"),
            "raw_keypass_for_reference": "bmchrc_pass_2026",
            "hospital_key": "bmchrc_hospital",
            "hospital_name": "Bhagwan Mahaveer Cancer Hospital & Research Centre",
            "is_active": True
        },
        {
            "key": "metromas_key_jaipur",
            "keypass_hash": sha256_hash("metromas_pass_2026"),
            "raw_keypass_for_reference": "metromas_pass_2026",
            "hospital_key": "metro_mas_hospital",
            "hospital_name": "Metro MAS Hospital",
            "is_active": True
        }
    ]
}

admins_auth_data = {
    "traffic_admins": [
        {
            "key": "jaipur_traffic_hq_admin",
            "keypass_hash": sha256_hash("jaipur_traffic_pass_2026"),
            "raw_keypass_for_reference": "jaipur_traffic_pass_2026",
            "admin_id": "ADM-JPR-HQ-01",
            "name": "Jaipur Police Traffic Control Headquarters (Yadgar, Ajmeri Gate)",
            "jurisdiction": "Jaipur Urban Police Commissionerate",
            "is_active": True
        },
        {
            "key": "green_corridor_dispatch_admin",
            "keypass_hash": sha256_hash("corridor_pass_2026"),
            "raw_keypass_for_reference": "corridor_pass_2026",
            "admin_id": "ADM-JPR-GC-02",
            "name": "Jaipur Green Corridor Emergency Dispatch Unit",
            "jurisdiction": "All Jaipur Emergency Medical Corridors",
            "is_active": True
        },
        {
            "key": "south_zone_traffic_admin",
            "keypass_hash": sha256_hash("south_traffic_pass_2026"),
            "raw_keypass_for_reference": "south_traffic_pass_2026",
            "admin_id": "ADM-JPR-SOUTH-03",
            "name": "South Zone Traffic Command (Malviya Nagar & Sanganer)",
            "jurisdiction": "South Jaipur & Airport Corridor",
            "is_active": True
        }
    ]
}

with open(AUTH_DIR / "hospitals_auth.json", "w", encoding="utf-8") as f:
    json.dump(hospitals_auth_data, f, indent=2)

with open(AUTH_DIR / "admins_auth.json", "w", encoding="utf-8") as f:
    json.dump(admins_auth_data, f, indent=2)

print("Auth JSON files written.")

# --------------------------------------------------------------------------
# 2. HOSPITALS MASTER DATA (JAIPUR)
# --------------------------------------------------------------------------
hospitals = [
    {
        "key": "sms_hospital",
        "name": "Sawai Man Singh (SMS) Hospital",
        "estd": 1947,
        "zone": "Central Jaipur",
        "trauma_level": "Level 1 Apex Trauma Centre",
        "overview": "Sawai Man Singh Hospital is the largest premier government hospital and medical college in Rajasthan, with over 3,200 beds, multi-organ transplant capabilities, and the premier state trauma centre.",
        "contact_details": {
            "emergency_helpline": "+91-141-2560291",
            "reception_phone": "+91-141-2518224",
            "ambulance_direct": "108",
            "email": "ms.smsh.jaipur@rajasthan.gov.in",
            "website": "https://medicaleducation.rajasthan.gov.in/smsmedicalcollege"
        },
        "address": {
            "street": "Jawahar Lal Nehru Marg, Ashok Nagar",
            "locality": "C-Scheme",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302004",
            "landmark": "Near SMS Medical College & Birla Mandir"
        },
        "coordinates": {
            "latitude": 26.8978,
            "longitude": 75.8156
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 3250,
            "icu_beds_count": 380,
            "blood_bank": True,
            "organ_transplant_unit": True,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    },
    {
        "key": "fortis_escorts",
        "name": "Fortis Escorts Hospital",
        "estd": 2007,
        "zone": "South Jaipur",
        "trauma_level": "Level 1 Quaternary Centre",
        "overview": "Fortis Escorts Hospital Jaipur is a premier 275-bed multi-super-speciality hospital JCI and NABH accredited, known for pioneering complex cardiac surgeries, neuro-trauma, and organ transplants.",
        "contact_details": {
            "emergency_helpline": "+91-141-2547000",
            "reception_phone": "+91-141-4097000",
            "ambulance_direct": "+91-141-2547108",
            "email": "contactus.jaipur@fortishealthcare.com",
            "website": "https://www.fortishealthcare.com/location/fortis-escorts-hospital-jaipur"
        },
        "address": {
            "street": "Jawahar Lal Nehru Marg, Malviya Nagar",
            "locality": "Malviya Nagar",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302017",
            "landmark": "Opposite OTS, Near Jawahar Circle"
        },
        "coordinates": {
            "latitude": 26.8524,
            "longitude": 75.8079
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 275,
            "icu_beds_count": 85,
            "blood_bank": True,
            "organ_transplant_unit": True,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    },
    {
        "key": "ehcc_hospital",
        "name": "Eternal Hospital (EHCC)",
        "estd": 2013,
        "zone": "South Jaipur",
        "trauma_level": "Level 1 Quaternary Centre",
        "overview": "Eternal Heart Care Centre and Research Institute is a leading state-of-the-art quaternary care hospital in Jawahar Circle, renowned for heart transplants, complex cardiac interventions, and green corridor protocols.",
        "contact_details": {
            "emergency_helpline": "+91-141-5174000",
            "reception_phone": "+91-141-5174001",
            "ambulance_direct": "+91-9549158888",
            "email": "contact@eternalhospital.com",
            "website": "https://www.eternalhospital.com"
        },
        "address": {
            "street": "3 A, Jagatpura Road, Near Jawahar Circle",
            "locality": "Chainpura, Malviya Nagar",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302017",
            "landmark": "Adjacent to Jawahar Circle Garden"
        },
        "coordinates": {
            "latitude": 26.8385,
            "longitude": 75.8038
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 250,
            "icu_beds_count": 72,
            "blood_bank": True,
            "organ_transplant_unit": True,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    },
    {
        "key": "narayana_hospital",
        "name": "Narayana Multispeciality Hospital",
        "estd": 2011,
        "zone": "South-East Jaipur",
        "trauma_level": "Level 2 Superspeciality Centre",
        "overview": "Narayana Multispeciality Hospital Jaipur offers comprehensive care in cardiac sciences, neurosciences, renal sciences, and orthopaedics, serving southern Jaipur and Tonk Road regions.",
        "contact_details": {
            "emergency_helpline": "+91-141-7122222",
            "reception_phone": "+91-141-7122000",
            "ambulance_direct": "+91-141-7122108",
            "email": "info.jaipur@narayanahealth.org",
            "website": "https://www.narayanahealth.org"
        },
        "address": {
            "street": "Sector 28, Kumbha Marg, Pratap Nagar",
            "locality": "Sanganer",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302033",
            "landmark": "Near Pratap Nagar Housing Board"
        },
        "coordinates": {
            "latitude": 26.8042,
            "longitude": 75.8219
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 330,
            "icu_beds_count": 68,
            "blood_bank": True,
            "organ_transplant_unit": True,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    },
    {
        "key": "manipal_hospital",
        "name": "Manipal Hospital Jaipur",
        "estd": 2014,
        "zone": "North Jaipur",
        "trauma_level": "Level 1 Superspeciality Centre",
        "overview": "Manipal Hospital Jaipur is a 225-bed tertiary care healthcare destination in Vidhyadhar Nagar offering comprehensive multispeciality critical and surgical care with NABH accreditation.",
        "contact_details": {
            "emergency_helpline": "+91-141-5164000",
            "reception_phone": "+91-141-5164001",
            "ambulance_direct": "+91-141-5164108",
            "email": "info.jaipur@manipalhospitals.com",
            "website": "https://www.manipalhospitals.com/jaipur/"
        },
        "address": {
            "street": "Sector 5, Main Sikar Road",
            "locality": "Vidhyadhar Nagar",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302039",
            "landmark": "Near Alka Cinema, Sikar Road"
        },
        "coordinates": {
            "latitude": 26.9632,
            "longitude": 75.7725
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 225,
            "icu_beds_count": 55,
            "blood_bank": True,
            "organ_transplant_unit": True,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    },
    {
        "key": "sdmh_hospital",
        "name": "Santokba Durlabhji Memorial Hospital (SDMH)",
        "estd": 1971,
        "zone": "Central Jaipur",
        "trauma_level": "Level 1 Multidisciplinary Hospital",
        "overview": "SDMH is a reputed non-profit multidisciplinary private trust hospital in Bapu Nagar providing comprehensive medical, pediatric, cardiac, and oncological treatments across 450 beds.",
        "contact_details": {
            "emergency_helpline": "+91-141-2566251",
            "reception_phone": "+91-141-2566252",
            "ambulance_direct": "+91-141-2566258",
            "email": "sdmhjaipur@gmail.com",
            "website": "https://www.sdmh.in"
        },
        "address": {
            "street": "Bhawani Singh Road, Near Rambagh Circle",
            "locality": "Bapu Nagar",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302015",
            "landmark": "Near SMS Stadium and Rambagh Palace"
        },
        "coordinates": {
            "latitude": 26.8942,
            "longitude": 75.8041
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 450,
            "icu_beds_count": 90,
            "blood_bank": True,
            "organ_transplant_unit": True,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    },
    {
        "key": "ck_birla_hospital",
        "name": "Rukmani Birla Hospital (CK Birla)",
        "estd": 2016,
        "zone": "South Jaipur",
        "trauma_level": "Level 2 Tertiary Centre",
        "overview": "Rukmani Birla Hospital by CK Birla Healthcare is a 100-bed modern multi-speciality tertiary care hospital located conveniently along the Gopalpura Bypass in South Jaipur.",
        "contact_details": {
            "emergency_helpline": "+91-141-3093333",
            "reception_phone": "+91-141-3093300",
            "ambulance_direct": "+91-141-3093108",
            "email": "info.rbh@ckbirlahospitals.com",
            "website": "https://www.rbh.ckbirlahospitals.com"
        },
        "address": {
            "street": "Gopalpura Bypass Road, Near Triveni Flyover",
            "locality": "Shanti Nagar, Surya Nagar",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302018",
            "landmark": "Near Triveni Nagar Flyover"
        },
        "coordinates": {
            "latitude": 26.8665,
            "longitude": 75.7834
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 120,
            "icu_beds_count": 30,
            "blood_bank": True,
            "organ_transplant_unit": False,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    },
    {
        "key": "mahatma_gandhi_hospital",
        "name": "Mahatma Gandhi Hospital & Medical College",
        "estd": 2000,
        "zone": "South Jaipur (Sitapura)",
        "trauma_level": "Level 1 University Hospital",
        "overview": "Mahatma Gandhi Medical College and Hospital is a major 1,400+ bed academic medical center in the Sitapura Industrial Area, pioneering living donor organ transplants in Rajasthan.",
        "contact_details": {
            "emergency_helpline": "+91-141-2771777",
            "reception_phone": "+91-141-2770677",
            "ambulance_direct": "+91-141-2771108",
            "email": "principal.medical@mgmch.org",
            "website": "https://www.mgmch.org"
        },
        "address": {
            "street": "RIICO Institutional Area, Tonk Road",
            "locality": "Sitapura",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302022",
            "landmark": "Near JECC Jaipur Exhibition & Convention Centre"
        },
        "coordinates": {
            "latitude": 26.7728,
            "longitude": 75.8451
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 1450,
            "icu_beds_count": 180,
            "blood_bank": True,
            "organ_transplant_unit": True,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    },
    {
        "key": "apex_hospital",
        "name": "Apex Hospital Malviya Nagar",
        "estd": 1994,
        "zone": "South Jaipur",
        "trauma_level": "Level 2 Multispeciality Centre",
        "overview": "Apex Hospitals is a leading super-speciality chain in Rajasthan, with its flagship 200-bed unit in Malviya Nagar providing round-the-clock emergency, trauma, and neuro-care.",
        "contact_details": {
            "emergency_helpline": "+91-141-2751871",
            "reception_phone": "+91-141-4101111",
            "ambulance_direct": "+91-141-2751108",
            "email": "contact@apexhospitals.com",
            "website": "https://www.apexhospitals.com"
        },
        "address": {
            "street": "SP-6, Malviya Industrial Area",
            "locality": "Malviya Nagar",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302017",
            "landmark": "Near Apex Circle & Calgiri Marg"
        },
        "coordinates": {
            "latitude": 26.8550,
            "longitude": 75.8242
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 200,
            "icu_beds_count": 45,
            "blood_bank": True,
            "organ_transplant_unit": False,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    },
    {
        "key": "shalby_hospital",
        "name": "Shalby Multispeciality Hospital",
        "estd": 2017,
        "zone": "West Jaipur",
        "trauma_level": "Level 2 Multispeciality Centre",
        "overview": "Shalby Multispeciality Hospital in Vaishali Nagar offers 235 beds with renowned expertise in orthopaedic joint replacement, cardiology, oncology, and comprehensive trauma management.",
        "contact_details": {
            "emergency_helpline": "+91-141-7123888",
            "reception_phone": "+91-141-7123100",
            "ambulance_direct": "+91-141-7123108",
            "email": "info.jaipur@shalby.in",
            "website": "https://www.shalby.org/locations/jaipur-hospital"
        },
        "address": {
            "street": "Underpass Road, Sector 3, Chitrakoot",
            "locality": "Vaishali Nagar",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302021",
            "landmark": "Near Chitrakoot Stadium"
        },
        "coordinates": {
            "latitude": 26.9031,
            "longitude": 75.7352
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 235,
            "icu_beds_count": 50,
            "blood_bank": True,
            "organ_transplant_unit": False,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    },
    {
        "key": "bmchrc_hospital",
        "name": "Bhagwan Mahaveer Cancer Hospital & Research Centre",
        "estd": 1997,
        "zone": "Central Jaipur",
        "trauma_level": "Comprehensive Cancer Institute",
        "overview": "BMCHRC is a premier NABH accredited comprehensive cancer hospital with 300 beds offering advanced surgical, medical, radiation, and pediatric oncology services.",
        "contact_details": {
            "emergency_helpline": "+91-141-2700107",
            "reception_phone": "+91-141-2700108",
            "ambulance_direct": "+91-141-2700109",
            "email": "bmchrc@datainfosys.net",
            "website": "https://www.bmchrc.org"
        },
        "address": {
            "street": "Jawahar Lal Nehru Marg",
            "locality": "Ashok Nagar",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302017",
            "landmark": "Next to World Trade Park (WTP) junction"
        },
        "coordinates": {
            "latitude": 26.8540,
            "longitude": 75.8090
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 300,
            "icu_beds_count": 40,
            "blood_bank": True,
            "organ_transplant_unit": True,
            "cardiac_catheterization_lab": False,
            "green_corridor_certified": True
        }
    },
    {
        "key": "metro_mas_hospital",
        "name": "Metro MAS Hospital",
        "estd": 2012,
        "zone": "South-West Jaipur",
        "trauma_level": "Level 2 Heart & Multispeciality Centre",
        "overview": "Metro MAS Heart & Multispeciality Hospital in Mansarovar is a 220-bed hospital equipped with state-of-the-art cath labs, critical care units, and emergency response teams.",
        "contact_details": {
            "emergency_helpline": "+91-141-6644444",
            "reception_phone": "+91-141-6644400",
            "ambulance_direct": "+91-141-6644108",
            "email": "metro.mas@metrohospitals.com",
            "website": "https://www.metrohospitals.com"
        },
        "address": {
            "street": "Shipra Path, Near Mansarovar Metro Station",
            "locality": "Mansarovar",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pin_code": "302020",
            "landmark": "Near Technology Park, Shipra Path"
        },
        "coordinates": {
            "latitude": 26.8583,
            "longitude": 75.7621
        },
        "facilities": {
            "emergency_24x7": True,
            "total_beds": 220,
            "icu_beds_count": 48,
            "blood_bank": True,
            "organ_transplant_unit": False,
            "cardiac_catheterization_lab": True,
            "green_corridor_certified": True
        }
    }
]

# Write lightweight index.json
index_data = [
    {
        "key": h["key"],
        "name": h["name"],
        "estd": h["estd"],
        "zone": h["zone"],
        "trauma_level": h["trauma_level"],
        "detail_url": f"/hospitals/{h['key']}"
    }
    for h in hospitals
]

with open(HOSPITALS_DIR / "index.json", "w", encoding="utf-8") as f:
    json.dump(index_data, f, indent=2)

print(f"Wrote index.json with {len(index_data)} hospitals.")

# Write individual hospital files
for h in hospitals:
    h_detail = h.copy()
    h_detail["cars_endpoint"] = f"/hospitals/{h['key']}/cars"
    with open(HOSPITALS_DIR / f"{h['key']}.json", "w", encoding="utf-8") as f:
        json.dump(h_detail, f, indent=2)

print(f"Wrote {len(hospitals)} hospital detail JSON files.")

# --------------------------------------------------------------------------
# 3. AMBULANCES / CARS DATA
# --------------------------------------------------------------------------
drivers_pool = [
    {"name": "Rajesh Meena", "phone": "+91-98290-11234", "license": "RJ14-2015-004512", "blood": "B+", "exp": 8},
    {"name": "Mukesh Sharma", "phone": "+91-98290-22345", "license": "RJ14-2012-008921", "blood": "O+", "exp": 12},
    {"name": "Suresh Gurjar", "phone": "+91-98290-33456", "license": "RJ14-2018-001290", "blood": "A+", "exp": 6},
    {"name": "Virendra Singh", "phone": "+91-98290-44567", "license": "RJ14-2010-009943", "blood": "AB+", "exp": 14},
    {"name": "Pawan Kumar", "phone": "+91-98290-55678", "license": "RJ14-2016-003318", "blood": "O-", "exp": 7},
    {"name": "Deepak Verma", "phone": "+91-98290-66789", "license": "RJ14-2019-007721", "blood": "B-", "exp": 5},
    {"name": "Sunil Choudhary", "phone": "+91-98290-77890", "license": "RJ14-2014-006612", "blood": "A-", "exp": 10},
    {"name": "Anil Saini", "phone": "+91-98290-88901", "license": "RJ14-2020-001156", "blood": "O+", "exp": 4},
]

for idx, h in enumerate(hospitals):
    lat = h["coordinates"]["latitude"]
    lon = h["coordinates"]["longitude"]
    key_slug = h["key"].replace("_hospital", "").replace("_", "")

    # Create in-service ambulances (2-3 per hospital)
    in_service_cars = [
        {
            "car_id": f"AMB-{key_slug.upper()}-01",
            "carkey": sha256_hash(f"secure_car_key_{key_slug}_01_secret"),
            "status": "in-service",
            "car_info": {
                "vehicle_number": f"RJ-14-PA-{1000 + idx * 10 + 1}",
                "make_model": "Force Motors Traveller 3350 ALS",
                "type": "ALS",
                "equipment": [
                    "Biphasic Defibrillator with pacing",
                    "Transport ICU Ventilator (Hamilton-T1)",
                    "Multi-para Patient Monitor (SpO2, ECG, NIBP, EtCO2)",
                    "Dual Syringe Infusion Pumps",
                    "Medical Vacuum Suction Unit",
                    "Centralized Oxygen with 2 x D-type cylinders",
                    "Advanced Trauma Spine Board & Cervical Collars"
                ],
                "fuel_level_percent": 92,
                "oxygen_tank_level_percent": 95
            },
            "driver_info": {
                "driver_id": f"DRV-{key_slug.upper()}-01",
                "name": drivers_pool[(idx * 2) % len(drivers_pool)]["name"],
                "phone": drivers_pool[(idx * 2) % len(drivers_pool)]["phone"],
                "license_number": drivers_pool[(idx * 2) % len(drivers_pool)]["license"],
                "blood_group": drivers_pool[(idx * 2) % len(drivers_pool)]["blood"],
                "shift": "Morning (08:00 - 16:00 IST)",
                "experience_years": drivers_pool[(idx * 2) % len(drivers_pool)]["exp"]
            },
            "current_location": {
                "latitude": round(lat + 0.0012, 6),
                "longitude": round(lon + 0.0015, 6),
                "speed_kmh": 0.0,
                "last_ping": "2026-09-18T16:55:00+05:30"
            }
        },
        {
            "car_id": f"AMB-{key_slug.upper()}-02",
            "carkey": sha256_hash(f"secure_car_key_{key_slug}_02_secret"),
            "status": "in-service",
            "car_info": {
                "vehicle_number": f"RJ-14-PA-{1000 + idx * 10 + 2}",
                "make_model": "Tata Winger Ambulance BLS",
                "type": "BLS",
                "equipment": [
                    "Automated External Defibrillator (AED)",
                    "Portable Suction Apparatus",
                    "Oxygen Delivery System (2 x 10L)",
                    "Foldable Wheelchair & Scoop Stretcher",
                    "First Aid & Splints Kit"
                ],
                "fuel_level_percent": 80,
                "oxygen_tank_level_percent": 88
            },
            "driver_info": {
                "driver_id": f"DRV-{key_slug.upper()}-02",
                "name": drivers_pool[(idx * 2 + 1) % len(drivers_pool)]["name"],
                "phone": drivers_pool[(idx * 2 + 1) % len(drivers_pool)]["phone"],
                "license_number": drivers_pool[(idx * 2 + 1) % len(drivers_pool)]["license"],
                "blood_group": drivers_pool[(idx * 2 + 1) % len(drivers_pool)]["blood"],
                "shift": "Rotational Day (08:00 - 20:00 IST)",
                "experience_years": drivers_pool[(idx * 2 + 1) % len(drivers_pool)]["exp"]
            },
            "current_location": {
                "latitude": round(lat - 0.0018, 6),
                "longitude": round(lon - 0.0011, 6),
                "speed_kmh": 24.5,
                "last_ping": "2026-09-18T16:56:12+05:30"
            }
        }
    ]

    # Create out-service ambulances (1 per hospital, under maintenance or off-duty)
    out_service_cars = [
        {
            "car_id": f"AMB-{key_slug.upper()}-03",
            "carkey": sha256_hash(f"secure_car_key_{key_slug}_03_secret"),
            "status": "out-service",
            "car_info": {
                "vehicle_number": f"RJ-14-PA-{1000 + idx * 10 + 3}",
                "make_model": "Force Motors Traveller 3050 ALS",
                "type": "ALS",
                "equipment": [
                    "Defibrillator",
                    "Ventilator (Routine Maintenance)",
                    "Oxygen Cylinder Kit",
                    "Stretcher"
                ],
                "fuel_level_percent": 45,
                "oxygen_tank_level_percent": 30
            },
            "driver_info": None,
            "current_location": {
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "speed_kmh": 0.0,
                "last_ping": "2026-09-18T14:30:00+05:30"
            }
        }
    ]

    car_data = {
        "hospital_key": h["key"],
        "hospital_name": h["name"],
        "total_cars": len(in_service_cars) + len(out_service_cars),
        "in_service_count": len(in_service_cars),
        "out_service_count": len(out_service_cars),
        "in_service": in_service_cars,
        "out_service": out_service_cars
    }

    with open(CARS_DIR / f"{h['key']}_cars.json", "w", encoding="utf-8") as f:
        json.dump(car_data, f, indent=2)

print(f"Wrote {len(hospitals)} ambulance fleet JSON files.")
