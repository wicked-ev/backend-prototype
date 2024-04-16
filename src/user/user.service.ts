import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivateDeviceDto } from './dto/index';
import { error } from 'console';
import { Users } from '@prisma/client';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async GetAccount(user: Users) {
    const account = await this.prisma.accounts.findUnique({
      where: {
        AccountOwner: user.id,
      },
    });
    if (account) {
      user['account'] = account;
      return user;
    } else {
      throw new error('Account Not Found');
    }
  }

  async ActiviteDevice(dto: ActivateDeviceDto) {
    const DeviceStatus = await this.isDeviceOwned(dto.DeviceSID);
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
    } else if (device.ownerID) {
      return true;
    } else {
      return false;
    }
  }
}
