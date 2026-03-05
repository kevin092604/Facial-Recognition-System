"""
UNAH Access Control - Backend API
FastAPI + InsightFace + SQL Server

Arrancar con:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
from routers import personas, estudiantes, empleados, ingresos, salidas, visitas, vehiculos, referencias, reconocimiento, enrolamiento
import embedding_cache

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("[Startup] Tablas verificadas/creadas.")
    import face_service
    face_service._init_insightface()
    embedding_cache.cargar_en_segundo_plano(SessionLocal)
    yield
    print("[Shutdown] Servidor detenido.")


app = FastAPI(
    title="UNAH Access Control API",
    description="Sistema de Control de Acceso - Universidad Nacional Autónoma de Honduras",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
_default_origins = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
cors_origins = os.getenv("CORS_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(personas.router)
app.include_router(estudiantes.router)
app.include_router(empleados.router)
app.include_router(ingresos.router)
app.include_router(salidas.router)
app.include_router(visitas.router)
app.include_router(vehiculos.router)
app.include_router(referencias.router)
app.include_router(reconocimiento.router)
app.include_router(enrolamiento.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
def root():
    return {
        "app": "UNAH Access Control API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
