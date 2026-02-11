def build_product_text(product):
    """
    Builds a rich text representation of an eyewear product for embedding.
    """
    category_str = ", ".join(product.category) if product.category else ""
    gender_str = ", ".join(product.gender) if product.gender else ""
    face_shapes_str = ", ".join(product.face_shapes) if product.face_shapes else ""
    frame_shapes_str = ", ".join(product.frame_shapes) if product.frame_shapes else ""
    frame_materials_str = ", ".join(product.frame_materials) if product.frame_materials else ""
    frame_colors_str = ", ".join(product.frame_colors) if product.frame_colors else ""
    lens_shapes_str = ", ".join(product.lens_shapes) if product.lens_shapes else ""
    lens_colors_str = ", ".join(product.lens_colors) if product.lens_colors else ""
    prescription_types_str = ", ".join(product.prescription_types) if product.prescription_types else ""
    usage_str = ", ".join(product.usage) if product.usage else ""
    keywords_str = ", ".join(product.keywords) if product.keywords else ""
    tone_descriptors_str = ", ".join(product.tone_descriptors) if product.tone_descriptors else ""
    style_tags_str = ", ".join(product.style_tags) if product.style_tags else ""
    recommended_for_str = ", ".join(product.recommended_for) if product.recommended_for else ""
    occasion_str = ", ".join(product.occasion) if product.occasion else ""
    tags_str = ", ".join(product.tags) if product.tags else ""
    
    return f"""
    Name: {product.name}
    Brand: {product.brand}
    Category: {category_str}
    Gender: {gender_str}
    Description: {product.description}
    Technical Specs:
    - Face Shapes: {face_shapes_str}
    - Frame Shapes: {frame_shapes_str}
    - Materials: {frame_materials_str}
    - Colors: {frame_colors_str}, {lens_colors_str}
    - Prescription: {product.supports_power} (Types: {prescription_types_str})
    - Blue Cut: {product.blue_cut}, Anti-Glare: {product.anti_glare}
    - Frame/Lens Size: {product.lens_size_mm}mm lens, {product.arm_size_mm}mm arm, {product.bridge_size_mm}mm bridge
    Usage: {usage_str}
    Contextual:
    - Tone: {tone_descriptors_str}
    - Style: {style_tags_str}
    - Occasion/Recommended For: {occasion_str} / {recommended_for_str}
    Tags & Keywords: {tags_str}, {keywords_str}
    Commercial:
    - Price: {product.price_usd} {product.currency}
    - Stock: {product.stock} units available
    - Rating: {product.rating}/5.0
    """
