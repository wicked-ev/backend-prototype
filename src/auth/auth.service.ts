import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, AuthDto2 } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  async signup(dto: AuthDto) {
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.prisma.users.create({
        data: {
          email: dto.email,
          firstName: dto.firstname,
          lastName: dto.lastname,
          BloodType: dto.BloodType,
          hash,
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
        email: dto.email,
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

  async signToken(
    UserId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: UserId,
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
