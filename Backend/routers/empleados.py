from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Empleado
from schemas import EmpleadoCreate, EmpleadoResponse

router = APIRouter(prefix="/empleados", tags=["empleados"])


@router.get("/por-persona/{id_persona}", response_model=EmpleadoResponse)
def get_empleado_by_persona(id_persona: int, db: Session = Depends(get_db)):
    emp = db.query(Empleado).filter(Empleado.Id_persona == id_persona).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return emp


@router.post("", response_model=EmpleadoResponse, status_code=201)
def create_empleado(body: EmpleadoCreate, db: Session = Depends(get_db)):
    existing = db.query(Empleado).filter(
        Empleado.NumeroEmpleado == body.NumeroEmpleado
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Empleado con ese NumeroEmpleado ya existe")

    db_emp = Empleado(
        Id_persona=body.Id_persona,
        NumeroEmpleado=body.NumeroEmpleado,
    )
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp
