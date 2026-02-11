from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSON
from pgvector.sqlalchemy import Vector
from app.database import Base

class Product(Base):
    __tablename__ = "eyewear_products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)
    brand = Column(String)

    category = Column(ARRAY(String))
    gender = Column(ARRAY(String))

    description = Column(String)

    face_shapes = Column(ARRAY(String))
    frame_shapes = Column(ARRAY(String))
    frame_materials = Column(ARRAY(String))
    frame_colors = Column(ARRAY(String))

    lens_shapes = Column(ARRAY(String))
    lens_colors = Column(ARRAY(String))

    arm_size_mm = Column(ARRAY(Integer))
    lens_size_mm = Column(ARRAY(Integer))
    bridge_size_mm = Column(ARRAY(Integer))
    pd_mm = Column(ARRAY(Integer))

    supports_power = Column(Boolean)
    prescription_types = Column(ARRAY(String))

    sph_min = Column(Float)
    sph_max = Column(Float)
    cyl_min = Column(Float)
    cyl_max = Column(Float)
    axis_min = Column(Integer)
    axis_max = Column(Integer)

    blue_cut = Column(Boolean)
    anti_glare = Column(Boolean)

    usage = Column(ARRAY(String))

    price_usd = Column(Float)
    power_price_usd = Column(Float)
    currency = Column(String)

    stock = Column(Integer)
    rating = Column(Float)

    keywords = Column(ARRAY(String))
    tone_descriptors = Column(ARRAY(String))
    style_tags = Column(ARRAY(String))
    recommended_for = Column(ARRAY(String))
    occasion = Column(ARRAY(String))
    tags = Column(ARRAY(String))

    images = Column(ARRAY(String))
    
    # Keeping compatibility with existing vector search
    embedding = Column(Vector(3072)) # Using 3072 as requested