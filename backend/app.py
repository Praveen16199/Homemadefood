from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import jwt
import time
import os
from datetime import datetime

# Import database functions
from database import init_db, get_menu_items, update_menu_item, add_menu_item, delete_menu_item, create_order, get_orders, update_order_status

# Initialize DB on import/startup
try:
    init_db()
except Exception as e:
    print("\n" + "="*60)
    print("WARNING: Database connection/initialization failed!")
    print(f"Error details: {e}")
    print("Please make sure MySQL is running and credentials in .env are correct.")
    print("="*60 + "\n")

app = FastAPI(title="SS Homemade Food API")

# Configure CORS to allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "ss_homemade_food_super_secret_key"
ALGORITHM = "HS256"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# --- Models ---
class LoginRequest(BaseModel):
    username: str
    password: str

class OrderItem(BaseModel):
    id: str
    name: str
    price: float
    qty: int

class OrderRequest(BaseModel):
    customerName: str
    customerPhone: str
    deliveryAddress: str
    items: List[OrderItem]
    totalAmount: float
    paymentStatus: str
    paymentMethod: str
    transactionId: str

class MenuCreateRequest(BaseModel):
    id: str
    name: str
    category: str
    price: float
    type: Optional[str] = None
    isAvailable: Optional[bool] = None
    available: Optional[bool] = None
    description: Optional[str] = None
    image: Optional[str] = None

class MenuUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    type: Optional[str] = None
    isAvailable: Optional[bool] = None
    available: Optional[bool] = None
    description: Optional[str] = None
    image: Optional[str] = None

class OrderStatusRequest(BaseModel):
    status: str

# --- JWT Auth Helper ---
def verify_admin_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required")
    
    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid Authorization header format")
        
        token = parts[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username != ADMIN_USERNAME:
            raise HTTPException(status_code=401, detail="Unauthorized token payload")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# --- Routes ---

@app.post("/api/admin/login")
def admin_login(req: LoginRequest):
    if req.username == ADMIN_USERNAME and req.password == ADMIN_PASSWORD:
        token_payload = {
            "sub": ADMIN_USERNAME,
            "exp": time.time() + 24 * 3600  # Token valid for 24 hours
        }
        token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
        return {"success": True, "token": token}
    
    return {"success": False, "message": "Invalid username or password"}

@app.get("/api/menu")
def read_menu():
    try:
        return get_menu_items()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading menu items: {str(e)}")

@app.post("/api/menu")
def add_menu(req: MenuCreateRequest, username: str = Depends(verify_admin_token)):
    existing = get_menu_items()
    # Check if string representation of ID already exists
    req_id_str = str(req.id)
    if any(item["id"] == req_id_str for item in existing):
        raise HTTPException(status_code=400, detail=f"Menu item with ID '{req.id}' already exists")
    
    is_avail_bool = req.isAvailable if req.isAvailable is not None else True
    avail_bool = req.available if req.available is not None else is_avail_bool
    
    success = add_menu_item(
        item_id=req_id_str,
        name=req.name,
        category=req.category,
        price=req.price,
        type=req.type,
        is_available=is_avail_bool,
        available=avail_bool,
        description=req.description,
        image=req.image
    )
    if success:
        return {"success": True, "message": f"Menu item {req.id} added successfully"}
    raise HTTPException(status_code=500, detail="Failed to add menu item")

@app.put("/api/menu/{item_id}")
def update_menu(item_id: str, req: MenuUpdateRequest, username: str = Depends(verify_admin_token)):
    avail_val = req.available if req.available is not None else req.isAvailable
    is_avail_val = req.isAvailable if req.isAvailable is not None else req.available
    
    success = update_menu_item(
        item_id=item_id,
        name=req.name,
        category=req.category,
        price=req.price,
        type=req.type,
        is_available=is_avail_val,
        available=avail_val,
        description=req.description,
        image=req.image
    )
    if success:
        return {"success": True, "message": f"Menu item {item_id} updated successfully"}
    raise HTTPException(status_code=404, detail=f"Menu item {item_id} not found")

@app.delete("/api/menu/{item_id}")
def delete_menu(item_id: str, username: str = Depends(verify_admin_token)):
    success = delete_menu_item(item_id)
    if success:
        return {"success": True, "message": f"Menu item {item_id} deleted successfully"}
    raise HTTPException(status_code=404, detail=f"Menu item {item_id} not found")

@app.post("/api/orders")
def place_order(req: OrderRequest):
    try:
        # Generate custom order ID: SS-datetime-suffix
        order_suffix = int(time.time() * 100) % 1000
        order_id = f"SS-{datetime.now().strftime('%d%m%H%M')}-{order_suffix:03d}"
        
        items_dict_list = [item.dict() for item in req.items]
        
        order_info = create_order(
            order_id=order_id,
            customer_name=req.customerName,
            customer_phone=req.customerPhone,
            delivery_address=req.deliveryAddress,
            items=items_dict_list,
            total_amount=req.totalAmount,
            payment_status=req.paymentStatus,
            payment_method=req.paymentMethod,
            transaction_id=req.transactionId
        )
        return {"success": True, "order": order_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save order: {str(e)}")

@app.get("/api/orders")
def read_orders(username: str = Depends(verify_admin_token)):
    try:
        return get_orders()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading orders: {str(e)}")

@app.put("/api/orders/{order_id}/status")
def change_order_status(order_id: str, req: OrderStatusRequest, username: str = Depends(verify_admin_token)):
    # Validate status values
    valid_statuses = ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    success = update_order_status(order_id, req.status)
    if success:
        return {"success": True, "message": f"Order {order_id} status updated to {req.status}"}
        
    raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
