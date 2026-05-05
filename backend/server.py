"""GadgetsHub FastAPI Backend.

Features:
- JWT auth (register, login, logout, me) via httpOnly cookies + Bearer fallback
- Gadgets API (list with filters, detail, categories, brands)
- Wishlist API (auth required)
- Compare endpoint (batch fetch by IDs)
- Seeds gadget catalog + admin user on startup
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from seed_data import GADGETS_SEED


# ---------- Config ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60 * 24 * 7  # 7 days (single token for simplicity)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="GadgetsHub API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("gadgetshub")


# ---------- Models ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str = "user"


class GadgetOut(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    price: float
    rating: float
    image: str
    description: str
    specs: dict


class WishlistActionIn(BaseModel):
    gadget_id: str


class CompareIn(BaseModel):
    gadget_ids: List[str]


# ---------- Auth helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_MINUTES * 60,
        path="/",
    )


def clear_auth_cookie(response: Response):
    response.delete_cookie(key="access_token", path="/")


def user_doc_to_out(doc: dict) -> UserOut:
    return UserOut(id=doc["id"], name=doc["name"], email=doc["email"], role=doc.get("role", "user"))


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------- Routes: Auth ----------
@api.post("/auth/register", response_model=UserOut)
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    # create empty wishlist
    await db.wishlists.insert_one({"user_id": user["id"], "gadget_ids": []})
    token = create_access_token(user["id"], user["email"])
    set_auth_cookie(response, token)
    response.headers["X-Access-Token"] = token
    return user_doc_to_out(user)


@api.post("/auth/login", response_model=UserOut)
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"])
    set_auth_cookie(response, token)
    response.headers["X-Access-Token"] = token
    return user_doc_to_out(user)


@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"ok": True}


@api.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return user_doc_to_out(user)


# ---------- Routes: Gadgets ----------
def gadget_doc_to_out(doc: dict) -> GadgetOut:
    return GadgetOut(
        id=doc["id"],
        name=doc["name"],
        brand=doc["brand"],
        category=doc["category"],
        price=doc["price"],
        rating=doc["rating"],
        image=doc["image"],
        description=doc["description"],
        specs=doc["specs"],
    )


@api.get("/gadgets", response_model=List[GadgetOut])
async def list_gadgets(
    q: Optional[str] = Query(None),
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = Query("featured", pattern="^(featured|price_asc|price_desc|rating_desc|name_asc)$"),
):
    query: dict = {}
    if category and category != "all":
        query["category"] = category
    if brand and brand != "all":
        query["brand"] = brand
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price"] = price_q
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"brand": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.gadgets.find(query, {"_id": 0})
    if sort == "price_asc":
        cursor = cursor.sort("price", 1)
    elif sort == "price_desc":
        cursor = cursor.sort("price", -1)
    elif sort == "rating_desc":
        cursor = cursor.sort("rating", -1)
    elif sort == "name_asc":
        cursor = cursor.sort("name", 1)
    else:
        cursor = cursor.sort([("rating", -1), ("price", -1)])
    docs = await cursor.to_list(length=500)
    return [gadget_doc_to_out(d) for d in docs]


@api.get("/gadgets/meta")
async def gadgets_meta():
    """Return distinct categories and brands + price range for filter UI."""
    categories = await db.gadgets.distinct("category")
    brands = await db.gadgets.distinct("brand")
    pipeline = [{"$group": {"_id": None, "min": {"$min": "$price"}, "max": {"$max": "$price"}}}]
    agg = await db.gadgets.aggregate(pipeline).to_list(1)
    price = agg[0] if agg else {"min": 0, "max": 0}
    return {
        "categories": sorted(categories),
        "brands": sorted(brands),
        "price_min": price.get("min", 0),
        "price_max": price.get("max", 0),
    }


@api.get("/gadgets/{gadget_id}", response_model=GadgetOut)
async def get_gadget(gadget_id: str):
    doc = await db.gadgets.find_one({"id": gadget_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Gadget not found")
    return gadget_doc_to_out(doc)


@api.post("/gadgets/compare", response_model=List[GadgetOut])
async def compare_gadgets(payload: CompareIn):
    if not payload.gadget_ids:
        return []
    if len(payload.gadget_ids) > 4:
        raise HTTPException(status_code=400, detail="You can compare up to 4 gadgets at a time.")
    docs = await db.gadgets.find({"id": {"$in": payload.gadget_ids}}, {"_id": 0}).to_list(length=10)
    # preserve order of request
    order = {gid: i for i, gid in enumerate(payload.gadget_ids)}
    docs.sort(key=lambda d: order.get(d["id"], 0))
    return [gadget_doc_to_out(d) for d in docs]


# ---------- Routes: Wishlist ----------
@api.get("/wishlist", response_model=List[GadgetOut])
async def get_wishlist(user=Depends(get_current_user)):
    wl = await db.wishlists.find_one({"user_id": user["id"]}, {"_id": 0})
    if not wl or not wl.get("gadget_ids"):
        return []
    docs = await db.gadgets.find({"id": {"$in": wl["gadget_ids"]}}, {"_id": 0}).to_list(length=200)
    return [gadget_doc_to_out(d) for d in docs]


@api.post("/wishlist/add")
async def wishlist_add(payload: WishlistActionIn, user=Depends(get_current_user)):
    # verify gadget exists
    exists = await db.gadgets.find_one({"id": payload.gadget_id}, {"_id": 0, "id": 1})
    if not exists:
        raise HTTPException(status_code=404, detail="Gadget not found")
    await db.wishlists.update_one(
        {"user_id": user["id"]},
        {"$addToSet": {"gadget_ids": payload.gadget_id}},
        upsert=True,
    )
    wl = await db.wishlists.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"ok": True, "gadget_ids": wl.get("gadget_ids", [])}


@api.post("/wishlist/remove")
async def wishlist_remove(payload: WishlistActionIn, user=Depends(get_current_user)):
    await db.wishlists.update_one(
        {"user_id": user["id"]},
        {"$pull": {"gadget_ids": payload.gadget_id}},
    )
    wl = await db.wishlists.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"ok": True, "gadget_ids": (wl or {}).get("gadget_ids", [])}


@api.get("/wishlist/ids")
async def wishlist_ids(user=Depends(get_current_user)):
    wl = await db.wishlists.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"gadget_ids": (wl or {}).get("gadget_ids", [])}


# ---------- Healthcheck ----------
@api.get("/")
async def root():
    return {"service": "GadgetsHub API", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # using Authorization header + localStorage token, so * origin ok
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Access-Token"],
)


# ---------- Startup: seed data + admin + indexes ----------
@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.gadgets.create_index("id", unique=True)
    await db.wishlists.create_index("user_id", unique=True)

    # Seed gadgets (idempotent: only if empty or count mismatch)
    count = await db.gadgets.count_documents({})
    if count == 0:
        docs = []
        for g in GADGETS_SEED:
            d = dict(g)
            d["id"] = str(uuid.uuid4())
            docs.append(d)
        if docs:
            await db.gadgets.insert_many(docs)
        logger.info(f"Seeded {len(docs)} gadgets.")

    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@gadgetshub.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        admin = {
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(admin)
        await db.wishlists.insert_one({"user_id": admin["id"], "gadget_ids": []})
        logger.info(f"Seeded admin user: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info("Admin password updated from .env")


@app.on_event("shutdown")
async def shutdown():
    client.close()
