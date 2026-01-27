from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.core.config import *
from app.api.dependencies import get_authorized_user, get_admin_user


router = APIRouter(prefix="/dashboard")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

@router.get("/", response_class=HTMLResponse)
async def dashboard(request: Request, user: dict = Depends(get_authorized_user)):
    return templates.TemplateResponse("dashboard.html", {
        "request": request, 
        "user": user, 
        "is_admin": (user['is_admin'] == 1)
    })

@router.get("/deny", response_class=HTMLResponse)
async def deny_page(request: Request, user: dict = Depends(get_admin_user)):
    return templates.TemplateResponse("deny.html", {"request": request, "user": user})

@router.get("/confirmations", response_class=HTMLResponse)
async def confirmations_page(request: Request, user: dict = Depends(get_admin_user)):
    return templates.TemplateResponse("confirmations.html", {"request": request, "user": user})

@router.get("/send_message", response_class=HTMLResponse)
async def send_message_page(request: Request, user: dict = Depends(get_authorized_user)):
    return templates.TemplateResponse("send_message.html", {
        "request": request, 
        "user": user, 
        "is_admin": (user['is_admin'] == 1)
    })

@router.get("/database", response_class=HTMLResponse)
async def database_list_page(request: Request, user: dict = Depends(get_authorized_user)):
    tables = [{"name": "users", "label": "Пользователи", "icon": "users"}, {"name": "cooldown", "label": "Кулдауны", "icon": "clock"}]
    return templates.TemplateResponse("database_list.html", {
        "request": request, 
        "user": user, 
        "tables": tables, 
        "is_admin": (user['is_admin'] == 1)
    })

@router.get("/database/{table_name}", response_class=HTMLResponse)
async def database_view_page(request: Request, table_name: str, user: dict = Depends(get_authorized_user)):
    return templates.TemplateResponse("database_view.html", {
        "request": request, 
        "user": user, 
        "table_name": table_name, 
        "is_admin": (user['is_admin'] == 1)
    })