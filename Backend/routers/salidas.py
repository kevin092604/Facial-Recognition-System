from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Salida, Persona
from schemas import SalidaCreate, SalidaResponse

router = APIRouter(prefix="/salidas", tags=["salidas"])


@router.post("", response_model=SalidaResponse, status_code=201)
def create_salida(body: SalidaCreate, db: Session = Depends(get_db)):
    persona = db.query(Persona).filter(Persona.Id_persona == body.Id_persona).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    now = datetime.now()

    db_salida = Salida(
        Id_persona=body.Id_persona,
        Fecha=now.date(),
        Hora=now.time().replace(microsecond=0),
    )
    db.add(db_salida)
    db.commit()
    db.refresh(db_salida)
    return db_salida
