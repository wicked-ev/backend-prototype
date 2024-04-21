import {
  IsNotEmpty,
  IsNumber,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';
import { AuthDto } from 'src/auth/dto';
export class ActivateDeviceDto {
  @IsNumber()
  @IsNotEmpty()
  DeviceSID: number;

  @IsNumber()
  @IsNotEmpty()
  ActivationCode: number;

  @IsNumber()
  @IsNotEmpty()
  PhoneNum: number;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  Userid: number;
}

export class RNPdto extends AuthDto {
  @IsNumber()
  @IsNotEmpty()
  Userid: number;
}

export class NoteDto {
  @IsNumber()
  @IsNotEmpty()
  AutherID: number;

  @IsNumber()
  @IsNotEmpty()
  PenitentId: number;

  @IsString()
  @IsNotEmpty()
  NoteTitle: string;

  @IsString()
  @IsNotEmpty()
  NoteContent: string;
}
