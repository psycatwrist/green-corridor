"""
Pydantic schemas for Jaipur Hospitals and Ambulance (Car) Fleet.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class HospitalSummary(BaseModel):
    """
    Lightweight summary model for the /hospitals index.
    Keeps the main list lightweight so clients can query fast.
    """
    key: str = Field(..., description="Unique key slug of the hospital")
    name: str = Field(..., description="Full legal name of the hospital")
    estd: int = Field(..., description="Year established")
    zone: str = Field(..., description="Jaipur Municipal/Traffic zone")
    trauma_level: Optional[str] = Field(None, description="Trauma care level, e.g., Level 1, Level 2")
    detail_url: str = Field(..., description="Relative API URL to fetch full hospital details")


class ContactDetails(BaseModel):
    """Hospital communication contacts."""
    emergency_helpline: str
    reception_phone: str
    ambulance_direct: str
    email: str
    website: Optional[str] = None


class Coordinates(BaseModel):
    """Geographic GPS coordinates."""
    latitude: float
    longitude: float


class Address(BaseModel):
    """Physical address information."""
    street: str
    locality: str
    city: str = "Jaipur"
    state: str = "Rajasthan"
    pin_code: str
    landmark: Optional[str] = None


class Facilities(BaseModel):
    """Medical facilities and green corridor readiness."""
    emergency_24x7: bool = True
    total_beds: int
    icu_beds_count: int
    blood_bank: bool
    organ_transplant_unit: bool
    cardiac_catheterization_lab: bool
    green_corridor_certified: bool


class HospitalDetail(BaseModel):
    """Full nested hospital profile returned at /hospitals/{key}."""
    key: str
    name: str
    estd: int
    overview: str
    contact_details: ContactDetails
    address: Address
    coordinates: Coordinates
    facilities: Facilities
    cars_endpoint: str = Field(..., description="API URL to access this hospital's ambulance fleet")


class DriverInfo(BaseModel):
    """Information regarding the ambulance driver/rider."""
    driver_id: str
    name: str
    phone: str
    license_number: str
    blood_group: Optional[str] = None
    shift: str
    experience_years: int


class CarInfo(BaseModel):
    """Ambulance hardware specifications and life support capabilities."""
    vehicle_number: str
    make_model: str
    type: str  # e.g., "ALS" (Advanced Life Support) or "BLS" (Basic Life Support)
    equipment: List[str]
    fuel_level_percent: Optional[int] = 100
    oxygen_tank_level_percent: Optional[int] = 100


class AmbulanceLocation(BaseModel):
    """Current live GPS telemetry of the ambulance."""
    latitude: float
    longitude: float
    last_ping: str
    speed_kmh: Optional[float] = 0.0


class Car(BaseModel):
    """
    Nested ambulance data structure.
    Contains secret carkey for car authentication, driver info, and vehicle specs.
    """
    car_id: str
    carkey: str = Field(..., description="Secret special encrypted key unique for each car")
    status: str = Field(..., description="'in-service' or 'out-service'")
    car_info: CarInfo
    driver_info: Optional[DriverInfo] = None
    current_location: AmbulanceLocation


class CarFleetResponse(BaseModel):
    """Overall ambulance fleet summary for a hospital."""
    hospital_key: str
    hospital_name: str
    total_cars: int
    in_service_count: int
    out_service_count: int
    in_service: List[Car]
    out_service: List[Car]
