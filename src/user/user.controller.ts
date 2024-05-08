import {
  Controller,
  Post,
  UseGuards,
  Body,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Users } from '@prisma/client';
//import { AuthGuard } from '@nestjs/passport';
//import { Request } from 'express';
import { GetUser } from 'src/auth/decorators';
import { jwtguard } from 'src/auth/guard';
import { UserService } from './user.service';
//import { UpdateDevice } from './dto/user.dto';
import { AuthService } from '../auth/auth.service';
import {
  ActivateDeviceDto,
  RNPdto,
  NoteDto,
  UpNoteDto,
  UpPatient,
  userid,
  HeartRate,
  currnetTime,
} from './dto';
//if you want to test the jwt guard just uncommnet the line below
//@UseGuards(jwtguard)
@Controller('user')
export class UserController {
  constructor(
    private userservice: UserService,
    private authService: AuthService,
  ) {}
  @Get('me')
  @UseGuards(jwtguard)
  getMe(@GetUser() user: Users) {
    return this.userservice.Getme(user);
  }

  //devices
  @Post('/devices')
  async ActivateDecvice(@Body() dto: ActivateDeviceDto) {
    await this.authService.validateRole(dto.ActivatorId, dto.Userid);
    return await this.userservice.ActivateDevice(dto);
  }

  // @Put('/devices/:id')
  // async updateDevice(@Param('id') device: number, @Body() dto: UpdateDevice) {
  //   await this.authService.validateRole(dto.ActivatorId, dto.NeWOwner);
  //   return await this.userservice.UpdateDevice(dto);
  // }

  @Put('/devices/:id')
  async DesActviateDevice(@Param('id') deviceSid: number, @Body() dto: userid) {
    const parsedDevice =
      typeof deviceSid === 'string' ? parseInt(deviceSid, 10) : deviceSid;
    await this.authService.validateRole(dto.UserId, null);
    return await this.userservice.DeActivateDevice(parsedDevice, dto.UserId);
  }
  @Delete('/devices/:id')
  async DeleteDevice(@Param('id') DeviceSid: number) {
    const parsedDevice =
      typeof DeviceSid === 'string' ? parseInt(DeviceSid, 10) : DeviceSid;
    return await this.userservice.DeleteDevice(parsedDevice);
  }

  //patients
  @Post('/patients')
  async createPatient(@Body() dto: RNPdto) {
    await this.authService.validateRole(dto.Userid);
    return await this.userservice.RegisterNewPatients(dto);
  }

  @Get('/patients')
  @UseGuards(jwtguard)
  async getPatientList(@GetUser() user: Users) {
    await this.authService.validateRole(user.id, null);
    console.log('user', user.id);
    return await this.userservice.GetpatientLists(user.id);
  }

  @Put('/patients/:id')
  async updatePatient(
    @Param('id') userId: number,
    @Body() dto: Partial<UpPatient>,
  ) {
    const parsedUserId =
      typeof userId === 'string' ? parseInt(userId, 10) : userId;
    await this.authService.validateRole(null, parsedUserId);
    return await this.userservice.Updatepatient(parsedUserId, dto);
  }

  @Delete('/patients/:id')
  async deletePatientFromList(
    @Param('id') PatientId: number,
    @Body() dto: userid,
  ) {
    const parsedUserId =
      typeof PatientId === 'string' ? parseInt(PatientId, 10) : PatientId;
    await this.authService.validateRole(dto.UserId, parsedUserId);
    return await this.userservice.DeletePatientFromList(
      parsedUserId,
      dto.UserId,
    );
  }
  //not tested yet
  @Get('/patients/:id/heartrates/')
  async getHeartbeat(@Param('id') PatientId: number, @Body() dto: HeartRate) {
    const parsedPatientId =
      typeof PatientId === 'string' ? parseInt(PatientId, 10) : PatientId;
    await this.authService.validateRole(dto.UserId, parsedPatientId);
    return await this.userservice.getHeartbeat(
      parsedPatientId,
      dto.startDate,
      dto.endDate,
    );
  }

  @Get('/patients/:id/heartrate/')
  async getHeartrate(@Param('id') PatientId: number) {
    const parsedPatientId =
      typeof PatientId === 'string' ? parseInt(PatientId, 10) : PatientId;
    await this.authService.validateRole(null, parsedPatientId);
    const now = new Date();
    const formattedDate = now.toISOString();
    console.log('actual date', formattedDate.toString());
    return await this.userservice.getLastestHeartRate(
      parsedPatientId,
      formattedDate ,
    );
    //  Math.floor(Math.random() * (90 - 50 + 1)) + 50;
  }
  //notes
  @Post('/patients/:patientId/notes')
  async creatNewNote(
    @Param('patientId') PatientId: number,
    @Body() dto: NoteDto,
  ) {
    const parsedPatientId =
      typeof PatientId === 'string' ? parseInt(PatientId, 10) : PatientId;
    await this.authService.validateRole(dto.AuthorId, parsedPatientId);
    return await this.userservice.CreateNewNote(dto, parsedPatientId);
  }
  @Get('/patients/:patientId/notes')
  async getNoteList(@Param('patientId') PatientId: number) {
    const parsedPatientId =
      typeof PatientId === 'string' ? parseInt(PatientId, 10) : PatientId;
    await this.authService.validateRole(null, parsedPatientId);
    return await this.userservice.GetNotesLists(parsedPatientId);
  }
  @Put('/notes/:id')
  async updateNote(
    @Param('id') NoteId: number,
    @Body() dto: Partial<UpNoteDto>,
  ) {
    const parsedNoteId =
      typeof NoteId === 'string' ? parseInt(NoteId, 10) : NoteId;
    await this.authService.validateRole(dto.AuthorId, null);
    return this.userservice.UpdateNote(parsedNoteId, dto);
  }

  @Delete('/notes/:id')
  DeleteNote(@Param('id') NoteId: number) {
    const parsedNoteId =
      typeof NoteId === 'string' ? parseInt(NoteId, 10) : NoteId;
    return this.userservice.DeleteNote(parsedNoteId);
  }
}
