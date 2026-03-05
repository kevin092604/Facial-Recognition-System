"""
Caché FAISS de embeddings faciales en memoria.

- Carga desde SQL Server en segundo plano al arrancar
- IndexFlatIP con normalización L2 → similitud coseno exacta
- ~5 ms por búsqueda a 100k vectores, ~200 MB RAM
- Fallback numpy si faiss-cpu no está instalado
"""

import threading
import numpy as np
from enum import Enum
from typing import Optional

EMBEDDING_DIM = 512
BATCH_SIZE    = 5_000

_lock = threading.RLock()

_raw_matrix: Optional[np.ndarray] = None   # (N, 512), L2-normalizada
_ids: list[int] = []                        # posición → id_persona
_id_to_pos: dict[int, int] = {}            # id_persona → posición  (O(1) lookup)
_faiss_index = None                         # faiss.IndexFlatIP
_pending: list[tuple[int, np.ndarray]] = [] # buffered durante CARGANDO

FAISS_AVAILABLE = False
try:
    import faiss as _faiss
    FAISS_AVAILABLE = True
    print("[Cache] faiss-cpu disponible.")
except ImportError:
    print("[Cache] faiss-cpu no instalado. Usando fallback numpy.")


class EstadoCache(Enum):
    NO_INICIADA = "no_iniciada"
    CARGANDO    = "cargando"
    LISTA       = "lista"
    VACIA       = "vacia"

_estado = EstadoCache.NO_INICIADA


# ── API pública ───────────────────────────────────────────────────────────────

def estado() -> EstadoCache:
    return _estado


def esta_lista() -> bool:
    return _estado in (EstadoCache.LISTA, EstadoCache.VACIA)


def cargar_en_segundo_plano(db_factory) -> None:
    """Lanza la carga desde SQL Server en un hilo separado."""
    hilo = threading.Thread(target=_cargar, args=(db_factory,), daemon=True)
    hilo.start()


def agregar(id_persona: int, embedding: list[float]) -> None:
    """Agrega o reemplaza el embedding de una persona en el índice."""
    global _estado

    vec = _normalizar(np.array(embedding, dtype=np.float32))

    with _lock:
        if _estado == EstadoCache.CARGANDO:
            _pending.append((id_persona, vec))
            return

        _insertar(id_persona, vec)

        if _estado == EstadoCache.VACIA:
            _estado = EstadoCache.LISTA


def buscar_en_db(embedding: list[float], db) -> tuple[int, float]:
    """
    Búsqueda secuencial en SQL Server. Fallback cuando FAISS está cargando.
    Retorna (id_persona, similitud). Si no hay embeddings retorna (-1, -1.0).
    """
    from models import FaceEmbedding

    vec = _normalizar(np.array(embedding, dtype=np.float32))

    mejor_id  = -1
    mejor_sim = -1.0

    for fila in db.query(FaceEmbedding).all():
        try:
            stored = np.frombuffer(fila.Embedding, dtype=np.float32).copy()
            norma  = np.linalg.norm(stored)
            if norma > 0:
                stored = stored / norma
            sim = float(np.dot(vec, stored))
            if sim > mejor_sim:
                mejor_sim = sim
                mejor_id  = fila.Id_persona
        except Exception:
            continue

    return mejor_id, mejor_sim


def buscar(embedding: list[float]) -> tuple[int, float]:
    """
    Retorna (id_persona, similitud_coseno).
    Si el índice no está disponible retorna (-1, -1.0).
    """
    with _lock:
        if _raw_matrix is None or not _ids:
            return -1, -1.0

        vec = _normalizar(np.array(embedding, dtype=np.float32)).reshape(1, -1)

        if FAISS_AVAILABLE and _faiss_index is not None:
            scores, positions = _faiss_index.search(vec, k=1)
            pos   = int(positions[0][0])
            score = float(scores[0][0])
        else:
            sims  = _raw_matrix @ vec.T
            pos   = int(np.argmax(sims))
            score = float(sims[pos])

        if pos < 0 or pos >= len(_ids):
            return -1, -1.0

        return _ids[pos], score


# ── Internos ──────────────────────────────────────────────────────────────────

