from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Visita, Persona, FaceEmbedding
from schemas import VisitaCreate, VisitaResponse, LoginRequest
from routers.personas import pwd_context, _find_persona
import face_service
import embedding_cache

router = APIRouter(prefix="/visitas", tags=["visitas"])


@router.post("/login")
def visita_login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Login alternativo para visitantes.
    Acepta { dni, password }. Busca por NumeroCuenta o NumeroEmpleado.
    """
    persona = _find_persona(db, body.dni)

    if not persona or not persona.Password or not pwd_context.verify(body.password, persona.Password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    return {
        "Id_persona": persona.Id_persona,
        "Nombre": persona.Nombre,
        "Apellido": persona.Apellido,
        "Telefono": persona.Telefono,
    }


@router.post("", response_model=VisitaResponse, status_code=201)
def create_visita(body: VisitaCreate, db: Session = Depends(get_db)):
    persona = db.query(Persona).filter(Persona.Id_persona == body.Id_persona).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    # Procesar y almacenar embedding facial si se envió foto
    if body.FotoBase64:
        embedding = face_service.get_face_embedding(body.FotoBase64)
        if embedding:
            existing_emb = db.query(FaceEmbedding).filter(
                FaceEmbedding.Id_persona == body.Id_persona
            ).first()
            if existing_emb:
                existing_emb.Embedding = face_service.embedding_to_bytes(embedding)
            else:
                db.add(FaceEmbedding(
                    Id_persona=body.Id_persona,
                    Embedding=face_service.embedding_to_bytes(embedding),
                ))
            embedding_cache.agregar(body.Id_persona, embedding)

    db_visita = Visita(
        Id_persona=body.Id_persona,
        TipoVisita=body.TipoVisita,
        Motivo=body.Motivo,
        Telefono=body.Telefono,
    )
    db.add(db_visita)
    db.commit()
    db.refresh(db_visita)
    return db_visita
