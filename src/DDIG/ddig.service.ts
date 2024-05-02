import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { DDIGDto, ReceivedDataDto } from './dto/DDIG.dto';
import { ConfigService } from '@nestjs/config';
import { connect, IClientOptions } from 'mqtt';
@Injectable()
export class DdigService {
  private BrokerUrl: string;
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private userservice: UserService,
  ) {
    this.BrokerUrl = this.config.get('BROKER_URL');
  }
  async GetDevice(sid: number) {
    const device = await this.prisma.device.findUnique({
      where: {
        Sid: sid,
      },
    });
    if (!device) {
      throw new Error('Device not found');
    }
    return device;
  }

  async SDPR(dto: DDIGDto) {
    const device = await this.GetDevice(dto.sid);
    if (!device) {
      throw new Error('Device not found');
    } else if (!device.ownerID) {
      throw new Error('Device not owned');
    }
    let devicerecord = await this.getDeviceRecord(dto.sid, device.ownerID);
    if (!devicerecord) {
      devicerecord = await this.CreateUserDeviceRecord(dto.sid, device.ownerID);
    }
    const topic = await this.CreateTopic(dto.sid, device.ownerID);
    this.connection(topic, device.ownerID, dto.sid, devicerecord);
    return { Topic: topic, permissions: true };
  }

  async CreateTopic(sidDevice: number, ownerid: number) {
    const data: string = sidDevice.toString() + ownerid.toString();
    const Topic = 'deviceport/' + data;
    console.log(Topic);
    return Topic;
  }

  async CreateUserDeviceRecord(sid: number, ownerid: number) {
    try {
      const devicerecord = await this.prisma.userListRecords.create({
        data: {
          AutherDeviceid: sid,
          User: ownerid,
        },
      });
      return devicerecord;
    } catch (err) {
      throw new Error('Device sid or User id is not valid');
    }
  }

  async getDeviceRecord(sid: number, ownerid: number) {
    try {
      const isDevice = await this.userservice.DoseDeviceExist(sid);
      const isUser = await this.userservice.DoesUserExist(ownerid);
      if (!isDevice) {
        throw new Error('Device not found');
      }
      if (!isUser) {
        throw new Error('User not found');
      }
      const devicerecord = await this.prisma.userListRecords.findUnique({
        where: {
          AutherDeviceid: sid,
          User: ownerid,
        },
      });
      return devicerecord;
    } catch (error) {
      throw new Error('Error Retrieving Record');
    }
  }

  async connection(
    topic: string,
    deviceOwnerID: number,
    deviceID: number,
    devicerecord: any,
  ) {
    const client = connect(
      this.BrokerUrl,
      // this.CreateMqttOption(deviceOwnerID),
    );
    client.on('connect', () => {
      console.log('connect to broker');
      client.subscribe(topic, (err) => {
        if (err) {
          console.error('error subscribing to topic:', err);
        } else {
          console.log(`subscribed to Topic! ${topic}`);
        }
      });
    });
    client.on('message', (topic, message) => {
      console.log(`Received message on topic ${message.toString()}`);
      const data = this.ProcessMessage(message.toString());
      //this.SetMediandata(Databuffer, data);
      this.ProcessTodb(data, devicerecord);
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
  ProcessMessage(message: string) {
    const values = message.split(',');
    if (values.length == 4) {
      const obj = {
        ir_Reading: parseInt(values[0]),
        redReading: parseInt(values[1]),
        beat: parseInt(values[2]),
        timeStamp: values[3],
      };
      console.log(obj);
      return obj;
    }
  }

  async ProcessTodb(data: ReceivedDataDto, devicerecord: any) {
    try {
      await this.prisma.heart_Rate_Record.create({
        data: {
          ULRid: devicerecord.id,
          ir_Reading: data.ir_Reading,
          redReading: data.redReading,
          beat: data.beat,
          timeStamp: data.timeStamp,
        },
      });
    } catch (err) {
      //this is just error handling while testing it should be removed in production
      console.log(err);
      throw new Error('cant not Process data to database');
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
