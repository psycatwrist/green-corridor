"""
Hospital and Ambulance Service
Reads and processes modular JSON data for Jaipur Hospitals and Ambulance fleets.
"""
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.config import HOSPITALS_DATA_DIR, CARS_DATA_DIR


class HospitalService:
    """Handles read operations for hospital metadata and ambulance fleets."""

    @staticmethod
    def _read_json(path: Path) -> Optional[Any]:
        """Utility to safely read JSON from disk."""
        if not path.exists():
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    @classmethod
    def get_all_hospitals_summary(cls) -> List[Dict[str, Any]]:
        """
        Returns lightweight index of all hospitals.
        This prevents /hospitals endpoint from becoming heavy and slow.
        """
        index_file = HOSPITALS_DATA_DIR / "index.json"
        data = cls._read_json(index_file)
        if data is None:
            return []
        return data

    @classmethod
    def get_hospital_detail(cls, hospital_key: str) -> Optional[Dict[str, Any]]:
        """
        Returns full detailed profile of a hospital by its key,
        including coordinates, contacts, address, and facilities.
        """
        detail_file = HOSPITALS_DATA_DIR / f"{hospital_key}.json"
        return cls._read_json(detail_file)

    @classmethod
    def get_hospital_cars(cls, hospital_key: str) -> Optional[Dict[str, Any]]:
        """
        Returns complete ambulance fleet structure for a hospital
        (both in_service and out_service lists).
        """
        cars_file = CARS_DATA_DIR / f"{hospital_key}_cars.json"
        return cls._read_json(cars_file)

    @classmethod
    def get_in_service_cars(cls, hospital_key: str) -> Optional[List[Dict[str, Any]]]:
        """
        Returns currently active and available ambulances for a hospital.
        Contains carkey, car_info, driver_info, and live coordinates.
        """
        fleet = cls.get_hospital_cars(hospital_key)
        if fleet is None:
            return None
        return fleet.get("in_service", [])

    @classmethod
    def get_out_service_cars(cls, hospital_key: str) -> Optional[List[Dict[str, Any]]]:
        """
        Returns out-of-service ambulances for a hospital.
        Contains same nested data structure as in-service cars.
        """
        fleet = cls.get_hospital_cars(hospital_key)
        if fleet is None:
            return None
        return fleet.get("out_service", [])

    @classmethod
    def get_car_by_id(cls, hospital_key: str, car_id: str) -> Optional[Dict[str, Any]]:
        """
        Finds a specific ambulance by its car_id from either
        in_service or out_service fleet.
        """
        fleet = cls.get_hospital_cars(hospital_key)
        if fleet is None:
            return None

        # Search in-service cars
        for car in fleet.get("in_service", []):
            if car.get("car_id").upper() == car_id.upper():
                return car

        # Search out-service cars
        for car in fleet.get("out_service", []):
            if car.get("car_id").upper() == car_id.upper():
                return car

        return None
