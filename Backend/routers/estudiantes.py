from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Estudiante
from schemas import EstudianteCreate, EstudianteResponse

router = APIRouter(prefix="/estudiantes", tags=["estudiantes"])


@router.get("/por-persona/{id_persona}", response_model=EstudianteResponse)
def get_estudiante_by_persona(id_persona: int, db: Session = Depends(get_db)):
    est = db.query(Estudiante).filter(Estudiante.Id_persona == id_persona).first()
    if not est:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return est


@router.post("", response_model=EstudianteResponse, status_code=201)
def create_estudiante(body: EstudianteCreate, db: Session = Depends(get_db)):
    existing = db.query(Estudiante).filter(
        Estudiante.NumeroCuenta == body.NumeroCuenta
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Estudiante con ese NumeroCuenta ya existe")

    db_est = Estudiante(
        Id_persona=body.Id_persona,
        NumeroCuenta=body.NumeroCuenta,
        CentroUniversitario="Ciudad Universitaria",
    )
    db.add(db_est)
    db.commit()
    db.refresh(db_est)
    return db_est
