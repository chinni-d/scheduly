from contextlib import asynccontextmanager
from datetime import date, time
from typing import Literal, Optional
from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.database import init_db_pool, close_db_pool, get_pool, get_or_init_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_pool()
    yield
    await close_db_pool()


app = FastAPI(
    title="Appointment Board API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Schemas
class AppointmentResponse(BaseModel):
    id: int
    title: str
    description: str = ""
    date: str
    start_time: str
    end_time: str
    status: Literal["Scheduled", "Completed", "Cancelled"]


class AppointmentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = ""
    date: date
    start_time: time
    end_time: time
    status: Literal["Scheduled", "Completed", "Cancelled"] = "Scheduled"


class AppointmentUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = ""
    date: date
    start_time: time
    end_time: time
    status: Optional[Literal["Scheduled", "Completed", "Cancelled"]] = None


class AppointmentStatusUpdate(BaseModel):
    status: Literal["Scheduled", "Completed", "Cancelled"]


# Endpoints Router
router = APIRouter()


@router.get("/health")
@app.get("/health")
async def health():
    pool = await get_or_init_pool()
    return {
        "status": "ok",
        "database": "connected" if pool else "disconnected"
    }


@router.get("/appointments", response_model=list[AppointmentResponse])
async def list_appointments(
    date_filter: Optional[date] = None,
    status_filter: Optional[str] = None
):
    pool = await get_or_init_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database is not connected.")

    async with pool.acquire() as conn:
        query = """
            SELECT id, title, description, date, start_time, end_time, status
            FROM appointments
            WHERE ($1::date IS NULL OR date = $1)
              AND ($2::text IS NULL OR status = $2)
            ORDER BY date ASC, start_time ASC;
        """
        rows = await conn.fetch(query, date_filter, status_filter)

        return [
            AppointmentResponse(
                id=row["id"],
                title=row["title"],
                description=row["description"] or "",
                date=row["date"].isoformat(),
                start_time=row["start_time"].strftime("%H:%M"),
                end_time=row["end_time"].strftime("%H:%M"),
                status=row["status"]
            )
            for row in rows
        ]


@router.post("/appointments", response_model=AppointmentResponse, status_code=201)
async def create_appointment(payload: AppointmentCreate):
    pool = await get_or_init_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database is not connected.")

    # 1. Validate End Time > Start Time
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time.")

    async with pool.acquire() as conn:
        # 2. Prevent Time Conflicts (check overlap with non-cancelled appointments)
        conflict = await conn.fetchrow("""
            SELECT id, title, start_time, end_time
            FROM appointments
            WHERE date = $1
              AND status != 'Cancelled'
              AND start_time < $3
              AND end_time > $2
            LIMIT 1;
        """, payload.date, payload.start_time, payload.end_time)

        if conflict:
            c_title = conflict["title"] or "Existing appointment"
            c_start = conflict["start_time"].strftime("%H:%M")
            c_end = conflict["end_time"].strftime("%H:%M")
            raise HTTPException(
                status_code=409,
                detail=f"Time slot is already occupied by '{c_title}' ({c_start} – {c_end})."
            )

        row = await conn.fetchrow("""
            INSERT INTO appointments (title, description, date, start_time, end_time, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, title, description, date, start_time, end_time, status;
        """, payload.title, payload.description or "", payload.date, payload.start_time, payload.end_time, payload.status)

        if not row:
            raise HTTPException(status_code=500, detail="Failed to create appointment.")

        return AppointmentResponse(
            id=row["id"],
            title=row["title"],
            description=row["description"] or "",
            date=row["date"].isoformat(),
            start_time=row["start_time"].strftime("%H:%M"),
            end_time=row["end_time"].strftime("%H:%M"),
            status=row["status"]
        )


@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: int, payload: AppointmentUpdate):
    pool = await get_or_init_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database is not connected.")

    # 1. Validate End Time > Start Time
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time.")

    async with pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT id, status FROM appointments WHERE id = $1", appointment_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Appointment not found.")

        # 2. Prevent Time Conflicts (check overlap with other non-cancelled appointments, excluding this ID)
        conflict = await conn.fetchrow("""
            SELECT id, title, start_time, end_time
            FROM appointments
            WHERE id != $1
              AND date = $2
              AND status != 'Cancelled'
              AND start_time < $4
              AND end_time > $3
            LIMIT 1;
        """, appointment_id, payload.date, payload.start_time, payload.end_time)

        if conflict:
            c_title = conflict["title"] or "Existing appointment"
            c_start = conflict["start_time"].strftime("%H:%M")
            c_end = conflict["end_time"].strftime("%H:%M")
            raise HTTPException(
                status_code=409,
                detail=f"Time slot is already occupied by '{c_title}' ({c_start} – {c_end})."
            )

        status_to_set = payload.status if payload.status else existing["status"]

        row = await conn.fetchrow("""
            UPDATE appointments
            SET title = $1, description = $2, date = $3, start_time = $4, end_time = $5, status = $6
            WHERE id = $7
            RETURNING id, title, description, date, start_time, end_time, status;
        """, payload.title, payload.description or "", payload.date, payload.start_time, payload.end_time, status_to_set, appointment_id)

        if not row:
            raise HTTPException(status_code=500, detail="Failed to update appointment.")

        return AppointmentResponse(
            id=row["id"],
            title=row["title"],
            description=row["description"] or "",
            date=row["date"].isoformat(),
            start_time=row["start_time"].strftime("%H:%M"),
            end_time=row["end_time"].strftime("%H:%M"),
            status=row["status"]
        )


@router.patch("/appointments/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(appointment_id: int, payload: AppointmentStatusUpdate):
    pool = await get_or_init_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database is not connected.")

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE appointments
            SET status = $1
            WHERE id = $2
            RETURNING id, title, description, date, start_time, end_time, status;
        """, payload.status, appointment_id)

        if not row:
            raise HTTPException(status_code=404, detail="Appointment not found.")

        return AppointmentResponse(
            id=row["id"],
            title=row["title"],
            description=row["description"] or "",
            date=row["date"].isoformat(),
            start_time=row["start_time"].strftime("%H:%M"),
            end_time=row["end_time"].strftime("%H:%M"),
            status=row["status"]
        )


@router.delete("/appointments/{appointment_id}", status_code=204)
async def delete_appointment(appointment_id: int):
    pool = await get_or_init_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database is not connected.")

    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM appointments WHERE id = $1;", appointment_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Appointment not found.")
        return None


# Mount router both with /api prefix and at root (for universal routing on Vercel and local uvicorn)
app.include_router(router, prefix="/api")
app.include_router(router)
