from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager

router = APIRouter()

# @router.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await manager.connect(websocket)
#     try:
#         while True:
#             await websocket.receive_text()  # keep connection alive
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)



@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    print(f"[WS] Client connected. Total active: {len(manager.active_connections)}")
    try:
        while True:
            try:
                msg = await websocket.receive_text()
                # 🏓 Handle ping/pong for keep-alive
                if msg == "ping":
                    await websocket.send_json({"type": "pong"})
                elif msg:
                    # Echo or handle other messages if needed
                    pass
            except WebSocketDisconnect:
                manager.disconnect(websocket)
                print(f"[WS] Client disconnected. Total active: {len(manager.active_connections)}")
                break
    except Exception as e:
        print(f"[WS] Error: {e}")
        manager.disconnect(websocket)

@router.post("/broadcast")
async def broadcast_message(message: dict):
    """
    Internal endpoint to allow other processes to broadcast to all WS clients.
    """
    await manager.broadcast(message)
    return {"status": "ok"}
