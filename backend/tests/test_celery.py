import pytest

from app.tasks.recommend_tasks import recommend_by_text_task, generate_user_embeddings_task

def test_generate_user_embeddings_task():
    """Test Celery task for generating user embeddings (synchronous execution)"""
    result = generate_user_embeddings_task.apply(args=[1])
    assert result.successful()
    assert result.result["status"] == "completed"
    assert result.result["user_id"] == 1

def test_recommend_by_text_task():
    """Test Celery task for text recommendations"""
    result = recommend_by_text_task.apply(args=["test_job_123", "vanilla and leather", 5])
    assert result.successful()
    assert result.result["job_id"] == "test_job_123"
    assert result.result["status"] == "completed"
