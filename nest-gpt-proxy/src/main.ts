import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(13000);
  console.log('NestJS 서버가 13000번 포트에서 실행 중입니다.');
}
bootstrap();
