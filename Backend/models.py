from sqlalchemy import Column, Integer, String, Date, Time, Text, LargeBinary, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from database import Base


class Persona(Base):
    __tablename__ = "Personas"

    Id_persona = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Nombre = Column(String(100), nullable=False)
    Apellido = Column(String(100), nullable=False)
    Telefono = Column(String(20), nullable=True)
    Password = Column(String(255), nullable=True)

    estudiante = relationship("Estudiante", back_populates="persona", uselist=False)
    empleado = relationship("Empleado", back_populates="persona", uselist=False)
    ingresos = relationship("Ingreso", back_populates="persona")
    salidas = relationship("Salida", back_populates="persona")
    visitas = relationship("Visita", back_populates="persona")
    vehiculos = relationship("Vehiculo", back_populates="persona")
    embeddings = relationship("FaceEmbedding", back_populates="persona")


class Estudiante(Base):
    __tablename__ = "Estudiantes"

    Id_estudiante = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Id_persona = Column(Integer, ForeignKey("Personas.Id_persona"), nullable=False)
    NumeroCuenta = Column(String(50), nullable=False, unique=True, index=True)
    CentroUniversitario = Column(String(100), nullable=True)

    persona = relationship("Persona", back_populates="estudiante")


class Empleado(Base):
    __tablename__ = "Empleados"

    Id_empleado = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Id_persona = Column(Integer, ForeignKey("Personas.Id_persona"), nullable=False)
    NumeroEmpleado = Column(String(50), nullable=False, unique=True, index=True)

    persona = relationship("Persona", back_populates="empleado")


class Marca(Base):
    __tablename__ = "Marcas"

    Id_marca = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Marca = Column(String(50), nullable=False)

    modelos = relationship("Modelo", back_populates="marca")


class Modelo(Base):
    __tablename__ = "Modelos"

    Id_modelo = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Id_marca = Column(Integer, ForeignKey("Marcas.Id_marca"), nullable=False)
    Modelo = Column(String(100), nullable=False)

    marca = relationship("Marca", back_populates="modelos")
    vehiculos = relationship("Vehiculo", back_populates="modelo")


class Vehiculo(Base):
    __tablename__ = "Vehiculos"

    Id_vehiculo = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Id_persona = Column(Integer, ForeignKey("Personas.Id_persona"), nullable=False)
    Id_modelo = Column(Integer, ForeignKey("Modelos.Id_modelo"), nullable=False)
    Matricula = Column(String(20), nullable=False)
    Color = Column(String(30), nullable=True)
    Ano = Column(Integer, nullable=True)

    persona = relationship("Persona", back_populates="vehiculos")
    modelo = relationship("Modelo", back_populates="vehiculos")


class Ingreso(Base):
    __tablename__ = "Ingresos"

    Id_ingreso = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Id_persona = Column(Integer, ForeignKey("Personas.Id_persona"), nullable=False)
    Tipo = Column(String(20), nullable=False)
    Motivo = Column(String(500), nullable=True)
    Periodo = Column(Integer, nullable=True)
    TipoPeriodo = Column(String(20), nullable=True)
    Fecha = Column(Date, nullable=False)
    Hora = Column(Time, nullable=False)

    persona = relationship("Persona", back_populates="ingresos")


class Salida(Base):
    __tablename__ = "Salidas"

    Id_salida = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Id_persona = Column(Integer, ForeignKey("Personas.Id_persona"), nullable=False)
    Fecha = Column(Date, nullable=False)
    Hora = Column(Time, nullable=False)

    persona = relationship("Persona", back_populates="salidas")


class Visita(Base):
    __tablename__ = "Visitas"

    Id_visita = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Id_persona = Column(Integer, ForeignKey("Personas.Id_persona"), nullable=False)
    TipoVisita = Column(String(100), nullable=False)
    Motivo = Column(Text, nullable=False)
    Telefono = Column(String(20), nullable=True)

    persona = relationship("Persona", back_populates="visitas")


class FaceEmbedding(Base):
    __tablename__ = "FaceEmbeddings"

    Id_embedding = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Id_persona = Column(Integer, ForeignKey("Personas.Id_persona"), nullable=False, unique=True)
    Embedding = Column(LargeBinary, nullable=False)
    FechaCreacion = Column(DateTime, default=func.now(), nullable=False)

    persona = relationship("Persona", back_populates="embeddings")
