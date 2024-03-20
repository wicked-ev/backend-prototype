import { IsNotEmpty, IsNumber, IsEmail } from 'class-validator';

export class ActivateDeviceDto {
  @IsNumber()
  @IsNotEmpty()
  DeviceSID: number;

  @IsNumber()
  @IsNotEmpty()
  ActivationCode: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  Userid: number;
}
