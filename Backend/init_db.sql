-- ============================================================
-- UNAH Access Control - Script de inicialización de base de datos
-- Ejecutar como administrador en SQL Server Management Studio
-- o con sqlcmd: sqlcmd -S localhost -i init_db.sql
-- ============================================================

USE master;
GO

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'UNAH_AccessControl')
BEGIN
    CREATE DATABASE UNAH_AccessControl;
    PRINT 'Base de datos UNAH_AccessControl creada.';
END
ELSE
    PRINT 'Base de datos UNAH_AccessControl ya existe.';
GO

USE UNAH_AccessControl;
GO

-- ── Personas ─────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Personas' AND type = 'U')
BEGIN
    CREATE TABLE Personas (
        Id_persona      INT IDENTITY(1,1) PRIMARY KEY,
        Nombre          NVARCHAR(100) NOT NULL,
        Apellido        NVARCHAR(100) NOT NULL,
        Telefono        NVARCHAR(20)  NULL,
        Password        NVARCHAR(255) NULL
    );
    PRINT 'Tabla Personas creada.';
END
GO

-- ── Estudiantes ───────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Estudiantes' AND type = 'U')
BEGIN
    CREATE TABLE Estudiantes (
        Id_estudiante       INT IDENTITY(1,1) PRIMARY KEY,
        Id_persona          INT           NOT NULL REFERENCES Personas(Id_persona),
        NumeroCuenta        NVARCHAR(50)  NOT NULL UNIQUE,
        CentroUniversitario NVARCHAR(100) NOT NULL DEFAULT 'Ciudad Universitaria'
    );
    PRINT 'Tabla Estudiantes creada.';
END
GO

-- ── Empleados ─────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Empleados' AND type = 'U')
BEGIN
    CREATE TABLE Empleados (
        Id_empleado     INT IDENTITY(1,1) PRIMARY KEY,
        Id_persona      INT          NOT NULL REFERENCES Personas(Id_persona),
        NumeroEmpleado  NVARCHAR(50) NOT NULL UNIQUE
    );
    PRINT 'Tabla Empleados creada.';
END
GO

-- ── Marcas ────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Marcas' AND type = 'U')
BEGIN
    CREATE TABLE Marcas (
        Id_marca  INT IDENTITY(1,1) PRIMARY KEY,
        Marca     NVARCHAR(50) NOT NULL
    );
    PRINT 'Tabla Marcas creada.';
END
GO

-- ── Modelos ───────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Modelos' AND type = 'U')
BEGIN
    CREATE TABLE Modelos (
        Id_modelo  INT IDENTITY(1,1) PRIMARY KEY,
        Id_marca   INT           NOT NULL REFERENCES Marcas(Id_marca),
        Modelo     NVARCHAR(100) NOT NULL
    );
    PRINT 'Tabla Modelos creada.';
END
GO

-- ── Vehiculos ─────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Vehiculos' AND type = 'U')
BEGIN
    CREATE TABLE Vehiculos (
        Id_vehiculo  INT IDENTITY(1,1) PRIMARY KEY,
        Id_persona   INT          NOT NULL REFERENCES Personas(Id_persona),
        Id_modelo    INT          NOT NULL REFERENCES Modelos(Id_modelo),
        Matricula    NVARCHAR(20) NOT NULL,
        Color        NVARCHAR(30) NULL,
        Ano          INT          NULL
    );
    PRINT 'Tabla Vehiculos creada.';
END
GO

-- ── Ingresos ──────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Ingresos' AND type = 'U')
BEGIN
    CREATE TABLE Ingresos (
        Id_ingreso   INT IDENTITY(1,1) PRIMARY KEY,
        Id_persona   INT           NOT NULL REFERENCES Personas(Id_persona),
        Tipo         NVARCHAR(20)  NOT NULL,
        Motivo       NVARCHAR(500) NULL,
        Periodo      INT           NULL,
        TipoPeriodo  NVARCHAR(20)  NULL,
        Fecha        DATE          NOT NULL,
        Hora         TIME          NOT NULL
    );
    PRINT 'Tabla Ingresos creada.';
END
GO

-- ── Salidas ───────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Salidas' AND type = 'U')
BEGIN
    CREATE TABLE Salidas (
        Id_salida   INT IDENTITY(1,1) PRIMARY KEY,
        Id_persona  INT  NOT NULL REFERENCES Personas(Id_persona),
        Fecha       DATE NOT NULL,
        Hora        TIME NOT NULL
    );
    PRINT 'Tabla Salidas creada.';
END
GO

