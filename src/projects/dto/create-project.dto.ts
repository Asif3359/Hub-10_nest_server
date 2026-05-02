import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @IsString()
  @MaxLength(255)
  @ApiProperty({ example: 'My Project' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'A short description' })
  description?: string;
}
