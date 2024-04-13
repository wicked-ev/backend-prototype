import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
//import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, ConfigService, JwtModule, JwtService],
})
export class UserModule {}
