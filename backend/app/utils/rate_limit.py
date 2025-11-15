"""Rate limiting dependency for FastAPI"""
from fastapi import Request, HTTPException
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

def check_rate_limit(limit: str):
    """Dependency factory for rate limiting"""
    async def rate_limit_dependency(request: Request):
        limiter = request.app.state.limiter
        # Manually check rate limit by creating a test endpoint function
        # and applying the decorator, then calling it
        async def test_func(request: Request):
            return None
        
        # Apply decorator to test function
        decorated_func = limiter.limit(limit)(test_func)
        
        try:
            # Call the decorated function to trigger rate limit check
            await decorated_func(request)
        except RateLimitExceeded:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded: {limit}. Please try again later."
            )
    return rate_limit_dependency

