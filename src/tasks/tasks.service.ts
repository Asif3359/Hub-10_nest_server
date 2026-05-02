import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    try {
      const task = await this.prisma.task.create({
        data: createTaskDto,
      });
      return { status_code: 201, data: task };
    } catch (error) {
      if (error?.code === 'P2003') {
        throw new NotFoundException('Project or assignee not found');
      }
      throw new InternalServerErrorException('Failed to create task');
    }
  }

  async findAll(projectId?: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return { status_code: 200, data: tasks };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    if (!task) throw new NotFoundException('Task not found');

    return { status_code: 200, data: task };
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Task not found');

    try {
      const updated = await this.prisma.task.update({
        where: { id },
        data: updateTaskDto,
      });
      return { status_code: 200, data: updated };
    } catch (error) {
      if (error?.code === 'P2003') {
        throw new NotFoundException('Project or assignee not found');
      }
      throw new InternalServerErrorException('Failed to update task');
    }
  }

  async remove(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { status_code: 200, data: { message: 'Task deleted successfully' } };
  }
}
