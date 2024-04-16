import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DDIGDto {
  @IsNumber()
  @IsNotEmpty()
  sid: number;

  @IsString()
  @IsNotEmpty()
  reqType: string;
}

export class ReceivedDataDto {
  @IsNumber()
  @IsNotEmpty()
  beat: number;

  @IsNumber()
  @IsNotEmpty()
  ir_Reading: number;

  @IsNumber()
  @IsNotEmpty()
  redReading: number;

  @IsDate()
  @IsNotEmpty()
  timeStamp: Date;
}
