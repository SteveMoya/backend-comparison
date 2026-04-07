from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Order, OrderStatus

router = APIRouter()


class OrderCreate(BaseModel):
    userId: int
    amount: float
    status: Optional[OrderStatus] = OrderStatus.PENDING


class OrderUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    amount: float
    status: OrderStatus
    created_at: datetime


class OrderAggregation(BaseModel):
    totalOrders: int
    totalAmount: float
    avgAmount: float


@router.post("", status_code=status.HTTP_201_CREATED, response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == order.userId).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    db_order = Order(
        user_id=order.userId,
        amount=order.amount,
        status=order.status or OrderStatus.PENDING
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("", response_model=List[dict])
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).join(User).order_by(Order.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "user_id": o.user_id,
            "amount": float(o.amount),
            "status": o.status.value,
            "created_at": o.created_at,
            "user_name": o.user.name if o.user else None,
            "user_email": o.user.email if o.user else None,
        }
        for o in orders
    ]


@router.get("/aggregation", response_model=OrderAggregation)
def get_aggregation(db: Session = Depends(get_db)):
    result = db.query(
        func.count(Order.id).label("totalOrders"),
        func.sum(Order.amount).label("totalAmount"),
        func.avg(Order.amount).label("avgAmount")
    ).first()
    
    return {
        "totalOrders": result.totalOrders or 0,
        "totalAmount": float(result.totalAmount or 0),
        "avgAmount": float(result.avgAmount or 0)
    }


@router.get("/{order_id}", response_model=dict)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).join(User).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    return {
        "id": order.id,
        "user_id": order.user_id,
        "amount": float(order.amount),
        "status": order.status.value,
        "created_at": order.created_at,
        "user_name": order.user.name if order.user else None,
        "user_email": order.user.email if order.user else None,
    }


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order_update: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    order.status = order_update.status
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    db.delete(order)
    db.commit()