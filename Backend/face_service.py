"""
Servicio de reconocimiento facial usando InsightFace.
Si InsightFace no está instalado, las funciones retornan None
y el sistema sigue funcionando sin reconocimiento facial.
"""

import base64
from typing import Optional, List

import cv2
import numpy as np

INSIGHTFACE_AVAILABLE = False
_face_app = None


def _init_insightface():
    """Inicializar InsightFace de forma lazy (solo cuando se necesite)."""
    global INSIGHTFACE_AVAILABLE, _face_app
    if _face_app is not None:
        return True
    try:
        import insightface
        from insightface.app import FaceAnalysis
        _face_app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"],
        )
        _face_app.prepare(ctx_id=0, det_size=(640, 640))
        INSIGHTFACE_AVAILABLE = True
        print("[FaceService] InsightFace cargado correctamente.")
        return True
    except Exception as e:
        print(f"[FaceService] InsightFace no disponible: {e}")
        print("[FaceService] El reconocimiento facial estará desactivado.")
        return False


def decode_base64_image(image_base64: str) -> Optional[np.ndarray]:
    """
    Decodifica una imagen base64 a array numpy BGR (formato OpenCV).
    Acepta imágenes con o sin prefijo 'data:image/...;base64,'.
    """
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        img_bytes = base64.b64decode(image_base64)
        nparr = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"[FaceService] Error decodificando imagen: {e}")
        return None


def get_face_embedding(image_base64: str) -> Optional[List[float]]:
    """
    Extrae el embedding facial de una imagen base64.
    Devuelve una lista de 512 floats o None si no se detectó rostro.
    """
    if _face_app is None:
        return None
    try:
        img = decode_base64_image(image_base64)
        if img is None:
            return None

        faces = _face_app.get(img)
        if not faces:
            return None

        # Tomar el rostro más grande
        face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        return face.embedding.tolist()
    except Exception as e:
        print(f"[FaceService] Error extrayendo embedding: {e}")
        return None


def compare_embeddings(emb1: List[float], emb2: List[float]) -> float:
    """
    Calcula la similitud coseno entre dos embeddings.
    Retorna valor entre -1.0 y 1.0 (1.0 = idénticos).
    """
    e1 = np.array(emb1, dtype=np.float32)
    e2 = np.array(emb2, dtype=np.float32)
    norm1 = np.linalg.norm(e1)
    norm2 = np.linalg.norm(e2)
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return float(np.dot(e1, e2) / (norm1 * norm2))


def embedding_to_bytes(embedding: List[float]) -> bytes:
    return np.array(embedding, dtype=np.float32).tobytes()


def bytes_to_embedding(data: bytes) -> List[float]:
    return np.frombuffer(data, dtype=np.float32).tolist()


# Umbral de similitud para verificación de identidad (ajustable)
SIMILARITY_THRESHOLD = 0.60
