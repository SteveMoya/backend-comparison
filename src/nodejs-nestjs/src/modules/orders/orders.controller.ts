import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrdersService, CreateOrderDto } from './orders.service';
import { OrderStatus } from './entities/order.entity';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Post('transaction')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create order with user in transaction' })
  async createWithTransaction(@Body() body: { userId: number; amount: number }) {
    return this.ordersService.createWithUserTransaction(body.userId, body.amount);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get('aggregation')
  @ApiOperation({ summary: 'Get order aggregation (COUNT, SUM, AVG)' })
  async getAggregation() {
    return this.ordersService.getOrderAggregation();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: Number })
  async update(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.update(+id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}