def _insertar(id_persona: int, vec: np.ndarray) -> None:
    """Inserta o reemplaza un embedding. DEBE llamarse con _lock adquirido."""
    global _raw_matrix, _faiss_index

    if id_persona in _id_to_pos:
        pos = _id_to_pos[id_persona]
        _raw_matrix[pos] = vec
        _faiss_index = _construir_faiss(_raw_matrix)
    else:
        pos = len(_ids)
        _ids.append(id_persona)
        _id_to_pos[id_persona] = pos
        _raw_matrix = vec.reshape(1, -1) if _raw_matrix is None \
                      else np.vstack([_raw_matrix, vec.reshape(1, -1)])
        if FAISS_AVAILABLE:
            if _faiss_index is None:
                _faiss_index = _faiss.IndexFlatIP(EMBEDDING_DIM)
            _faiss_index.add(vec.reshape(1, -1))


def _normalizar(vec: np.ndarray) -> np.ndarray:
    if FAISS_AVAILABLE:
        v2 = vec.reshape(1, -1).astype(np.float32)
        _faiss.normalize_L2(v2)
        return v2[0]
    norma = np.linalg.norm(vec)
    return vec / norma if norma > 0 else vec


def _construir_faiss(matriz: np.ndarray):
    if not FAISS_AVAILABLE:
        return None
    idx = _faiss.IndexFlatIP(EMBEDDING_DIM)
    idx.add(matriz)
    return idx


def _cargar(db_factory) -> None:
    global _raw_matrix, _ids, _id_to_pos, _faiss_index, _estado

    _estado = EstadoCache.CARGANDO
    print("[Cache] Iniciando carga de embeddings desde SQL Server...")

    db = db_factory()
    try:
        from models import FaceEmbedding

        total = db.query(FaceEmbedding).count()
        if total == 0:
            with _lock:
                _raw_matrix  = None
                _ids         = []
                _id_to_pos   = {}
                _faiss_index = None
                _estado      = EstadoCache.VACIA
                for pid, pvec in _pending:
                    _insertar(pid, pvec)
                if _pending:
                    _estado = EstadoCache.LISTA
                _pending.clear()
            print("[Cache] Sin embeddings en BD.")
            return

        print(f"[Cache] Cargando {total:,} embeddings en lotes de {BATCH_SIZE:,}...")

        ids_acc      = []
        id_to_pos_acc = {}
        vecs_acc     = []
        offset       = 0

        while offset < total:
            lote = (
                db.query(FaceEmbedding)
                .order_by(FaceEmbedding.Id_embedding)
                .offset(offset)
                .limit(BATCH_SIZE)
                .all()
            )
            for r in lote:
                try:
                    vec = np.frombuffer(r.Embedding, dtype=np.float32).copy()
                    pos = len(ids_acc)
                    ids_acc.append(r.Id_persona)
                    id_to_pos_acc[r.Id_persona] = pos
                    vecs_acc.append(vec)
                except Exception:
                    continue
            offset += BATCH_SIZE
            print(f"[Cache]   {min(offset, total):,}/{total:,}...")

        if not vecs_acc:
            with _lock:
                _raw_matrix  = None
                _ids         = []
                _id_to_pos   = {}
                _faiss_index = None
                _estado      = EstadoCache.VACIA
                for pid, pvec in _pending:
                    _insertar(pid, pvec)
                if _pending:
                    _estado = EstadoCache.LISTA
                _pending.clear()
            return

        matriz = np.array(vecs_acc, dtype=np.float32)
        if FAISS_AVAILABLE:
            _faiss.normalize_L2(matriz)
        else:
            normas = np.linalg.norm(matriz, axis=1, keepdims=True)
            normas[normas == 0] = 1
            matriz /= normas

        idx = _construir_faiss(matriz)

        with _lock:
            _raw_matrix  = matriz
            _ids         = ids_acc
            _id_to_pos   = id_to_pos_acc
            _faiss_index = idx
            _estado      = EstadoCache.LISTA

            # Aplicar enrolamientos que llegaron durante la carga
            for pid, pvec in _pending:
                _insertar(pid, pvec)
            _pending.clear()

        print(f"[Cache] {len(ids_acc):,} embeddings listos en memoria.")

    except Exception as e:
        print(f"[Cache] Error cargando embeddings: {e}")
        _estado = EstadoCache.VACIA
    finally:
        db.close()
