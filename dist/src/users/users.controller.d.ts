import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../entities/user.entity';
import { WebsocketService } from '../bot-pump-telegram/websocket.service';
export declare class UsersController {
    private readonly websocketService;
    private readonly usersService;
    constructor(websocketService: WebsocketService, usersService: UserService);
    create(createUserDto: CreateUserDto): Promise<User>;
    findOne(id: string): Promise<User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: string): Promise<string>;
}
