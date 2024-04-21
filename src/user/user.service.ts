import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivateDeviceDto, NoteDto, RNPdto } from './dto/index';
import { error } from 'console';
import { Users } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private Authservice: AuthService,
  ) {}

  async Getme(user: Users) {
    const account = await this.GetAccount(user);
    user['account'] = account;
    return user;
  }
  async GetAccount(user: Users) {
    const account = await this.prisma.accounts.findUnique({
      where: {
        AccountOwner: user.id,
      },
    });
    if (account) {
      return account;
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

  async IsPatientsRegistered(dto: RNPdto) {
    const patient = await this.prisma.users.findUnique({
      where: {
        phoneNum: dto.phoneNum,
      },
    });
    if (!patient) {
      return false;
    } else {
      return patient;
    }
  }
  async RegisterNewPatients(dto: RNPdto) {
    const patient = await this.IsPatientsRegistered(dto);
    if (!patient) {
      try {
        const token = this.Authservice.signup(dto);
        if (typeof token === 'string') {
          this.AddPatientsToList(dto, dto.Userid);
        }
      } catch (err) {
        throw new Error('Error creating new User');
      }
    } else {
      this.AddPatientsToList(patient, dto.Userid);
    }
  }

  async AddPatientsToList(patient: any, userID: number) {
    const accpatient = await this.IsPatientsInList(patient);
    if (accpatient) {
      await this.prisma.previewerList.create({
        data: {
          PreviewedAccountId: userID,
          PreviewerAccountId: accpatient.AccId,
        },
      });
    } else {
      throw new Error('this patients already in the list');
    }
  }
  async IsPatientsInList(patient: any) {
    const accpatient = await this.GetAccount(patient);
    const patientslists = await this.prisma.previewerList.findFirst({
      where: {
        PreviewedAccountId: accpatient.AccId,
      },
    });
    if (patientslists) {
      return false;
    } else {
      return accpatient;
    }
  }
  async GetUser(id: number) {
    try {
      const user = this.prisma.users.findUnique({
        where: {
          id: id,
        },
      });
      return user;
    } catch {
      return false;
    }
  }
  async CreatNewNote(dto: NoteDto) {
    const patient = await this.GetUser(dto.PenitentId);
    if (!patient) {
      throw new Error('invalde patient ID');
    } else {
      try {
        await this.prisma.notes.create({
          data: {
            NoteAutherId: dto.AutherID,
            PenitentId: dto.PenitentId,
            NoteSub: dto.NoteTitle,
            NoteMain: dto.NoteContent,
          },
        });
      } catch (err) {
        throw new Error('Error while creating note');
      }
    }
  }
}
