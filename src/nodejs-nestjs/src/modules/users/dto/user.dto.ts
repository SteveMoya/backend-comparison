import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'User name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  @IsEmail()
  email: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  limit?: number = 10;
}