import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
} from 'class-validator';

export class validateRole {
  @IsOptional()
  @IsNumber()
  PatientId: number;

  @IsOptional()
  @IsNumber()
  DoctorId: number;
}
export class AuthDto {
  @IsNotEmpty()
  @IsString()
  firstname: string;

  @IsNotEmpty()
  @IsString()
  lastname: string;

  @IsString()
  @IsNotEmpty()
  phoneNum: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  BloodType: string;

  @IsDate()
  @IsNotEmpty()
  DateOfBirth: Date;

  @IsNumber()
  @IsOptional()
  weight: number;

  @IsNumber()
  @IsOptional()
  height: number;

  @IsNumber()
  @IsOptional()
  MinRate: number;

  @IsNumber()
  @IsOptional()
  MaxRate: number;
}

export class AuthDto2 {
  @IsString()
  @IsNotEmpty()
  phonenum: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
