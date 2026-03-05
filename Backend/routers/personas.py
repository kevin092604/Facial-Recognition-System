from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from passlib.context import CryptContext

from database import get_db
from models import Persona, Estudiante, Empleado
from schemas import PersonaCreate, PersonaResponse, LoginRequest

router = APIRouter(prefix="/personas", tags=["personas"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _find_persona(db: Session, identifier: str) -> Persona | None:
    """
    Busca una persona por NumeroCuenta o NumeroEmpleado.
    """
    est = db.query(Estudiante).filter(Estudiante.NumeroCuenta == identifier).first()
    if est:
        return est.persona

    emp = db.query(Empleado).filter(Empleado.NumeroEmpleado == identifier).first()
    if emp:
        return emp.persona

    return None


# ── POST /personas/login ─────────────────────────────────────────────────────

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Autenticación de estudiantes y empleados.
    El campo 'dni' acepta NumeroCuenta o NumeroEmpleado.
    """
    persona = _find_persona(db, request.dni)

    if not persona or not persona.Password or not pwd_context.verify(request.password, persona.Password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    return {
        "Id_persona": persona.Id_persona,
        "Nombre": persona.Nombre,
        "Apellido": persona.Apellido,
        "Telefono": persona.Telefono,
    }


# ── GET /personas ────────────────────────────────────────────────────────────

@router.get("", response_model=List[PersonaResponse])
def get_all_personas(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return db.query(Persona).offset(skip).limit(limit).all()


# ── POST /personas ───────────────────────────────────────────────────────────

@router.post("", response_model=PersonaResponse, status_code=201)
def create_persona(body: PersonaCreate, db: Session = Depends(get_db)):
    """
    Crea una persona nueva.
    """
    hashed = pwd_context.hash(body.Password) if body.Password else None

    db_persona = Persona(
        Nombre=body.Nombre,
        Apellido=body.Apellido,
Telefono=body.Telefono,
        Password=hashed,
    )
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona


# ── GET /personas/{identifier} ───────────────────────────────────────────────

@router.get("/{identifier}", response_model=PersonaResponse)
def get_persona(identifier: str, db: Session = Depends(get_db)):
    """
    Busca una persona por NumeroCuenta o NumeroEmpleado.
    """
    persona = _find_persona(db, identifier)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    return persona
