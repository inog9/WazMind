"""
Simple in-memory cache for frequently accessed data
"""
import time
from typing import Optional, Any
from functools import wraps

class SimpleCache:
    """Simple in-memory cache with TTL"""
    def __init__(self):
        self._cache = {}
        self._ttl = {}
    
    def get(self, key: str, default: Any = None) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key in self._cache:
            if key in self._ttl:
                if time.time() < self._ttl[key]:
                    return self._cache[key]
                else:
                    # Expired, remove it
                    del self._cache[key]
                    del self._ttl[key]
            else:
                return self._cache[key]
        return default
    
    def set(self, key: str, value: Any, ttl: int = 60) -> None:
        """Set value in cache with TTL in seconds"""
        self._cache[key] = value
        self._ttl[key] = time.time() + ttl
    
    def delete(self, key: str) -> None:
        """Delete key from cache"""
        if key in self._cache:
            del self._cache[key]
        if key in self._ttl:
            del self._ttl[key]
    
    def clear(self) -> None:
        """Clear all cache"""
        self._cache.clear()
        self._ttl.clear()
    
    def invalidate_pattern(self, pattern: str) -> None:
        """Invalidate all keys matching pattern"""
        keys_to_delete = [k for k in self._cache.keys() if pattern in k]
        for key in keys_to_delete:
            self.delete(key)

# Global cache instance
cache = SimpleCache()

def cached(ttl: int = 60):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
            
            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl=ttl)
            return result
        return wrapper
    return decorator

