import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users/users.controller';
import { UserService } from './users/users.service';
import { UsersModule } from './users/users.module';
import { WebsocketModule } from './bot-pump-telegram/websocket.module'; 

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'base-nest-js',
      entities: [User],
      synchronize: true, 
    }),
    TypeOrmModule.forFeature([User]),
    UsersModule,
    WebsocketModule,
  ],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class AppModule {}
