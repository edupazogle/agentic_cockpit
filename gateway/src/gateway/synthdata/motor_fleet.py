"""Motor-fleet synthetic data factory — telematics, vehicles, body shops, golden cases.

Generates deterministic seeded data so every run is reproducible for audit.
"""

import hashlib
import json
import random
from dataclasses import dataclass, field
from pathlib import Path

SEED = 42
DATA_DIR = Path(__file__).resolve().parent / "output"


@dataclass
class TelematicsPacket:
    packet_id: str
    vehicle_id: str
    timestamp: str
    gps_lat: float
    gps_lon: float
    speed_kmh: int
    acceleration_g: float
    brake_force: float
    engine_rpm: int
    fuel_level_pct: int
    odometer_km: int


@dataclass
class VehicleRecord:
    vehicle_id: str
    vin: str
    make: str
    model: str
    year: int
    policy_number: str
    policyholder: str
    coverage_type: str
    insured_value_eur: int


@dataclass
class BodyShop:
    shop_id: str
    name: str
    address: str
    lat: float
    lon: float
    rating: float
    specialties: list[str] = field(default_factory=list)
    capacity: int = 5
    avg_repair_days: int = 7


@dataclass
class GoldenEvalCase:
    case_id: str
    input_text: str
    expected_category: str
    expected_severity: str
    telematics_ref: str
    regulatory_requirements: list[str] = field(default_factory=list)


MAKES_MODELS = [
    ("Renault", ["Clio", "Megane", "Captur"]),
    ("Peugeot", ["208", "308", "3008"]),
    ("Citroen", ["C3", "C4", "Berlingo"]),
    ("Volkswagen", ["Golf", "Polo", "Tiguan"]),
    ("BMW", ["320i", "X3", "530d"]),
    ("Mercedes", ["C220", "GLC", "E300"]),
    ("Audi", ["A3", "Q5", "A6"]),
    ("Toyota", ["Yaris", "Corolla", "RAV4"]),
    ("Ford", ["Fiesta", "Focus", "Kuga"]),
    ("Opel", ["Corsa", "Astra", "Grandland"]),
]

BODY_SHOP_NAMES = [
    "Carrosserie Lyon Sud", "Garage du Centre", "Auto Réparation Express",
    "Carrosserie Moderne", "Garage Bellecour", "Centre Auto Part-Dieu",
    "Répar'Auto", "Garage des Alpes", "Carrosserie Rhône",
    "Auto Service Gerland", "Garage Saint-Jean", "Carrosserie de la Tête d'Or",
    "Speedy Lyon Est", "Feu Vert Réparation", "Norauto Lyon",
    "Midas Croix-Rousse", "Garage du Parc", "Auto Confluence",
    "Carrosserie Vénissieux", "Garage des Brotteaux", "Réparation Premium",
    "Garage Vaise", "Carrosserie Villeurbanne", "Centre Auto Oullins",
    "Garage Caluire",
]


def _seed(prefix: str) -> random.Random:
    rng = random.Random(SEED)
    rng.seed(hashlib.sha256(f"{prefix}:{SEED}".encode()).digest())
    return rng


def generate_telematics(count: int = 50) -> list[TelematicsPacket]:
    rng = _seed("telematics")
    packets = []
    for i in range(count):
        lat = 45.75 + rng.uniform(-0.15, 0.15)
        lon = 4.85 + rng.uniform(-0.15, 0.15)
        packets.append(TelematicsPacket(
            packet_id=f"TELE-{i + 1:04d}",
            vehicle_id=f"VEH-{rng.randint(1, 30):04d}",
            timestamp=f"2026-05-{(i % 28) + 1:02d}T{rng.randint(6, 22):02d}:{rng.randint(0, 59):02d}:00Z",
            gps_lat=round(lat, 6),
            gps_lon=round(lon, 6),
            speed_kmh=rng.randint(0, 130),
            acceleration_g=round(rng.uniform(-0.5, 0.8), 3),
            brake_force=round(rng.uniform(0, 1), 3),
            engine_rpm=rng.randint(800, 4500),
            fuel_level_pct=rng.randint(10, 100),
            odometer_km=rng.randint(5000, 180000),
        ))
    return packets


