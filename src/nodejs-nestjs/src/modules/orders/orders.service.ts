import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Order, OrderStatus } from './entities/order.entity';

export interface CreateOrderDto {
  userId: number;
  amount: number;
  status?: OrderStatus;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = this.ordersRepository.create(createOrderDto);
    return this.ordersRepository.save(order);
  }

  async createWithUserTransaction(userId: number, amount: number): Promise<{ user: User; order: Order }> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const order = manager.create(Order, {
        userId,
        amount,
        status: OrderStatus.PENDING,
      });
      const savedOrder = await manager.save(order);

      return { user, order: savedOrder };
    });
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    
    return order;
  }

  async update(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    return this.ordersRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.ordersRepository.remove(order);
  }

  async getOrderAggregation(): Promise<{ totalOrders: number; totalAmount: number; avgAmount: number }> {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('COUNT(*)', 'totalOrders')
      .addSelect('SUM(order.amount)', 'totalAmount')
      .addSelect('AVG(order.amount)', 'avgAmount')
      .getRawOne();

    return {
      totalOrders: parseInt(result.totalOrders) || 0,
      totalAmount: parseFloat(result.totalAmount) || 0,
      avgAmount: parseFloat(result.avgAmount) || 0,
    };
  }
}