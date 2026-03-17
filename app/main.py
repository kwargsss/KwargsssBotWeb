import logging
import json
import os
import app.core.config as config
import app.core.database as database
import traceback
import time
import services.backup as backup
import asyncio

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.templating import Jinja2Templates
from app.core.state import manager, bot_state
from app.api.routers import auth, dashboard, tickets, api
from app.core.logger import log


class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return "/api/updates" not in record.getMessage()

logging.getLogger("uvicorn.access").addFilter(EndpointFilter())

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await database.init_db()
        log.info("✅ База данных подключена")

        asyncio.create_task(backup.backup_scheduler())
        log.info("⏳ Планировщик бекапов сайта запущен")
        
    except Exception as e:
        log.critical(f"🔥 ОШИБКА ПРИ ЗАПУСКЕ: {e}")
        
    yield
    log.info("🛑 Сервер останавливается...")

app = FastAPI(lifespan=lifespan)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(FRONTEND_DIR, "templates"))

app.add_middleware(
    SessionMiddleware,
    secret_key=config.SESSION_SECRET,
    same_site="lax",
    https_only=False,
)   

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8000",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

@app.middleware("http")
async def log_exceptions_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
   
    except Exception as e:
        error_detail = traceback.format_exc()
        
        log_msg = (
            f"❌ UNCAUGHT EXCEPTION\n"
            f"Path: {request.method} {request.url.path}\n"
            f"User-Agent: {request.headers.get('user-agent')}\n"
            f"Client IP: {request.client.host if request.client else 'Unknown'}\n"
            f"Error: {str(e)}\n\n"
            f"Traceback:\n{error_detail}"
        )

        log.error(log_msg)

        raise e

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    if process_time > 1.0:
        log.warning(f"🐢 Медленный ответ: {request.url.path} занял {process_time:.2f}s")
        
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    return templates.TemplateResponse("404.html", {"request": request}, status_code=404)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(tickets.router)
app.include_router(api.router)

@app.websocket("/ws/bot")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.headers.get("Authorization")
    
    if token != config.API_SECRET:
        log.warning(f"⚠️ Попытка подключения к WS с неверным токеном! IP: {websocket.client.host}")
        await websocket.close(code=1008)
        return
    
    await manager.connect(websocket)
    log.info("🤖 Бот успешно подключился по WebSocket")
    
    await manager.send_command({"action": "force_sync", "data": {}})
    
    try:
        while True:
            msg = await websocket.receive_text()
            payload = json.loads(msg)
            p_type = payload.get("type")

            if p_type == "sync_data":
                bot_state["channels"] = payload["data"].get("channels", [])
                bot_state["members"] = payload["data"].get("members", [])
                
                if "tickets" in payload["data"]:
                    bot_state["tickets"] = payload["data"]["tickets"]
                
                bot_state["is_synced"] = True
            
            elif p_type == "ticket_history_data":
                t_id = str(payload["data"]["ticket_id"])
                bot_state["chat_histories"][t_id] = payload["data"]["messages"]

            elif p_type == "log" or p_type == "db_response":
                bot_state["logs_buffer"].append(payload)
            
            elif p_type == "live_log":
                bot_state["logs_buffer"].append(payload)

            elif p_type == "stats_update":
                if isinstance(bot_state["stats"], dict):
                    bot_state["stats"].update(payload["data"])
                else:
                    bot_state["stats"] = payload["data"]

            elif p_type in ["ticket_created", "new_message", "ticket_updated", "ticket_deleted"]:
                bot_state["ticket_events"].append(payload)

            elif p_type == "archive_data":
                t_id = payload["data"]["ticket_id"]
                content = payload["data"]["html_content"]
                
                with open(f"static/archives/ticket-{t_id}.html", "w", encoding="utf-8") as f: 
                    f.write(content)
            

            elif p_type == "archived_tickets_list":
                bot_state["archives"] = payload["data"]

    except WebSocketDisconnect:
        log.warning("🔌 Бот отключился (Disconnect)")
        manager.disconnect()

    except Exception as e:
        log.error(f"💥 Ошибка внутри WebSocket цикла: {e}")
        manager.disconnect()
        await websocket.close(code=1011)

@app.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "ok"}