def generate_vehicles(count: int = 30) -> list[VehicleRecord]:
    rng = _seed("vehicles")
    vehicles = []
    for i in range(count):
        make, models = rng.choice(MAKES_MODELS)
        model = rng.choice(models)
        year = rng.randint(2018, 2026)
        vehicles.append(VehicleRecord(
            vehicle_id=f"VEH-{i + 1:04d}",
            vin=f"VF{rng.randint(10, 99)}{rng.randint(100, 999)}{rng.randint(100000, 999999)}",
            make=make,
            model=model,
            year=year,
            policy_number=f"AXA-MOTOR-{rng.randint(10000, 99999)}",
            policyholder=f"Policyholder {i + 1}",
            coverage_type=rng.choice(["Full", "Third-party + fire", "Third-party only"]),
            insured_value_eur=rng.choice([8000, 12000, 18000, 25000, 35000, 50000]),
        ))
    return vehicles


def generate_body_shops(count: int = 25) -> list[BodyShop]:
    rng = _seed("bodyshops")
    shops = []
    names = rng.sample(BODY_SHOP_NAMES, min(count, len(BODY_SHOP_NAMES)))
    for i in range(count):
        name = names[i] if i < len(names) else f"Body Shop {i + 1}"
        shops.append(BodyShop(
            shop_id=f"SHOP-{i + 1:04d}",
            name=name,
            address=f"{rng.randint(1, 200)} Rue de Lyon, {rng.choice(['69001','69002','69003','69004','69006'])} Lyon",
            lat=round(45.75 + rng.uniform(-0.1, 0.1), 6),
            lon=round(4.85 + rng.uniform(-0.1, 0.1), 6),
            rating=round(rng.uniform(3.2, 5.0), 1),
            specialties=rng.sample(
                ["collision", "painting", "glass", "frame", "electrical", "mechanical"],
                k=rng.randint(2, 4),
            ),
            capacity=rng.randint(3, 12),
            avg_repair_days=rng.randint(3, 21),
        ))
    return shops


def generate_golden_cases(count: int = 20) -> list[GoldenEvalCase]:
    rng = _seed("golden")
    categories = ["collision", "theft", "vandalism", "mechanical-failure", "natural-disaster"]
    severities = ["low", "medium", "high", "critical"]
    cases = []
    for i in range(count):
        cat = categories[i % len(categories)]
        sev = severities[i % len(severities)]
        cases.append(GoldenEvalCase(
            case_id=f"MF-GOLDEN-{i + 1:03d}",
            input_text=f"[{cat}] Motor claim {i + 1}. Telematics shows vehicle impact at "
                       f"{rng.randint(30, 90)} km/h. {rng.choice(['Airbag deployed', 'No airbag'])}. "
                       f"Location: Lyon {rng.randint(1, 9)}e arrondissement.",
            expected_category=cat,
            expected_severity=sev,
            telematics_ref=f"TELE-{rng.randint(1, 50):04d}",
            regulatory_requirements=(
                ["RGPD Art. 22", "EU AI Act Art. 50"] if sev in ("high", "critical")
                else ["RGPD Art. 22"] if sev == "medium"
                else []
            ),
        ))
    return cases


def write_all() -> dict:
    """Generate and write all synthetic data to disk. Returns summary."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    telematics = generate_telematics(50)
    vehicles = generate_vehicles(30)
    body_shops = generate_body_shops(25)
    golden = generate_golden_cases(20)

    def to_dict(obj: object) -> dict:
        return obj.__dict__ if hasattr(obj, "__dict__") else {}

    datasets = {
        "telematics": [to_dict(t) for t in telematics],
        "vehicles": [to_dict(v) for v in vehicles],
        "body_shops": [to_dict(b) for b in body_shops],
        "golden_cases": [to_dict(g) for g in golden],
    }

    for name, data in datasets.items():
        path = DATA_DIR / f"motor_fleet_{name}.json"
        path.write_text(json.dumps(data, indent=2))

    return {
        "telematics_count": len(telematics),
        "vehicle_count": len(vehicles),
        "body_shop_count": len(body_shops),
        "golden_case_count": len(golden),
        "output_dir": str(DATA_DIR),
        "seed": SEED,
    }


if __name__ == "__main__":
    summary = write_all()
    print(json.dumps(summary, indent=2))
