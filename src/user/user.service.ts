import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivateDeviceDto, NoteDto, RNPdto, UpNoteDto } from './dto/index';
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
    const account = await this.GetAccount(user.id);
    user['account'] = account;
    return user;
  }
  async GetAccount(Userid: number) {
    const account = await this.prisma.accounts.findUnique({
      where: {
        AccountOwner: Userid,
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
          const users = this.GetpatientLists(dto.Userid);
          return users;
        }
      } catch (err) {
        throw new Error('Error creating new User');
      }
    } else {
      this.AddPatientsToList(patient, dto.Userid);
      const user = this.GetpatientLists(dto.Userid);
      return user;
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
        return await this.GetNotesLists(dto.AutherID);
      } catch (err) {
        throw new Error('Error creating note');
      }
    }
  }

  async UpdateNote(dto: UpNoteDto) {
    try {
      await this.prisma.notes.update({
        where: {
          Nid: dto.NoteId,
          NoteAutherId: dto.AutherID,
          PenitentId: dto.PenitentId,
        },
        data: {
          NoteSub: dto.NoteTitle,
          NoteMain: dto.NoteContent,
        },
      });
    } catch (err) {
      throw new Error('error updating note');
    }
  }

  async GetpatientLists(UserId: number) {
    const AccUser = await this.GetAccount(UserId);
    try {
      const PatientList = await this.prisma.previewerList.findMany({
        where: {
          PreviewerAccountId: AccUser.AccId,
        },
      });
      const List = [];
      for (let index = 0; index < PatientList.length; index++) {
        const Pid: number = PatientList[index].PreviewedAccountId;
        const data = {
          id: PatientList[index].id,
          PreviewerAccountId: PatientList[index].PreviewerAccountId,
          PreviewedAccountId: PatientList[index].PreviewedAccountId,
        };
        const user: any = await this.GetUser(Pid);
        delete user.hash;
        data['user'] = user;
        List.push(data);
      }
      return List;
    } catch (err) {}
  }
  async GetNotesLists(UserId: number) {
    try {
      const ListofNotes = await this.prisma.notes.findMany({
        where: {
          NoteAutherId: UserId,
        },
      });
      if (!ListofNotes) {
        throw new Error('empty');
      } else {
        return ListofNotes;
      }
    } catch (err) {
      console.log(err);
      throw new Error('error getting note list');
    }
  }
}
