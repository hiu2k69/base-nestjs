import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, NotFoundException, ConflictException } from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { WebsocketService } from './websocket.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly websocketService: WebsocketService,
    private readonly usersService: UserService,
  ) {}

  @Get()  
  async findAll() {  
    try {  
      const users = await this.websocketService.findAll();  
      return users;  
    } catch (error) {  
      console.error('Could not retrieve user list:', error);  
      throw new Error('Could not retrieve user list'); 
    }  
  }
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file')) 
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const updatedUser = await this.usersService.update(+id, updateUserDto);
      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }
      return updatedUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<string> {
    try {
      return await this.usersService.remove(+id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
