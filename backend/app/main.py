"""InsightBoard API — FastAPI + SQLite. Auto-seeds demo data on first run."""
from __future__ import annotations

import os

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from . import analytics, seed, store

app = FastAPI(title="InsightBoard API", version="1.0.0", description="Sales analytics: ingest, aggregate, export.")

origins = os.environ.get("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if origins.strip() == "*" else [o.strip() for o in origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    store.init_db()
    if store.count() == 0:
        store.replace_orders(seed.generate())


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "orders": store.count(), "demo": True}


@app.get("/api/summary")
def get_summary(date_from: str | None = Query(None, alias="from"), date_to: str | None = Query(None, alias="to")) -> dict:
    return analytics.summary(date_from, date_to)


@app.get("/api/orders")
def get_orders(
    date_from: str | None = Query(None, alias="from"),
    date_to: str | None = Query(None, alias="to"),
    limit: int = Query(100, le=1000),
    offset: int = 0,
) -> dict:
    rows = store.fetch_orders(date_from, date_to)
    return {"total": len(rows), "orders": rows[offset : offset + limit]}


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)) -> dict:
    content = await file.read()
    try:
        rows, skipped = analytics.parse_upload(content, file.filename or "upload.csv")
    except Exception as e:  # noqa: BLE001 — surface a friendly message to the client
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}") from e
    if not rows:
        raise HTTPException(status_code=400, detail="No usable rows found in the file.")
    loaded = store.replace_orders(rows)
    return {"loaded": loaded, "skipped": skipped, "filename": file.filename}


@app.post("/api/reset")
def reset() -> dict:
    loaded = store.replace_orders(seed.generate())
    return {"reset": True, "loaded": loaded, "label": seed.SEED_LABEL}


@app.get("/api/export/csv")
def export_csv(date_from: str | None = Query(None, alias="from"), date_to: str | None = Query(None, alias="to")):
    data = analytics.export_csv(date_from, date_to)
    return Response(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=insightboard-orders.csv"},
    )


@app.get("/api/export/xlsx")
def export_xlsx(date_from: str | None = Query(None, alias="from"), date_to: str | None = Query(None, alias="to")):
    data = analytics.export_xlsx(date_from, date_to)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=insightboard-orders.xlsx"},
    )
