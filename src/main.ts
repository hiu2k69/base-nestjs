// src/main.ts (hoặc một file khởi tạo)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
}
bootstrap();
