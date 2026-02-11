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
    try:
        while True:
            try:
                msg = await websocket.receive_text()
                # optional: handle ping/pong
                if msg:
                    await websocket.send_json({"type": "pong"})
            except WebSocketDisconnect:
                manager.disconnect(websocket)
                break
    except Exception as e:
        manager.disconnect(websocket)

@router.post("/broadcast")
async def broadcast_message(message: dict):
    """
    Internal endpoint to allow other processes to broadcast to all WS clients.
    """
    await manager.broadcast(message)
    return {"status": "ok"}
