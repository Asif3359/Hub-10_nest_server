import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly safeSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
    isVerified: true,
  };

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existing) throw new ConflictException('User with this email already exists');

    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
          isVerified: true,
        },
        select: this.safeSelect,
      });
      return { status_code: 201, data: user };
    } catch {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: this.safeSelect,
      orderBy: { createdAt: 'desc' },
    });
    return { status_code: 200, data: users };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: this.safeSelect,
    });

    if (!user) throw new NotFoundException('User not found');

    return { status_code: 200, data: user };
  }

  async update(id: string, requesterId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) throw new NotFoundException('User not found');
    if (id !== requesterId) throw new ForbiddenException('You can only update your own profile');

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        select: this.safeSelect,
      });
      return { status_code: 200, data: updated };
    } catch {
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string, requesterId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) throw new NotFoundException('User not found');
    if (id !== requesterId) throw new ForbiddenException('You can only delete your own account');

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { status_code: 200, data: { message: 'Account deleted successfully' } };
  }
}
