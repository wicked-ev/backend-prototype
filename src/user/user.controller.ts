import { Controller, Post, UseGuards, Body, Put, Delete } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Users } from '@prisma/client';
//import { AuthGuard } from '@nestjs/passport';
//import { Request } from 'express';
import { GetUser } from 'src/auth/decorators';
import { jwtguard } from 'src/auth/guard';
import { UserService } from './user.service';
import { UpdateDevice } from './dto/user.dto';
import { AuthService } from '../auth/auth.service';
import {
  ActivateDeviceDto,
  RNPdto,
  NoteDto,
  UpNoteDto,
  UpPatient,
} from './dto';
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

  @Put('/devices/:id')
  async updateDevice(@Body() dto: UpdateDevice) {
    await this.authService.validateRole(dto.ActivatorId, dto.NeWOwner);
    return await this.userservice.UpdateDevice(dto);
  }

  @Delete('/devices/:id')
  async DeleteDevice(@Body() DeviceId: number) {
    return await this.userservice.DeleteDevice(DeviceId);
  }

  //patients
  @Post('/patients')
  async createPatient(@Body() dto: RNPdto) {
    await this.authService.validateRole(dto.Userid);
    return await this.userservice.RegisterNewPatients(dto);
  }

  @Get('/patients')
  async getPatientList(@Body() userId: number) {
    await this.authService.validateRole(userId);
    return await this.userservice.GetpatientLists(userId);
  }

  @Put('/patients/:id')
  async updatePatient(@Body() dto: Partial<UpPatient>) {
    await this.authService.validateRole(null, dto.id);
    return await this.userservice.Updatepatient(dto);
  }

  @Delete('/patients/:id')
  async deletePatientFromList(@Body() PatientId: number, UserId: number) {
    await this.authService.validateRole(UserId, PatientId);
    return await this.userservice.DeletePatientFromList(PatientId, UserId);
  }

  //notes
  @Post('/patients/:patientId/notes')
  async creatNewNote(@Body() dto: NoteDto) {
    await this.authService.validateRole(dto.AuthorID, dto.PatientId);
    return await this.userservice.CreateNewNote(dto);
  }
  @Get('/patients/:patientId/notes')
  async getNoteList(@Body() PatientId: number) {
    await this.authService.validateRole(null, PatientId);
    return await this.userservice.GetNotesLists(PatientId);
  }
  @Put('/notes/:id')
  async updateNote(@Body() dto: Partial<UpNoteDto>) {
    await this.authService.validateRole(dto.AuthorId, dto.PatientId);
    return this.userservice.UpdateNote(dto);
  }

  @Delete('/notes/:id')
  DeleteNote(@Body() NoteId: number) {
    return this.userservice.DeleteNote(NoteId);
  }
}
