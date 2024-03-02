import { Controller, Req, UseGuards } from '@nestjs/common';
import { Get } from '@nestjs/common';
//import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { jwtguard } from 'src/auth/guard';
@Controller('user')
export class UserController {
  @UseGuards(jwtguard)
  @Get('me')
  getMe(@Req() req: Request) {
    return req.user;
  }
}
