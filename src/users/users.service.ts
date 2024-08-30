// src/users/user.service.ts
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { User } from './entities/user.entity';
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOneBy({ email: createUserDto.email });
    
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    return this.userRepository.findOneBy({ id });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
  
    if (updateUserDto.email) {
      const existingUser = await this.userRepository.findOneBy({ email: updateUserDto.email });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }
  
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<string> {
    const result = await this.userRepository.delete(id);
    if (result.affected > 0) {
      return 'Delete Successfully';
    }
    throw new NotFoundException('User not found');
  }
}
