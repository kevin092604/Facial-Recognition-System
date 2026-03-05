from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from sqlalchemy.orm import joinedload

from database import get_db
from models import Persona, Estudiante, Empleado, Ingreso
import face_service
import embedding_cache

router = APIRouter(prefix="/reconocer", tags=["reconocimiento"])


class ReconocerRequest(BaseModel):
    FotoBase64: str
    Tipo: str = "Peatonal"


@router.post("")
def reconocer_persona(body: ReconocerRequest, db: Session = Depends(get_db)):
    from embedding_cache import EstadoCache
    estado = embedding_cache.estado()
    if estado == EstadoCache.VACIA:
        raise HTTPException(status_code=404, detail="No hay rostros enrolados en el sistema")

    # Extraer embedding de la foto
    embedding = face_service.get_face_embedding(body.FotoBase64)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No se detectó ningún rostro en la imagen")

    # FAISS listo → búsqueda en memoria (~5ms)
    # FAISS cargando → fallback SQL Server (lento pero funcional)
    if estado == EstadoCache.LISTA:
        id_persona, similitud = embedding_cache.buscar(embedding)
    else:
        id_persona, similitud = embedding_cache.buscar_en_db(embedding, db)

    if similitud < face_service.SIMILARITY_THRESHOLD:
        raise HTTPException(
            status_code=403,
            detail=f"Rostro no reconocido (similitud: {round(similitud, 4)})"
        )

    # Obtener datos de la persona con estudiante/empleado en un solo query
    persona: Persona = (
        db.query(Persona)
        .options(joinedload(Persona.estudiante), joinedload(Persona.empleado))
        .filter(Persona.Id_persona == id_persona)
        .first()
    )
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    estudiante = persona.estudiante
    empleado   = persona.empleado

    if estudiante:
        tipo_usuario = "Estudiante"
        identificador = estudiante.NumeroCuenta
    elif empleado:
        tipo_usuario = "Empleado"
        identificador = empleado.NumeroEmpleado
    else:
        tipo_usuario = "Persona"
        identificador = str(persona.Id_persona)

    # Registrar ingreso automáticamente
    now = datetime.now()
    ingreso = Ingreso(
        Id_persona=id_persona,
        Tipo=body.Tipo,
        Motivo="Reconocimiento facial automático",
        Fecha=now.date(),
        Hora=now.time().replace(microsecond=0),
    )
    db.add(ingreso)
    db.commit()
    db.refresh(ingreso)

    return {
        "autorizado": True,
        "similitud": round(similitud, 4),
        "persona": {
            "Id_persona": persona.Id_persona,
            "Nombre": persona.Nombre,
            "Apellido": persona.Apellido,
            "tipo_usuario": tipo_usuario,
            "identificador": identificador,
        },
        "ingreso_registrado": ingreso.Id_ingreso,
    }
