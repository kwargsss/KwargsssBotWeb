from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from app.api.dependencies import get_admin_user
from app.core.state import bot_state, manager
from app.core.config import *


router = APIRouter(prefix="/dashboard/tickets", tags=["tickets"])
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

@router.get("/", response_class=HTMLResponse)
async def tickets_index(request: Request, user: dict = Depends(get_admin_user)):
    return templates.TemplateResponse("tickets_list.html", {"request": request, "user": user})

@router.get("/api/list")
async def get_tickets_list(user: dict = Depends(get_admin_user)):
    return JSONResponse(bot_state["tickets"])

@router.get("/api/archive_list")
async def get_archive_list(user: dict = Depends(get_admin_user)):
    await manager.send_command({"action": "get_archived_tickets", "data": {}})
    return JSONResponse(bot_state.get("archives", []))

@router.get("/archive", response_class=HTMLResponse)
async def tickets_archive_page(request: Request, user: dict = Depends(get_admin_user)):
    return templates.TemplateResponse("tickets_archive.html", {"request": request, "user": user})

@router.post("/api/history/request")
async def request_history(data: dict, user: dict = Depends(get_admin_user)):
    t_id = data.get("ticket_id")
    if not await manager.send_command({"action": "get_ticket_history", "data": {"ticket_id": t_id}}):
        raise HTTPException(503, "Bot offline")
    return {"status": "requested"}

@router.get("/api/history/{ticket_id}")
async def get_history(ticket_id: str, user: dict = Depends(get_admin_user)):
    history = bot_state["chat_histories"].get(str(ticket_id))
    if history is None:
        return JSONResponse({"status": "waiting", "messages": []})
    return JSONResponse({"status": "ok", "messages": history})

@router.get("/{type}/{id}", response_class=HTMLResponse)
async def ticket_view(request: Request, type: str, id: int, user: dict = Depends(get_admin_user)):
    return templates.TemplateResponse("ticket_chat.html", {
        "request": request, 
        "user": user, 
        "ticket_id": id, 
        "ticket_type": type
    })

@router.post("/action")
async def ticket_action(data: dict, user: dict = Depends(get_admin_user)):
    if not await manager.send_command(data): 
        raise HTTPException(status_code=503, detail="Bot not connected")
    return {"status": "ok"}