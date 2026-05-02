import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, createProjectDto: CreateProjectDto) {
    try {
      const project = await this.prisma.project.create({
        data: { ...createProjectDto, ownerId },
      });
      return { status_code: 201, data: project };
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new ConflictException('A project with this name already exists');
      }
      throw new InternalServerErrorException('Failed to create project');
    }
  }

  async findAll(ownerId: string) {
    const projects = await this.prisma.project.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return { status_code: 200, data: projects };
  }

  async findOne(id: string, ownerId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: { tasks: { where: { deletedAt: null } } },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) throw new ForbiddenException('Access denied');

    return { status_code: 200, data: project };
  }

  async update(id: string, ownerId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) throw new ForbiddenException('Access denied');

    try {
      const updated = await this.prisma.project.update({
        where: { id },
        data: updateProjectDto,
      });
      return { status_code: 200, data: updated };
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new ConflictException('A project with this name already exists');
      }
      throw new InternalServerErrorException('Failed to update project');
    }
  }

  async remove(id: string, ownerId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) throw new ForbiddenException('Access denied');

    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { status_code: 200, data: { message: 'Project deleted successfully' } };
  }
}
