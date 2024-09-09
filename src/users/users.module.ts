import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { WebsocketModule } from './websocket.module'; // Đường dẫn tùy thuộc vào cấu trúc project của bạn

@Module({
  controllers: [UsersController],
  providers: [UserService],
  imports: [TypeOrmModule.forFeature([User]),WebsocketModule],
})
export class UsersModule {
  constructor(private usersService: UserService) {}
}
