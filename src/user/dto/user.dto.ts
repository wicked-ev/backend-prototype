import {
  IsNotEmpty,
  IsNumber,
  IsEmail,
  IsOptional,
  IsString,
  IsDate,
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

export class UpPatient {
  @IsNumber()
  @IsNotEmpty()
  pid: number;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsNumber()
  @IsOptional()
  phone: number;

  @IsDate()
  @IsOptional()
  birthdate: Date;

  @IsString()
  @IsOptional()
  firstname: string;

  @IsString()
  @IsOptional()
  lastname: string;

  @IsString()
  @IsOptional()
  BloodType: string;

  @IsNumber()
  @IsOptional()
  weight: number;

  @IsNumber()
  @IsOptional()
  height: number;
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

export class UpNoteDto extends NoteDto {
  @IsNumber()
  @IsNotEmpty()
  NoteId: number;
}
