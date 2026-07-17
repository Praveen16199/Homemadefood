import mysql.connector
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load env variables from backend/.env with override=True to prioritize .env values
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

INITIAL_MENU = [
    {"id": "c1", "name": "Special Chettinad Combo", "category": "Combos", "price": 159.0, "type": "non-veg", "isAvailable": 1},
    {"id": "b1", "name": "Steaming Hot Idli (2 Pcs)", "category": "Breakfast", "price": 40.0, "type": "veg", "isAvailable": 1},
    {"id": "b2", "name": "Crispy Ghee Roast Dosa", "category": "Breakfast", "price": 70.0, "type": "veg", "isAvailable": 1},
    {"id": "b3", "name": "Home-style Pongal & Vada", "category": "Breakfast", "price": 60.0, "type": "veg", "isAvailable": 1},
    {"id": "b4", "name": "Poori Masala (3 Pcs)", "category": "Breakfast", "price": 80.0, "type": "veg", "isAvailable": 1},
    {"id": "l1", "name": "Wholesome Veg Meals", "category": "Lunch", "price": 120.0, "type": "veg", "isAvailable": 1},
    {"id": "l2", "name": "Chettinad Chicken Biryani", "category": "Lunch", "price": 180.0, "type": "non-veg", "isAvailable": 1},
    {"id": "l3", "name": "Egg Biryani (with 2 eggs)", "category": "Lunch", "price": 140.0, "type": "egg", "isAvailable": 1},
    {"id": "l4", "name": "Curd Rice with Pomegranate", "category": "Lunch", "price": 70.0, "type": "veg", "isAvailable": 1},
    {"id": "a1", "name": "Soft Chapati (1 Pc)", "category": "Add-ons", "price": 15.0, "type": "veg", "isAvailable": 1},
    {"id": "a2", "name": "Boiled Egg (1 Pc)", "category": "Add-ons", "price": 15.0, "type": "egg", "isAvailable": 1},
    {"id": "a3", "name": "Fluffy Egg Omelette", "category": "Add-ons", "price": 30.0, "type": "egg", "isAvailable": 1},
    {"id": "a4", "name": "Chettinad Chicken Gravy (cup)", "category": "Add-ons", "price": 90.0, "type": "non-veg", "isAvailable": 1},
    {"id": "d1", "name": "Dinner Dosa with Chutney & Sambar", "category": "Dinner", "price": 50.0, "type": "veg", "isAvailable": 1},
    {"id": "d2", "name": "Wheat Chapati with Kurma (3 Pcs)", "category": "Dinner", "price": 70.0, "type": "veg", "isAvailable": 1},
    {"id": "e1", "name": "Egg Kalaki (Street Style)", "category": "Egg Specials", "price": 25.0, "type": "egg", "isAvailable": 1},
    {"id": "e2", "name": "Spicy Egg Podimas", "category": "Egg Specials", "price": 40.0, "type": "egg", "isAvailable": 1},
    {"id": "nv1", "name": "Chicken 65 (Boneless, 150g)", "category": "Non Veg Specials", "price": 140.0, "type": "non-veg", "isAvailable": 1},
    {"id": "nv2", "name": "Spicy Pepper Chicken Fry", "category": "Non Veg Specials", "price": 150.0, "type": "non-veg", "isAvailable": 1},
    {"id": "bev1", "name": "Traditional Filter Coffee", "category": "Beverages", "price": 25.0, "type": "veg", "isAvailable": 1},
    {"id": "bev2", "name": "Refreshing Pepsi (250ml)", "category": "Beverages", "price": 20.0, "type": "veg", "isAvailable": 1}
]

def get_mysql_config():
    return {
        "host": os.getenv("MYSQL_HOST", "localhost"),
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", "")
    }

def get_db_connection():
    config = get_mysql_config()
    config["database"] = os.getenv("MYSQL_DATABASE", "ss_homemade_food")
    return mysql.connector.connect(**config)

def init_db():
    # 1. Create DB if not exists
    config = get_mysql_config()
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    db_name = os.getenv("MYSQL_DATABASE", "ss_homemade_food")
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
    conn.commit()
    cursor.close()
    conn.close()
    
    # 2. Connect to the created database and create tables
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create menu table (with new columns description, image, available)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS menu (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        type VARCHAR(50) NULL,
        isAvailable TINYINT(1) NOT NULL DEFAULT 1,
        description TEXT NULL,
        image VARCHAR(255) NULL,
        available TINYINT(1) NOT NULL DEFAULT 1
    )
    """)
    
    # Create orders table (using JSON type for items)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(100) PRIMARY KEY,
        customerName VARCHAR(255) NOT NULL,
        customerPhone VARCHAR(50) NOT NULL,
        deliveryAddress TEXT NOT NULL,
        items JSON NOT NULL, 
        totalAmount DECIMAL(10, 2) NOT NULL,
        paymentStatus VARCHAR(100) NOT NULL,
        paymentMethod VARCHAR(100) NOT NULL,
        transactionId VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        date VARCHAR(100) NOT NULL
    )
    """)
    conn.commit()
    
    # Dynamic table upgrade for existing tables to ensure they have the new columns
    cursor.execute("DESCRIBE menu")
    columns = [col[0] for col in cursor.fetchall()]
    if "description" not in columns:
        cursor.execute("ALTER TABLE menu ADD COLUMN description TEXT NULL")
    if "image" not in columns:
        cursor.execute("ALTER TABLE menu ADD COLUMN image VARCHAR(255) NULL")
    if "available" not in columns:
        cursor.execute("ALTER TABLE menu ADD COLUMN available TINYINT(1) NOT NULL DEFAULT 1")
    conn.commit()
    
    # Seed initial menu if empty
    cursor.execute("SELECT COUNT(*) FROM menu")
    if cursor.fetchone()[0] == 0:
        for item in INITIAL_MENU:
            cursor.execute(
                "INSERT INTO menu (id, name, category, price, type, isAvailable, description, image, available) VALUES (%s, %s, %s, %s, %s, %s, NULL, NULL, %s)",
                (item["id"], item["name"], item["category"], item["price"], item["type"], item["isAvailable"], item["isAvailable"])
            )
        conn.commit()
        print("MySQL database seeded with default menu items.")
        
    cursor.close()
    conn.close()

