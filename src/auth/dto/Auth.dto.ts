import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
} from 'class-validator';

export class AuthDto {
  @IsNotEmpty()
  @IsString()
  firstname: string;

  @IsNotEmpty()
  @IsString()
  lastname: string;

  @IsNumber()
  @IsNotEmpty()
  phoneNum: number;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  BloodType: string;

  @IsDate()
  @IsNotEmpty()
  DateOfBirth: Date;

  @IsNumber()
  @IsNotEmpty()
  weight: number;

  @IsNumber()
  @IsNotEmpty()
  height: number;
}

export class AuthDto2 {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
