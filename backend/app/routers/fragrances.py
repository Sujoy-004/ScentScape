"""T2.4: Fragrance search and recommendation endpoints.

Provides endpoints for:
- Get fragrance details by ID
- Search fragrances by name, brand, accords
- Text-based recommendation queries (async)
- User-profile-based recommendations (async)
"""

from datetime import datetime, timezone
import logging
from typing import Optional, List, Dict, Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, status, Depends
import sys
import os
from celery.result import AsyncResult

from app.auth.dependencies import get_optional_user_id
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.celery_app import celery_app
from app.tasks.recommend_tasks import recommend_by_profile_task, recommend_by_text_task
from app.schemas.schemas import (
    FragranceDetail,
    FragranceSearchResult,
    TextRecommendationRequest,
    RecommendationJob,
    RecommendationResult,
    FragranceNote,
    FragranceAccord,
)

# Attempt to import neo4j local client
try:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
    from ml.graph.neo4j_client import get_neo4j, init_neo4j
except ImportError:
    pass

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/fragrances", tags=["fragrances"])

# In-memory job cache (in production: use Redis)
recommendation_jobs = {}

def get_graph_client():
    """Lazy initialize neo4j client"""
    try:
        from ml.graph.neo4j_client import get_neo4j, init_neo4j
        try:
            return get_neo4j()
        except RuntimeError:
            uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
            user = os.environ.get("NEO4J_USERNAME", "neo4j")
            pwd = os.environ.get("NEO4J_PASSWORD", "password")
            return init_neo4j(uri, user, pwd)
    except Exception as e:
        logger.error(f"Neo4j client init failed: {e}")
        return None


