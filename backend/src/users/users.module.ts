import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Area } from '../areas/entities/area.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Area])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
