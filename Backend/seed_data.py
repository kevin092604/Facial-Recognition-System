"""
seed_data.py - Inserta datos de prueba en la base de datos.

Uso:
    python seed_data.py

Usuarios creados:
  Estudiantes (sin contraseña, acceso solo por reconocimiento facial):
    NumeroCuenta: 20191001234
    NumeroCuenta: 20201005678

  Empleados (contraseña: 1234):
    NumeroEmpleado: EMP-001
    NumeroEmpleado: EMP-002
"""

import sys
import os

# Añadir directorio raíz al path
sys.path.insert(0, os.path.dirname(__file__))

from passlib.context import CryptContext
from database import SessionLocal, engine, Base
from models import Persona, Estudiante, Empleado

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEFAULT_PASSWORD = "1234"

PERSONAS = [
    {
        "Nombre":   "Carlos",
        "Apellido": "Martinez",
        "Telefono": "99887766",
        "rol":      "estudiante",
        "extra":    {"NumeroCuenta": "20191001234"},
    },
    {
        "Nombre":   "Maria",
        "Apellido": "Lopez",
        "Telefono": "88776655",
        "rol":      "estudiante",
        "extra":    {"NumeroCuenta": "20201005678"},
    },
    {
        "Nombre":   "Jose",
        "Apellido": "Hernandez",
        "Telefono": "77665544",
        "rol":      "empleado",
        "extra":    {"NumeroEmpleado": "EMP-001"},
    },
    {
        "Nombre":   "Ana",
        "Apellido": "Rodriguez",
        "Telefono": "66554433",
        "rol":      "empleado",
        "extra":    {"NumeroEmpleado": "EMP-002"},
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    hashed = pwd_context.hash(DEFAULT_PASSWORD)
    inserted = 0

    try:
        for p in PERSONAS:
            # Verificar si ya existe por NumeroCuenta o NumeroEmpleado
            if p["rol"] == "estudiante":
                nc = p["extra"]["NumeroCuenta"]
                if db.query(Estudiante).filter(Estudiante.NumeroCuenta == nc).first():
                    print(f"  [SKIP] Estudiante {p['Nombre']} {p['Apellido']} ({nc}) ya existe.")
                    continue
            elif p["rol"] == "empleado":
                ne = p["extra"]["NumeroEmpleado"]
                if db.query(Empleado).filter(Empleado.NumeroEmpleado == ne).first():
                    print(f"  [SKIP] Empleado {p['Nombre']} {p['Apellido']} ({ne}) ya existe.")
                    continue

            persona = Persona(
                Nombre=p["Nombre"],
                Apellido=p["Apellido"],
                Telefono=p["Telefono"],
                Password=hashed if p["rol"] == "empleado" else None,
            )
            db.add(persona)
            db.flush()
            print(f"  [OK] Persona creada: {p['Nombre']} {p['Apellido']}")
            inserted += 1

            # Crear rol asociado
            if p["rol"] == "estudiante":
                nc = p["extra"]["NumeroCuenta"]
                db.add(Estudiante(
                    Id_persona=persona.Id_persona,
                    NumeroCuenta=nc,
                    CentroUniversitario="Ciudad Universitaria",
                ))
                print(f"       → Estudiante: {nc}")

            elif p["rol"] == "empleado":
                ne = p["extra"]["NumeroEmpleado"]
                db.add(Empleado(
                    Id_persona=persona.Id_persona,
                    NumeroEmpleado=ne,
                ))
                print(f"       → Empleado: {ne}")

        db.commit()
        print(f"\n✅ Seed completado. {inserted} personas nuevas insertadas.")
        print(f"   Contraseña de empleados de prueba: {DEFAULT_PASSWORD}")
        print(f"   Estudiantes: sin contraseña (acceso por reconocimiento facial)")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error durante seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=== Seed de datos de prueba ===\n")
    seed()
