import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivateDeviceDto } from './dto/index';
import { error } from 'console';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async ActiviteDevice(dto: ActivateDeviceDto) {
    const DeviceStatus = await this.isDeviceOwned(dto.DeviceSID);
    // const user = await this.prisma.users.update({
    //     where:{
    //         email: dto.email,
    //         id: dto.Userid,
    //     },
    //     data:{
    //     }
    // })
    if (!DeviceStatus) {
      const deviceupdate = await this.prisma.device.update({
        where: {
          Sid: dto.DeviceSID,
        },
        data: {
          ownerID: dto.Userid,
        },
      });
      return deviceupdate;
    } else {
      return 'Device Owned!';
    }
  }

  async isDeviceOwned(DeviceID: number) {
    const device = await this.prisma.device.findUnique({
      where: {
        Sid: DeviceID,
      },
    });
    if (!device) {
      throw new error('Device Not Found');
    } else if (!device.ownerID) {
      return true;
    } else {
      return false;
    }
  }
}
