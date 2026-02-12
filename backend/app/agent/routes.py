

# #routes.py
# import os
# import uuid
# from fastapi import APIRouter, Query, HTTPException
# from livekit import api
# from dotenv import load_dotenv

# print("🔥 Loading LiveKit token route")

# load_dotenv()  # force load

# router = APIRouter()

# @router.get("/getToken")
# async def get_token(name: str = Query("guest")):
#     try:
#         api_key = os.getenv("LIVEKIT_API_KEY")
#         api_secret = os.getenv("LIVEKIT_API_SECRET")

#         print("🔑 API KEY:", api_key)
#         print("🔐 API SECRET:", "FOUND" if api_secret else "MISSING")

#         if not api_key or not api_secret:
#             raise Exception("LiveKit env vars missing")

#         room_name = f"room-{uuid.uuid4().hex[:8]}"

#         token = (
#             api.AccessToken(api_key, api_secret)
#             .with_identity(name)
#             .with_name(name)
#             .with_grants(
#                 api.VideoGrants(
#                     room_join=True,
#                     room=room_name,
#                 )
#             )
#         )

#         jwt = token.to_jwt()
#         print("✅ TOKEN GENERATED")

#         return jwt

#     except Exception as e:
#         print("❌ TOKEN ERROR:", str(e))
#         raise HTTPException(status_code=500, detail=str(e))





import os
import uuid
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import PlainTextResponse
from livekit import api
from dotenv import load_dotenv

# Load env at the very top
load_dotenv()

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "LiveKit routes are working"}

@router.get("/getToken", response_class=PlainTextResponse)
async def get_token(name: str = Query("guest")):
    try:
        api_key = os.getenv("LIVEKIT_API_KEY")
        api_secret = os.getenv("LIVEKIT_API_SECRET")

        print(f"🔑 API KEY present: {bool(api_key)}")
        print(f"🔐 API SECRET present: {bool(api_secret)}")

        if not api_key or not api_secret:
            error_msg = "LiveKit credentials not configured"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)

        # Create a unique room for this user
        room_name = f"room-{uuid.uuid4().hex[:8]}"
        print(f"🏠 Creating room: {room_name} for user: {name}")

        token = (
            api.AccessToken(api_key, api_secret)
            .with_identity(name)
            .with_name(name)
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=room_name,
                )
            )
        )

        jwt = token.to_jwt()
        print(f"✅ Token generated successfully for user: {name}, room: {room_name}")
        
        # Return JWT directly as string (matches commented working code)
        return jwt

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_msg = f"Token generation failed: {str(e)}"
        print(f"❌ TOKEN ERROR: {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)