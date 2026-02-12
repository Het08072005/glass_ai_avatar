from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from fastapi.encoders import jsonable_encoder
from app.database import get_db
from app.schemas.product import ProductCreate, ProductResponse
from app.models.product import Product
from app.services.search_service import SearchService
from app.websocket.manager import manager

router = APIRouter()


# ----------------------------------------
# Main Search Endpoint
# Handles all search requests - clears previous results on new query
# ----------------------------------------
@router.get("/search", response_model=List[ProductResponse])
async def search(
    q: Optional[str] = Query(None, description="Search query"),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    brand: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    face_shape: Optional[str] = Query(None),
    frame_shape: Optional[str] = Query(None),
    occasion: Optional[str] = Query(None),
    frame_color: Optional[str] = Query(None),
    lens_color: Optional[str] = Query(None),
    lens_shape: Optional[str] = Query(None),
    usage: Optional[str] = Query(None),
    arm_size: Optional[str] = Query(None),
    lens_size: Optional[str] = Query(None),
    bridge_size: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
):
    """
    Main Search Endpoint:
    - Accepts query q (search text)
    - Clears previous results when new search is made (empty query = empty results)
    - Uses hybrid_search for intelligent matching with embeddings
    - Supports filters for detailed search
    - Works with frontend search bar and LiveKit agent
    """
    
    # Build filters dict
    filters = {
        "brand": brand,
        "category": category,
        "gender": gender,
        "min_price": min_price,
        "max_price": max_price,
        "face_shape": face_shape,
        "frame_shape": frame_shape,
        "occasion": occasion,
        "frame_color": frame_color,
        "lens_color": lens_color,
        "lens_shape": lens_shape,
        "usage": usage,
        "arm_size": arm_size,
        "lens_size": lens_size,
        "bridge_size": bridge_size,
    }
    
    # If no query, return empty list (clears previous results)
    if not q or not q.strip():
        products = []
    else:
        # Use hybrid_search for intelligent results with embeddings
        result = SearchService.hybrid_search(db, q.strip(), skip=skip, limit=limit, filters=filters)
        products = result.get("products", [])
    
    # Convert to JSON-serializable format
    products_pydantic = [ProductResponse.model_validate(p) for p in products]
    products_json = jsonable_encoder(products_pydantic)
    
    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "SEARCH_RESULT",
        "query": q or "",
        "found": len(products) > 0,
        "count": len(products),
        "products": products_json
    })
    
    return products_pydantic










# ----------------------------------------
# Add product
# ----------------------------------------
@router.post("/add", response_model=ProductResponse)
async def add_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    db_product = Product(**product.dict())
    created = SearchService.add_product(db, db_product)

    await manager.broadcast({
        "type": "PRODUCT_ADDED",
        "product": jsonable_encoder(created)
    })

    return created


# ----------------------------------------
# Get all products with filters
# ----------------------------------------
@router.get("/all", response_model=List[ProductResponse])
async def get_all_products(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    frame_color: Optional[str] = Query(None),
    lens_shape: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    blue_cut: Optional[bool] = Query(None),
    anti_glare: Optional[bool] = Query(None),
    material: Optional[str] = Query(None),
    lens_color: Optional[str] = Query(None),
    usage: Optional[str] = Query(None),
    arm_size: Optional[str] = Query(None),
    lens_size: Optional[str] = Query(None),
    bridge_size: Optional[str] = Query(None),
):
    filters = {
        "q": q,
        "brand": brand,
        "category": category,
        "gender": gender,
        "frame_color": frame_color,
        "lens_shape": lens_shape,
        "lens_color": lens_color,
        "usage": usage,
        "arm_size": arm_size,
        "lens_size": lens_size,
        "bridge_size": bridge_size,
        "min_price": min_price,
        "max_price": max_price,
        "blue_cut": blue_cut,
        "anti_glare": anti_glare,
        "material": material
    }
    products = SearchService.get_all(db, skip=skip, limit=limit, filters=filters)

    await manager.broadcast({
        "type": "ALL_PRODUCTS",
        "count": len(products),
        "skip": skip,
        "limit": limit
    })
    return products



# ----------------------------------------
# Get facets for filters
# ----------------------------------------
@router.get("/facets")
async def get_facets(db: Session = Depends(get_db)):
    """
    Returns unique brands, categories, etc. for filters.
    """
    brands = [r[0] for r in db.query(Product.brand).distinct().all() if r[0]]
    
    return {
        "brands": sorted(brands),
        "genders": ["Mens", "Womens", "Unisex", "Kids"],
        "categories": ["Glasses", "Sunglasses", "Reading Glasses", "Computer Glasses"],
        "frame_colors": ["Black", "Brown", "Cream", "Green", "Gunmetal", "Orange", "Purple", "Silver", "White", "Blue", "Clear", "Gold", "Grey", "Mixed", "Pink", "Red", "Tortoise", "Other", "Graduated", "Yellow", "Rose Gold"],
        "lens_colors": ["Black", "Bronze", "Gold", "Grey", "Pink", "Silver", "Blue", "Brown", "Green", "Orange", "Purple", "Yellow", "Other", "Photochromic", "Graduated", "Mirrored", "Tinted", "Red"],
        "lens_shapes": ["Aviator", "Butterfly", "Cats Eyes", "Oval", "Rectangle", "Retro", "Round", "Semi-Rimless", "Side Shields", "Square", "Square Aviator", "Shield", "Wayfarer", "Oversize", "Wire", "Wrap"],
        "usages": ["Winter Sports", "Cycling", "Field/Racquet Sports", "Mountaineering", "Driving", "Golf", "Fishing", "Watersports", "Running", "Leisure"],
        "arm_sizes": [115, 120, 123, 124, 125, 127, 130, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 152, 155],
        "lens_sizes": [27, 28, 40, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 99, 132, 134, 135],
        "bridge_sizes": [1, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 32, 48, 127, 128, 140, 142, 143, 147, 180]
    }


# ----------------------------------------
# Get product by ID
# ----------------------------------------
@router.get("/products/{id}", response_model=ProductResponse)
async def get_product(id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product



