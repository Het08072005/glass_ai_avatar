import time
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models.product import Product
from app.services.embedding_service import EmbeddingService
from app.utils.text_builder import build_product_text

def ensure_tables():
    """Ensure tables exist without dropping existing data."""
    print("--- Ensuring Database Tables Exist ---")
    # This will create tables if they don't exist, but won't drop existing ones or data.
    Base.metadata.create_all(bind=engine)
    print("DONE: Tables verified.")

def process_batch():
    """
    Process all products that are missing embeddings.
    Uses 3072-dimensional embeddings via Gemini (gemini-embedding-001).
    """
    db: Session = SessionLocal()
    try:
        print(f"\n--- Checking for products missing embeddings ---")
        
        # Get all products missing embeddings, ordered by ID
        products = db.query(Product).filter(
            Product.embedding.is_(None)
        ).order_by(Product.id).all()
        
        if not products:
            print("No more products missing embeddings. Your database is fully updated!")
            return False

        print(f"Found {len(products)} products to process.")

        for product in products:
            try:
                # 1. Build the comprehensive text content using all product fields
                rich_text = build_product_text(product)
                
                if not rich_text.strip():
                    print(f"Skipping {product.name} (ID: {product.id}): No text content found.")
                    continue
                
                print(f"Processing: [{product.name}] (ID: {product.id})")
                
                # 2. Generate 3072-dim embedding from Gemini
                embedding_vector = EmbeddingService.embed_text(rich_text)
                
                # 3. Save to database
                product.embedding = embedding_vector
                db.commit()
                print(f"--> SUCCESS: Embedded with 3072 dimensions.")
                
                # Rate limit safety
                time.sleep(0.5) 
            except Exception as e:
                print(f"--> ERROR on product '{product.name}': {e}")
                db.rollback()
                
        print(f"\nProcessing of {len(products)} items complete.")
        return True
    finally:
        db.close()

if __name__ == "__main__":
    print("==================================================")
    print("   E-COMMERCE PRODUCT EMBEDDING GENERATOR (NDB)   ")
    print("==================================================")
    
    # 1. Ensure schema is correct but DO NOT delete any existing data
    ensure_tables()
    
    # 2. Process all products
    has_processed = process_batch()
    
    if has_processed:
        print("\n[INFO] All missing embeddings have been generated.")
    else:
        print("\n[INFO] Database was already up to date.")
    print("==================================================")
