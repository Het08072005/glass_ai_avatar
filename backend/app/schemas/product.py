from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class ProductBase(BaseModel):
    name: str # e.g. "Tom Ford FAUSTO FT5634-B"
    brand: Optional[str] = None # e.g. "Tom Ford"
    category: Optional[List[str]] = [] # e.g. ["Prescription Glasses"]
    gender: Optional[List[str]] = [] # e.g. ["Mens"]
    description: Optional[str] = None
    
    face_shapes: Optional[List[str]] = []
    frame_shapes: Optional[List[str]] = []
    frame_materials: Optional[List[str]] = []
    frame_colors: Optional[List[str]] = []
    
    lens_shapes: Optional[List[str]] = []
    lens_colors: Optional[List[str]] = []
    
    arm_size_mm: Optional[List[int]] = []
    lens_size_mm: Optional[List[int]] = []
    bridge_size_mm: Optional[List[int]] = []
    pd_mm: Optional[List[int]] = []
    
    supports_power: Optional[bool] = False
    prescription_types: Optional[List[str]] = []
    
    sph_min: Optional[float] = None
    sph_max: Optional[float] = None
    cyl_min: Optional[float] = None
    cyl_max: Optional[float] = None
    axis_min: Optional[int] = None
    axis_max: Optional[int] = None
    
    blue_cut: Optional[bool] = False
    anti_glare: Optional[bool] = False
    
    usage: Optional[List[str]] = []
    
    price_usd: Optional[float] = None
    power_price_usd: Optional[float] = None
    currency: Optional[str] = "USD"
    
    stock: Optional[int] = 0
    rating: Optional[float] = 4.5
    
    keywords: Optional[List[str]] = []
    tone_descriptors: Optional[List[str]] = []
    style_tags: Optional[List[str]] = []
    recommended_for: Optional[List[str]] = []
    occasion: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    
    images: Optional[List[str]] = []

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
