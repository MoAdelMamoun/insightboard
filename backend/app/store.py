"""SQLite persistence for orders (stdlib sqlite3 — no ORM needed)."""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from typing import Iterable

DB_PATH = os.environ.get("DATABASE_PATH", "insightboard.db")

COLUMNS = ["id", "date", "customer", "category", "region", "product", "quantity", "unit_price", "revenue", "status"]


@contextmanager
def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with _conn() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT,
                date TEXT NOT NULL,
                customer TEXT,
                category TEXT,
                region TEXT,
                product TEXT,
                quantity INTEGER,
                unit_price REAL,
                revenue REAL,
                status TEXT
            )
            """
        )
        c.execute("CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date)")


def count() -> int:
    with _conn() as c:
        return c.execute("SELECT COUNT(*) AS n FROM orders").fetchone()["n"]


def replace_orders(rows: Iterable[dict]) -> int:
    rows = list(rows)
    with _conn() as c:
        c.execute("DELETE FROM orders")
        c.executemany(
            f"INSERT INTO orders ({', '.join(COLUMNS)}) VALUES ({', '.join('?' for _ in COLUMNS)})",
            [tuple(r.get(col) for col in COLUMNS) for r in rows],
        )
    return len(rows)


def fetch_orders(date_from: str | None = None, date_to: str | None = None) -> list[dict]:
    clauses, params = [], []
    if date_from:
        clauses.append("date >= ?")
        params.append(date_from)
    if date_to:
        clauses.append("date <= ?")
        params.append(date_to)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with _conn() as c:
        rows = c.execute(f"SELECT {', '.join(COLUMNS)} FROM orders {where} ORDER BY date", params).fetchall()
    return [dict(r) for r in rows]


def bounds() -> tuple[str, str]:
    with _conn() as c:
        row = c.execute("SELECT MIN(date) AS lo, MAX(date) AS hi FROM orders").fetchone()
    return (row["lo"] or "2025-01-01", row["hi"] or "2025-12-31")
