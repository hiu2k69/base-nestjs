import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @IsOptional()  
  created_at?: Date;

  @IsOptional() 
  updated_at?: Date;
}