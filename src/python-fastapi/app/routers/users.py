from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Order, OrderStatus

router = APIRouter()


class UserCreate(BaseModel):
    name: str
    email: EmailStr


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime


class UserWithOrders(UserResponse):
    orders: list = []


class UserStats(BaseModel):
    totalOrders: int
    totalAmount: float
    avgAmount: float


@router.post("", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    
    db_user = User(name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("", response_model=dict)
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    users = db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    total = db.query(User).count()
    return {"data": users, "total": total, "page": page, "limit": limit}


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user_update.email and user_update.email != user.email:
        existing = db.query(User).filter(User.email == user_update.email).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    
    if user_update.name:
        user.name = user_update.name
    if user_update.email:
        user.email = user_update.email
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    db.delete(user)
    db.commit()


@router.get("/{user_id}/orders", response_model=UserWithOrders)
def get_user_with_orders(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    return {"id": user.id, "name": user.name, "email": user.email, "created_at": user.created_at, "orders": orders}


@router.get("/{user_id}/stats", response_model=UserStats)
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    orders = db.query(Order).filter(Order.user_id == user_id).all()
    total_orders = len(orders)
    total_amount = sum(float(order.amount) for order in orders)
    avg_amount = total_amount / total_orders if total_orders > 0 else 0
    
    return {"totalOrders": total_orders, "totalAmount": total_amount, "avgAmount": avg_amount}


from datetime import datetime