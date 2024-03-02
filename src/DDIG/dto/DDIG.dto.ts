import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DDIGDto {
  @IsNumber()
  @IsNotEmpty()
  sid: number;

  @IsString()
  @IsNotEmpty()
  reqType: string;
}
