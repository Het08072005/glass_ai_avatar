from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from app.models.product import Product
from app.services.embedding_service import EmbeddingService
from app.utils.query_parser import parse
from app.utils.text_builder import build_product_text

class SearchService:

    @staticmethod
    def add_product(db: Session, product: Product):
        """
        Adds a product to DB with embedding.
        """
        text = build_product_text(product)
        product.embedding = EmbeddingService.embed_text(text)

        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 20, filters: dict = None):
        query = db.query(Product)
        
        if filters:
            # Handle text search within get_all if q is provided
            if filters.get("q"):
                q = filters["q"]
                query = query.filter(
                    or_(
                        Product.name.ilike(f"%{q}%"),
                        Product.brand.ilike(f"%{q}%"),
                        Product.description.ilike(f"%{q}%"),
                        Product.tags.any(q)
                    )
                )
            
            # Apply all other filters using the helper
            query = SearchService._apply_filters(query, filters)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def _apply_filters(query, filters):
        """Standard SQL hard-filters for UI constraints (Sidebar, etc.)"""
        if not filters: return query
        
        # Clean filters: remove 'all', empty strings, or None
        active_filters = {k: v for k, v in filters.items() if v not in [None, '', 'all', ['all']]}
        if not active_filters: return query

        # Helper to convert potential single value to list
        def to_list(val):
            if isinstance(val, list): return [v for v in val if v not in [None, '', 'all']]
            if isinstance(val, str) and "," in val: return [v.strip() for v in val.split(",") if v.strip() not in [None, '', 'all']]
            return [val] if val not in [None, '', 'all'] else []

        # Brand (Supports multiple)
        if "brand" in active_filters:
            brands = to_list(active_filters["brand"])
            if brands:
                query = query.filter(or_(*[Product.brand.ilike(f"%{b}%") for b in brands]))
        
        # Robust Array Filters (Case Insensitive, Supports Multi-select)
        for key, db_col in [("category", "category"), ("gender", "gender"), 
                          ("face_shape", "face_shapes"), ("frame_shape", "frame_shapes"),
                          ("occasion", "occasion"), ("frame_color", "frame_colors"),
                          ("lens_color", "lens_colors"), ("lens_shape", "lens_shapes"),
                          ("usage", "usage")]:
            if key in active_filters:
                vals = to_list(active_filters[key])
                if vals:
                    clauses = []
                    for i, v in enumerate(vals):
                        param_key = f"val_{key}_{i}"
                        clauses.append(text(f"ARRAY_TO_STRING({db_col}, ', ') ILIKE :{param_key}"))
                    
                    query = query.filter(or_(*clauses))
                    # Add all params at once
                    params = {f"val_{key}_{i}": f"%{v}%" for i, v in enumerate(vals)}
                    query = query.params(**params)

        # Integer Array Filters (Exact Match, Supports Multi-select)
        for key, db_col in [("arm_size", "arm_size_mm"), ("lens_size", "lens_size_mm"), ("bridge_size", "bridge_size_mm")]:
            if key in active_filters:
                vals = to_list(active_filters[key])
                if vals:
                    target_ints = []
                    for v in vals:
                        try:
                            # Handle "140mm" or 140
                            clean_val = int(''.join(filter(str.isdigit, str(v))))
                            target_ints.append(clean_val)
                        except: pass
                    
                    if target_ints:
                        # Use any() which translates to 'val = ANY(col)'
                        # For multiple values, we want OR(col.any(v1), col.any(v2)...)
                        col_attr = getattr(Product, db_col)
                        query = query.filter(or_(*[col_attr.any(v) for v in target_ints]))

        # Price Range
        min_p = active_filters.get("min_price")
        max_p = active_filters.get("max_price")
        if min_p:
            try: query = query.filter(Product.price_usd >= float(min_p))
            except: pass
        if max_p:
            try: query = query.filter(Product.price_usd <= float(max_p))
            except: pass
            
        return query

    @staticmethod
    def basic_search(db: Session, query_text: str, skip: int = 0, limit: int = 20, filters: dict = None):
        """Standard SQL-only search"""
        parsed = parse(query_text)
        merged_filters = parsed.get("filters", {}).copy()
        if filters:
            merged_filters.update(filters)

        query = db.query(Product)
        
        if parsed.get("keywords"):
            for kw in parsed["keywords"]:
                query = query.filter(or_(
                    Product.name.ilike(f"%{kw}%"),
                    Product.brand.ilike(f"%{kw}%"),
                    Product.description.ilike(f"%{kw}%"),
                    Product.tags.any(kw),
                    Product.style_tags.any(kw),
                    Product.keywords.any(kw)
                ))
        else:
            # Default to checking the whole query string if no specific keywords parsed
            query = query.filter(
                or_(
                    Product.name.ilike(f"%{query_text}%"),
                    Product.brand.ilike(f"%{query_text}%"),
                    Product.description.ilike(f"%{query_text}%")
                )
            )
        
        query = SearchService._apply_filters(query, merged_filters)
        products = query.offset(skip).limit(limit).all()

        return {"products": products, "parsed": parsed}

    @staticmethod
    def hybrid_search(db: Session, query_text: str, skip: int = 0, limit: int = 20, filters: dict = None):
        """
        'Intelligent Sales Agent' Hybrid Search v4.
        Treats identified brands as 'Hard Intent' constraints while boosting other stylistic features.
        """
        try:
            # 1. Normalize and Deep Parse
            query_clean = query_text.lower().replace("gray", "grey")
            parsed = parse(query_clean)
            intent = parsed.get("filters", {})
            keywords = [k for k in parsed.get("keywords", []) if len(k) > 1]

            # 2. Vector Semantic Baseline
            query_embedding = EmbeddingService.embed_text(query_text)
            distance_expr = Product.embedding.cosine_distance(query_embedding)
            # Baseline similarity: Range [0..20]
            vector_relevance = (2.0 - distance_expr) * 10.0

            # 3. Intelligent Metadata Boosting
            k_parts, k_params = ["0"], {}
            
            # --- High Weight: Brands & Names (Explicitly mentioned brands get massive boost) ---
            query_brands = intent.get("brands", [])
            for i, b in enumerate(query_brands):
                pk = f"v_br_{i}"
                k_params[pk] = f"%{b}%"
                k_parts.append(f"(CASE WHEN brand ILIKE :{pk} THEN 500.0 ELSE 0 END)")
                k_parts.append(f"(CASE WHEN name ILIKE :{pk} THEN 100.0 ELSE 0 END)")

            # --- Medium Weight: Colors & Main Categories ---
            for i, c in enumerate(intent.get("colors", [])):
                pk = f"v_cl_{i}"
                k_params[pk] = f"%{c}%"
                k_parts.append(f"(CASE WHEN ARRAY_TO_STRING(frame_colors, ', ') ILIKE :{pk} THEN 40.0 ELSE 0 END)")
                k_parts.append(f"(CASE WHEN ARRAY_TO_STRING(lens_colors, ', ') ILIKE :{pk} THEN 30.0 ELSE 0 END)")
                k_parts.append(f"(CASE WHEN description ILIKE :{pk} THEN 10.0 ELSE 0 END)")
            
            for i, cat in enumerate(intent.get("categories", [])):
                pk = f"v_ct_{i}"
                k_params[pk] = f"%{cat}%"
                k_parts.append(f"(CASE WHEN ARRAY_TO_STRING(category, ', ') ILIKE :{pk} THEN 50.0 ELSE 0 END)")

            # --- Contextual Boosts: Gender, Occasion, Shapes ---
            for i, g in enumerate(intent.get("genders", [])):
                pk = f"v_gd_{i}"
                k_params[pk] = f"%{g}%"
                k_parts.append(f"(CASE WHEN ARRAY_TO_STRING(gender, ', ') ILIKE :{pk} THEN 20.0 ELSE 0 END)")

            for i, occ in enumerate(intent.get("occasions", [])):
                pk = f"v_oc_{i}"
                k_params[pk] = f"%{occ}%"
                k_parts.append(f"(CASE WHEN ARRAY_TO_STRING(occasion, ', ') ILIKE :{pk} THEN 30.0 ELSE 0 END)")
                k_parts.append(f"(CASE WHEN ARRAY_TO_STRING(style_tags, ', ') ILIKE :{pk} THEN 15.0 ELSE 0 END)")

            # --- Descriptive/Long-tail Keywords ---
            for i, kw in enumerate(keywords):
                pk = f"v_kw_{i}"
                k_params[pk] = f"%{kw}%"
                k_parts.append(f"(CASE WHEN name ILIKE :{pk} THEN 20.0 ELSE 0 END)")
                k_parts.append(f"(CASE WHEN description ILIKE :{pk} THEN 10.0 ELSE 0 END)")
                k_parts.append(f"(CASE WHEN (ARRAY_TO_STRING(tags, ', ') ILIKE :{pk} OR ARRAY_TO_STRING(keywords, ', ') ILIKE :{pk}) THEN 5.0 ELSE 0 END)")

            k_score_expr = text(" + ".join(k_parts))

            # 4. Final Unified Relevance Score
            unified_score = vector_relevance + k_score_expr

            # 5. Strategic Execution
            base_query = db.query(Product, unified_score.label("relevance"))\
                           .filter(Product.embedding.is_not(None))\
                           .params(**k_params)
            
            # --- HARD Constraint: If a brand is mentioned, restrict to that brand ---
            if query_brands:
                base_query = base_query.filter(or_(*[Product.brand.ilike(f"%{b}%") for b in query_brands]))

            # Apply Hard UI Filters (Sidebar)
            filtered_query = SearchService._apply_filters(base_query, filters)
            results = filtered_query.order_by(text("relevance DESC")).offset(skip).limit(limit).all()

            # 6. Sales Agent Fallback (No dead-ends)
            # Only relax constraints if NO explicit UI filters are active.
            # If the user expressly clicked a filter, we should respect it.
            active_ui_filters = filters and any(v not in [None, '', 'all'] for v in filters.values())

            if not results and not active_ui_filters and query_brands:
                print(f"Sales Agent Fallback: Relaxing strict constraints for '{query_text}'.")
                # Drop hard filters but keep high relevance boosts
                results = db.query(Product, unified_score.label("relevance"))\
                           .filter(Product.embedding.is_not(None))\
                           .params(**k_params)\
                           .order_by(text("relevance DESC")).offset(skip).limit(limit).all()

            return {
                "products": [r[0] for r in results],
                "parsed": parsed,
                "meta": {
                    "count": len(results),
                    "search_strategy": "sales_agent_hybrid_v4",
                    "hard_brand_filter": bool(query_brands)
                }
            }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return SearchService.basic_search(db, query_text, skip, limit, filters)
