import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
//import { IoAdapter } from '@nestjs/platform-socket.io';
import { WsAdapter } from '@nestjs/platform-ws';

import * as http from 'http';
import * as WebSocket from 'ws';
//import { WebSocketServer } from '@nestjs/websockets';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const server = http.createServer(app.getHttpAdapter().getInstance());
  const wss = new WebSocket.Server({ server });
  app.useWebSocketAdapter(new WsAdapter(wss));
  await app.listen(5000);
}
bootstrap();
