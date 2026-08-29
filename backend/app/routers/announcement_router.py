# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import json

from app.database.connection import get_db
from app.utils.dependencies import get_current_user
from app.schemas.announcement_schema import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from app.services import announcement_service, privilege_service
from datetime import date

router = APIRouter(prefix="/announcements", tags=["Announcements"])

# ── Connection Manager para WebSockets ───────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_announcement(self, announcement: dict):
        payload = json.dumps(announcement, default=str)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except:
                pass # Ignorar conexiones caídas

manager = ConnectionManager()


# ── WebSockets Endpoint ──────────────────────────────────────────────────────
@router.websocket("/ws")
async def websocket_announcements(websocket: WebSocket, db: Session = Depends(get_db)):
    await manager.connect(websocket)
    # Al conectar, enviamos el anuncio activo actual inmediatamente
    active = announcement_service.get_active_published(db)
    payload = {
        "type": "announcement",
        "data": {"id": active.id, "title": active.title, "content": active.content} if active else None
    }
    
    try:
        await websocket.send_text(json.dumps(payload, default=str))
        while True:
            # En nuestro caso, el cliente (proyector) solo escucha.
            # Mantenemos viva la conexión esperando un Ping o msgs genéricos.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── REST Endpoints (Admin) ───────────────────────────────────────────────────

@router.get("", response_model=List[AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)): # No requiere auth para el demo
    return announcement_service.get_all(db)

@router.post("", response_model=AnnouncementResponse)
def create_announcement(data: AnnouncementCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return announcement_service.create(db, data)

@router.put("/{ann_id}", response_model=AnnouncementResponse)
def update_announcement(ann_id: int, data: AnnouncementUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    obj = announcement_service.update(db, ann_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    return obj

@router.delete("/{ann_id}")
def delete_announcement(ann_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not announcement_service.delete(db, ann_id):
        raise HTTPException(status_code=404, detail="No encontrado")
    return {"message": "Eliminado"}

@router.post("/{ann_id}/publish")
async def publish_announcement(ann_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Publica un anuncio (o 0 para despublicar todo) y hace el broadcast webSocket.
    """
    published = announcement_service.publish(db, ann_id)
    
    payload = {
        "type": "announcement",
        "data": {"id": published.id, "title": published.title, "content": published.content} if published else None
    }
    
    # Broadcast a pantallas
    await manager.broadcast_announcement(payload)
    status = "Publicado" if published else "Oculto"
    return {"message": f"Anuncio {status}"}

@router.post("/publish/weekly_program")
async def publish_weekly_program(week_start: date, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Ocullta todos los anuncios normales y transmite el programa de privilegios de la semana indicada.
    """
    # Despublicar todo anuncio activo
    announcement_service.publish(db, 0)
    
    # Obtener el programa semanal
    schedule_data = privilege_service.get_schedule(db, week_start)
    
    payload = {
        "type": "weekly_program",
        "data": schedule_data,
        "week_start": str(week_start)
    }
    
    await manager.broadcast_announcement(payload)
    return {"message": "Programa publicado"}

@router.post("/publish/playlist")
async def publish_playlist(ids: List[int], db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Publica una selección de anuncios para que roten en las pantallas.
    """
    # Despublicar todo anuncio individual activo por coherencia
    announcement_service.publish(db, 0)
    
    selected = announcement_service.get_many(db, ids)
    
    payload = {
        "type": "announcement_playlist",
        "data": [{"id": a.id, "title": a.title, "content": a.content} for a in selected]
    }
    
    await manager.broadcast_announcement(payload)
    return {"message": f"Playlist con {len(selected)} anuncios publicada"}

