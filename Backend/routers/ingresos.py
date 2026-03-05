from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Ingreso, Persona, FaceEmbedding
from schemas import IngresoCreate, IngresoResponse
import face_service

router = APIRouter(prefix="/ingresos", tags=["ingresos"])


@router.get("", response_model=List[IngresoResponse])
def get_all_ingresos(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    ingresos = (
        db.query(Ingreso)
        .options(joinedload(Ingreso.persona))
        .order_by(Ingreso.Fecha.desc(), Ingreso.Hora.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        IngresoResponse(
            Id_ingreso=ing.Id_ingreso,
            Id_persona=ing.Id_persona,
            Tipo=ing.Tipo,
            Motivo=ing.Motivo,
            Periodo=ing.Periodo,
            TipoPeriodo=ing.TipoPeriodo,
            Fecha=ing.Fecha,
            Hora=ing.Hora,
            Nombre=ing.persona.Nombre if ing.persona else None,
            Apellido=ing.persona.Apellido if ing.persona else None,
        )
        for ing in ingresos
    ]


@router.post("", status_code=201)
def create_ingreso(body: IngresoCreate, db: Session = Depends(get_db)):
    # Verificar que la persona existe
    persona = db.query(Persona).filter(Persona.Id_persona == body.Id_persona).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    now = datetime.now()

    # Verificación facial opcional (solo compara, no crea embeddings)
    face_result = None
    if body.FotoBase64:
        embedding = face_service.get_face_embedding(body.FotoBase64)
        if embedding:
            stored = db.query(FaceEmbedding).filter(
                FaceEmbedding.Id_persona == body.Id_persona
            ).first()
            if stored:
                stored_emb = face_service.bytes_to_embedding(stored.Embedding)
                similarity = face_service.compare_embeddings(embedding, stored_emb)
                face_result = {
                    "verified": similarity >= face_service.SIMILARITY_THRESHOLD,
                    "similarity": round(similarity, 4),
                }

    db_ingreso = Ingreso(
        Id_persona=body.Id_persona,
        Tipo=body.Tipo,
        Motivo=body.Motivo,
        Periodo=body.Periodo,
        TipoPeriodo=body.TipoPeriodo,
        Fecha=now.date(),
        Hora=now.time().replace(microsecond=0),
    )
    db.add(db_ingreso)
    db.commit()
    db.refresh(db_ingreso)

    response = {
        "Id_ingreso": db_ingreso.Id_ingreso,
        "Id_persona": db_ingreso.Id_persona,
        "Tipo": db_ingreso.Tipo,
        "Motivo": db_ingreso.Motivo,
        "Periodo": db_ingreso.Periodo,
        "TipoPeriodo": db_ingreso.TipoPeriodo,
        "Fecha": str(db_ingreso.Fecha),
        "Hora": str(db_ingreso.Hora),
    }
    if face_result:
        response["face_verification"] = face_result

    return response
