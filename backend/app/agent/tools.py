import httpx
import json
import os
from dotenv import load_dotenv
load_dotenv()
import asyncio
from fastapi.encoders import jsonable_encoder
from livekit.agents import function_tool, RunContext, ToolError
# from app.websocket.manager import manager

# Use internal URL for server-side communication
FASTAPI_URL = os.getenv("INTERNAL_API_URL", "http://127.0.0.1:8000") + "/api/search"

# ⚡ GLOBAL HTTP CLIENT FOR CONNECTION POOLING (Critical for Latency)
http_client = httpx.AsyncClient(timeout=8.0)

@function_tool(
    name="search_products",
    description="Search products from the lifestyle database based on user preferences like brand, color, and occasion."
)
async def search_products(
    ctx: RunContext,
    query: str,
    category: str | None = None
) -> dict:
    """
    Search products and trigger a navigation event on the frontend.
    """
    print(f"DEBUG: search_products tool called with query='{query}' and category='{category}'")
    if not query or not query.strip():
        raise ToolError("Search query is empty")

    params = {"q": query.strip()}
    if category:
        params["category"] = category.strip()

    try:
        # ⚡ 1. IMMEDIATE NAVIGATION / "LOADING" SIGNAL TO FRONTEND
        try:
            if hasattr(ctx, 'room') and ctx.room:
                # 🔥 1. NAVIGATE WITH QUERY IN URL (The surest way to autofill)
                query_val = query.strip()
                nav_url = f"/products?q={query_val}"
                
                payload_nav = json.dumps({
                    "type": "navigate", 
                    "url": nav_url,
                    "query": query_val # Redundancy to be safe
                })
                
                # 🔥 2. SIGNAL LOADING (Keep UI in sync)
                payload_load = json.dumps({
                    "type": "SEARCH_LOADING", 
                    "status": True,
                    "query": query_val
                })
                
                await ctx.room.local_participant.publish_data(payload_nav.encode("utf-8"), reliable=True)
                await ctx.room.local_participant.publish_data(payload_load.encode("utf-8"), reliable=True)
                print(f"DEBUG: Sent navigate and loading for {query_val}")
        except Exception as e:
            print(f"Signal failure: {e}")

        # ⚡ 2. FAST DB LOOKUP (Reusing Global Client)
        # Using global client avoids SSL handshake overhead (~300ms saved)
        res = await http_client.get(FASTAPI_URL, params=params)
        res.raise_for_status()

        products = res.json()
        if not isinstance(products, list):
            raise ToolError("Unexpected response format from backend")

        # ⚡ 3. SEND RESULTS TO FRONTEND VIA DATA CHANNEL & WEBSOCKET
        try:
            # A. LiveKit Data Channel
            if hasattr(ctx, 'room') and ctx.room:
                preview_products = products[:12]
                payload_result = {
                    "type": "SEARCH_RESULT",
                    "query": query_val,
                    "products": preview_products
                }
                await ctx.room.local_participant.publish_data(json.dumps(payload_result).encode("utf-8"), reliable=True)
                print(f"DEBUG: Pushed {len(preview_products)} products via LiveKit")

            # B. Global WebSocket (Force Update)
            try:
                # Also signal loading to WS
                await http_client.post(f"{os.getenv('INTERNAL_API_URL', 'http://127.0.0.1:8000')}/broadcast", json={
                    "type": "SEARCH_LOADING",
                    "query": query_val
                })
                # Send result to WS
                await http_client.post(f"{os.getenv('INTERNAL_API_URL', 'http://127.0.0.1:8000')}/broadcast", json={
                    "type": "SEARCH_RESULT",
                    "query": query_val,
                    "products": jsonable_encoder(products[:20]) # More for WS
                })
                print(f"DEBUG: Broadcasted search '{query_val}' to Global WS")
            except Exception as e:
                print(f"WS Broadcast failure: {e}")

        except Exception as e:
            print(f"Data publication failure: {e}")

        # ⚡ 4. FORMAT RESULTS FOR AGENT (Optimized for detailed speech)
        if products:
            detailed_products = []
            for p in products[:3]: # Limit to top 3 for faster token generation
                detailed_products.append({
                    "name": p.get("name"),
                    "brand": p.get("brand"),
                    "price_usd": p.get("price_usd"),
                    "features": [t for t in (p.get("tags") or []) if t in ["Polarized", "Blue Cut", "UV400"]],
                    "desc": p.get("description", "")[:150]
                })
            
            recommendation = f"Found {len(products)} items. Top pick: {products[0]['name']}."
        else:
            detailed_products = []
            recommendation = "No exact matches, showing trending alternatives."

        return {
            "status": "ok", 
            "count": len(products),
            "top_products": detailed_products,
            "system_note": "Speak about the top_products immediately."
        }

    except httpx.HTTPStatusError as e:
        raise ToolError(f"Database error: {e.response.status_code}")
    except Exception as e:
        raise ToolError(f"Search failed: {str(e)}")

@function_tool(
    name="end_conversation",
    description="Properly close the session when the user is finished or says goodbye."
)
async def end_conversation(ctx: RunContext):
    """
    Signals the frontend to start the exit sequence. 
    """
    print("Tool: end_conversation called.")
    
    # ⚡ 1. Signal via LiveKit Data Channel (Prioritized for latency/reliability)
    try:
        if hasattr(ctx, 'room') and ctx.room:
            payload = json.dumps({"type": "END_SESSION"})
            await ctx.room.local_participant.publish_data(payload.encode("utf-8"), reliable=True)
    except Exception as e:
        print(f"LiveKit end signal failed: {e}")

    # ⚡ 2. Signal via Global WebSocket (Fallback/Redundancy)
    try:
        # Use global client for broadcast too
        base_url = os.getenv("INTERNAL_API_URL", "http://127.0.0.1:8000")
        await http_client.post(f"{base_url}/broadcast", json={"type": "END_SESSION"})
    except Exception as e:
        print(f"Broadcast failed: {e}")

    return "CONVERSATION_ENDED"

