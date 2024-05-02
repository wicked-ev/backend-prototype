import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, AuthDto2 } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../auth/enums';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  async signup(dto: AuthDto, Role?: string) {
    if (Role === null) {
      Role = Roles.Doctor;
    }
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.prisma.users.create({
        data: {
          phoneNum: dto.phoneNum,
          email: dto.email,
          firstName: dto.firstname,
          lastName: dto.lastname,
          BloodType: dto.BloodType,
          birthdate: dto.DateOfBirth,
          height: dto.height,
          weight: dto.weight,
          MaxRate: dto.MaxRate,
          MinRate: dto.MinRate,
          hash,
          Role: Role,
        },
      });
      if (user) {
        await this.prisma.accounts.create({
          data: {
            AccountOwner: user.id,
          },
        });
      }
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Email already exists');
        }
        throw error;
      }
    }
  }
  async signin(dto: AuthDto2) {
    const user = await this.prisma.users.findUnique({
      where: {
        phoneNum: dto.phonenum,
      },
    });
    if (!user) {
      throw new Error('Wrong credentials');
    }
    const pwMatches = await argon.verify(user.hash, dto.password);
    if (!pwMatches) {
      throw new Error('Wrong credentials');
    }
    return this.signToken(user.id, user.email);
  }

  // async validateUser(id: number, password: string) {
  //   const user = await this.prisma.users.findFirst({
  //     where: {
  //       id: id,
  //     }
  //   });
  //   if (!user) return null;

  //   const pwValid = await argon.verify(user.hash, password);
  //   if (!pwValid) return null;

  //   return user;
  // }

  async validateRole(DoctorId?: number, PatientId?: number) {
    try {
      if (DoctorId !== null) {
        const doc = await this.prisma.users.findUnique({
          where: {
            id: DoctorId,
            Role: Roles.Doctor,
          },
        });
        if (!doc) {
          throw new Error('Doctor id invalid');
        }
      }
      if (PatientId !== null) {
        const patient = await this.prisma.users.findUnique({
          where: {
            id: PatientId,
            Role: Roles.Patient,
          },
        });
        if (!patient) {
          throw new Error('Patient id invalid');
        }
      }
    } catch (err) {
      throw new Error('Error while validating role');
    }
  }
  async signToken(
    DoctorId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: DoctorId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });
    return { access_token: token };
  }
}
