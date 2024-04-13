import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
//import { JwtStrategy } from './startegy/jwt.startegy';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './startegy';
//import { JwtStrategy } from './startegy';

@Module({
  imports: [JwtModule, ConfigModule, PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtModule, JwtService, JwtStrategy, PrismaService],
})
export class AuthModule {}
