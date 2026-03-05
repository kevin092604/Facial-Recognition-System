from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Vehiculo, Persona, Modelo, Marca
from schemas import VehiculoCreate, VehiculoResponse, VehiculoListResponse

router = APIRouter(prefix="/vehiculos", tags=["vehiculos"])


@router.get("", response_model=List[VehiculoListResponse])
def get_all_vehiculos(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    vehiculos = (
        db.query(Vehiculo)
        .options(joinedload(Vehiculo.modelo).joinedload(Modelo.marca))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        VehiculoListResponse(
            Id_vehiculo=veh.Id_vehiculo,
            Id_persona=veh.Id_persona,
            Placa=veh.Matricula,
            Marca=veh.modelo.marca.Marca if veh.modelo and veh.modelo.marca else None,
            Modelo=veh.modelo.Modelo if veh.modelo else None,
            Color=veh.Color,
            Ano=veh.Ano,
        )
        for veh in vehiculos
    ]


@router.post("", response_model=VehiculoResponse, status_code=201)
def create_vehiculo(body: VehiculoCreate, db: Session = Depends(get_db)):
    persona = db.query(Persona).filter(Persona.Id_persona == body.Id_persona).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    modelo = db.query(Modelo).filter(Modelo.Id_modelo == body.Id_modelo).first()
    if not modelo:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")

    db_veh = Vehiculo(
        Id_persona=body.Id_persona,
        Id_modelo=body.Id_modelo,
        Matricula=body.Matricula,
        Color=body.Color,
        Ano=body.Ano,
    )
    db.add(db_veh)
    db.commit()
    db.refresh(db_veh)
    return db_veh
