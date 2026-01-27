import database

from fastapi import Request, HTTPException, Depends


async def get_current_user(request: Request):
    user_id = request.session.get("user_id")
    if not user_id: return None
    return await database.get_user(user_id)

async def get_authorized_user(request: Request):
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=307, headers={"Location": "/login"})
    
    if user['is_approved'] != 1:
        raise HTTPException(status_code=307, headers={"Location": "/pending"})
        
    return user

async def get_admin_user(user: dict = Depends(get_authorized_user)):
    if user['is_admin'] == 0:
        raise HTTPException(status_code=403, detail="Access denied: Admins only")
    return user