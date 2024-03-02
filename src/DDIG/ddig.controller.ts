import { Controller } from '@nestjs/common';
import { DdigService } from './ddig.service';
import { DDIGDto } from './dto/DDIG.dto';
import { Body, Post } from '@nestjs/common';
@Controller('ddig')
export class DdigController {
  constructor(private ddig: DdigService) {}

  @Post('DDIG')
  DDIG(@Body() dto: DDIGDto) {
    return this.ddig.DDIG(dto);
  }
}