def get_menu_items():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM menu")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "price": float(row["price"]),
            "type": row["type"] if "type" in row and row["type"] else "veg",
            "available": bool(row["available"]) if "available" in row and row["available"] is not None else bool(row["isAvailable"]),
            "isAvailable": bool(row["isAvailable"]) if row["isAvailable"] is not None else bool(row.get("available", 1)),
            "description": row["description"] if "description" in row else None,
            "image": row["image"] if "image" in row else None
        }
        for row in rows
    ]

def update_menu_item(item_id, name=None, category=None, price=None, type=None, is_available=None, description=None, image=None, available=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    fields = []
    params = []
    
    if name is not None:
        fields.append("name = %s")
        params.append(name)
        
    if category is not None:
        fields.append("category = %s")
        params.append(category)
        
    if price is not None:
        fields.append("price = %s")
        params.append(price)
        
    if type is not None:
        fields.append("type = %s")
        params.append(type)
        
    if is_available is not None:
        fields.append("isAvailable = %s")
        params.append(1 if is_available else 0)
        
    if available is not None:
        fields.append("available = %s")
        params.append(1 if available else 0)
        
    if description is not None:
        fields.append("description = %s")
        params.append(description)
        
    if image is not None:
        fields.append("image = %s")
        params.append(image)
        
    if not fields:
        cursor.close()
        conn.close()
        return False
        
    params.append(item_id)
    query = f"UPDATE menu SET {', '.join(fields)} WHERE id = %s"
    
    cursor.execute(query, tuple(params))
    success = cursor.rowcount > 0
    conn.commit()
    cursor.close()
    conn.close()
    return success

def add_menu_item(item_id, name, category, price, type=None, is_available=True, description=None, image=None, available=True):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    avail_val = 1 if (available and is_available) else 0
    type_val = type if type else "veg"
    
    cursor.execute(
        "INSERT INTO menu (id, name, category, price, type, isAvailable, description, image, available) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (item_id, name, category, price, type_val, avail_val, description, image, avail_val)
    )
    success = cursor.rowcount > 0
    conn.commit()
    cursor.close()
    conn.close()
    return success

def delete_menu_item(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM menu WHERE id = %s", (item_id,))
    success = cursor.rowcount > 0
    conn.commit()
    cursor.close()
    conn.close()
    return success


def create_order(order_id, customer_name, customer_phone, delivery_address, items, total_amount, payment_status, payment_method, transaction_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    date_str = datetime.now().isoformat()
    items_json = json.dumps(items)
    
    cursor.execute("""
    INSERT INTO orders (id, customerName, customerPhone, deliveryAddress, items, totalAmount, paymentStatus, paymentMethod, transactionId, status, date)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'Pending', %s)
    """, (order_id, customer_name, customer_phone, delivery_address, items_json, total_amount, payment_status, payment_method, transaction_id, date_str))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        "id": order_id,
        "customerName": customer_name,
        "customerPhone": customer_phone,
        "deliveryAddress": delivery_address,
        "items": items,
        "totalAmount": total_amount,
        "paymentStatus": payment_status,
        "paymentMethod": payment_method,
        "transactionId": transaction_id,
        "status": "Pending",
        "date": date_str
    }

def get_orders():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM orders ORDER BY date DESC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    orders_list = []
    for row in rows:
        items_val = row["items"]
        if isinstance(items_val, str):
            try:
                items_list = json.loads(items_val)
            except Exception:
                items_list = []
        elif isinstance(items_val, (list, dict)):
            items_list = items_val
        else:
            items_list = []
            
        orders_list.append({
            "id": row["id"],
            "customerName": row["customerName"],
            "customerPhone": row["customerPhone"],
            "deliveryAddress": row["deliveryAddress"],
            "items": items_list,
            "totalAmount": float(row["totalAmount"]),
            "paymentStatus": row["paymentStatus"],
            "paymentMethod": row["paymentMethod"],
            "transactionId": row["transactionId"],
            "status": row["status"],
            "date": row["date"]
        })
    return orders_list

def update_order_status(order_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (status, order_id))
    success = cursor.rowcount > 0
    conn.commit()
    cursor.close()
    conn.close()
    return success
