import { Controller, Post, UseGuards, Body, Put } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Users } from '@prisma/client';
//import { AuthGuard } from '@nestjs/passport';
//import { Request } from 'express';
import { GetUser } from 'src/auth/decorators';
import { jwtguard } from 'src/auth/guard';
import { UserService } from './user.service';
import { ActivateDeviceDto, RNPdto, NoteDto, UpNoteDto, UpPatient } from './dto';
//@UseGuards(jwtguard)
@Controller('user')
export class UserController {
  constructor(private userservice: UserService) {}
  @Get('me')
  @UseGuards(jwtguard)
  getMe(@GetUser() user: Users) {
    return this.userservice.Getme(user);
  }
  @Post('ActiviateDevice')
  ActiviateDecvice(@Body() dto: ActivateDeviceDto) {
    return this.userservice.ActiviteDevice(dto);
  }

  @Post('RegisterPatients')
  RegisterNewPatients(@Body() dto: RNPdto) {
    return this.userservice.RegisterNewPatients(dto);
  }

  @Get('GetPatientList')
  GetPatientList(@Body() userId: number) {
    return this.userservice.GetpatientLists(userId);
  }

  @Post('CreateNote')
  CreatNewNote(@Body() dto: NoteDto) {
    return this.userservice.CreateNewNote(dto);
  }
  @Get('GetNoteList')
  GetNoteList(@Body() PatientId: number) {
    return this.userservice.GetNotesLists(PatientId);
  }
  @Put('UpdateNote')
  UpdateNote(@Body() dto: UpNoteDto) {
    return this.userservice.UpdateNote(dto);
  }

  @Put('UpdatePatient')
  UpdatePatient(@Body() dto: UpPatient) {
    return this.userservice.Updatepatient(dto);
  }
}
