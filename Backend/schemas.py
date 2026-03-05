from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime


# ── Personas ────────────────────────────────────────────────────────────────

class PersonaCreate(BaseModel):
    Nombre: str
    Apellido: str
    Telefono: Optional[str] = None
    Password: Optional[str] = None


class PersonaResponse(BaseModel):
    Id_persona: int
    Nombre: str
    Apellido: str
    Telefono: Optional[str] = None

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    dni: str       # puede ser NumeroCuenta o NumeroEmpleado
    password: str


# ── Estudiantes ─────────────────────────────────────────────────────────────

class EstudianteCreate(BaseModel):
    Id_persona: int
    NumeroCuenta: str


class EstudianteResponse(BaseModel):
    Id_estudiante: int
    Id_persona: int
    NumeroCuenta: str
    CentroUniversitario: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Empleados ────────────────────────────────────────────────────────────────

class EmpleadoCreate(BaseModel):
    Id_persona: int
    NumeroEmpleado: str


class EmpleadoResponse(BaseModel):
    Id_empleado: int
    Id_persona: int
    NumeroEmpleado: str

    model_config = {"from_attributes": True}


# ── Ingresos ─────────────────────────────────────────────────────────────────

class IngresoCreate(BaseModel):
    Id_persona: int
    Tipo: str
    Motivo: Optional[str] = None
    Periodo: Optional[int] = None
    TipoPeriodo: Optional[str] = None
    FotoBase64: Optional[str] = None


class IngresoResponse(BaseModel):
    Id_ingreso: int
    Id_persona: int
    Tipo: str
    Motivo: Optional[str] = None
    Periodo: Optional[int] = None
    TipoPeriodo: Optional[str] = None
    Fecha: date
    Hora: time
    Nombre: Optional[str] = None
    Apellido: Optional[str] = None


# ── Salidas ──────────────────────────────────────────────────────────────────

class SalidaCreate(BaseModel):
    Id_persona: int


class SalidaResponse(BaseModel):
    Id_salida: int
    Id_persona: int
    Fecha: date
    Hora: time


# ── Visitas ──────────────────────────────────────────────────────────────────

class VisitaCreate(BaseModel):
    Id_persona: int
    TipoVisita: str
    Motivo: str
    Telefono: Optional[str] = None
    FotoBase64: Optional[str] = None


class VisitaResponse(BaseModel):
    Id_visita: int
    Id_persona: int
    TipoVisita: str
    Motivo: str
    Telefono: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Vehículos ────────────────────────────────────────────────────────────────

class VehiculoCreate(BaseModel):
    Id_modelo: int
    Color: Optional[str] = None
    Ano: Optional[int] = None
    Matricula: str
    Id_persona: int


class VehiculoResponse(BaseModel):
    Id_vehiculo: int
    Id_persona: int
    Id_modelo: int
    Matricula: str
    Color: Optional[str] = None
    Ano: Optional[int] = None

    model_config = {"from_attributes": True}


class VehiculoListResponse(BaseModel):
    Id_vehiculo: int
    Id_persona: int
    Placa: str
    Marca: Optional[str] = None
    Modelo: Optional[str] = None
    Color: Optional[str] = None
    Ano: Optional[int] = None


# ── Referencias ──────────────────────────────────────────────────────────────

class MarcaResponse(BaseModel):
    Id_marca: int
    Marca: str

    model_config = {"from_attributes": True}


class ModeloResponse(BaseModel):
    Id_modelo: int
    Id_marca: int
    Modelo: str

    model_config = {"from_attributes": True}
