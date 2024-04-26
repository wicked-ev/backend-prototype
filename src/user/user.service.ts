import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivateDeviceDto, NoteDto, RNPdto } from './dto/index';
import { error } from 'console';
import { Users } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { validate } from 'class-validator';
import { UpNoteDto } from './dto/user.dto';
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
    try {
      if (!dto) {
        throw new Error('Invalid input: dto is null or undefined');
      }
      const isDeviceOwned = await this.isDeviceOwned(dto.DeviceSID);
      if (!isDeviceOwned) {
        const deviceupdate = await this.prisma.device.update({
          where: {
            Sid: dto.DeviceSID,
          },
          data: {
            ownerID: dto.Userid,
          },
        });
        if (deviceupdate) {
          return {
            status: 'success',
            data: deviceupdate,
          };
        } else {
          throw new Error('Failed to activate device');
        }
      } else {
        return {
          status: 'error',
          message: 'Device Owned!',
        };
      }
    } catch (error) {
      console.error('Error in ActiviteDevice:', error);
      throw new Error('Failed to activate device');
    }
  }

  async isDeviceOwned(deviceId: number) {
    const device = await this.prisma.device.findUnique({
      where: {
        Sid: deviceId,
      },
    });
    if (!device) {
      throw new Error('Device Not Found');
    }
    return !!device.ownerID;
  }

  async isPatientRegistered(dto: RNPdto) {
    if (!dto) {
      throw new Error('Invalid input: dto is null or undefined');
    }
    try {
      const patient = await this.prisma.users.findUnique({
        where: {
          phoneNum: dto.phoneNum,
        },
      });
      if (patient === null || patient === undefined) {
        return false;
      } else {
        return patient;
      }
    } catch (error) {
      throw new Error('Error querying the database');
    }
  }
  async RegisterNewPatients(dto: RNPdto) {
    const patient = await this.isPatientRegistered(dto);
    if (!patient) {
      try {
        const token = await this.Authservice.signup(dto);
        if (typeof token === 'string') {
          await this.AddPatientsToList(dto, dto.Userid);
          return 'Patient registered successfully';
        }
      } catch (err) {
        throw new Error(`Error creating new User: ${err.message}`);
      }
    } else {
      await this.AddPatientsToList(patient, dto.Userid);
      return 'Patient already registered';
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
    try {
      const accpatient = await this.GetAccount(patient);
      if (accpatient !== null && accpatient !== undefined) {
        const count = await this.prisma.previewerList.count({
          where: {
            PreviewedAccountId: accpatient.AccId,
          },
        });
        if (count > 0) {
          throw new Error('Patient is already in the list');
        } else {
          return accpatient;
        }
      } else {
        return null;
      }
    } catch (error) {
      throw new Error('Error in IsPatientsInList: ' + error.message);
    }
  }
  async GetUser(id: number) {
    if (typeof id !== 'number') {
      throw new Error('Invalid input: id must be a number');
    }
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          id,
        },
      });
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error in GetUser:', error);
      throw new Error(`Error retrieving user: ${error.message}`);
    }
  }
  async CreateNewNote(dto: NoteDto) {
    const validationErrors = await validate(dto);
    if (validationErrors.length > 0) {
      throw new Error('Invalid input: NoteDto is not valid');
    }

    const patientExists = await this.DoesPatientExist(dto.PenitentId);
    if (!patientExists) {
      throw new Error('Invalid patient ID');
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
        return await this.GetNotesLists(dto.PenitentId);
      } catch (err) {
        throw new Error(`Error while creating note: ${err.message}`);
      }
    }
  }
  async GetNotesLists(PatientId: number) {
    if (
      typeof PatientId !== 'number' ||
      PatientId === null ||
      PatientId === undefined
    ) {
      throw new Error('Invalid input: PenitentId must be a number');
    }
    try {
      const listOfNotes = await this.prisma.notes.findMany({
        where: {
          PenitentId: PatientId,
        },
        select: {
          Nid: true,
          NoteSub: true,
          NoteMain: true,
        },
      });
      if (!listOfNotes) {
        return [];
      } else {
        return listOfNotes;
      }
    } catch (err) {
      throw new Error(`Failed to retrieve notes: ${err.message}`);
    }
  }
  async DoesPatientExist(patientId: number) {
    const patient = await this.prisma.users.findUnique({
      where: {
        id: patientId,
      },
      select: {
        id: true,
      },
    });
    return !!patient;
  }

  async GetpatientLists(userId: number) {
    const AccUser = await this.GetAccount(userId);
    try {
      const patientList = await this.prisma.previewerList.findMany({
        where: {
          PreviewerAccountId: AccUser.AccId,
        },
      });
      const List = [];
      for (let index = 0; index < patientList.length; index++) {
        const Pid: number = patientList[index].PreviewedAccountId;
        const data = {
          id: patientList[index].id,
          PreviewerAccountId: patientList[index].PreviewerAccountId,
          PreviewedAccountId: patientList[index].PreviewedAccountId,
        };
        const user: any = await this.GetUser(Pid);
        delete user.hash;
        data['user'] = user;
        List.push(data);
      }
      return List;
    } catch (err) {
      console.error('Error in GetpatientLists:', err);
      throw new Error(`Failed to get patient lists: ${err.message}`);
    }
  }

  async Updatepatient(dto: UpPatient) {
    
  }

  async UpdateNote(dto: UpNoteDto) {
    const validationErrors = await validate(dto);
    if (validationErrors.length > 0) {
      throw new Error('Invalid input: UpNoteDto is not valid');
    }
    const note = await this.prisma.notes.findUnique({
      where: {
        Nid: dto.NoteId,
        NoteAutherId: dto.AutherID,
      },
    });
    if (!note) {
      throw new Error(`Note not found`);
    }
    try {
      const updatedNote = await this.prisma.notes.update({
        where: {
          Nid: dto.NoteId,
          NoteAutherId: dto.AutherID,
        },
        data: {
          NoteSub: dto.NoteTitle,
          NoteMain: dto.NoteContent,
        },
      });
      return updatedNote;
    } catch (err) {
      throw new Error(`Error updating note: ${err.message}`);
    }
  }
}
