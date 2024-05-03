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
import { UpdateDevice } from './dto/user.dto';
import { AuthService } from '../auth/auth.service';
import {
  ActivateDeviceDto,
  RNPdto,
  NoteDto,
  UpNoteDto,
  UpPatient,
  userid,
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
  async getPatientList(@Body() dto: userid) {
    await this.authService.validateRole(dto.UserId, null);
    return await this.userservice.GetpatientLists(dto.UserId);
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
