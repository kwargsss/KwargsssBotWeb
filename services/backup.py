import aiosqlite
import httpx
import asyncio
import app.core.config as config

from datetime import datetime
from app.core.logger import log


async def perform_backup():
    try:
        async with aiosqlite.connect(config.DB_FILE) as db:
            await db.execute("PRAGMA wal_checkpoint(TRUNCATE);")
            await db.commit()

        with open(config.DB_FILE, "rb") as f:
            file_data = f.read()

        filename = f"backup_{datetime.now().strftime('%Y-%m-%d_%H-%M')}.db"
        
        async with httpx.AsyncClient() as client:
            files = {
                "document": (filename, file_data, "application/x-sqlite3")
            }
            data = {
                "chat_id": config.TG_LOG_CHAT_ID,
                "caption": f"📦 <b>Ежедневный бекап БД сайта</b>\n📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                "parse_mode": "HTML"
            }
            
            response = await client.post(
                f"https://api.telegram.org/bot{config.TG_LOG_TOKEN}/sendDocument",
                data=data,
                files=files,
                timeout=60.0
            )
            
            if response.status_code == 200:
                log.info("✅ Бекап БД успешно отправлен в Telegram")
            else:
                log.error(f"Ошибка отправки бекапа: {response.text}")

    except Exception as e:
        log.critical(f"🔥 ОШИБКА СОЗДАНИЯ БЕКАПА: {e}")

async def backup_scheduler():
    while True:
        await asyncio.sleep(86400) 
        await perform_backup()