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
  Userid: number;

  @IsNumber()
  @IsNotEmpty()
  ActivatorId: number;
}

export class RNPdto extends AuthDto {
  @IsNumber()
  @IsNotEmpty()
  Userid: number;
}

export class UpPatient {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  phoneNum: string;

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
  AuthorID: number;

  @IsNumber()
  @IsNotEmpty()
  PatientId: number;

  @IsString()
  @IsNotEmpty()
  NoteTitle: string;

  @IsString()
  @IsNotEmpty()
  NoteContent: string;
}

export class UpNoteDto {
  @IsNumber()
  @IsNotEmpty()
  NoteId: number;

  @IsNumber()
  @IsNotEmpty()
  AuthorId: number;

  @IsNumber()
  @IsNotEmpty()
  PatientId: number;

  @IsString()
  @IsOptional()
  NoteTitle: string;

  @IsString()
  @IsOptional()
  NoteContent: string;
}

export class UpdateDevice {
  @IsNumber()
  @IsNotEmpty()
  DeviceSID: number;

  @IsNumber()
  @IsNotEmpty()
  ActivatorId: number;

  @IsNumber()
  @IsNotEmpty()
  NeWOwner: number;
}
