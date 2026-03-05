# UNAH Access Control

Sistema de control de acceso universitario con reconocimiento facial para la Universidad Nacional Autonoma de Honduras, disenado para manejar volumenes de hasta 100,000+ personas registradas.

---

## Tecnologias

### Frontend
| Tecnologia | Version | Uso |
|------------|---------|-----|
| Next.js | 16.0.0 | Framework React con SSR |
| React | 19.2.0 | UI |
| TypeScript | 5.x | Tipado estatico |
| Tailwind CSS | 4.1.9 | Estilos utilitarios |
| Radix UI | Varias | Componentes accesibles (Dialog, Select, Tabs, Toast, etc.) |
| shadcn/ui | - | Sistema de componentes basado en Radix + Tailwind |
| React Hook Form + Zod | 7.x / 3.x | Formularios con validacion |
| Recharts | 2.15.4 | Graficos en el dashboard |
| Lucide React | 0.553 | Iconos |
| Sonner | 1.7.4 | Notificaciones toast |
| next-themes | 0.4.6 | Tema claro/oscuro |

### Backend
| Tecnologia | Version | Uso |
|------------|---------|-----|
| FastAPI | 0.115.0 | Framework API REST |
| Uvicorn | 0.32.0 | Servidor ASGI |
| SQLAlchemy | 2.0.36 | ORM |
| pyodbc | 5.2.0 | Driver ODBC para SQL Server |
| InsightFace | 0.7.3 | Generacion de embeddings faciales |
| ONNX Runtime | 1.19.2 | Inferencia de modelos de IA |
| OpenCV | 4.10.0 | Procesamiento de imagenes |
| NumPy | 1.26.4 | Operaciones vectoriales y cache en memoria |
| FAISS (faiss-cpu) | Latest | Indice vectorial para busqueda 1:N |
| Pillow | 11.0.0 | Manipulacion de imagenes |
| passlib + bcrypt | 1.7.4 / 4.0.1 | Hashing de contrasenas |
| python-dotenv | 1.0.1 | Variables de entorno |

### Base de datos
| Tecnologia | Uso |
|------------|-----|
| SQL Server | Base de datos principal (tablas, relaciones, embeddings en VARBINARY) |
| ODBC Driver 17/18 | Conexion desde Python |

---

## Requisitos previos

