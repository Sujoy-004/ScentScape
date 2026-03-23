"""T2.4: Fragrance search and recommendation endpoints.

Provides endpoints for:
- Get fragrance details by ID
- Search fragrances by name, brand, accords
- Text-based recommendation queries (async)
- User-profile-based recommendations (async)
"""

import asyncio
import logging
from typing import Optional, List
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, status, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_optional_user_id
from app.database import get_session
from app.schemas.schemas import (
    FragranceDetail,
    FragranceSearchResult,
    TextRecommendationRequest,
    RecommendationJob,
    RecommendationResult,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/fragrances", tags=["fragrances"])

# In-memory job cache (in production: use Redis)
recommendation_jobs = {}


@router.get("/{fragrance_id}", response_model=FragranceDetail)
async def get_fragrance_detail(
    fragrance_id: str,
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> FragranceDetail:
    """Get fragrance detail including notes, accords, and similarity to user profile.
    
    Args:
        fragrance_id: Neo4j fragrance ID
        user_id: Optional authenticated user (for personalized similarity score)
        
    Returns:
        Fragrance detail with notes, accords, optional similarity score
        
    Raises:
        HTTPException: 404 if fragrance not found
    """
    # TODO: Query Neo4j for fragrance by ID
    # TODO: If user_id provided, calculate similarity to user taste vector
    
    logger.info(f"GET /fragrances/{fragrance_id} (user: {user_id})")
    
    # Placeholder response
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Fragrance not found",
    )


@router.get("/search", response_model=List[FragranceSearchResult])
async def search_fragrances(
    q: Optional[str] = Query(None, min_length=1, max_length=100),
    brand: Optional[str] = Query(None),
    accord: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> List[FragranceSearchResult]:
    """Search fragrances by name, brand, or accord.
    
    Args:
        q: Fragrance name search query
        brand: Brand name filter
        accord: Accord filter
        limit: Max results (default 10, max 50)
        user_id: Optional authenticated user (for personalized similarity)
        
    Returns:
        List of FragranceSearchResult with top accords and optional similarity score
    """
    # TODO: Query Neo4j using full-text search or Cypher patterns
    # TODO: If user_id provided, score each result against user taste vector
    
    logger.info(f"GET /fragrances/search (q: {q}, brand: {brand}, accord: {accord}, limit: {limit})")
    
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
    
    # TODO: Enqueue Celery task for async recommendation generation
    # TODO: Task will encode query with Sentence-BERT, score against all fragrances,
    #       optionally apply user taste vector, rank and store results
    
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
            generated_at=job.get("generated_at"),
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
    
    # TODO: Enqueue Celery task for async recommendation
    # TODO: Task will retrieve user taste vector from cache/DB,
    #       score all fragrances via GraphSAGE + BPR personalization,
    #       rank and store results
    
    return RecommendationJob(
        job_id=job_id,
        status="processing",
        message="Generating personalized recommendations...",
    )
