import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [JwtModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, JwtModule, JwtService, PrismaService],
})
export class AuthModule {}
