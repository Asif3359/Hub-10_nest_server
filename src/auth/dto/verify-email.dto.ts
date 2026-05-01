import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @IsEmail()
  @ApiProperty({ description: 'Email address to verify', example: 'test@example.com' })
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  @ApiProperty({ description: '6-digit verification code sent to your email', example: '482951' })
  code!: string;
}
