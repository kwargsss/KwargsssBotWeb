import json

from fastapi import WebSocket


bot_state = {
    "channels": [], 
    "members": [], 
    "tickets": [],
    "is_synced": False, 
    "logs_buffer": [],
    "ticket_events": [],
    "archives": [],
    "chat_histories": {},
    "stats": {
        "total_members": 0,
        "online_members": 0,
        "messages_today": 0,
        "commands_today": 0,
        "recent_commands": [],
        "chart_data": [],
        "system": {}
    }
}

class BotConnectionManager:
    def __init__(self): 
        self.active_connection: WebSocket = None
    
    async def connect(self, websocket: WebSocket): 
        await websocket.accept()
        self.active_connection = websocket
    
    def disconnect(self): 
        self.active_connection = None
        bot_state["is_synced"] = False
    
    async def send_command(self, data: dict) -> bool:
        if not self.active_connection: return False
        try: 
            await self.active_connection.send_text(json.dumps(data))
            return True
        except: 
            self.active_connection = None
            return False

manager = BotConnectionManager()