import os
import numpy as np
from google import genai
from dotenv import load_dotenv
from functools import lru_cache

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class EmbeddingService:

    @staticmethod
    @lru_cache(maxsize=128)
    def embed_text(text: str) -> list[float]:
        try:
            result = client.models.embed_content(
                model="gemini-embedding-001",
                contents=text,
                config={'output_dimensionality': 3072}
            )
            return result.embeddings[0].values
        except Exception as e:
            print(f"Embedding error: {e}")
            return [0.0] * 3072
