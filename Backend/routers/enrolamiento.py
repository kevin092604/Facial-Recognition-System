from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import FaceEmbedding, Persona, Estudiante, Empleado
import face_service
import embedding_cache

router = APIRouter(prefix="/enrolar", tags=["enrolamiento"])


class EnrolarRequest(BaseModel):
    identificador: str   # NumeroCuenta o NumeroEmpleado
    FotoBase64: str


@router.post("")
def enrolar_persona(body: EnrolarRequest, db: Session = Depends(get_db)):
    # Buscar persona por NumeroCuenta o NumeroEmpleado
    estudiante = db.query(Estudiante).filter(
        Estudiante.NumeroCuenta == body.identificador
    ).first()

    empleado = None
    if not estudiante:
        empleado = db.query(Empleado).filter(
            Empleado.NumeroEmpleado == body.identificador
        ).first()

    if not estudiante and not empleado:
        raise HTTPException(
            status_code=404,
            detail="No se encontró ningún estudiante o empleado con ese identificador"
        )

    id_persona = estudiante.Id_persona if estudiante else empleado.Id_persona
    persona: Persona = db.query(Persona).filter(Persona.Id_persona == id_persona).first()

    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    # Extraer embedding de la foto
    embedding = face_service.get_face_embedding(body.FotoBase64)
    if embedding is None:
        raise HTTPException(
            status_code=400,
            detail="No se detectó ningún rostro en la imagen. Asegúrese de que el rostro esté bien iluminado y centrado."
        )

    # Guardar o actualizar el embedding
    existente = db.query(FaceEmbedding).filter(
        FaceEmbedding.Id_persona == id_persona
    ).first()

    if existente:
        # Verificar que la nueva foto corresponde a la misma persona
        stored_emb = face_service.bytes_to_embedding(existente.Embedding)
        similitud = face_service.compare_embeddings(embedding, stored_emb)

        if similitud < face_service.SIMILARITY_THRESHOLD:
            raise HTTPException(
                status_code=403,
                detail=f"La foto no corresponde a la persona enrolada previamente (similitud: {round(similitud, 4)}). "
                       f"Asegúrese de que sea la misma persona."
            )

        # Borrar el registro viejo y guardar el nuevo en binario
        db.delete(existente)
        db.flush()
        nuevo = FaceEmbedding(
            Id_persona=id_persona,
            Embedding=face_service.embedding_to_bytes(embedding),
        )
        db.add(nuevo)
        mensaje = f"Embedding actualizado correctamente (similitud verificada: {round(similitud, 4)})"
    else:
        nuevo = FaceEmbedding(
            Id_persona=id_persona,
            Embedding=face_service.embedding_to_bytes(embedding),
        )
        db.add(nuevo)
        mensaje = "Persona enrolada correctamente"

    db.commit()

    # Actualizar caché en memoria
    embedding_cache.agregar(id_persona, embedding)

    tipo_usuario = "Estudiante" if estudiante else "Empleado"
    identificador_label = estudiante.NumeroCuenta if estudiante else empleado.NumeroEmpleado

    return {
        "enrolado": True,
        "mensaje": mensaje,
        "persona": {
            "Id_persona": persona.Id_persona,
            "Nombre": persona.Nombre,
            "Apellido": persona.Apellido,
            "tipo_usuario": tipo_usuario,
            "identificador": identificador_label,
        },
    }


@router.get("/buscar/{identificador}")
def buscar_persona(identificador: str, db: Session = Depends(get_db)):
    """Busca un estudiante o empleado por su número de cuenta o número de empleado."""
    estudiante = db.query(Estudiante).filter(
        Estudiante.NumeroCuenta == identificador
    ).first()

    empleado = None
    if not estudiante:
        empleado = db.query(Empleado).filter(
            Empleado.NumeroEmpleado == identificador
        ).first()

    if not estudiante and not empleado:
        raise HTTPException(status_code=404, detail="No se encontró ningún estudiante o empleado")

    id_persona = estudiante.Id_persona if estudiante else empleado.Id_persona
    persona: Persona = db.query(Persona).filter(Persona.Id_persona == id_persona).first()

    tiene_embedding = db.query(FaceEmbedding).filter(
        FaceEmbedding.Id_persona == id_persona
    ).first() is not None

    tipo_usuario = "Estudiante" if estudiante else "Empleado"
    identificador_label = estudiante.NumeroCuenta if estudiante else empleado.NumeroEmpleado

    return {
        "Id_persona": persona.Id_persona,
        "Nombre": persona.Nombre,
        "Apellido": persona.Apellido,
        "tipo_usuario": tipo_usuario,
        "identificador": identificador_label,
        "ya_enrolado": tiene_embedding,
    }
