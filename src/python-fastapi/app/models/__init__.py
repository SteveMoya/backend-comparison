from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")