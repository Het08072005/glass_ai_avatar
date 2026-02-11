import os
import certifi

# Fix for SSL certificate verify failed on Mac
os.environ["SSL_CERT_FILE"] = certifi.where()

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.routes import search
from app.agent.routes import router as livekit_router
from app.websocket.routes import router as ws_router

app = FastAPI(
    title="ShadeHub API",
    description="Premium Eyewear E-commerce API with AI-powered features",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENV", "development") == "development" else None,  # Hide docs in production
    redoc_url=None
)

# Tables create karein (with error handling)
try:
    Base.metadata.create_all(bind=engine)
    print("[SUCCESS] Database tables created successfully")
except Exception as e:
    print(f"[WARNING] Database initialization warning: {e}")

# Configure CORS - Production Ready
# Get allowed origins from environment variable
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [
    "http://localhost:5173",  # Local development
    "http://127.0.0.1:5173",  # Local development alternative
    "https://ui.34.235.32.139.nip.io", # Explicit AWS deployment domain
    FRONTEND_URL,  # Production frontend URL from .env
]

# Remove duplicates and empty strings
allowed_origins = list(set(filter(None, allowed_origins)))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Specific origins instead of "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

print(f"[INFO] CORS enabled for origins: {allowed_origins}")

# Mount 3D models directory
glasses_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "glasses_3d")
if os.path.exists(glasses_path):
    app.mount("/glasses", StaticFiles(directory=glasses_path), name="glasses")

# Routes
app.include_router(search.router, prefix="/api")
app.include_router(livekit_router, prefix="/api")
app.include_router(ws_router)


@app.get("/")
def home():
    return {"message": "API is running. Go to /docs for testing."}