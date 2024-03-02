import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DDIGDto } from './dto/DDIG.dto';
import * as argon from 'argon2';

@Injectable()
export class DdigService {
  constructor(private prisma: PrismaService) {}

  async DDIG(dto: DDIGDto) {
    const device = await this.prisma.device.findUnique({
      where: {
        Sid: dto.sid,
      },
    });

    if (!device) {
      throw new Error('Device not found');
    }
    if (!device.ownerID) {
      throw new Error('Device not owned');
    } else {
      const topic = await this.CreateTopic(dto.sid, device.ownerID);
      return { Topic: topic, permissions: true };
    }
    return dto;
  }
  async CreateTopic(sidDevice: number, ownerid: number) {
    const hashd = await argon.hash(sidDevice.toString());
    const hasho = await argon.hash(ownerid.toString());
    const Topic = '/' + hashd + '/' + hasho;
    return Topic;
  }
}
