import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @IsString()
  @MaxLength(255)
  @ApiProperty({ example: 'Fix login bug' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Users cannot log in with special characters' })
  description?: string;

  @IsUUID()
  @ApiProperty({ example: 'uuid-of-project' })
  projectId: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ example: 'uuid-of-assignee' })
  assigneeId?: string;
}
