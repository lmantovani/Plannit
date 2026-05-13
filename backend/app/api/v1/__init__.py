from fastapi import APIRouter
from app.api.v1.endpoints import auth, leads, briefings, dashboard, users

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(leads.router)
api_router.include_router(briefings.router)
api_router.include_router(dashboard.router)
