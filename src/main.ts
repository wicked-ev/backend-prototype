import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  app.useWebSocketAdapter(new IoAdapter());
  await app.listen(3000);

  const wsServer = app.getHttpServer();
  const wsPort = process.env.WS_PORT || 3001;
  await wsServer.listen(wsPort, () => {
    console.log(`WebSocket server running on port ${wsPort}`);
  });
}
bootstrap();
