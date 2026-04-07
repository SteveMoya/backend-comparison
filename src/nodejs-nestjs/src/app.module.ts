import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST', 'localhost'),
        port: configService.get('POSTGRES_PORT', 5432),
        username: configService.get('POSTGRES_USER', 'benchmark'),
        password: configService.get('POSTGRES_PASSWORD', 'benchmark'),
        database: configService.get('POSTGRES_DB', 'benchmark'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    OrdersModule,
  ],
})
export class AppModule {}