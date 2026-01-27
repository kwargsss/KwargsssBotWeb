import httpx
import uuid
import app.core.database as database

from app.core.config import *
from app.core.logger import log
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from app.api.dependencies import get_current_user


router = APIRouter()
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

@router.get("/", include_in_schema=False)
async def main(request: Request):
    user = await get_current_user(request)
    if user: return RedirectResponse("/dashboard")
    return RedirectResponse("/login")

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    user = await get_current_user(request)
    if user: return RedirectResponse("/dashboard")
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/auth/discord")
async def login_discord(request: Request):
    scope = "identify"

    state = str(uuid.uuid4())
    request.session["oauth_state"] = state

    url = f"https://discord.com/api/oauth2/authorize?client_id={DISCORD_CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope={scope}&state={state}"
    return RedirectResponse(url)

@router.get("/auth/callback")
async def auth_callback(code: str, state: str, request: Request):
    saved_state = request.session.pop("oauth_state", None)
    
    if not saved_state or state != saved_state:
        log.warning("⚠️ Обнаружена попытка CSRF атаки или устаревшая сессия при входе.")
        return HTMLResponse("<h1>Ошибка безопасности (State mismatch). Попробуйте войти заново.</h1>", status_code=403)

    try:
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://discord.com/api/oauth2/token",
                data={
                    "client_id": DISCORD_CLIENT_ID,
                    "client_secret": DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_data = token_resp.json()
            
            user_resp = await client.get(
                "https://discord.com/api/users/@me",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            user_data = user_resp.json()

        await database.upsert_user(user_data)
        request.session["user_id"] = user_data["id"]
        log.info(f"Пользователь вошел: {user_data['username']} (ID: {user_data['id']})")
        return RedirectResponse("/dashboard")
    
    except Exception as e:
        log.error(f"Ошибка OAuth Callback: {e}")
        return HTMLResponse("<h1>Ошибка авторизации. Попробуйте позже.</h1>", status_code=500)

@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/login")

@router.get("/pending", response_class=HTMLResponse)
async def pending_page(request: Request):
    user = await get_current_user(request)
    if not user: return RedirectResponse("/login")
    if user['is_approved'] == 1: return RedirectResponse("/dashboard")
    return templates.TemplateResponse("pending.html", {"request": request, "user": user})

@router.get("/bot-offline", response_class=HTMLResponse)
async def bot_offline_page(request: Request):
    return templates.TemplateResponse("bot_offline.html", {"request": request}, status_code=503)