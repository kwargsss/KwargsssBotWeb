import aiosqlite

from app.core.config import DB_FILE, SUPER_ADMIN_ID
from app.core.logger import log


async def init_db():
    try:
        async with aiosqlite.connect(DB_FILE) as db:
            await db.execute("PRAGMA journal_mode=WAL;") 
            await db.execute("PRAGMA foreign_keys=ON;")

            await db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    discord_id TEXT PRIMARY KEY,
                    username TEXT,
                    avatar TEXT,
                    is_approved INTEGER DEFAULT 0,
                    is_admin INTEGER DEFAULT 0
                )
            """)
            await db.commit()
            log.info("База данных успешно инициализирована")
            
    except Exception as e:
        log.critical(f"НЕ УДАЛОСЬ ПОДКЛЮЧИТЬСЯ К БД!\n{e}")


async def get_user(discord_id: str):
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM users WHERE discord_id = ?", (discord_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

async def upsert_user(user_data: dict):
    discord_id = user_data['id']
    username = user_data['username']
    avatar_hash = user_data.get('avatar')
    
    if avatar_hash:
        ext = "gif" if avatar_hash.startswith("a_") else "png"
        avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.{ext}"
    else:
        avatar_url = "https://cdn.discordapp.com/embed/avatars/0.png" 
    
    is_super = 1 if str(discord_id) == str(SUPER_ADMIN_ID) else 0
    is_approved_default = 1 if is_super else 0

    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute("SELECT 1 FROM users WHERE discord_id = ?", (discord_id,)) as cursor:
            existing = await cursor.fetchone()
            
        if existing:
            await db.execute("UPDATE users SET username = ?, avatar = ? WHERE discord_id = ?", 
                             (username, avatar_url, discord_id))
        else:
            await db.execute("""
                INSERT INTO users (discord_id, username, avatar, is_approved, is_admin)
                VALUES (?, ?, ?, ?, ?)
            """, (discord_id, username, avatar_url, is_approved_default, is_super))
        await db.commit()

async def get_pending_users():
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM users WHERE is_approved = 0") as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
async def get_denied_users():
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM users WHERE is_approved = -1") as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def approve_user(discord_id: str):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("UPDATE users SET is_approved = 1 WHERE discord_id = ?", (discord_id,))
        await db.commit()

async def deny_user(discord_id: str):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("UPDATE users SET is_approved = -1 WHERE discord_id = ?", (discord_id,))
        await db.commit()