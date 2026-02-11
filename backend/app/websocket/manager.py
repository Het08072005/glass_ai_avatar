from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for ws in self.active_connections[:]:
            try:
                await ws.send_json(data)
            except Exception as e:
                print(f"Error broadcasting to {ws}: {e}")
                self.active_connections.remove(ws)

manager = ConnectionManager()
