"""Aggregation + ingest + export, powered by pandas."""
from __future__ import annotations

import io
from datetime import datetime, timedelta

import pandas as pd

from . import store

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _df(rows: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(rows, columns=store.COLUMNS)
    if not df.empty:
        df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce").fillna(0.0)
        df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0).astype(int)
    return df


def summary(date_from: str | None, date_to: str | None) -> dict:
    lo, hi = store.bounds()
    date_from = date_from or lo
    date_to = date_to or hi

    df = _df(store.fetch_orders(date_from, date_to))
    revenue = float(df["revenue"].sum()) if not df.empty else 0.0
    orders = int(len(df))
    aov = revenue / orders if orders else 0.0

    # Growth vs previous equal-length window.
    span = (datetime.fromisoformat(date_to) - datetime.fromisoformat(date_from)).days
    prev_to = (datetime.fromisoformat(date_from) - timedelta(days=1)).date().isoformat()
    prev_from = (datetime.fromisoformat(prev_to) - timedelta(days=span)).date().isoformat()
    prev_rev = float(_df(store.fetch_orders(prev_from, prev_to))["revenue"].sum())
    growth = ((revenue - prev_rev) / prev_rev * 100) if prev_rev > 0 else None

    # Monthly series
    series = []
    if not df.empty:
        d = df.copy()
        d["ym"] = pd.to_datetime(d["date"]).dt.to_period("M")
        for period, g in sorted(d.groupby("ym"), key=lambda kv: kv[0]):
            ts = period.to_timestamp()
            series.append(
                {"label": f"{MONTHS[ts.month - 1]} {ts.year}", "revenue": float(g["revenue"].sum()), "orders": int(len(g))}
            )

    def breakdown(by: str) -> list[dict]:
        if df.empty:
            return []
        total = revenue or 1.0
        g = df.groupby(by).agg(revenue=("revenue", "sum"), orders=("revenue", "size")).reset_index()
        g = g.sort_values("revenue", ascending=False)
        return [
            {"key": str(row[by]), "revenue": float(row["revenue"]), "orders": int(row["orders"]), "pct": float(row["revenue"]) / total * 100}
            for _, row in g.iterrows()
        ]

    return {
        "range": {"from": date_from, "to": date_to},
        "kpis": {"revenue": revenue, "orders": orders, "avgOrderValue": aov, "growthPct": growth},
        "series": series,
        "categories": breakdown("category"),
        "regions": breakdown("region"),
    }


# ── ingest ────────────────────────────────────────────────────────────────────
_ALIASES = {
    "id": ["id", "order id", "order_id", "order"],
    "date": ["date", "order date", "order_date", "created", "created_at"],
    "customer": ["customer", "client", "customer name", "account"],
    "category": ["category", "cat", "product category"],
    "region": ["region", "area", "territory", "zone"],
    "product": ["product", "item", "sku", "product name"],
    "quantity": ["quantity", "qty", "units", "count"],
    "unit_price": ["unitprice", "unit price", "unit_price", "price", "rate"],
    "revenue": ["revenue", "total", "amount", "sales", "line_total", "line total"],
    "status": ["status", "state"],
}


def _match(df_cols: list[str], aliases: list[str]) -> str | None:
    norm = {c.lower().strip(): c for c in df_cols}
    for a in aliases:
        if a in norm:
            return norm[a]
    return None


def parse_upload(content: bytes, filename: str) -> tuple[list[dict], int]:
    """Returns (rows, skipped). Raises ValueError on an unreadable file."""
    bio = io.BytesIO(content)
    if filename.lower().endswith((".xlsx", ".xls")):
        raw = pd.read_excel(bio)
    else:
        raw = pd.read_csv(bio)
    if raw.empty:
        return [], 0

    cols = list(raw.columns.astype(str))
    cm = {k: _match(cols, v) for k, v in _ALIASES.items()}
    if not cm["date"]:
        raise ValueError("No recognizable 'date' column found.")

    rows, skipped, auto = [], 0, 1
    for _, r in raw.iterrows():
        try:
            d = pd.to_datetime(r[cm["date"]]).date().isoformat()
        except Exception:
            skipped += 1
            continue
        qty = int(pd.to_numeric(r[cm["quantity"]], errors="coerce")) if cm["quantity"] else 1
        qty = qty or 1
        price = float(pd.to_numeric(r[cm["unit_price"]], errors="coerce") or 0) if cm["unit_price"] else 0.0
        status = "refunded" if cm["status"] and "refund" in str(r[cm["status"]]).lower() else "completed"
        if cm["revenue"]:
            revenue = float(pd.to_numeric(r[cm["revenue"]], errors="coerce") or 0)
        else:
            revenue = 0.0 if status == "refunded" else qty * price
        rows.append(
            {
                "id": str(r[cm["id"]]) if cm["id"] and pd.notna(r[cm["id"]]) else f"ROW-{auto}",
                "date": d,
                "customer": str(r[cm["customer"]]) if cm["customer"] else "—",
                "category": str(r[cm["category"]]) if cm["category"] else "Uncategorized",
                "region": str(r[cm["region"]]) if cm["region"] else "Unknown",
                "product": str(r[cm["product"]]) if cm["product"] else "—",
                "quantity": qty,
                "unit_price": price,
                "revenue": revenue,
                "status": status,
            }
        )
        auto += 1
    return rows, skipped


# ── export ──────────────────────────────────────────────────────────────────
def export_csv(date_from: str | None, date_to: str | None) -> bytes:
    df = _df(store.fetch_orders(date_from, date_to))
    return df.to_csv(index=False).encode("utf-8")


def export_xlsx(date_from: str | None, date_to: str | None) -> bytes:
    df = _df(store.fetch_orders(date_from, date_to))
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as xw:
        df.to_excel(xw, index=False, sheet_name="Orders")
    return buf.getvalue()
