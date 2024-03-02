import { Module } from '@nestjs/common';
import { DdigService } from './ddig.service';
import { DdigController } from './ddig.controller';
//import mqtt, { IClientOptions } from 'mqtt';
// DDIG stand for Device Data Intgrety Guard
@Module({
  providers: [DdigService],
  controllers: [DdigController],
})
export class DDIGModule {}
