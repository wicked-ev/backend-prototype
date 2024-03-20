import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DDIGDto } from './dto/DDIG.dto';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { connect, IClientOptions } from 'mqtt/*';

@Injectable()
export class DdigService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

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
    const Topic = 'topic/' + hashd + '/' + hasho;
    console.log(Topic);
    return Topic;
  }
  connection(topic: string, deviceOwnerID: number) {
    const option: IClientOptions = {
      keepalive: 60,
      clientId: deviceOwnerID.toString(),
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
    };
    const BrokerUrl = this.config.get('BROKER_URL');
    const client = connect(BrokerUrl, option);
    client.on('connect', () => {
      console.log('connect to broker');
      client.subscribe(topic, (err) => {
        if (err) {
          console.error('error subscribing to topic:', err);
        } else {
          console.log('subscribed to Topic!');
        }
        client.on('message', (message) => {
          console.log(`Received message on topic ${message.toString()}`);
        });
      });
    });
  }
  //handelData(clinet: MqttClient){}
}
