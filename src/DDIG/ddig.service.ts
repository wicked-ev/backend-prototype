import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DDIGDto } from './dto/DDIG.dto';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { connect, IClientOptions } from 'mqtt/*';
import {
  createReadStream,
  mkdirSync,
  statSync,
  writeFileSync,
  constants,
  accessSync,
  readFile,
  writeFile,
} from 'fs';

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
      const payload = this.CheckifTempStorage(device.ownerID);
      //this.connection(topic, device.ownerID, device.ownerID,);
      if (!payload.State) {
        this.CreateNewTempStorage(payload.Path);
        const data = this.Readfile(payload.State + '/index.txt');
        const indexContext: number = this.GetIndexFileContext(data);
        this.connection(topic, device.ownerID, payload.Path, indexContext);
        // const indexfilePath: string = payload.Path + '/index.txt';
        //const readStream = createReadStream(indexfilePath);
      }

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

  connection(
    topic: string,
    deviceOwnerID: number,
    StoragePath: string,
    indexContext: number,
  ) {
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
          this.DataHandeler(message.toString(), StoragePath, indexContext);
          console.log(`Received message on topic ${message.toString()}`);
        });
      });
    });
  }
  fileExists(filePath: string): boolean {
    try {
      // Check if the file exists
      accessSync(filePath, constants.F_OK);
      return true;
    } catch (err) {
      // File does not exist or cannot be accessed
      return false;
    }
  }

  CheckifTempStorage(UserID: number) {
    try {
      const VerfiyDir: string = '../../TempStorageCSV/' + UserID.toString();
      const isDir: boolean = statSync(VerfiyDir).isDirectory();
      return { Path: VerfiyDir, State: isDir };
    } catch (err) {
      if (err.code === 'ENOENT') {
        return { Path: '', State: false };
      } else console.log(err);
    }
  }

  CreateNewTempStorage(UserPath: string) {
    try {
      mkdirSync(UserPath);
      console.log('created Path successfully');
      const MapIndex: string = 'lastFileIndex: 0\n';
      this.CreateFile(UserPath, '/index.txt', MapIndex);
      const csvMap: string = 'Index,ir_Reading,radReading,beats,TimeStamp\n';
      this.CreateFile(UserPath, '0', csvMap);
    } catch (err) {
      if (err.code === 'EEXIST') {
        console.log('file already exists');
      } else {
        return err;
      }
    }
  }

  DataHandeler(message: string, targetPath: string, indexContext: number) {
    //const indexfilePath: string = targetPath + '/index.txt';
    //const readStream = createReadStream(indexfilePath);
    const filepath: string = this.CreateFile(
      targetPath,
      indexContext.toString(),
    );
    writeFile(filepath, message, (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      }
    });
  }

  async updateIdexfile(StorgePath: string) {}

  Readfile(filePath: string) {
    readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        console.log(err);
      }
      return data;
    });
  }

  GetIndexFileContext(data): number {
    for (let i = 0; i < data.length; i++) {
      if (data[i] == ':' && i + 1 < data.length) {
        let newstr: string = data.slice(i + 1);
        newstr = newstr.replace('/sg', '');
        const strvalue = parseInt(newstr);
        return strvalue;
      }
    }
  }
  CreateFile(Path: string, fileName?: string, message: string = ''): string {
    if (fileName !== undefined) {
      const filePath = Path + '/' + fileName;
      writeFileSync(filePath, message);
      return filePath;
    }
    const currentTime: Date = new Date();
    const filename: string =
      currentTime.getFullYear().toString() +
      currentTime.getDate().toString() +
      currentTime.getHours().toString();
    const filePath = Path + '/' + filename;
    writeFileSync(filePath, message);
    return filePath;
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
