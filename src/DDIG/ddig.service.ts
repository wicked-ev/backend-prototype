import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DDIGDto } from './dto/DDIG.dto';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { connect, IClientOptions } from 'mqtt';
import Bottleneck from 'bottleneck';
@Injectable()
export class DdigService {
  private messagesQueue: Bottleneck;
  private BrokerUrl: string;
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.BrokerUrl = this.config.get('BROKER_URL');
    this.messagesQueue = new Bottleneck({ maxConcurrent: 1, reservoir: 50 });
  }
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
      this.connection(topic, device.ownerID, dto.sid);
      return { Topic: topic, permissions: true };
    }
  }
  async CreateTopic(sidDevice: number, ownerid: number) {
    const hashd = await argon.hash(sidDevice.toString());
    const hasho = await argon.hash(ownerid.toString());
    const Topic = 'topic/' + hashd + '/' + hasho;
    console.log(Topic);
    return Topic;
  }

  async connection(topic: string, deviceOwnerID: number, deviceID: number) {
    let msgCounter: number = 0;
    const Databuffer = [0, 0, 0];
    const client = connect(
      this.BrokerUrl,
      this.CreateMqttOption(deviceOwnerID),
    );
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
          const data = this.ProcessMessage(message);
          if (msgCounter < 5) {
            Databuffer[0] = Databuffer[0] + data.beat;
            Databuffer[1] = Databuffer[1] + data.ir_Reading;
            Databuffer[2] = Databuffer[2] + data.redReading;
            msgCounter++;
          } else if (msgCounter == 5) {
            this.SetMediandata(Databuffer, data);
            data['OwnerID'] = deviceOwnerID;
            data['DeviceID'] = deviceID;
            this.ProcessTodb(data);
          }
        });
      });
    });
  }
  SetMediandata(Databuffer: Array<number>, data: object) {
    Databuffer.every((value) => {
      return (value = value / 5);
    });
    data['beat'] = Databuffer[0];
    data['ir_Reading'] = Databuffer[1];
    data['ir_Reading'] = Databuffer[2];
    Databuffer = [0, 0, 0];
  }
  ProcessMessage(message: string, DeviceID?: number, OwnerID?: number) {
    const values = message.split(',');
    const obj = {
      OwnerID: OwnerID,
      AutherDevice: DeviceID,
      ir_Reading: parseInt(values[0]),
      redReading: parseInt(values[1]),
      beat: parseInt(values[2]),
      timeStamp: values[3],
    };
    return obj;
  }

  async ProcessTodb(data: any) {
    try {
      await this.prisma.heart_Rate_Record.createMany(data);
    } catch (err) {
      console.log(err);
    }
  }
  CreateMqttOption(DeviceOwnerID: number) {
    const option: IClientOptions = {
      keepalive: 60,
      clientId: DeviceOwnerID.toString(),
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
    };
    return option;
  }
}
