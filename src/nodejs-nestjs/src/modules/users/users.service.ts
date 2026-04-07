import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(query: UserQueryDto): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['orders'],
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }
    
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async findWithOrders(userId: number): Promise<User> {
    return this.findOne(userId);
  }

  async getUserOrderStats(userId: number): Promise<{ totalOrders: number; totalAmount: number; avgAmount: number }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['orders'],
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    const orders = user.orders || [];
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.amount), 0);
    const avgAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;
    
    return { totalOrders, totalAmount, avgAmount };
  }
}