@router.get("", response_model=List[FragranceSearchResult])
async def list_fragrances(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    brand: Optional[str] = Query(None),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> List[FragranceSearchResult]:
    """List fragrances with lightweight pagination and optional brand filter."""
    client = get_graph_client()
    if not client:
        return []

    where_clause = ""
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    if brand:
        where_clause = "WHERE toLower(f.brand) CONTAINS toLower($brand)"
        params["brand"] = brand

    query = f"""
    MATCH (f:Fragrance)
    {where_clause}
    OPTIONAL MATCH (f)-[:BELONGS_TO_ACCORD]->(a:Accord)
    RETURN f, collect(distinct a.name) as accords
    SKIP $offset
    LIMIT $limit
    """

    try:
        results = client.execute_query(query, params)
        return [
            FragranceSearchResult(
                id=r["f"].get("id"),
                name=r["f"].get("name"),
                brand=r["f"].get("brand", "Unknown"),
                year=r["f"].get("year"),
                top_accords=list(r["accords"])[:3],
                similarity_score=None,
            )
            for r in results
        ]
    except Exception as e:
        logger.error(f"List fragrances query failed: {e}")
        return []

@router.get("/{fragrance_id}", response_model=FragranceDetail)
async def get_fragrance_detail(
    fragrance_id: str,
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> FragranceDetail:
    """Get fragrance detail including notes, accords, and similarity to user profile."""
    client = get_graph_client()
    if not client:
        logger.warning("Graph client unavailable. Returning mock data.")
        return FragranceDetail(
            id=fragrance_id,
            name="Mocked Fragrance",
            brand="Unknown",
            year=2024,
            concentration="EDP",
            description="Database unavailable."
        )

    query = """
    MATCH (f:Fragrance {id: $frag_id})
    OPTIONAL MATCH (f)-[r:HAS_NOTE]->(n:Note)
    OPTIONAL MATCH (f)-[a:BELONGS_TO_ACCORD]->(ac:Accord)
    RETURN f, collect(distinct {note: n.name, type: type(r), category: n.category}) as notes, 
           collect(distinct ac.name) as accords
    """
    try:
        results = client.execute_query(query, {"frag_id": fragrance_id})
        if not results:
            raise HTTPException(status_code=404, detail="Fragrance not found")
            
        record = results[0]
        f_node = record["f"]
        
        # Parse notes
        top, mid, base = [], [], []
        for n in record["notes"]:
            if n.get("note"):
                note_cat = n.get("category", "").lower()
                n_obj = FragranceNote(id=n["note"], name=n["note"], category=note_cat)
                if "top" in note_cat: top.append(n_obj)
                elif "mid" in note_cat: mid.append(n_obj)
                else: base.append(n_obj)
                
        # Parse accords
        accords = [FragranceAccord(id=a, name=a) for a in record["accords"] if a]
        
        return FragranceDetail(
            id=f_node.get("id", fragrance_id),
            name=f_node.get("name", "Unknown"),
            brand=f_node.get("brand", "Unknown"),
            year=f_node.get("year", None),
            concentration=f_node.get("concentration", "EDP"),
            gender_label=f_node.get("gender_label", "N/A"),
            description=f_node.get("description", ""),
            top_notes=top,
            middle_notes=mid,
            base_notes=base,
            accords=accords,
            similarity_score=None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Graph query failed: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@router.get("/search", response_model=List[FragranceSearchResult])
async def search_fragrances(
    q: Optional[str] = Query(None, min_length=1, max_length=100),
    brand: Optional[str] = Query(None),
    accord: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> List[FragranceSearchResult]:
    """Search fragrances by name, brand, or accord."""
    client = get_graph_client()
    if not client:
        return []

    # Simplified graph search
    conditions = []
    params: dict[str, Any] = {"limit": limit}
    
    if q:
        conditions.append("toLower(f.name) CONTAINS toLower($q)")
        params["q"] = q
    if brand:
        conditions.append("toLower(f.brand) CONTAINS toLower($brand)")
        params["brand"] = brand
        
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    
    query = f"""
    MATCH (f:Fragrance)
    {where_clause}
    OPTIONAL MATCH (f)-[:BELONGS_TO_ACCORD]->(a:Accord)
    RETURN f, collect(distinct a.name) as accords
    LIMIT $limit
    """
    
    try:
        results = client.execute_query(query, params)
        return [
            FragranceSearchResult(
                id=r["f"].get("id"),
                name=r["f"].get("name"),
                brand=r["f"].get("brand", "Unknown"),
                year=r["f"].get("year"),
                top_accords=list(r["accords"])[:3],
                similarity_score=None
            ) for r in results
        ]
    except Exception as e:
        logger.error(f"Search query failed: {e}")
        return []


@router.post("/recommend/text", response_model=RecommendationJob)
async def recommend_by_text(
    request: TextRecommendationRequest,
    user_id: Optional[int] = Depends(get_optional_user_id),
    session: AsyncSession = Depends(get_session),
) -> RecommendationJob:
    """Generate recommendation from text description (async job).
    
    Uses Sentence-BERT to encode the text query and returns top-10 similar fragrances
    based on description embeddings and user taste vector (if authenticated).
    
    Args:
        request: Text query and limit (default 10)
        user_id: Optional authenticated user for personalized scoring
        session: Database session
        
    Returns:
        RecommendationJob with job_id and processing status
    """
    job_id = str(uuid4())
    
    # Store job in cache with initial status
    recommendation_jobs[job_id] = {
        "status": "processing",
        "user_id": user_id,
        "query": request.query,
        "results": None,
        "error": None,
    }
    
    logger.info(f"Created recommendation job {job_id} for query: {request.query[:50]}")
    
    try:
        async_task = recommend_by_text_task.delay(
            job_id=job_id,
            query=request.query,
            limit=request.limit,
            user_id=user_id,
        )
        recommendation_jobs[job_id]["celery_task_id"] = async_task.id
    except Exception as e:
        logger.error(f"Failed to enqueue text recommendation task for {job_id}: {e}")
        recommendation_jobs[job_id]["status"] = "failed"
        recommendation_jobs[job_id]["error"] = str(e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Recommendation queue unavailable",
        )
    
    return RecommendationJob(
        job_id=job_id,
        status="processing",
        message="Recommendation generation started",
    )


@router.get("/recommend/{job_id}", response_model=RecommendationResult | RecommendationJob)
async def get_recommendation_result(
    job_id: str,
) -> dict:
    """Poll async recommendation job result.
    
    Args:
        job_id: Job ID from recommend endpoint
        
    Returns:
        RecommendationResult if complete, RecommendationJob if processing
        
    Raises:
        HTTPException: 404 if job not found
    """
    if job_id not in recommendation_jobs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    
    job = recommendation_jobs[job_id]

    if job["status"] == "processing" and job.get("celery_task_id"):
        result = AsyncResult(job["celery_task_id"], app=celery_app)
        if result.successful():
            payload = result.result if isinstance(result.result, dict) else {}
            job["status"] = "completed"
            job["results"] = payload.get("fragrances", [])
            raw_generated_at = payload.get("generated_at")
            if isinstance(raw_generated_at, datetime):
                job["generated_at"] = raw_generated_at
            elif isinstance(raw_generated_at, str):
                try:
                    job["generated_at"] = datetime.fromisoformat(raw_generated_at.replace("Z", "+00:00"))
                except ValueError:
                    job["generated_at"] = datetime.now(timezone.utc)
            else:
                job["generated_at"] = datetime.now(timezone.utc)
        elif result.failed():
            job["status"] = "failed"
            job["error"] = str(result.result)
    
    if job["status"] == "processing":
        return RecommendationJob(
            job_id=job_id,
            status="processing",
            message="Still generating recommendations...",
        )
    elif job["status"] == "completed":
        return RecommendationResult(
            job_id=job_id,
            fragrances=job["results"] or [],
            generated_at=job.get("generated_at") or datetime.now(timezone.utc),
        )
    elif job["status"] == "failed":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=job.get("error", "Recommendation generation failed"),
        )


@router.post("/recommend/profile", response_model=RecommendationJob)
async def recommend_by_profile(
    limit: int = Query(10, ge=1, le=50),
    user_id: int = Depends(get_optional_user_id),
    session: AsyncSession = Depends(get_session),
) -> RecommendationJob:
    """Generate recommendations based on user's fragrance ratings (async job).
    
    Requires authentication. Uses user's taste vector built from their ratings
    to personalize recommendations via Bayesian Personalized Ranking (BPR).
    
    Args:
        limit: Max recommendations to return
        user_id: Current authenticated user
        session: Database session
        
    Returns:
        RecommendationJob with job_id and processing status
        
    Raises:
        HTTPException: 401 if user not authenticated
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for profile-based recommendations",
        )
    
    job_id = str(uuid4())
    
    # Store job
    recommendation_jobs[job_id] = {
        "status": "processing",
        "user_id": user_id,
        "query": None,
        "results": None,
        "error": None,
    }
    
    logger.info(f"Created profile recommendation job {job_id} for user {user_id}")
    
    try:
        async_task = recommend_by_profile_task.delay(
            job_id=job_id,
            user_id=user_id,
            limit=limit,
        )
        recommendation_jobs[job_id]["celery_task_id"] = async_task.id
    except Exception as e:
        logger.error(f"Failed to enqueue profile recommendation task for {job_id}: {e}")
        recommendation_jobs[job_id]["status"] = "failed"
        recommendation_jobs[job_id]["error"] = str(e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Recommendation queue unavailable",
        )
    
    return RecommendationJob(
        job_id=job_id,
        status="processing",
        message="Generating personalized recommendations...",
    )
