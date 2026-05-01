import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) { }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(createAuthDto: CreateAuthDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createAuthDto.email },
      });
      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(createAuthDto.password, 10);
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await this.prisma.pendingUser.upsert({
        where: { email: createAuthDto.email },
        update: { password: hashedPassword, name: createAuthDto.name, code, expiresAt },
        create: { email: createAuthDto.email, password: hashedPassword, name: createAuthDto.name, code, expiresAt },
      });

      await this.mailService.sendVerificationCode(createAuthDto.email, code);

      return {
        status_code: 200,
        data: {
          status: 'pending',
          message: 'Verification code sent to your email. Please verify to complete registration.',
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      console.error(error);
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    try {
      const pending = await this.prisma.pendingUser.findUnique({
        where: { email: verifyEmailDto.email },
      });

      if (!pending) {
        throw new BadRequestException('No pending registration found for this email');
      }

      if (new Date() > pending.expiresAt) {
        await this.prisma.pendingUser.delete({ where: { email: verifyEmailDto.email } });
        throw new BadRequestException('Verification code has expired. Please register again.');
      }

      if (pending.code !== verifyEmailDto.code) {
        throw new BadRequestException('Invalid verification code');
      }

      const user = await this.prisma.user.create({
        data: {
          email: pending.email,
          password: pending.password,
          name: pending.name,
          isVerified: true,
        },
      });

      await this.prisma.pendingUser.delete({ where: { email: pending.email } });


      return {
        status_code: 201,
        data: {
          status: 'success',
          message: 'Email verified. User registered successfully.',
          token: this.jwtService.sign({ id: user.id, email: user.email, role: user.role }) as string,
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      if (!user.isVerified) {
        throw new UnauthorizedException('Email not verified. Please verify your email first.');
      }
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return {
        status_code: 200,
        token: this.jwtService.sign({ id: user.id, email: user.email, role: user.role }) as string,
        data: {
          status: 'success',
          message: 'User logged in successfully',
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      console.error(error);
      throw new InternalServerErrorException('Failed to login user');
    }
  }
}
