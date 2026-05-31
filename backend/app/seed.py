"""Deterministic, obviously-fictional demo sales data (mirrors the frontend seed)."""
from __future__ import annotations

import calendar
import random

PRODUCTS = {
    "Apparel": [("Canvas Tote", 24), ("Wool Beanie", 18), ("Linen Shirt", 48), ("Rain Jacket", 96)],
    "Home": [("Stoneware Mug", 16), ("Linen Throw", 68), ("Soy Candle", 22), ("Ceramic Vase", 42)],
    "Electronics": [("USB-C Hub", 39), ("Wireless Mouse", 29), ("Desk Lamp", 54), ("Bluetooth Speaker", 79)],
    "Outdoors": [("Trail Bottle", 21), ("Camp Mug", 16), ("Daypack", 88), ("Picnic Blanket", 58)],
    "Beauty": [("Hand Balm", 12), ("Bar Soap", 9), ("Face Mist", 26), ("Lip Tint", 15)],
}
CATEGORIES = list(PRODUCTS)
REGIONS = ["North", "South", "East", "West"]
CUSTOMERS = [
    "Acme Supply Co.", "Globex Retail", "Initech Goods", "Umbra Mercantile",
    "Vandelay Imports", "Hooli Market", "Pied Piper Shop", "Stark Trading",
    "Wonka Provisions", "Soylent Foods", "Cyberdyne Outlet", "Wayne Bazaar",
]

SEED_LABEL = "Demo dataset — Acme & friends, FY2025"


def generate(seed: int = 20260530) -> list[dict]:
    r = random.Random(seed)
    orders: list[dict] = []
    n = 10000
    for month in range(12):
        base = 28 + month * 2
        cnt = base + r.randint(0, 9)
        days = calendar.monthrange(2025, month + 1)[1]
        for _ in range(cnt):
            day = r.randint(1, days)
            cat = r.choice(CATEGORIES)
            product, price = r.choice(PRODUCTS[cat])
            qty = r.randint(1, 5)
            status = "refunded" if r.random() < 0.05 else "completed"
            revenue = 0 if status == "refunded" else qty * price
            orders.append(
                {
                    "id": f"ORD-{n}",
                    "date": f"2025-{month + 1:02d}-{day:02d}",
                    "customer": r.choice(CUSTOMERS),
                    "category": cat,
                    "region": r.choice(REGIONS),
                    "product": product,
                    "quantity": qty,
                    "unit_price": price,
                    "revenue": revenue,
                    "status": status,
                }
            )
            n += 1
    orders.sort(key=lambda o: o["date"])
    return orders
