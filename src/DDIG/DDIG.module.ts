import { Module } from '@nestjs/common';
import { DdigService } from './ddig.service';
import { DdigController } from './ddig.controller';
import { ConfigService } from '@nestjs/config';
//import { prismaModule } from 'src/prisma/prisma.module';
// import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
//import mqtt, { IClientOptions } from 'mqtt';
// DDIG stand for Device Data Intgrety Guard
@Module({
  providers: [DdigService, ConfigService, PrismaService],
  controllers: [DdigController],
})
export class DDIGModule {}