- **Python** 3.9+
- **Node.js** 18+ y npm
- **SQL Server** (Express o completo)
- **ODBC Driver 17 o 18 for SQL Server** -- [Descargar](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
- **Microsoft C++ Build Tools** -- requerido para InsightFace
  - Descargar: https://visualstudio.microsoft.com/visual-cpp-build-tools/
  - En el instalador seleccionar: **"Desktop development with C++"**
  - Reiniciar la PC despues de instalar

---

## Instalacion (primera vez)

### 1. Base de datos

Ejecutar `Backend/init_db.sql` en SSMS. Crea la base de datos `UNAH_AccessControl` con todas las tablas y datos de referencia.

### 2. Configurar variables de entorno

```bash
cd Backend
cp .env.example .env
```

Editar `.env` con las credenciales de SQL Server:

**Opcion A -- Autenticacion de Windows:**
```env
DB_SERVER=localhost
DB_NAME=UNAH_AccessControl
DB_TRUSTED_CONNECTION=yes
DB_DRIVER=ODBC Driver 17 for SQL Server
```

**Opcion B -- Autenticacion SQL:**
```env
DB_SERVER=localhost
DB_NAME=UNAH_AccessControl
DB_USER=sa
DB_PASSWORD=tu_password
DB_TRUSTED_CONNECTION=no
DB_DRIVER=ODBC Driver 17 for SQL Server
```

> Si usas SQL Server Express el servidor es `localhost\SQLEXPRESS`.

Para habilitar autenticacion SQL en SSMS:
1. Clic derecho en el servidor -> Properties -> Security
2. Seleccionar **SQL Server and Windows Authentication mode**
3. Reiniciar el servicio de SQL Server
4. Ejecutar en SSMS: `ALTER LOGIN sa ENABLE; ALTER LOGIN sa WITH PASSWORD = 'tu_password';`

### 3. Backend (FastAPI -- puerto 8000)

```bash
cd Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
uvicorn main:app --reload --port 8000
```

### 4. Frontend (Next.js -- puerto 3000)

```bash
cd Frontend
npm install
npm run dev
```

---

## Migracion (instalaciones existentes)

Si el sistema ya estaba corriendo con una version anterior que guardaba embeddings en formato JSON, ejecutar el script de migracion **una sola vez** antes de arrancar el servidor:

```bash
cd Backend
venv\Scripts\activate
python migrate_embeddings.py
```

Esto convierte la columna `Embedding` de `NVARCHAR(MAX)` (JSON) a `VARBINARY(MAX)` (binario), lo que reduce el tiempo de carga inicial en ~10x.

---

## Funcionamiento actual

El sistema tiene tres interfaces independientes accesibles por URL:

### 1. Panel de administracion -- `http://localhost:3000`

Acceso exclusivo para empleados. Flujo:
1. Empleado inicia sesion con numero de empleado y contrasena
2. En el dashboard accede a **"Enrolar personas"**
3. Busca al estudiante o empleado por numero de cuenta o numero de empleado
4. El sistema muestra los datos de la persona e indica si ya esta enrolada
5. Se captura la foto y se guarda el embedding facial en formato binario
6. Si la persona ya estaba enrolada, verifica que la nueva foto corresponda a la misma persona antes de actualizar (proteccion contra suplantacion)

### 2. Terminal de entrada -- `http://localhost:3000/terminal`
> Disenada para pantalla completa en los portones de la universidad.

Interfaz de kiosco para instalar en los portones:
1. Activar camara
2. Escanear rostro
3. El sistema busca en la cache en memoria (no va a la BD en cada escaneo)
4. Muestra pantalla verde con nombre y tipo de usuario si es reconocido
5. Muestra pantalla roja si el rostro no esta enrolado
6. Registra el ingreso automaticamente
7. Se reinicia automaticamente en 5 segundos

> Si el servidor acaba de arrancar y la cache aun esta cargando, la terminal devuelve un mensaje de "sistema inicializando".

### 3. Registro de personas -- `http://localhost:3000/registro-personas`
> Acceso directo por URL, sin login requerido. Usar en red interna.

Panel para registrar nuevos estudiantes y empleados:
- Seleccionar tipo: Estudiante o Empleado
- Ingresar datos personales (DNI, Nombre, Apellido, Email, Telefono, Contrasena)
- Ingresar Numero de Cuenta (estudiante) o Numero de Empleado (empleado)
- Una vez registrada, la persona puede ser enrolada desde el panel de administracion

---

## Arquitectura de reconocimiento facial

### Almacenamiento
Los embeddings faciales se guardan como binario (`VARBINARY(MAX)`) en SQL Server. Cada embedding son exactamente 2 KB (512 valores `float32`).

### Cache en memoria
Al arrancar el servidor, todos los embeddings se cargan en segundo plano como una matriz NumPy normalizada. El servidor queda disponible de inmediato mientras la cache se construye en paralelo.

| Volumen | Tiempo de carga | RAM usada |
|---------|----------------|-----------|
| 10,000  | ~1 segundo     | ~20 MB    |
| 50,000  | ~3 segundos    | ~100 MB   |
| 100,000 | ~5 segundos    | ~200 MB   |

### Busqueda
Cada escaneo en el porton realiza **una sola multiplicacion de matrices** (embedding nuevo x matriz de todos los embeddings), devolviendo el resultado en menos de 5ms sin importar cuantas personas esten registradas.

---

## Usuarios de prueba

Contrasena para todos: `1234`

| Tipo       | Identificador | Acceso al panel admin |
|------------|---------------|-----------------------|
| Estudiante | `20191001234` | No                    |
| Estudiante | `20201005678` | No                    |
| Empleado   | `EMP-001`     | Si                    |
| Empleado   | `EMP-002`     | Si                    |

---

## API -- Endpoints principales

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/personas/login` | Autenticacion de empleados |
| POST | `/personas` | Crear persona |
| POST | `/estudiantes` | Crear estudiante |
| POST | `/empleados` | Crear empleado |
| GET | `/enrolar/buscar/{identificador}` | Buscar persona para enrolar |
| POST | `/enrolar` | Guardar/actualizar embedding facial |
| POST | `/reconocer` | Identificar rostro contra la cache |
| POST | `/ingresos` | Registrar ingreso |
| GET | `/ingresos` | Listar ingresos |
| GET | `/docs` | Documentacion interactiva (Swagger) |

---

## Estructura del proyecto

```
Ingenieria_Software/
├── .gitignore
├── README.md
├── Frontend/                    # Next.js 16 (React 19, TypeScript, Tailwind 4)
│   ├── package.json
│   └── app/
│       ├── page.tsx             # Login (solo empleados)
│       ├── dashboard/           # Dashboard del empleado
│       ├── enrolamiento/        # Panel de enrolamiento facial
│       ├── terminal/            # Terminal de reconocimiento (portones)
│       └── registro-personas/   # Registro de nuevos estudiantes/empleados
└── Backend/                     # FastAPI + InsightFace + SQLAlchemy
    ├── main.py                  # Arranque, CORS, routers, carga de cache
    ├── database.py              # Conexion SQL Server
    ├── models.py                # Modelos SQLAlchemy
    ├── schemas.py               # Esquemas Pydantic
    ├── face_service.py          # InsightFace: embeddings binarios
    ├── embedding_cache.py       # Cache en memoria con NumPy
    ├── migrate_embeddings.py    # Migracion JSON -> binario (una sola vez)
    ├── routers/
    │   ├── personas.py          # Login y CRUD de personas
    │   ├── estudiantes.py
    │   ├── empleados.py
    │   ├── ingresos.py
    │   ├── salidas.py
    │   ├── visitas.py
    │   ├── vehiculos.py
    │   ├── referencias.py       # Marcas y modelos de vehiculos
    │   ├── enrolamiento.py      # Enrolamiento y verificacion facial
    │   └── reconocimiento.py    # Identificacion en portones
    ├── init_db.sql              # Crear tablas + seed marcas/modelos
    ├── seed_data.py             # Usuarios de prueba
    ├── requirements.txt
    └── .env.example
```
