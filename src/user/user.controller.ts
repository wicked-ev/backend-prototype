import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Users } from '@prisma/client';
//import { AuthGuard } from '@nestjs/passport';
//import { Request } from 'express';
import { GetUser } from 'src/auth/decorators';
import { jwtguard } from 'src/auth/guard';
import { UserService } from './user.service';
import { ActivateDeviceDto, RNPdto } from './dto';
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
}
