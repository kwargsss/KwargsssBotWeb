import httpx
import config
import database

from logger import log
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from dependencies import get_current_user


router = APIRouter()
templates = Jinja2Templates(directory="templates")

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
async def login_discord():
    scope = "identify"
    url = f"https://discord.com/api/oauth2/authorize?client_id={config.DISCORD_CLIENT_ID}&redirect_uri={config.REDIRECT_URI}&response_type=code&scope={scope}"
    return RedirectResponse(url)

@router.get("/auth/callback")
async def auth_callback(code: str, request: Request):
    try:
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://discord.com/api/oauth2/token",
                data={
                    "client_id": config.DISCORD_CLIENT_ID,
                    "client_secret": config.DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": config.REDIRECT_URI,
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