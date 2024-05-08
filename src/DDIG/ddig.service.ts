import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { DDIGDto, ReceivedDataDto } from './dto/DDIG.dto';
import { ConfigService } from '@nestjs/config';
import { connect, IClientOptions } from 'mqtt';
import { log } from 'console';

@Injectable()
export class DdigService {
  private BrokerUrl: string;
  private MaxRate: number = 0;
  private MinRate: number = 0;
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
  async getUserRateConstraints(userid: number) {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          id: userid,
        },
        select: {
          id: true,
          MaxRate: true,
          MinRate: true,
        },
      });
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error('User not found');
    }
  }

  async SDPR(dto: DDIGDto) {
    const device = await this.GetDevice(dto.sid);
    if (!device) {
      throw new Error('Device not found');
    } else if (!device.ownerID) {
      throw new Error('Device not owned');
    }
    console.log('device owner', device.ownerID);

    let devicerecord = await this.getDeviceRecord(dto.sid, device.ownerID);
    if (!devicerecord) {
      devicerecord = await this.CreateUserDeviceRecord(dto.sid, device.ownerID);
    }
    const userConstraints = await this.getUserRateConstraints(device.ownerID);
    this.MinRate = userConstraints.MinRate;
    this.MaxRate = userConstraints.MaxRate;
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
          AuthorDeviceid: sid,
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
      console.log('device', isDevice);
      console.log('user', isUser);

      if (!isDevice) {
        throw new Error('Device not found');
      }
      if (!isUser) {
        throw new Error('User not found');
      }
      const devicerecord = await this.prisma.userListRecords.findFirst({
        where: {
          AuthorDeviceid: sid,
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

  async getPatientPreviewer(PatientId: number) {
    const PatientAcc = await this.userservice.getAccount(PatientId);
    try {
      const PreviewerList = await this.prisma.previewerList.findMany({
        where: {
          PreviewedAccountId: PatientAcc.AccId,
        },
      });
    } catch (error) {
      throw new Error(`error getting Previewers`);
    }
  }
  async ProcessTodb(data: ReceivedDataDto, devicerecord: any) {
    if (data.beat >= this.MaxRate) {
      console.log('Max Rate Reached');
    }
    if (data.beat <= this.MinRate) {
      console.log('Min Rate Reached');
    }
    try {
      console.log('device record', devicerecord);
      console.log("data ", data);
      
      await this.prisma.heart_Rate_Record.create({
        data: {
          ULRid: devicerecord.ULRid,
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
