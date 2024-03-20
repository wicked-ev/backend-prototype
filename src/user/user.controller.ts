import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Users } from '@prisma/client';
//import { AuthGuard } from '@nestjs/passport';
//import { Request } from 'express';
import { GetUser } from 'src/auth/decorators';
import { jwtguard } from 'src/auth/guard';
import { UserService } from './user.service';
import { ActivateDeviceDto } from './dto';
@UseGuards(jwtguard)
@Controller('user')
export class UserController {
  constructor(private userservice: UserService) {}
  @Get('me')
  getMe(@GetUser() user: Users) {
    return user;
  }
  @Post('ActiviateDevice')
  ActiviateDecvice(@Body() dto: ActivateDeviceDto) {
    return this.userservice.ActiviteDevice(dto);
  }
}
