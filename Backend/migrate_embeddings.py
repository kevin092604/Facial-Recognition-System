"""
Migración: convierte la columna Embedding de NVARCHAR(MAX) a VARBINARY(MAX)
y re-serializa los embeddings existentes de JSON a binario.

Ejecutar UNA sola vez antes de arrancar el servidor con la nueva versión:
    python migrate_embeddings.py
"""

import sys
from sqlalchemy import text
import numpy as np
import json

from database import engine, SessionLocal


def migrar():
    print("=== Migración de embeddings: JSON → Binario ===\n")

    with engine.connect() as conn:
        # Verificar tipo actual de la columna
        resultado = conn.execute(text("""
            SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'FaceEmbeddings' AND COLUMN_NAME = 'Embedding'
        """)).fetchone()

        if not resultado:
            print("ERROR: Tabla FaceEmbeddings no encontrada.")
            sys.exit(1)

        tipo_actual = resultado[0].upper()
        print(f"Tipo actual de columna: {tipo_actual}")

        if tipo_actual == "VARBINARY":
            print("La columna ya es VARBINARY. No se necesita migración.")
            return

        # 1. Agregar columna temporal binaria
        print("Agregando columna temporal EmbeddingBin...")
        conn.execute(text(
            "ALTER TABLE FaceEmbeddings ADD EmbeddingBin VARBINARY(MAX) NULL"
        ))
        conn.commit()

    # 2. Convertir cada embedding de JSON a binario
    db = SessionLocal()
    try:
        filas = db.execute(
            text("SELECT Id_embedding, Embedding FROM FaceEmbeddings")
        ).fetchall()

        print(f"Convirtiendo {len(filas)} embeddings...")
        convertidos = 0
        errores = 0

        for fila in filas:
            try:
                datos_json = fila[1]
                if isinstance(datos_json, bytes):
                    datos_json = datos_json.decode("utf-8")
                vec = np.array(json.loads(datos_json), dtype=np.float32)
                binario = vec.tobytes()
                db.execute(
                    text("UPDATE FaceEmbeddings SET EmbeddingBin = :b WHERE Id_embedding = :id"),
                    {"b": binario, "id": fila[0]}
                )
                convertidos += 1
            except Exception as e:
                print(f"  Error en Id_embedding={fila[0]}: {e}")
                errores += 1

        db.commit()
        print(f"Convertidos: {convertidos} | Errores: {errores}")
    finally:
        db.close()

    # 3. Reemplazar columna
    with engine.connect() as conn:
        print("Eliminando columna antigua y renombrando la nueva...")
        conn.execute(text("ALTER TABLE FaceEmbeddings DROP COLUMN Embedding"))
        conn.execute(text(
            "EXEC sp_rename 'FaceEmbeddings.EmbeddingBin', 'Embedding', 'COLUMN'"
        ))
        conn.execute(text(
            "ALTER TABLE FaceEmbeddings ALTER COLUMN Embedding VARBINARY(MAX) NOT NULL"
        ))
        conn.commit()

    print("\n=== Migración completada exitosamente ===")
    print("Ahora puedes arrancar el servidor con: uvicorn main:app --reload --port 8000")


if __name__ == "__main__":
    migrar()
