import config
import database

from logger import log
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dependencies import get_admin_user, get_authorized_user, get_current_user
from state import bot_state, manager


router = APIRouter(prefix="/api")

class CommandModel(BaseModel): 
    action: str
    data: dict

@router.get("/admin/denied_users")
async def api_get_denied(user: dict = Depends(get_admin_user)):
    users = await database.get_denied_users()
    return JSONResponse(users)

@router.get("/admin/pending_users")
async def api_get_pending(user: dict = Depends(get_admin_user)):
    users = await database.get_pending_users()
    return JSONResponse(users)

@router.post("/admin/approve")
async def api_approve_user(data: dict, user: dict = Depends(get_admin_user)):
    target_id = data.get("user_id")
    try:
        await database.approve_user(target_id)
        log.info(f"Admin {user['username']} ОДОБРИЛ пользователя {target_id}")
        return {"status": "success"}
    
    except Exception as e:
        log.error(f"Ошибка при одобрении пользователя {target_id}: {e}")
        raise HTTPException(500, "Database error")

@router.post("/admin/deny")
async def api_deny_user(data: dict, user: dict = Depends(get_admin_user)):
    target_id = data.get("user_id")
    try:
        await database.deny_user(target_id)
        log.info(f"Admin {user['username']} ОТКЛОНИЛ пользователя {target_id}")
        return {"status": "success"}
    
    except Exception as e:
        log.error(f"Ошибка при отклонении пользователя {target_id}: {e}")
        raise HTTPException(500, "Database error")

@router.post("/control")
async def send_command_api(
    command: CommandModel, 
    request: Request,
    x_secret: str = Header(None)
):
    is_authorized = False

    if x_secret and x_secret == config.API_SECRET: 
        is_authorized = True
    else:
        user = await get_current_user(request)
        if user and user.get('is_approved') == 1: 
            is_authorized = True
            
    if not is_authorized: 
        raise HTTPException(status_code=403, detail="Not authorized")
    
    log.info(f"Отправка команды боту: {command.action}")

    if not await manager.send_command(command.model_dump()): 
        log.error(f"Не удалось отправить команду {command.action} - Бот офлайн")
        raise HTTPException(status_code=503, detail="Bot not connected")
    
    return {"status": "ok"}

@router.get("/updates")
async def get_updates():
    logs = list(bot_state["logs_buffer"])
    bot_state["logs_buffer"].clear()

    t_events = list(bot_state["ticket_events"])
    bot_state["ticket_events"].clear()
    
    return JSONResponse({
        "is_synced": bot_state["is_synced"], 
        "channels": bot_state["channels"], 
        "members": bot_state["members"], 
        "new_logs": logs,
        "ticket_events": t_events, 
        "stats": bot_state["stats"]
    })