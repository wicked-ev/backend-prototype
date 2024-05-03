import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivateDeviceDto, NoteDto, RNPdto } from './dto/index';
//import { error } from 'console';
import { Users } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
//import { validate } from 'class-validator';
import { UpdateDevice, UpNoteDto, UpPatient, userid } from './dto/user.dto';
import { Roles } from 'src/auth/enums';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private Authservice: AuthService,
  ) {}

  async Getme(user: Users) {
    const account = await this.getAccount(user.id);
    if (!account) {
      throw new Error('Account not found');
    }
    user['account'] = account;
    return user;
  }
  async getAccount(Userid: number) {
    try {
      const account = await this.prisma.accounts.findUnique({
        where: {
          AccountOwner: Userid,
        },
      });
      return account;
    } catch (error) {
      console.error('Error in GetAccount:', error);
      throw new Error('Failed to retrieve account');
    }
  }

  async getUserDevice(userId: number) {
    try {
      if (!userId) {
        throw new Error('Invalid input: userId is null or undefined');
      }
      console.log(userId);
      const device = await this.prisma.device.findUnique({
        where: {
          ownerID: userId,
        },
      });
      if (!device) {
        return device;
      }
      delete device.activateCode;
      return device;
    } catch (error) {
      console.error('Error in getUserDevice:', error);
      throw new Error('Failed to retrieve user devices');
    }
  }

  async ActivateDevice(dto: ActivateDeviceDto) {
    try {
      if (!dto) {
        throw new Error('Invalid input: dto is null or undefined');
      }
      //const isDeviceOwned = await this.isDeviceOwned(dto.DeviceSID);
      const isDevice = await this.DoseDeviceExist(dto.DeviceSID);
      if (!isDevice) {
        const deviceupdate = await this.prisma.device.update({
          where: {
            Sid: dto.DeviceSID,
          },
          data: {
            ownerID: dto.Userid,
            Activator: dto.ActivatorId,
          },
        });
        if (deviceupdate) {
          delete deviceupdate.activateCode;
          return {
            status: 'success',
            data: deviceupdate,
          };
        } else {
          throw new Error('Error updating device');
        }
      } else {
        return {
          status: 'error',
          message: 'Device not found',
        };
      }
    } catch (error) {
      throw new Error('Failed to activate device');
    }
  }

  async DeactivateDevice(sid: number, author: number) {
    const isdevice = await this.DoseDeviceExist(sid);
    const isauthoer = await this.DoesUserExist(author);
    if (!isauthoer) {
      throw new Error('User not found');
    }
    if (!isdevice) {
      throw new Error('Device not found');
    }
    try {
      const device = await this.prisma.device.update({
        where: {
          Sid: sid,
        },
        data: {
          ownerID: null,
          Activator: author,
        },
      });
      if (device) {
        return {
          status: 'success',
          data: device,
        };
      } else {
        throw new Error('Error updating device');
      }
    } catch (err) {
      throw new Error('Error updating device');
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
      //const patientacc = await this.getAccount(dto.id);
      const patient = await this.prisma.users.findUnique({
        where: {
          phoneNum: dto.phoneNum,
          Role: Roles.Patient,
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
        const token = await this.Authservice.signup(dto, Roles.Patient);
        if (typeof token !== null) {
          const patient = await this.isPatientRegistered(dto);
          if (patient) {
            await this.AddPatientsToList(patient.id, dto.Userid);
            return 'Patient registered successfully';
          }
        }
      } catch (err) {
        throw new Error(`Error creating new User: ${err.message}`);
      }
    } else {
      await this.AddPatientsToList(patient.id, dto.Userid);
      return 'Patient already registered';
    }
  }

  async AddPatientsToList(patientId: number, userID: number) {
    const accpatient = await this.IsPatientsInList(patientId);
    const userAcc = await this.getAccount(userID);
    if (accpatient) {
      await this.prisma.previewerList.create({
        data: {
          PreviewedAccountId: accpatient.AccId,
          PreviewerAccountId: userAcc.AccId,
        },
      });
    } else {
      throw new Error('this patients already in the list');
    }
  }
  async IsPatientsInList(patientId: number) {
    try {
      const accpatient = await this.getAccount(patientId);
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
      delete user.hash;
      return user;
    } catch (error) {
      console.error('Error in GetUser:', error);
      throw new Error(`Error retrieving user: ${error.message}`);
    }
  }
  async CreateNewNote(dto: NoteDto, PatientId: number) {
    // const validationErrors = await validate(dto);
    // if (validationErrors.length > 0) {
    //   throw new Error('Invalid input: NoteDto is not valid');
    // }

    //const patientExists = await this.DoesUserExist(dto.PenitentId);
    // if (!patientExists) {
    //   throw new Error('Invalid patient ID');
    const patient = await this.getAccount(PatientId);
    const author = await this.getAccount(dto.AuthorId);
    try {
      await this.prisma.notes.create({
        data: {
          NoteAutherId: author.AccId,
          PatientId: patient.AccId,
          NoteSub: dto.NoteTitle,
          NoteMain: dto.NoteContent,
        },
      });
      return await this.GetNotesLists(PatientId);
    } catch (err) {
      throw new Error(`Error while creating note: ${err.message}`);
    }
  }
  async GetNotesLists(PatientId: number) {
    // if (
    //   typeof PatientId !== 'number' ||
    //   PatientId === null ||
    //   PatientId === undefined
    // ) {
    //   throw new Error('Invalid input: PenitentId must be a number');
    // }
    const patient = await this.getAccount(PatientId);
    try {
      const listOfNotes = await this.prisma.notes.findMany({
        where: {
          PatientId: patient.AccId,
        },
        select: {
          Nid: true,
          NoteSub: true,
          NoteMain: true,
        },
      });
      if (!listOfNotes) {
        return { message: 'list empty' };
      } else {
        return listOfNotes;
      }
    } catch (err) {
      throw new Error(`Failed to retrieve notes: ${err.message}`);
    }
  }
  async DoesUserExist(patientId: number) {
    const User = await this.prisma.users.findUnique({
      where: {
        id: patientId,
      },
      select: {
        id: true,
      },
    });
    return !!User;
  }
  async getAccountbyId(accountId: number) {
    try {
      const account = await this.prisma.accounts.findUnique({
        where: {
          AccId: accountId,
        },
      });
      if (account) {
        return account;
      }
    } catch (error) {
      console.error('Error in GetAccount:', error);
      throw new Error('Failed to retrieve account');
    }
  }
  async GetpatientLists(userId: number) {
    const AccUser = await this.getAccount(userId);
    console.log(AccUser);
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
        const userAcc = await this.getAccountbyId(Pid);
        const user: any = await this.GetUser(userAcc.AccountOwner);
        const device = await this.getUserDevice(userAcc.AccountOwner);
        delete user.hash;
        data['user'] = { user, device };
        List.push(data);
      }
      return List;
    } catch (err) {
      console.error('Error in GetpatientLists:', err);
      throw new Error(`Failed to get patient lists: ${err.message}`);
    }
  }

  removeUndefinedOrNull<T extends object>(obj: T): Partial<T> {
    const newObj: Partial<T> = {};

    for (const key in obj) {
      if (
        obj.hasOwnProperty(key) &&
        obj[key] !== undefined &&
        obj[key] !== null
      ) {
        newObj[key] = obj[key];
      }
    }

    return newObj;
  }
  async Updatepatient(userid: number, dto: Partial<UpPatient>) {
    // let dataraw: Users;
    // console.log(dto);
    // dataraw.phoneNum = dto.phoneNum;
    // dataraw.email = dto.email;
    // dataraw.lastName = dto.lastname;
    // dataraw.firstName = dto.firstname;
    // dataraw.weight = dto.weight;
    // dataraw.height = dto.height;
    // dataraw.MaxRate = dto.MaxRate;
    // dataraw.MinRate = dto.MinRate;
    // dataraw.BloodType = dto.BloodType;
    // dataraw.birthdate = dto.birthdate;
    // const data = this.removeUndefinedOrNull(dataraw);
    const patientexist: boolean = await this.DoesUserExist(userid);
    if (!patientexist) {
      throw new Error('Patient not Found');
    }
    try {
      const updatedPatient = await this.prisma.users.update({
        where: {
          id: userid,
        },
        data: {
          ...dto,
          updatedAt: new Date(),
        },
      });
      delete updatedPatient.hash;
      return updatedPatient;
    } catch (err) {
      throw new Error(`Error updating Patient: ${err.message}`);
    }
  }
  async doesNotexist(NoteId: number): Promise<boolean> {
    const note = await this.prisma.notes.findUnique({
      where: {
        Nid: NoteId,
      },
    });
    return !!note;
  }
  async DoseDeviceExist(DeivceId: number): Promise<boolean> {
    const device = await this.prisma.device.findUnique({
      where: {
        Sid: DeivceId,
      },
    });
    return !!device;
  }
  async UpdateDevice(dto: UpdateDevice) {
    try {
      const device = await this.DoseDeviceExist(dto.DeviceSID);
      if (!device) {
        throw new Error('Device not found');
      }
      // const activator = await this.DoesUserExist(dto.ActivatorId);
      // const patient = await this.DoesUserExist(dto.NeWOwner);
      // if (!patient) {
      //   throw new Error('Patient not found');
      // }
      // if (!activator) {
      //   throw new Error('Activator not found');
      // }
      if (device) {
        const updatedDevice = await this.prisma.device.update({
          where: {
            Sid: dto.DeviceSID,
          },
          data: {
            Activator: dto.ActivatorId,
            ownerID: dto.NeWOwner,
          },
        });
        return updatedDevice;
      }
    } catch (err) {
      throw new Error(`Error updating note: ${err.message}`);
    }
  }

  async UpdateNote(dto: Partial<UpNoteDto>) {
    const patient = await this.getAccount(dto.PatientId);
    const author = await this.getAccount(dto.AuthorId);
    const dataraw = {
      Nid: dto.NoteId,
      NoteAutherId: author.AccId,
      PenitentId: patient.AccId,
      NoteSub: dto.NoteTitle,
      NoteMain: dto.NoteContent,
    };
    const data = this.removeUndefinedOrNull(dataraw);
    //const validationErrors = await validate(dto);
    // if (validationErrors.length > 0) {
    //   throw new Error('Invalid input: UpNoteDto is not valid');
    // }
    const note = await this.doesNotexist(dto.NoteId);
    if (!note) {
      throw new Error(`Note not found`);
    }
    try {
      await this.prisma.notes.update({
        where: {
          Nid: dto.NoteId,
        },
        data,
      });
      return await this.GetNotesLists(dto.PatientId);
    } catch (err) {
      throw new Error(`Error updating note: ${err.message}`);
    }
  }

  async DeleteDevice(DeviceId: number) {
    try {
      const device = await this.DoseDeviceExist(DeviceId);
      if (!device) {
        throw new Error('Device not found');
      }
      await this.prisma.device.delete({
        where: {
          Sid: DeviceId,
        },
      });
      return { message: 'Device deleted successfully' };
    } catch (error) {
      console.error('Error deleting Device:', error);
      return { message: 'An error occurred while deleting the Device' };
    }
  }
  async DeleteNote(NoteId: number) {
    try {
      const note = await this.doesNotexist(NoteId);
      if (!note) {
        throw new Error(`Note not found`);
      }
      await this.prisma.notes.delete({
        where: {
          Nid: NoteId,
        },
      });
      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { message: 'An error occurred while deleting the user' };
    }
  }
  async DeleteUser(UserId: number) {
    try {
      const patient = await this.DoesUserExist(UserId);
      if (!patient) {
        throw new Error(`patient not found`);
      }
      await this.prisma.users.delete({
        where: {
          id: UserId,
        },
      });
      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { message: 'An error occurred while deleting the user' };
    }
  }

  async DeletePatientFromList(PatientId: number, UserId: number) {
    try {
      // const patient = await this.DoesUserExist(PatientId);
      // const user = await this.DoesUserExist(UserId);
      // if (!user) {
      //   throw new Error(`User not found`);
      // }
      // if (!patient) {
      //   throw new Error(`patient not found`);
      // }
      const userAccId = await this.getAccount(UserId);
      const patientAccId = await this.getAccount(PatientId);
      if (!userAccId) {
        throw new Error(`User Account not found`);
      }
      if (!patientAccId) {
        throw new Error(`Patient Account not found`);
      }

      const listele = await this.prisma.previewerList.findFirst({
        where: {
          PreviewerAccountId: userAccId.AccId,
          PreviewedAccountId: patientAccId.AccId,
        },
      });
      if (!listele) {
        throw new Error(`Patient not found in list`);
      }
      await this.prisma.previewerList.delete({
        where: {
          id: listele.id,
          PreviewedAccountId: listele.PreviewedAccountId,
          PreviewerAccountId: listele.PreviewerAccountId,
        },
      });
      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { message: 'An error occurred while deleting the user' };
    }
  }
}
