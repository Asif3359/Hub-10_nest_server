import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from 'src/app.controller';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) { }


  async register(createAuthDto: CreateAuthDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createAuthDto.email }
      });
      if (existingUser) {
        throw new ConflictException('User already exists');
      }
      const hashedPassword = await bcrypt.hash(createAuthDto.password, 10);
      const user = await this.prisma.user.create({
        data: { ...createAuthDto, password: hashedPassword }
      });
      return {
        status_code: 201,
        data: {
          status: 'success',
          message: 'User registered successfully',
          token: this.jwtService.sign({ id: user.id, email: user.email, role: user.role }) as string,
          user: { id: user.id, email: user.email, name: user.name, role: user.role }

        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to register user', error);
    }
  }
}