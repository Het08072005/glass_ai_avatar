import re
from typing import Dict, Any, List

class QueryParser:
    BRANDS = [
        "adidas", "akoni", "alexander mcqueen", "all saints", "arnette", "balenciaga", "balmain", "bolle", "boss", 
        "bottega veneta", "burberry", "calvin klein", "canada goose", "carolina herrera", "carrera", "chloe", 
        "chopard", "coach", "david beckham", "dita", "dkny", "dolce&gabbana", "dragon", "dsquared2", 
        "emporio armani", "eyevan", "ferragamo", "ferrari", "gant", "gucci", "guess", "hugo", "jacquemus", 
        "jimmy choo", "kate spade", "lacoste", "linda farrow", "longchamp", "love moschino", "marc jacobs", 
        "maxmara", "michael kors", "moncler", "montblanc", "moschino", "mulberry", "mykita", "nike", 
        "oakley", "off-white", "oliver peoples", "palm angels", "paul smith", "persol", "philipp plein", 
        "polaroid", "police", "polo ralph lauren", "porsche design", "puma", "ralph lauren", "ray ban", "ray-ban", 
        "revo", "rudy project", "saint laurent", "serengeti", "smith", "swarovski", "ted baker", "tiffany", 
        "tom ford", "tommy hilfiger", "under armour", "valentino", "versace", "victoria beckham", 
        "vivienne westwood", "vogue", "zeiss"
    ]
    
    COLORS = ["black", "white", "red", "blue", "green", "grey", "gray", "navy", "brown", "pink", "yellow", "orange", "silver", "gold", "tortoise", "clear", "gunmetal", "cream", "rose gold"]
    
    GENDER_MAP = {
        "men": "mens", "man": "mens", "male": "mens", "boys": "childrens",
        "women": "womens", "woman": "womens", "female": "womens", "girls": "childrens",
        "unisex": "unisex", "kids": "childrens", "childrens": "childrens", "teen": "teen"
    }
    
    FACE_SHAPES = ["oval", "round", "heart", "square", "diamond", "oblong"]
    FRAME_SHAPES = ["rectangular", "aviator", "wayfarer", "round", "cat-eye", "oval", "square", "oversized", "geometric"]
    OCCASIONS = ["formal", "casual", "beach", "party", "sports", "office", "travel", "wedding"]
    
    STOP_WORDS = {"show", "me", "find", "please", "want", "buy", "looking", "for", "with", "in", "a", "an", "the", "and", "or", "glasses", "sunglasses", "color", "style", "type", "kind", "brand", "model"}
    
    PRICE_MAX_WORDS = ["under", "below", "less than", "upto", "within", "max"]
    PRICE_MIN_WORDS = ["above", "over", "more than", "starting", "min", "atleast"]
    CATEGORIES = ["sunglasses", "prescription", "frames", "blue light", "reading", "eyeglasses", "optical", "luxury"]

    @staticmethod
    def _normalize_price(val: str) -> int:
        val = val.lower().replace(",", "").replace(" ", "").strip()
        try:
            if "k" in val:
                return int(float(val.replace("k", "")) * 1000)
            return int(float(val))
        except (ValueError, TypeError):
            return 0

    @staticmethod
    def parse(text: str) -> Dict[str, Any]:
        original_text = text
        text = text.lower()
        
        filters = {
            "min_price": None,
            "max_price": None,
            "brands": [],
            "colors": [],
            "genders": [],
            "categories": [],
            "face_shapes": [],
            "frame_shapes": [],
            "occasions": [],
            "is_popular_intent": False
        }

        # Handle Price Range
        range_match = re.search(r'(\d+(?:\.\d+)?k?)\s*(?:to|and|-)\s*(\d+(?:\.\d+)?k?)', text)
        if range_match:
            filters["min_price"] = QueryParser._normalize_price(range_match.group(1))
            filters["max_price"] = QueryParser._normalize_price(range_match.group(2))
            text = text.replace(range_match.group(0), " ")

        if filters["max_price"] is None:
            for w in QueryParser.PRICE_MAX_WORDS:
                m = re.search(rf'{w}\s*(\d+(?:\.\d+)?k?)', text)
                if m: 
                    filters["max_price"] = QueryParser._normalize_price(m.group(1))
                    text = text.replace(m.group(0), " ")
        
        if filters["min_price"] is None:
            for w in QueryParser.PRICE_MIN_WORDS:
                m = re.search(rf'{w}\s*(\d+(?:\.\d+)?k?)', text)
                if m: 
                    filters["min_price"] = QueryParser._normalize_price(m.group(1))
                    text = text.replace(m.group(0), " ")

        # Extract Brands
        for brand in QueryParser.BRANDS:
            if re.search(rf'\b{re.escape(brand)}\b', text):
                filters["brands"].append(brand)
                text = text.replace(brand, " ")
        
        # Extract Colors
        for color in QueryParser.COLORS:
            if re.search(rf'\b{re.escape(color)}\b', text):
                filters["colors"].append(color)
                text = text.replace(color, " ")

        # Extract Categories
        for cat in QueryParser.CATEGORIES:
            if re.search(rf'\b{re.escape(cat)}\b', text):
                filters["categories"].append(cat)
                text = text.replace(cat, " ")

        # Extract Genders
        for k, v in QueryParser.GENDER_MAP.items():
            if re.search(rf'\b{re.escape(k)}\b', text):
                if v not in filters["genders"]:
                    filters["genders"].append(v)
                text = text.replace(k, " ")
        
        # Extract Face Shapes
        for shape in QueryParser.FACE_SHAPES:
            if re.search(rf'\b{re.escape(shape)}\b', text):
                filters["face_shapes"].append(shape)
                text = text.replace(shape, " ")

        # Extract Frame Shapes
        for shape in QueryParser.FRAME_SHAPES:
            if re.search(rf'\b{re.escape(shape)}\b', text):
                filters["frame_shapes"].append(shape)
                text = text.replace(shape, " ")

        # Extract Occasions
        for occ in QueryParser.OCCASIONS:
            if re.search(rf'\b{re.escape(occ)}\b', text):
                filters["occasions"].append(occ)
                text = text.replace(occ, " ")

        # Keywords
        clean_text = re.sub(r'[^a-z0-9\s]', ' ', text)
        words = clean_text.split()
        keywords = [w for w in words if w not in QueryParser.STOP_WORDS and len(w) > 2]

        return {
            "keywords": keywords,
            "filters": filters,
            "original": original_text
        }

def parse(query_text: str) -> dict:
    return QueryParser.parse(query_text)
