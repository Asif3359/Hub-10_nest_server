import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @IsEmail()
    @ApiProperty({
        description: 'The email of the user',
        example: 'test@example.com',
    })
    email!: string;
    @IsString()
    @MinLength(8)
    @MaxLength(32)
    @ApiProperty({
        description: 'The password of the user',
        example: 'Password123!',
    })
    password!: string;
}