from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Marca, Modelo
from schemas import MarcaResponse, ModeloResponse

router = APIRouter(prefix="/referencias", tags=["referencias"])


@router.get("/marcas", response_model=List[MarcaResponse])
def get_marcas(db: Session = Depends(get_db)):
    return db.query(Marca).order_by(Marca.Marca).all()


@router.get("/modelos/{id_marca}", response_model=List[ModeloResponse])
def get_modelos_by_marca(id_marca: int, db: Session = Depends(get_db)):
    return db.query(Modelo).filter(Modelo.Id_marca == id_marca).all()