-- ── Visitas ───────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Visitas' AND type = 'U')
BEGIN
    CREATE TABLE Visitas (
        Id_visita   INT IDENTITY(1,1) PRIMARY KEY,
        Id_persona  INT           NOT NULL REFERENCES Personas(Id_persona),
        TipoVisita  NVARCHAR(100) NOT NULL,
        Motivo      NVARCHAR(MAX) NOT NULL,
        Telefono    NVARCHAR(20)  NULL
    );
    PRINT 'Tabla Visitas creada.';
END
GO

-- ── FaceEmbeddings ────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'FaceEmbeddings' AND type = 'U')
BEGIN
    CREATE TABLE FaceEmbeddings (
        Id_embedding   INT IDENTITY(1,1) PRIMARY KEY,
        Id_persona     INT           NOT NULL REFERENCES Personas(Id_persona),
        Embedding      VARBINARY(MAX) NOT NULL,
        FechaCreacion  DATETIME      DEFAULT GETDATE() NOT NULL
    );
    PRINT 'Tabla FaceEmbeddings creada.';
END
GO

-- ── Datos de referencia: Marcas y Modelos ─────────────────────────────────────
IF NOT EXISTS (SELECT TOP 1 1 FROM Marcas)
BEGIN
    PRINT 'Insertando marcas y modelos...';

    -- Marcas
    INSERT INTO Marcas (Marca) VALUES
        ('Toyota'),     -- 1
        ('Honda'),      -- 2
        ('Nissan'),     -- 3
        ('Mazda'),      -- 4
        ('Hyundai'),    -- 5
        ('Kia'),        -- 6
        ('Ford'),       -- 7
        ('Chevrolet'),  -- 8
        ('Mitsubishi'), -- 9
        ('Suzuki'),     -- 10
        ('Otro');       -- 11

    -- Toyota
    INSERT INTO Modelos (Id_marca, Modelo) VALUES
        (1,'Corolla'),(1,'Camry'),(1,'RAV4'),(1,'Hilux'),
        (1,'Prado'),(1,'Yaris'),(1,'4Runner'),(1,'Tacoma'),(1,'Otro');

    -- Honda
    INSERT INTO Modelos (Id_marca, Modelo) VALUES
        (2,'Civic'),(2,'Accord'),(2,'CR-V'),(2,'HR-V'),
        (2,'Pilot'),(2,'Fit'),(2,'Odyssey'),(2,'Otro');

    -- Nissan
    INSERT INTO Modelos (Id_marca, Modelo) VALUES
        (3,'Sentra'),(3,'Altima'),(3,'Versa'),(3,'Kicks'),
        (3,'X-Trail'),(3,'Frontier'),(3,'Pathfinder'),(3,'Otro');

    -- Mazda
    INSERT INTO Modelos (Id_marca, Modelo) VALUES
        (4,'Mazda3'),(4,'Mazda6'),(4,'CX-3'),(4,'CX-5'),
        (4,'CX-9'),(4,'BT-50'),(4,'Otro');

    -- Hyundai
    INSERT INTO Modelos (Id_marca, Modelo) VALUES
        (5,'Accent'),(5,'Elantra'),(5,'Tucson'),(5,'Santa Fe'),
        (5,'Creta'),(5,'Kona'),(5,'Otro');

    -- Kia
    INSERT INTO Modelos (Id_marca, Modelo) VALUES
        (6,'Rio'),(6,'Forte'),(6,'Sportage'),(6,'Sorento'),
        (6,'Seltos'),(6,'Soul'),(6,'Otro');

    -- Ford
    INSERT INTO Modelos (Id_marca, Modelo) VALUES
        (7,'Fiesta'),(7,'Focus'),(7,'Escape'),(7,'Explorer'),
        (7,'F-150'),(7,'Ranger'),(7,'Mustang'),(7,'Otro');

    -- Chevrolet
    INSERT INTO Modelos (Id_marca, Modelo) VALUES
        (8,'Spark'),(8,'Cruze'),(8,'Equinox'),(8,'Traverse'),
        (8,'Silverado'),(8,'Colorado'),(8,'Otro');

    -- Mitsubishi
    INSERT INTO Modelos (Id_marca, Modelo) VALUES
        (9,'Mirage'),(9,'Lancer'),(9,'Outlander'),(9,'Montero'),
        (9,'L200'),(9,'Otro');

    -- Suzuki
    INSERT INTO Modelos (Id_marca, Modelo) VALUES
        (10,'Swift'),(10,'Vitara'),(10,'Jimny'),(10,'Ertiga'),
        (10,'Ciaz'),(10,'Otro');

    -- Otro
    INSERT INTO Modelos (Id_marca, Modelo) VALUES (11,'Otro');

    PRINT 'Marcas y modelos insertados.';
END
GO

PRINT '=== Inicialización completada. Ejecute seed_data.py para datos de prueba. ===';
GO
