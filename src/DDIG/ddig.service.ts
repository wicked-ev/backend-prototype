import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DDIGDto } from './dto/DDIG.dto';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { connect, IClientOptions } from 'mqtt/*';
import { mkdirSync, statSync, writeFile, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

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

  connection(topic: string, deviceOwnerID: number, OwnerID: number) {
    const BrokerUrl = this.config.get('BROKER_URL');
    const client = connect(BrokerUrl, this.CreateMqttOption(deviceOwnerID));
    client.on('connect', () => {
      console.log('connect to broker');
      client.subscribe(topic, (err) => {
        if (err) {
          console.error('error subscribing to topic:', err);
        } else {
          console.log('subscribed to Topic!');
        }
        client.on('message', (message) => {
          const payload = this.CheckifTempStorage(OwnerID);
          if (!payload.State) {
            this.CreateNewTempStorage(payload.Path);
            this.DataHandeler(message, payload.Path);
          } else {
            this.DataHandeler(message, payload.Path);
          }
          console.log(`Received message on topic ${message.toString()}`);
        });
      });
    });
  }

  CheckifTempStorage(UserID: number) {
    const VerfiyDir: string = '../../TempStorageCSV/' + UserID.toString();
    try {
      return { Path: VerfiyDir, State: statSync(VerfiyDir).isDirectory() };
    } catch (err) {
      if (err.code === 'ENOENT') {
        return { Path: '', State: false };
      } else console.log(err);
    }
  }

  CreateCsvFile(Path: string, fileName?: string, message: string = ''): string {
    if (fileName !== undefined) {
      const filePath = Path + '/' + fileName;
      writeFileSync(filePath, message);

      return filePath;
    }
    const currentTime: Date = new Date();
    const filename: string =
      currentTime.getFullYear().toString() +
      currentTime.getDate().toString() +
      currentTime.getHours().toString() +
      currentTime.getMinutes().toString();
    const filePath = Path + '/' + filename;
    writeFileSync(filePath, message);
    return filePath;
  }

  CreateNewTempStorage(UserPath: string) {
    try {
      mkdirSync(UserPath);
      console.log('created Path successfully');
      const csvMap: string = 'ir_Reading,radReading,beats,TimeStamp\n';
      writeFileSync(UserPath, undefined, csvMap);
    } catch (err) {
      if (err.code === 'EEXIST') {
        console.log('file already exists');
      } else {
        return err;
      }
    }
  }

  DataHandeler(message: string, targetPath: string) {}
}
