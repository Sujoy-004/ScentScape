import logging
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

try:
    from pinecone import Pinecone
    from sentence_transformers import SentenceTransformer
except ImportError:
    Pinecone = None
    SentenceTransformer = None

router = APIRouter(prefix="/recommendations", tags=["recommendations"])
logger = logging.getLogger(__name__)

# Lazy loading of models and clients to avoid blocking startup if missing
_model = None
_pinecone = None
_index_desc = None
_index_graph = None


def _allow_mock_recommendations() -> bool:
    return os.getenv("SCENTSCAPE_ALLOW_MOCK_RECOMMENDATIONS", "false").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

def get_model():
    global _model
    if _model is None and SentenceTransformer is not None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def get_pinecone():
    global _pinecone, _index_desc, _index_graph
    if _pinecone is None and Pinecone is not None:
        api_key = os.environ.get("PINECONE_API_KEY")
        if api_key and api_key != "your_pinecone_api_key_here":
            try:
                _pinecone = Pinecone(api_key=api_key)
                # Attempt to get index references
                _index_desc = _pinecone.Index("scentscape-descriptions")
                _index_graph = _pinecone.Index("scentscape-graph")
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone: {e}")
    return _pinecone

class FragranceRecommendation(BaseModel):
    id: str
    name: str
    brand: str
    match_score: float
    reason: str
    mock: bool = False

@router.get("/for-me", response_model=List[FragranceRecommendation])
async def get_personalized_recommendations(user_id: str = "current_user"):
    """
    Returns Bayesian Personalized Ranking recommendations based on user ratings.
    """
    logger.info(f"Generating personalized recommendations for user {user_id}")
    
    if not _allow_mock_recommendations():
        raise HTTPException(
            status_code=503,
            detail="Personalized recommendations are unavailable until ranking services are fully configured.",
        )

    # Mock mode is explicitly controlled for local/demo usage.
    return [
        {
            "id": "1",
            "name": "Oud Wood",
            "brand": "Tom Ford",
            "match_score": 94.5,
            "reason": "Based on your high rating of Santal 33",
            "mock": True,
        },
        {
            "id": "2",
            "name": "Baccarat Rouge 540",
            "brand": "Maison Francis Kurkdjian",
            "match_score": 89.0,
            "reason": "Matches your preference for Amber floral profiles",
            "mock": True,
        }
    ]

@router.get("/similar/{fragrance_id}", response_model=List[FragranceRecommendation])
async def get_similar_fragrances(
    fragrance_id: str,
    limit: int = Query(5, ge=1, le=20)
):
    """
    Returns similar fragrances using combined GraphSAGE + Sentence-BERT cosine similarity.
    Queries Pinecone 'scentscape-graph' and 'scentscape-descriptions' indices.
    """
    get_pinecone()
    
    if _index_graph is None:
        if not _allow_mock_recommendations():
            raise HTTPException(
                status_code=503,
                detail="Graph recommendation index is unavailable.",
            )

        logger.warning("Pinecone index not available, returning mock fallback")
        return [
            {
                "id": "4",
                "name": "Santal 33",
                "brand": "Le Labo",
                "match_score": 92.1,
                "reason": "Shares 4 accords and similar woody profile",
                "mock": True,
            }
        ]
        
    try:
        # We query the vector of the existing ID to get its exact embedding
        fetch_response = _index_graph.fetch(ids=[fragrance_id])
        if fragrance_id not in fetch_response.vectors:
            raise HTTPException(status_code=404, detail="Fragrance not found in graph index")
            
        vector = fetch_response.vectors[fragrance_id].values
        
        # Query nearest neighbors
        query_res = _index_graph.query(
            vector=vector,
            top_k=limit + 1,  # +1 to filter out self
            include_metadata=True
        )
        
        matches = []
        for match in query_res.matches:
            if match.id != fragrance_id:
                matches.append({
                    "id": match.id,
                    "name": match.metadata.get("name", "Unknown"),
                    "brand": match.metadata.get("brand", "Unknown"),
                    "match_score": round(match.score * 100, 1),
                    "reason": "Structurally similar notes and accords (GraphSAGE)",
                    "mock": False,
                })
        return matches[:limit]
    except Exception as e:
        logger.error(f"Pinecone query failed: {e}")
        raise HTTPException(status_code=500, detail="Recommendation generation failed")

@router.get("/text", response_model=List[FragranceRecommendation])
async def search_by_text(
    q: str = Query(..., min_length=3, description="Natural language search query"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Natural language search using Sentence-BERT embeddings.
    e.g., 'smoky vanilla with leather notes' -> Pinecone ANN
    """
    model = get_model()
    get_pinecone()
    
    if model is None or _index_desc is None:
        if not _allow_mock_recommendations():
            raise HTTPException(
                status_code=503,
                detail="Text recommendation services are unavailable.",
            )

        logger.warning(f"ML services unavailable. Returning mock text search for: {q}")
        return [
            {
                "id": "5",
                "name": "Rose 31",
                "brand": "Byredo",
                "match_score": 88.5,
                "reason": f"Semantic match for '{q}'",
                "mock": True,
            }
        ]
        
    try:
        # Encode Query
        query_vector = model.encode([q])[0].tolist()
        
        # Search in Pinecone
        query_res = _index_desc.query(
            vector=query_vector,
            top_k=limit,
            include_metadata=True
        )
        
        matches = []
        for match in query_res.matches:
            matches.append({
                "id": match.id,
                "name": match.metadata.get("name", "Unknown"),
                "brand": match.metadata.get("brand", "Unknown"),
                "match_score": round(match.score * 100, 1),
                "reason": f"Semantic match for '{q}'",
                "mock": False,
            })
            
        return matches
    except Exception as e:
        logger.error(f"Text search failed: {e}")
        raise HTTPException(status_code=500, detail="Text search failed")

@router.post("/rebuild-embeddings")
async def trigger_rebuild_embeddings():
    """
    Trigger async rebuild for text and graph embeddings.
    """
    try:
        from app.tasks.recommend_tasks import rebuild_embeddings_task

        task = rebuild_embeddings_task.delay()
        logger.info(f"Triggered embedding rebuild task: {task.id}")
        return {
            "status": "accepted",
            "task_id": task.id,
            "message": "Embedding rebuild task queued.",
        }
    except Exception as e:
        logger.error(f"Failed to trigger embedding rebuild task: {e}")
        raise HTTPException(status_code=500, detail="Failed to queue embedding rebuild task")
